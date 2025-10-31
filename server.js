import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("Server TikTok Live aktif!");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server berjalan di port", PORT));
