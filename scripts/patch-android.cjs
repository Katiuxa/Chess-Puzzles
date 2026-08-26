"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const ANDROID = path.join(ROOT, "android-app");
const APP = path.join(ANDROID, "app");
const SRC = path.join(APP, "src", "main");
const PKG = "com.metamovidas.sherzod";
const APP_NAME = "Chess Puzzles";
const PASS = "SherzodMetaUpload2026";

function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
  console.log("patch " + path.relative(ROOT, file));
}

function ensureKeystore() {
  const dir = path.join(ANDROID, "keystore");
  fs.mkdirSync(dir, { recursive: true });
  const jks = path.join(dir, "sherzod-upload.jks");
  const props = path.join(ANDROID, "keystore.properties");
  if (fs.existsSync(jks) && fs.existsSync(props)) return;

  const javaHome = process.env.JAVA_HOME || "C:\\Program Files\\Android\\Android Studio\\jbr";
  const keytool = path.join(javaHome, "bin", "keytool.exe");
  const r = spawnSync(fs.existsSync(keytool) ? keytool : "keytool", [
    "-genkeypair", "-v",
    "-keystore", jks,
    "-storetype", "JKS",
    "-alias", "sherzod",
    "-keyalg", "RSA",
    "-keysize", "2048",
    "-validity", "10000",
    "-storepass", PASS,
    "-keypass", PASS,
    "-dname", "CN=Sherzod, OU=Metamovidas, O=Metamovidas, L=Madrid, C=ES"
  ], { stdio: "inherit" });
  if (r.status) throw new Error("keytool falló");
  write(props, `storeFile=keystore/sherzod-upload.jks
storePassword=${PASS}
keyAlias=sherzod
keyPassword=${PASS}
`);
}

