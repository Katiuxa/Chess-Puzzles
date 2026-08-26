"use strict";

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const ANDROID = path.join(ROOT, "android-app");
const OUT = path.join(ROOT, "dist-android");
const wantAab = process.argv.includes("--aab");
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT ||
  path.join(process.env.LOCALAPPDATA || "", "Android", "Sdk");
const studioJbr = "C:\\Program Files\\Android\\Android Studio\\jbr";
const java = fs.existsSync(path.join(studioJbr, "bin", "java.exe"))
  ? studioJbr
  : (process.env.JAVA_HOME || studioJbr);

function run(cmd, args, cwd) {
  console.log(cmd + " " + args.join(" "));
  const r = spawnSync(cmd, args, {
    cwd: cwd || ROOT,
    stdio: "inherit",
    shell: true,
    env: Object.assign({}, process.env, {
      ANDROID_HOME: sdk,
      ANDROID_SDK_ROOT: sdk,
      JAVA_HOME: java
    })
  });
  if (r.status) process.exit(r.status);
}

function copyIf(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log("-> " + dest);
}

run("npm", ["run", "build"]);
if (!fs.existsSync(path.join(ANDROID, "app"))) {
  run("npx", ["cap", "add", "android"]);
}
run("npx", ["cap", "sync", "android"]);
run("node", ["scripts/patch-android.cjs"]);
run("node", ["scripts/generate-icons.cjs"]);

const gw = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
run(gw, ["assembleRelease"], ANDROID);
if (wantAab) run(gw, ["bundleRelease"], ANDROID);

fs.mkdirSync(OUT, { recursive: true });
copyIf(
  path.join(ANDROID, "app", "build", "outputs", "apk", "release", "app-release.apk"),
  path.join(OUT, "Chess-Puzzles-1.0.4.apk")
);
copyIf(
  path.join(ANDROID, "app", "build", "outputs", "apk", "release", "app-release.apk"),
  path.join(ROOT, "Chess-Puzzles-1.0.4.apk")
);
copyIf(
  path.join(ANDROID, "app", "build", "outputs", "apk", "release", "app-release.apk"),
  path.join(ROOT, "Chess-Puzzles.apk")
);
copyIf(
  path.join(ANDROID, "app", "build", "outputs", "bundle", "release", "app-release.aab"),
  path.join(OUT, "Chess-Puzzles-1.0.4.aab")
);
console.log("Listo en " + OUT);
