@echo off
echo ===================================================
echo Uruchamianie kompilacji Androida z nowymi sciezkami
echo ===================================================
set JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.20.8-hotspot
set ANDROID_HOME=D:\Android\Sdk
set PATH=%JAVA_HOME%\bin;%PATH%;D:\Android\Sdk\platform-tools
npx expo run:android
