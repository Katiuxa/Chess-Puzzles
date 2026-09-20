"use strict";

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const script = path.join(__dirname, "make-knight-icons.py");

const r = spawnSync("python", [script], { cwd: ROOT, stdio: "inherit", shell: true });
if (r.status) process.exit(r.status || 1);

// Keep feature graphic simple: charcoal + store icon embedded via copy note
const storeIcon = path.join(ROOT, "store-assets", "icon-512.png");
if (fs.existsSync(storeIcon)) {
  console.log("icons listos (caballo dorado)");
}
