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
const ver = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).version || "1.0.0";
const apkName = `Chess-Puzzles-${ver}.apk`;
const aabName = `Chess-Puzzles-${ver}.aab`;
const apkSrc = path.join(ANDROID, "app", "build", "outputs", "apk", "release", "app-release.apk");
const aabSrc = path.join(ANDROID, "app", "build", "outputs", "bundle", "release", "app-release.aab");
copyIf(apkSrc, path.join(OUT, apkName));
copyIf(apkSrc, path.join(ROOT, apkName));
copyIf(apkSrc, path.join(ROOT, "Chess-Puzzles.apk"));
const desktop = path.join(process.env.USERPROFILE || "", "Desktop", apkName);
if (process.env.USERPROFILE) copyIf(apkSrc, desktop);
copyIf(aabSrc, path.join(OUT, aabName));
copyIf(aabSrc, path.join(ROOT, aabName));
if (process.env.USERPROFILE) copyIf(aabSrc, path.join(process.env.USERPROFILE, "Desktop", aabName));
console.log("Listo en " + OUT + " (v" + ver + ")");
