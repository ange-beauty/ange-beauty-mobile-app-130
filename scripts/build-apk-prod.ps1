$ErrorActionPreference = "Stop"

# Force production environment values for the bundle step.
$env:NODE_ENV = "production"
$env:EXPO_PUBLIC_API_BASE_URL = "https://api.angebeauty.net/"

# Use JDK 17 if present.
$jdk17 = "C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot"
if (Test-Path "$jdk17\bin\java.exe") {
  $env:JAVA_HOME = $jdk17
  $env:Path = "$jdk17\bin;$env:Path"
}

Write-Host "Building release APK with production API: $env:EXPO_PUBLIC_API_BASE_URL"

npx expo prebuild --platform android --no-install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Push-Location android
try {
  .\gradlew.bat assembleRelease
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
finally {
  Pop-Location
}

Write-Host "APK generated at android/app/build/outputs/apk/release/app-release.apk"
