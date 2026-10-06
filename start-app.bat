@echo off
title Bep Viet Gourmet - Khoi Dong He Thong
echo ========================================================
echo       BEP VIET GOURMET - FULLSTACK FOOD DELIVERY
echo ========================================================
echo.
echo [1/2] Dang khoi dong Backend Server (Port 5000)...
start "BEP-VIET-SERVER" cmd /k "cd server && node index.js"

timeout /t 2 /nobreak >nul

echo [2/2] Dang khoi dong Frontend Client (Vite Port 5173)...
start "BEP-VIET-CLIENT" cmd /k "cd client && npx.cmd vite --host --port 5173"

timeout /t 3 /nobreak >nul

echo.
echo ========================================================
echo HE THONG DA SAN SANG!
echo - Trang Khach Hang: http://localhost:5173
echo - Trang Quan Tri (Admin): http://localhost:5173/admin
echo - Backend API & Socket: http://localhost:5000
echo ========================================================
echo.
start http://localhost:5173
