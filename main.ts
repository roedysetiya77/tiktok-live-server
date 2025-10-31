// main.ts — TikTok Live Status API (versi JSON)
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const username = url.searchParams.get("username");

    if (!username) {
      return new Response(JSON.stringify({ error: "Parameter 'username' wajib diisi." }), {
        headers: { "content-type": "application/json" },
      });
    }

    const apiUrl = `https://www.tiktok.com/api/live/detail/?aid=1988&unique_id=${username}`;

    // TikTok butuh beberapa header agar tidak memblokir permintaan
    const res = await fetch(apiUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Referer": `https://www.tiktok.com/@${username}/live`,
        "Accept": "application/json, text/plain, */*",
      },
    });

    if (!res.ok) {
      return new Response(
        JSON.stringify({ username, isLive: false, error: "Tidak bisa mengakses TikTok API." }),
        { headers: { "content-type": "application/json" } },
      );
    }

    const data = await res.json();

    // Data akan muncul di field "data" → "liveRoom"
    const liveRoom = data?.data?.liveRoom;

    if (!liveRoom) {
      return new Response(
        JSON.stringify({
          username,
          isLive: false,
          message: "Tidak sedang live atau data tidak tersedia.",
          rawFound: true,
        }),
        { headers: { "content-type": "application/json" } },
      );
    }

    // Parsing data penting
    const result = {
      username,
      isLive: liveRoom.status === 2, // 2 = live, 4 = offline
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
      JSON.stringify({ error: err.message || "Terjadi kesalahan tak terduga." }),
      { headers: { "content-type": "application/json" } },
    );
  }
});
