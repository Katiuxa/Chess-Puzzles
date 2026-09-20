"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const ANDROID = path.join(ROOT, "android-app");
const APP = path.join(ANDROID, "app");
const SRC = path.join(APP, "src", "main");
const PKG = "com.metamovidas.chesspuzzles";
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
  s = s.replace(/namespace\s+"[^"]+"/, `namespace "${PKG}"`);
  s = s.replace(/applicationId\s+"[^"]+"/, `applicationId "${PKG}"`);
  s = s.replace(/versionCode \d+/, "versionCode 19");
  s = s.replace(/versionName "[^"]+"/, 'versionName "1.0.18"');
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
    <color name="splash_bg">#000000</color>
</resources>
`);
}

function copyIcons() {
  const iconPath = path.join(ROOT, "resources", "icon.png");
  const fgPath = path.join(ROOT, "resources", "icon-foreground.png");
  if (!fs.existsSync(iconPath) || !fs.existsSync(fgPath)) {
    throw new Error("Faltan resources/icon.png o icon-foreground.png (npm run icons)");
  }
  const { spawnSync } = require("child_process");
  const apply = path.join(ROOT, "scripts", "apply-android-icons.py");
  const pr = spawnSync("python", [apply, SRC], { cwd: ROOT, stdio: "inherit", shell: true });
  if (pr.status) process.exit(pr.status || 1);

  const anyDpi = path.join(SRC, "res", "mipmap-anydpi-v26");
  fs.mkdirSync(anyDpi, { recursive: true });
  const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;
  fs.writeFileSync(path.join(anyDpi, "ic_launcher.xml"), adaptive);
  fs.writeFileSync(path.join(anyDpi, "ic_launcher_round.xml"), adaptive);
  write(path.join(SRC, "res", "values", "ic_launcher_background.xml"), `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#000000</color>
</resources>
`);
  write(path.join(SRC, "res", "drawable", "ic_launcher_background.xml"), `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <gradient
        android:type="linear"
        android:angle="270"
        android:startColor="#000000"
        android:endColor="#1C1C1E" />
</shape>
`);
}

function patchMainActivity() {
  const pkgPath = PKG.split(".").join(path.sep);
  const javaRoot = path.join(SRC, "java");
  const destDir = path.join(javaRoot, pkgPath);
  const dest = path.join(destDir, "MainActivity.java");
  write(dest, `package ${PKG};

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        SplashScreen splash = SplashScreen.installSplashScreen(this);
        splash.setKeepOnScreenCondition(() -> false);
        super.onCreate(savedInstanceState);

        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.parseColor("#0e1a12"));

        final View root = findViewById(android.R.id.content);
        ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {
            Insets nav = insets.getInsets(WindowInsetsCompat.Type.navigationBars());
            Insets cutout = insets.getInsets(WindowInsetsCompat.Type.displayCutout());
            int bottom = Math.max(nav.bottom, cutout.bottom);
            v.setPadding(0, 0, 0, bottom);
            return insets;
        });
        ViewCompat.requestApplyInsets(root);
    }

    @Override
    public void onStart() {
        super.onStart();
        focusWebView();
    }

    @Override
    public void onResume() {
        super.onResume();
        focusWebView();
    }

    private void focusWebView() {
        if (getBridge() == null) return;
        WebView webView = getBridge().getWebView();
        if (webView == null) return;
        webView.setClickable(true);
        webView.setFocusable(true);
        webView.setFocusableInTouchMode(true);
        webView.requestFocus();
    }
}
`);

  // Remove old package tree leftovers so Gradle doesn't compile both.
  const stale = path.join(javaRoot, "com", "metamovidas", "sherzod");
  if (fs.existsSync(stale) && PKG !== "com.metamovidas.sherzod") {
    fs.rmSync(stale, { recursive: true, force: true });
    console.log("removed stale java package com.metamovidas.sherzod");
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
  patchMainActivity();
  patchStrings();
  patchStyles();
  copyIcons();
  const vars = path.join(ANDROID, "variables.gradle");
  if (fs.existsSync(vars)) {
    let s = fs.readFileSync(vars, "utf8");
    s = s.replace(/minSdkVersion = \d+/, "minSdkVersion = 24");
    s = s.replace(/compileSdkVersion = \d+/, "compileSdkVersion = 36");
    s = s.replace(/targetSdkVersion = \d+/, "targetSdkVersion = 36");
    fs.writeFileSync(vars, s);
  }
  console.log("Android parcheado (" + PKG + ")");
}

main();
