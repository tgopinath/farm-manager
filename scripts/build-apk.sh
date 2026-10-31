#!/bin/zsh
# Builds the Farm Manager Android APK in demo mode (sample farm, no server needed)
# and uploads it to the GitHub release the portfolio links to. Builds in a temporary copy so app/ stays free of generated android/ files.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; WORK="$(mktemp -d)/farm"
cp -cR "$ROOT/app" "$WORK"
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ANDROID_HOME="$HOME/Library/Android/sdk" EXPO_PUBLIC_DEMO=1 CI=1
cd "$WORK" && npx expo prebuild --platform android --no-install --clean
cd android && ./gradlew --no-daemon assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a,x86_64
cp app/build/outputs/apk/release/app-release.apk "$ROOT/farm-manager.apk"
~/.local/bin/gh release upload v1.0.0 "$ROOT/farm-manager.apk" -R tgopinath/farm-manager --clobber
echo "Uploaded to https://github.com/tgopinath/farm-manager/releases/latest/download/$(basename "$ROOT/farm-manager.apk")"
