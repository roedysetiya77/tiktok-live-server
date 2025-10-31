import express from "express";
import fetch from "node-fetch";

const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("✅ TikTok Live JSON API aktif!");
});

app.get("/live", async (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(400).json({ error: "Masukkan ?username=" });

  try {
    const response = await fetch(`https://www.tiktok.com/@${username}/live`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      },
    });

    const html = await response.text();
    const isLive = html.includes('"isLive":true');
    const titleMatch = html.match(/"title":"(.*?)"/);
    const viewerMatch = html.match(/"viewerCount":(\d+)/);
    const coverMatch = html.match(/"cover":"(.*?)"/);

    res.json({
      username,
      isLive,
      title: titleMatch ? decodeURIComponent(titleMatch[1]) : "",
      viewerCount: viewerMatch ? parseInt(viewerMatch[1]) : 0,
      cover: coverMatch ? decodeURIComponent(coverMatch[1]) : "",
    });
  } catch (err) {
    res.status(500).json({ error: "Gagal ambil data", message: err.message });
  }
});

app.listen(port, () => console.log(`Server aktif di port ${port}`));
