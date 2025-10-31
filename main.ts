import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  const url = new URL(req.url);
  const username = url.searchParams.get("username");

  if (!username) {
    return new Response(JSON.stringify({ error: "Parameter 'username' wajib diisi." }), {
      headers: { "content-type": "application/json" },
    });
  }

  const apiUrl = `https://m.tiktok.com/api/live/detail/?aid=1988&unique_id=${username}`;

  try {
    const res = await fetch(apiUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; Mobile; rv:110.0) Gecko/110.0 Firefox/110.0",
        "Referer": `https://www.tiktok.com/@${username}/live`,
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Fetch-Mode": "cors",
      },
    });

    if (!res.ok) {
      return new Response(
        JSON.stringify({
          username,
          isLive: false,
          error: `Gagal ambil data TikTok (status ${res.status})`,
        }),
        { headers: { "content-type": "application/json" } },
      );
    }

    const data = await res.json();
    const liveRoom = data?.data?.liveRoom;

    if (!liveRoom) {
      return new Response(
        JSON.stringify({
          username,
          isLive: false,
          message: "Tidak sedang live atau data kosong.",
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
