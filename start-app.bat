@echo off
title نظام الأرشفة - تشغيل تلقائي
color 0B

echo ========================================
echo   تشغيل نظام الأرشفة الإلكترونية للجماعة
echo ========================================
echo.

REM ============================================
REM 1. تشغيل MySQL من XAMPP (بلا فتح الواجهة الرسومية)
REM ============================================
echo [1/3] جاري تشغيل MySQL...
net start | find "MySQL" >nul
if errorlevel 1 (
    start "" "C:\xampp\xampp_start.exe"
    timeout /t 5 /nobreak >nul
) else (
    echo MySQL خدام من قبل.
)

REM ============================================
REM 2. تشغيل Backend فنافذة منفصلة
REM ============================================
echo [2/3] جاري تشغيل Backend...
REM !! بدلي هاد المسار بالمسار الحقيقي ديال مجلد backend عندك !!
start "Archive Backend" cmd /k "cd /d C:\Users\HASSANI\Downloads\archive-app\archive-app\backend && npm start"

timeout /t 4 /nobreak >nul

REM ============================================
REM 3. تشغيل Frontend فنافذة منفصلة
REM ============================================
echo [3/3] جاري تشغيل Frontend...
REM !! بدلي هاد المسار بالمسار الحقيقي ديال مجلد frontend عندك !!
start "Archive Frontend" cmd /k "cd /d C:\Users\HASSANI\Downloads\archive-app\archive-app\frontend && npm run dev"

timeout /t 6 /nobreak >nul

REM ============================================
REM 4. فتح المتصفح تلقائياً
REM ============================================
echo جاري فتح التطبيق فالمتصفح...
start http://localhost:5173

echo.
echo ========================================
echo   التطبيق خدام! خليو هاد النوافذ مفتوحة.
echo   (تقدري تصغريهم، ماتسدوهمش)
echo ========================================
pause
