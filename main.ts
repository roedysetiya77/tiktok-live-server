// main.ts — TikTok Live Status Checker via CDN
// Deploy langsung di Deno Deploy / Render tanpa npm install

// Import modul dari CDN (tidak perlu npm)
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

async function checkTikTokLive(username: string) {
  try {
    const res = await fetch(`https://www.tiktok.com/@${username}`);
    if (!res.ok) {
      return { username, isLive: false, error: `Gagal ambil data TikTok (status ${res.status})` };
    }

    const html = await res.text();

    // Cari bagian window.__UNIVERSAL_DATA__
    const match = html.match(/<script id="__UNIVERSAL_DATA__"[^>]*>(.*?)<\/script>/s);
    if (!match) {
      return { username, isLive: false, message: "Data JSON tidak ditemukan." };
    }

    // Parse JSON mentah dari halaman
    const jsonRaw = JSON.parse(match[1]);
    const liveData = jsonRaw.__DEFAULT_SCOPE__?.webapp.userInfo;

    // Ambil data siaran langsung
    const isLive = liveData?.user?.roomId ? true : false;
    const title = liveData?.user?.uniqueId || "";
    const viewerCount = liveData?.user?.followerCount || 0;

    if (isLive) {
      return {
        username,
        isLive: true,
        title,
        viewerCount,
        message: "Sedang live 🔴",
      };
    } else {
      return {
        username,
        isLive: false,
        title: "Tidak sedang live",
        viewerCount,
      };
    }
  } catch (err) {
    return { username, isLive: false, error: err.message || "Terjadi kesalahan." };
  }
}

// API endpoint handler
serve(async (req) => {
  const url = new URL(req.url);
  const username = url.searchParams.get("username");

  if (!username) {
    return new Response(
      JSON.stringify({ error: "Parameter ?username= wajib diisi" }, null, 2),
      { headers: { "content-type": "application/json" }, status: 400 },
    );
  }

  const result = await checkTikTokLive(username);
  return new Response(JSON.stringify(result, null, 2), {
    headers: { "content-type": "application/json" },
  });
});

console.log("✅ Server TikTok Live Checker aktif...");
