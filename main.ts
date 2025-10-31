import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  const url = new URL(req.url);
  const username = url.searchParams.get("username");

  if (!username) {
    return new Response(JSON.stringify({ error: "Parameter 'username' wajib diisi." }), {
      headers: { "content-type": "application/json" },
    });
  }

  const apiUrl = `https://www.tiktok.com/api/webcast/room/?aid=1988&unique_id=${username}`;

  try {
    const res = await fetch(apiUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; Mobile; rv:110.0) Gecko/110.0 Firefox/110.0",
        "Referer": `https://www.tiktok.com/@${username}/live`,
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const text = await res.text();

    // Kadang TikTok mengembalikan string JS, bukan JSON murni
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      // Bersihkan jika ada prefix 'for (;;);'
      data = JSON.parse(text.replace(/^for\s*\(;;\);\s*/, ""));
    }

    const liveRoom = data?.data;

    if (!liveRoom || !liveRoom.room_id_str) {
      return new Response(
        JSON.stringify({
          username,
          isLive: false,
          message: "Tidak sedang live atau data tidak ditemukan.",
          rawFound: true,
        }),
        { headers: { "content-type": "application/json" } },
      );
    }

    const result = {
      username,
      isLive: liveRoom.status === 2,
      title: liveRoom.title || "",
      viewerCount: liveRoom.user_count || 0,
      likeCount: liveRoom.like_count || 0,
      roomId: liveRoom.room_id_str,
      streamUrl: liveRoom.stream_url?.rtmp_pull_url || "",
      cover: liveRoom.cover?.url_list?.[0] || "",
      rawFound: true,
    };

    return new Response(JSON.stringify(result, null, 2), {
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ username, isLive: false, error: err.message }),
      { headers: { "content-type": "application/json" } },
    );
  }
});
