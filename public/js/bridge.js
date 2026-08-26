(function () {
  "use strict";
  document.documentElement.classList.add("is-native");

  function cap() {
    return window.Capacitor || null;
  }
  function plugin(name) {
    var C = cap();
    if (!C) return null;
    if (C.Plugins && C.Plugins[name]) return C.Plugins[name];
    if (typeof C.getPlugin === "function") {
      try { return C.getPlugin(name); } catch (e) { return null; }
    }
    return null;
  }

  async function hideSplash() {
    var SplashScreen = plugin("SplashScreen");
    if (!SplashScreen || !SplashScreen.hide) return;
    try {
      await SplashScreen.hide({ fadeOutDuration: 0 });
    } catch (e) {}
  }

  async function bootNative() {
    var StatusBar = plugin("StatusBar");
    var Keyboard = plugin("Keyboard");
    var App = plugin("App");
    var Haptics = plugin("Haptics");

    await hideSplash();
    setTimeout(hideSplash, 50);
    setTimeout(hideSplash, 250);
    setTimeout(hideSplash, 800);

    try {
      if (StatusBar) {
        if (StatusBar.setOverlaysWebView) await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setStyle({ style: "DARK" });
        if (StatusBar.setBackgroundColor) await StatusBar.setBackgroundColor({ color: "#0e1a12" });
        if (StatusBar.show) await StatusBar.show();
      }
    } catch (e) {}
    try {
      if (Keyboard && Keyboard.setAccessoryBarVisible) await Keyboard.setAccessoryBarVisible({ isVisible: false });
    } catch (e) {}

    if (App && App.addListener) {
      App.addListener("backButton", function () {
        if (typeof window.SherzodConsumeBack === "function" && window.SherzodConsumeBack()) return;
        if (App.exitApp) App.exitApp();
      });
      App.addListener("appStateChange", function (state) {
        if (state && state.isActive) hideSplash();
      });
    }
    if (Haptics && Haptics.impact && typeof navigator.vibrate !== "function") {
      navigator.vibrate = function () {
        try { Haptics.impact({ style: "Light" }); } catch (e) {}
        return true;
      };
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { bootNative(); });
  } else {
    bootNative();
  }
  window.addEventListener("load", function () { hideSplash(); });
})();
