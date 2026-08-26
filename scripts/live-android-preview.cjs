"use strict";

const http = require("http");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const PORT = Number(process.env.PREVIEW_PORT || 4177);
const ROOT = path.join(__dirname, "..");
const SDK =
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  path.join(process.env.LOCALAPPDATA || "", "Android", "Sdk");
const ADB = path.join(SDK, "platform-tools", "adb.exe");
const APK = fs.existsSync(path.join(ROOT, "Chess-Puzzles.apk"))
  ? path.join(ROOT, "Chess-Puzzles.apk")
  : path.join(ROOT, "dist-android", "Sherzod-1.0.0.apk");
const PACKAGE = "com.metamovidas.sherzod";
const ACTIVITY = `${PACKAGE}/.MainActivity`;
const CACHE = path.join(ROOT, "_boards", "live_frame.png");

let latest = null;
let capturing = false;

function runAdb(args) {
  return new Promise((resolve) => {
    const child = spawn(ADB, args, { windowsHide: true });
    const chunks = [];
    child.stdout.on("data", (d) => chunks.push(d));
    child.on("error", () => resolve(null));
    child.on("close", (code) => {
      if (code !== 0) return resolve(null);
      resolve(Buffer.concat(chunks));
    });
  });
}

async function captureLoop() {
  if (capturing) return;
  capturing = true;
  try {
    const png = await runAdb(["exec-out", "screencap", "-p"]);
    if (png && png.length > 1000) {
      latest = png;
      fs.writeFileSync(CACHE, png);
    }
  } catch {
    /* keep last frame */
  } finally {
    capturing = false;
  }
}

async function boot() {
  await runAdb(["install", "-r", APK]);
  await runAdb(["shell", "am", "force-stop", PACKAGE]);
  await runAdb(["shell", "am", "start", "-n", ACTIVITY]);
}

const HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Chess Puzzles — live Android</title>
  <style>
    html, body { margin: 0; height: 100%; background: #0b120e; color: #e8d7a8; font: 14px/1.4 system-ui, sans-serif; }
    .wrap { min-height: 100%; display: grid; place-items: center; padding: 12px; box-sizing: border-box; }
    img { max-width: min(100%, 420px); width: 100%; height: auto; border-radius: 18px; box-shadow: 0 18px 40px rgba(0,0,0,.45); background: #111; }
    .meta { margin-top: 10px; opacity: .8; text-align: center; font-size: 12px; max-width: 420px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div>
      <img id="frame" alt="Android live preview" />
      <div class="meta">Solo espejo (no toques aquí). Interactúa en el emulador / teléfono.</div>
    </div>
  </div>
  <script>
    const img = document.getElementById("frame");
    let busy = false;
    async function tick() {
      if (busy) return;
      busy = true;
      try {
        const res = await fetch("/frame.png?t=" + Date.now(), { cache: "no-store" });
        if (!res.ok) return;
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const prev = img.src;
        img.src = url;
        if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      } catch (e) {}
      finally { busy = false; }
    }
    tick();
    setInterval(tick, 700);
  </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);
  if (url.pathname === "/" || url.pathname === "/index.html") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    res.end(HTML);
    return;
  }
  if (url.pathname === "/frame.png") {
    const body = latest || (fs.existsSync(CACHE) ? fs.readFileSync(CACHE) : null);
    if (!body) {
      res.writeHead(503, { "Content-Type": "text/plain" });
      res.end("waiting");
      return;
    }
    res.writeHead(200, {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
      "Content-Length": body.length,
    });
    res.end(body);
    return;
  }
  res.writeHead(404).end("not found");
});

boot().then(() => console.log("App launched on device.")).catch((e) => console.warn(e));
setInterval(captureLoop, 700);
captureLoop();

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Live Android preview: http://127.0.0.1:${PORT}/`);
});
