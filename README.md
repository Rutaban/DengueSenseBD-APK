# DengueSense BD — Android APK Build Guide

This is a ready-to-build **Expo (React Native)** project for the DengueSense BD app. It contains both the **public** and **healthcare professional** layers in one cross-platform JSX file.

The APK itself **cannot be built in this chat** — APK compilation needs the Android SDK + Gradle + JDK, which only run on your local machine or on Expo's cloud servers. This project is set up so building takes a single command on your side.

---

## What's in this folder

```
DengueSenseBD/
├── App.jsx              ← your two-layer React Native app
├── package.json         ← dependencies (Expo SDK 51)
├── app.json             ← app config (name, icon, Android package name)
├── eas.json             ← build profiles (APK output)
├── babel.config.js      ← Babel for Expo
├── .gitignore
└── assets/              ← icon.png, splash.png, etc. (placeholders – replace with your art)
```

---

## Option A — Build APK in the cloud (recommended, no Android SDK needed)

This uses **Expo Application Services (EAS)**. You don't need Android Studio, Gradle, or a powerful PC. The build runs on Expo's servers and gives you a direct APK download link.

### One-time setup on your machine
1. Install Node.js 18+ from https://nodejs.org
2. Open a terminal in this folder and run:
   ```bash
   npm install
   npm install -g eas-cli
   eas login          # create a free Expo account if you don't have one
   eas init           # this writes a real project ID into app.json
   ```

### Build the APK
```bash
eas build --platform android --profile preview
```
- Build takes **~10–20 minutes** on EAS servers
- When done, the terminal prints a URL like `https://expo.dev/.../builds/...`
- Open it, click **Download**, transfer the `.apk` to your Android phone, install it

The `preview` profile in `eas.json` is configured to produce an **installable APK** (not the Play Store AAB), so you can sideload it directly.

---

## Option B — Build APK locally (requires Android SDK)

If you want to avoid the cloud and have Android Studio installed:

```bash
npm install
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```
The APK appears at `android/app/build/outputs/apk/release/app-release.apk`.

**Requirements for local builds:**
- JDK 17
- Android SDK Platform 34
- Android Studio (recommended) or just the command-line tools
- `ANDROID_HOME` environment variable set

This route is slower to set up but doesn't depend on Expo's servers.

---

## Option C — Run it instantly on your phone (no APK yet)

Just to test before committing to a build:
```bash
npm install
npx expo start
```
Install the **Expo Go** app on your Android phone from Play Store, scan the QR code in the terminal. The app launches in seconds. Great for iteration; once you're happy with it, run Option A.

---

## Replacing the placeholder icon and splash

The `assets/` folder needs four PNGs:
- `icon.png` — 1024×1024, app icon
- `adaptive-icon.png` — 1024×1024, Android adaptive icon foreground (transparent background)
- `splash.png` — 1284×2778, launch screen
- `favicon.png` — 48×48, web favicon (optional)

Easiest way: generate them with https://www.appicon.co or use any 1024×1024 PNG you have. **Until you replace these, the app builds and runs fine but ships with default Expo placeholders.**

---

## Customising before building

Edit `app.json` to change:
- `name` — display name shown under the icon
- `android.package` — must be a unique reverse-DNS like `bd.yourorg.denguesense` (change before publishing to Play Store; the current `bd.denguesense.app` is fine for personal sideloading)
- `version` and `android.versionCode` — bump these for each new build you distribute

---

## Troubleshooting

**"Cannot find module 'expo'"** → run `npm install` first.

**"eas: command not found"** → install globally with `npm install -g eas-cli`.

**Build fails on EAS with "projectId missing"** → run `eas init` and accept when it offers to write the project ID into `app.json`.

**App opens to a white screen on the phone** → most often a JS error. Run `npx expo start` and connect from Expo Go to see the actual error in the dev console.

**Want iOS too?** → `eas build --platform ios --profile preview` (requires a paid Apple Developer account — $99/year — to install on a physical iPhone).

---

## What runs where

- **App.jsx** uses only React Native primitives (`View`, `Text`, `TouchableOpacity`, `ScrollView`, `TextInput`, `Switch`, `Linking`, `SafeAreaView`). No DOM, no web-only libraries.
- Both layers — public portal and professional portal — live in this one file and switch via the `view` state in the root `DengueSenseBDApp` component.
- Works on Android, iOS, and web (with `npx expo start --web`) from this same file.
