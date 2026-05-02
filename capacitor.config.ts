import type { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize, KeyboardStyle } from "@capacitor/keyboard";

const config: CapacitorConfig = {
  appId: "com.dled.stringhomeworktutor",
  appName: "String Homework Tutor",
  webDir: "dist",
  server: {
    iosScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#222222",
      showSpinner: false,
      iosSpinnerStyle: "small",
      spinnerColor: "#3498db",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: true,
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#222222",
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      style: KeyboardStyle.Dark,
      resizeOnFullScreen: true,
    },
    Haptics: {
      // Enable haptic feedback
    },
    MicrophonePlugin: {
      // Custom microphone plugin for iOS
    },
  },
  ios: {
    contentInset: "automatic",
    scrollEnabled: true,
  },
};

export default config;
