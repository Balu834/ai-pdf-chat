import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.intellixy.app",
  appName: "Intellixy",
  webDir: "out", // not used in live-reload mode, but required by Capacitor

  server: {
    url: "https://intellixy.vercel.app",
    cleartext: false, // HTTPS only
  },

  android: {
    backgroundColor: "#0f0f0f",
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // set true only for dev
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#0f0f0f",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
    StatusBar: {
      style: "Dark",
      backgroundColor: "#0f0f0f",
    },
  },
};

export default config;
