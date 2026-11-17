#!/bin/zsh
# Builds the Farm Manager iOS app (Apple HIG look) for the iPhone Simulator in demo mode (sample farm, no server)
# and copies it to ios-sim/FarmManager.app. Builds in a temporary copy so app/ stays free of generated ios/ files.
# Needs Xcode and CocoaPods (gem install --user-install cocoapods -v 1.15.2 on the system Ruby).
#   zsh scripts/build-ios-sim.sh && xcrun simctl install booted ios-sim/FarmManager.app && xcrun simctl launch booted com.gopinath.farmmanager
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; WORK="$(mktemp -d)/farm"
export PATH="$HOME/.gem/ruby/2.6.0/bin:$PATH" EXPO_PUBLIC_DEMO=1 CI=1 LANG=en_US.UTF-8
cp -cR "$ROOT/app" "$WORK"
cd "$WORK" && npx expo prebuild --platform ios --clean
cd ios && xcodebuild -workspace FarmManager.xcworkspace -scheme FarmManager -configuration Release -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' -derivedDataPath build CODE_SIGNING_ALLOWED=NO build | grep -E "error:|BUILD (SUCCEEDED|FAILED)"
rm -rf "$ROOT/ios-sim" && mkdir -p "$ROOT/ios-sim"
cp -R build/Build/Products/Release-iphonesimulator/FarmManager.app "$ROOT/ios-sim/"
cd "$ROOT" && rm -rf "$(dirname "$WORK")"   # the temporary copy, its Pods and build outputs
echo "Built $ROOT/ios-sim/FarmManager.app"
