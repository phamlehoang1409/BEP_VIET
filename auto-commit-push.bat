@echo off
chcp 65001 >nul
title BEP VIET GOURMET - AUTO COMMIT & PUSH TO GITHUB / VERCEL
color 0A

echo =====================================================================
echo       BẾP VIỆT GOURMET - TỰ ĐỘNG COMMIT & PUSH LÊN GITHUB + VERCEL
echo =====================================================================
echo.

:: 1. Check Git
git --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Máy tính chưa cài đặt Git! Vui lòng tải Git tại https://git-scm.com/
    pause
    exit /b 1
)

:: 2. Check Git Repo
if not exist ".git" (
    echo [*] Đang khởi tạo Git repository...
    git init -b main
)

:: 3. Check Remote
git remote get-url origin >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!] Chưa liên kết với kho lưu trữ GitHub (Remote Origin).
    echo.
    echo Vui lòng dán link GitHub Repository của bạn vào đây
    echo Ví dụ: https://github.com/username/bep-viet.git
    echo.
    set /p REPO_URL="Nhập link GitHub Repo của bạn: "
    if defined REPO_URL (
        git remote add origin %REPO_URL%
        echo [OK] Đã gắn remote origin: %REPO_URL%
    ) else (
        echo [!] Chưa nhập link. Sẽ chỉ commit nội bộ trên máy tính.
    )
)

echo.
echo [*] Đang chuẩn bị các tệp thay đổi...
git add .

set COMMIT_MSG=feat: Cap nhat va nang cap giao dien Bep Viet Gourmet [%DATE% %TIME%]
set /p USER_MSG="Nhập ghi chú commit (Bấm Enter để dùng mặc định: '%COMMIT_MSG%'): "

if defined USER_MSG (
    set COMMIT_MSG=%USER_MSG%
)

echo.
echo [*] Đang thực hiện Commit: "%COMMIT_MSG%"
git commit -m "%COMMIT_MSG%"

echo.
echo [*] Đang đẩy (Push) lên GitHub & kích hoạt tự động deploy Vercel...
git branch -M main
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =====================================================================
    echo [THÀNH CÔNG] Đã đẩy code lên GitHub thành công!
    echo Vercel đã nhận được bản cập nhật và đang tự động Deploy web lên mạng!
    echo =====================================================================
) else (
    echo.
    echo [CHÚ Ý] Nếu đây là lần đẩy đầu tiên hoặc chưa đăng nhập GitHub,
    echo bạn hãy đảm bảo đã tạo Repository trên GitHub và nhập tài khoản khi được hỏi.
)

echo.
pause
