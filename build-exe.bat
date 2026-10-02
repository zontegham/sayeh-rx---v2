@echo off
chcp 65001 > nul
title ساخت فایل اجرایی ویندوز - فرستنده سایه (شرکت ژئوتک)
echo ======================================================================
echo    سامانه فرستنده امن یکسویه سایه - شرکت ژئوتک
echo    در حال ساخت فایل اجرایی Sayeh-Transmitter.exe برای ویندوز...
echo ======================================================================
echo.

:: بررسی وجود Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [خطا] Node.js بر روی این سیستم نصب نیست.
    echo لطفاً Node.js را از سایت https://nodejs.org دانلود و نصب کنید.
    echo.
    pause
    exit /b 1
)

echo [1/3] بیلد کدهای فرانت‌اند و کدهای رمزنگاری سامانه...
call npm run build
if %errorlevel% neq 0 (
    echo [خطا] فرایند بیلد با مشکل مواجه شد.
    pause
    exit /b 1
)

echo [2/3] بررسی و نصب پکیج الکترون و بیلدر...
call npm install --save-dev electron electron-builder
if %errorlevel% neq 0 (
    echo [خطا] در دریافت پکیج‌های بیلد.
    pause
    exit /b 1
)

echo [3/3] تولید فایل خروجی تک‌فایل Sayeh-Transmitter.exe ...
call npx electron-builder --win portable --config.directories.output=release
if %errorlevel% neq 0 (
    echo [خطا] تولید فایل EXE ناموفق بود.
    pause
    exit /b 1
)

echo.
echo ======================================================================
echo    [موفقیت] فایل Sayeh-Transmitter.exe با موفقیت در پوشه release ساخته شد!
echo    می‌توانید این فایل را روی هر سیستم ویندوزی بدون اینترنت اجرا کنید.
echo ======================================================================
echo.
pause
