import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  const url = new URL(req.url);
  // Root
  if (url.pathname === "/") {
    return new Response(
      "✅ Server TikTok Live Scraper aktif!\nGunakan /live?username=USERNAME",
      { headers: { "Content-Type": "text/plain" } }
    );
  }

  // Endpoint /live?username=...
  if (url.pathname === "/live") {
    const username = url.searchParams.get("username");
    if (!username) {
      return new Response("❌ Parameter ?username= wajib diisi", { status: 400 });
    }

    try {
      // Fetch halaman TikTok Live
      const res = await fetch(`https://www.tiktok.com/@${username}/live`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      const html = await res.text();

      // Cari JSON internal TikTok (SIGI_STATE)
      const match = html.match(/<script id="SIGI_STATE" type="application\/json">(.*?)<\/script>/);
      if (!match) {
        // Bila tidak menemukan, anggap bukan live atau struktur berubah
        return new Response(JSON.stringify({ username, isLive: false }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      const data = JSON.parse(match[1]);

      // Struktur bisa berbeda antar halaman / versi, cek safer access
      const liveInfo = data?.LiveRoom?.liveRoomInfo || {};
      const userInfo = data?.UserModule?.users || {};
      // ambil avatar dari userInfo jika tersedia
      const avatar =
        Object.values(userInfo)[0]?.avatarLarger ||
        Object.values(userInfo)[0]?.avatarThumb ||
        "";

      const result = {
        username,
        isLive: liveInfo?.status === 1 || !!liveInfo?.room_id,
        title: liveInfo?.title || "",
        viewerCount: liveInfo?.user_count || 0,
        cover:
          liveInfo?.cover?.url_list?.[0] ||
          (avatar && avatar.url_list ? avatar.url_list[0] : avatar) ||
          "",
        rawFound: !!match[1],
      };

      return new Response(JSON.stringify(result, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Gagal mengambil data", message: String(err) }),
        { headers: { "Content-Type": "application/json" }, status: 500 }
      );
    }
  }

  // fallback 404
  return new Response("404 - Not Found", { status: 404 });
});
