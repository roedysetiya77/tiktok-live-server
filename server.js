import express from "express";
import { WebSocketServer } from "ws";
import { WebcastPushConnection } from "tiktok-live-connector";

const app = express();
const PORT = process.env.PORT || 3000;

// ----- WebSocket -----
const wss = new WebSocketServer({ noServer: true });
const connections = new Map();

wss.on("connection", (ws, req) => {
  const username = new URL(req.url, "http://localhost").searchParams.get("username");
  if (!username) return ws.close();

  const tiktok = new WebcastPushConnection(username);
  connections.set(ws, tiktok);

  tiktok.connect().then(() => {
    ws.send(JSON.stringify({ type: "status", message: `Connected to ${username}` }));
  });

  tiktok.on("chat", (data) => {
    ws.send(JSON.stringify({ type: "chat", user: data.uniqueId, comment: data.comment }));
  });

  tiktok.on("gift", (data) => {
    ws.send(JSON.stringify({ type: "gift", user: data.uniqueId, giftName: data.giftName }));
  });

  tiktok.on("like", (data) => {
    ws.send(JSON.stringify({ type: "like", user: data.uniqueId, likeCount: data.likeCount }));
  });

  ws.on("close", () => {
    tiktok.disconnect();
    connections.delete(ws);
  });
});

// ----- Express -----
app.get("/", (req, res) => {
  res.send("✅ TikTok Live Server aktif. Gunakan WS pada /ws?username=<nama>");
});

const server = app.listen(PORT, () =>
  console.log(`Server berjalan di port ${PORT}`)
);

server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});