function patchGradle() {
  const appGradle = path.join(APP, "build.gradle");
  let s = fs.readFileSync(appGradle, "utf8");
  if (!s.includes("keystore.properties")) {
    s = s.replace(
      "android {",
      `def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new java.io.FileInputStream(keystorePropertiesFile))
}

android {`
    );
  }
  if (!s.includes("signingConfigs")) {
    s = s.replace(
      "    buildTypes {",
      `    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties["keyAlias"]
                keyPassword keystoreProperties["keyPassword"]
                storeFile rootProject.file(keystoreProperties["storeFile"])
                storePassword keystoreProperties["storePassword"]
            }
        }
    }
    buildTypes {`
    );
  }
  if (!s.includes("signingConfig signingConfigs.release")) {
    s = s.replace(
      /release \{\s*minifyEnabled false/,
      `release {
            minifyEnabled false
            signingConfig signingConfigs.release`
    );
  }
  s = s.replace(/versionCode \d+/, "versionCode 5");
  s = s.replace(/versionName "[^"]+"/, 'versionName "1.0.4"');
  fs.writeFileSync(appGradle, s);
  console.log("edit android/app/build.gradle");
}

function patchManifest() {
  write(path.join(SRC, "AndroidManifest.xml"), `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.VIBRATE" />

    <uses-feature android:name="android.hardware.touchscreen" android:required="true" />

    <supports-screens
        android:anyDensity="true"
        android:largeScreens="true"
        android:normalScreens="true"
        android:smallScreens="true"
        android:xlargeScreens="true" />

    <application
        android:allowBackup="true"
        android:hardwareAccelerated="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:largeHeap="true"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="false">

        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode|navigation|density"
            android:exported="true"
            android:label="@string/title_activity_main"
            android:launchMode="singleTask"
            android:screenOrientation="fullUser"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="\${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>
    </application>
</manifest>
`);
}

function patchStrings() {
  const file = path.join(SRC, "res", "values", "strings.xml");
  if (!fs.existsSync(file)) return;
  let s = fs.readFileSync(file, "utf8");
  s = s.replace(/<string name="app_name">[^<]+<\/string>/, `<string name="app_name">${APP_NAME}</string>`);
  s = s.replace(/<string name="title_activity_main">[^<]+<\/string>/, `<string name="title_activity_main">${APP_NAME}</string>`);
  s = s.replace(/<string name="package_name">[^<]+<\/string>/, `<string name="package_name">${PKG}</string>`);
  s = s.replace(/<string name="custom_url_scheme">[^<]+<\/string>/, `<string name="custom_url_scheme">${PKG}</string>`);
  fs.writeFileSync(file, s);
}

function patchStyles() {
  write(path.join(SRC, "res", "values", "styles.xml"), `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
        <item name="colorAccent">@color/colorAccent</item>
        <item name="android:statusBarColor">@android:color/transparent</item>
        <item name="android:navigationBarColor">@color/colorPrimary</item>
        <item name="android:windowDrawsSystemBarBackgrounds">true</item>
        <item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>
    </style>
    <style name="AppTheme.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar">
        <item name="windowActionBar">false</item>
        <item name="windowNoTitle">true</item>
        <item name="android:windowBackground">@color/splash_bg</item>
        <item name="android:statusBarColor">@color/colorPrimary</item>
        <item name="android:navigationBarColor">@color/colorPrimary</item>
        <item name="android:windowDrawsSystemBarBackgrounds">true</item>
        <item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>
    </style>
    <style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
        <item name="windowSplashScreenBackground">@color/splash_bg</item>
        <item name="windowSplashScreenAnimatedIcon">@mipmap/ic_launcher_foreground</item>
        <item name="windowSplashScreenIconBackgroundColor">@color/splash_bg</item>
        <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>
    </style>
</resources>
`);
  write(path.join(SRC, "res", "values", "colors.xml"), `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#0E1A12</color>
    <color name="colorPrimaryDark">#0E1A12</color>
    <color name="colorAccent">#E0C36A</color>
    <color name="splash_bg">#0E1A12</color>
</resources>
`);
}

function copyIcons() {
  const { Resvg } = require("@resvg/resvg-js");
  const svg = fs.readFileSync(path.join(ROOT, "public", "favicon.svg"), "utf8");
  function raster(size) {
    const out = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">${svg.replace(/<svg[^>]*>/, "").replace("</svg>", "")}</svg>`;
    return new Resvg(out, { fitTo: { mode: "width", value: size } }).render().asPng();
  }
  const dens = { "mipmap-mdpi": 48, "mipmap-hdpi": 72, "mipmap-xhdpi": 96, "mipmap-xxhdpi": 144, "mipmap-xxxhdpi": 192 };
  for (const [folder, size] of Object.entries(dens)) {
    const dir = path.join(SRC, "res", folder);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "ic_launcher.png"), raster(size));
    fs.writeFileSync(path.join(dir, "ic_launcher_round.png"), raster(size));
    fs.writeFileSync(path.join(dir, "ic_launcher_foreground.png"), raster(Math.round(size * 1.5)));
  }
  const anyDpi = path.join(SRC, "res", "mipmap-anydpi-v26");
  fs.mkdirSync(anyDpi, { recursive: true });
  const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;
  fs.writeFileSync(path.join(anyDpi, "ic_launcher.xml"), adaptive);
  fs.writeFileSync(path.join(anyDpi, "ic_launcher_round.xml"), adaptive);
  write(path.join(SRC, "res", "values", "ic_launcher_background.xml"), `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0E1A12</color>
</resources>
`);
  function splashPng(w, h) {
    const svgSplash = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <rect width="${w}" height="${h}" fill="#0e1a12"/>
      <g transform="translate(${w / 2 - 160} ${h / 2 - 210}) scale(5)">
        ${svg.replace(/<svg[^>]*>/, "").replace("</svg>", "")}
      </g>
    </svg>`;
    return new Resvg(svgSplash, { fitTo: { mode: "width", value: w } }).render().asPng();
  }
  const splashMap = {
    drawable: [480, 800],
    "drawable-port-mdpi": [320, 480],
    "drawable-port-hdpi": [480, 800],
    "drawable-port-xhdpi": [720, 1280],
    "drawable-port-xxhdpi": [1080, 1920],
    "drawable-land-mdpi": [480, 320],
    "drawable-land-hdpi": [800, 480],
    "drawable-land-xhdpi": [1280, 720]
  };
  for (const [folder, [w, h]] of Object.entries(splashMap)) {
    const dir = path.join(SRC, "res", folder);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "splash.png"), splashPng(w, h));
  }
}

function main() {
  if (!fs.existsSync(APP)) throw new Error("Primero hay que crear android/ con cap add android");
  const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT ||
    path.join(process.env.LOCALAPPDATA || "", "Android", "Sdk");
  write(path.join(ANDROID, "local.properties"), "sdk.dir=" + sdk.replace(/\\/g, "/") + "\n");
  ensureKeystore();
  patchGradle();
  patchManifest();
  patchStrings();
  patchStyles();
  copyIcons();
  const vars = path.join(ANDROID, "variables.gradle");
  if (fs.existsSync(vars)) {
    let s = fs.readFileSync(vars, "utf8");
    s = s.replace(/minSdkVersion = \d+/, "minSdkVersion = 24");
    s = s.replace(/compileSdkVersion = \d+/, "compileSdkVersion = 35");
    s = s.replace(/targetSdkVersion = \d+/, "targetSdkVersion = 35");
    fs.writeFileSync(vars, s);
  }
  console.log("Android parcheado");
}

main();
