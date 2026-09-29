@echo off
title Cai Dat Thu Vien - Bep Viet Gourmet
echo ========================================================
echo        DANG CAI DAT THU VIEN CHO BEP VIET GOURMET
echo ========================================================
echo.
echo [1/2] Dang cai dat Backend Server (Express, Socket.io, Multer)...
cd server
call npm.cmd install
cd ..

echo.
echo [2/2] Dang cai dat Frontend Client (React, Vite, Tailwind, Lucide)...
cd client
call npm.cmd install
cd ..

echo.
echo ========================================================
echo [THANH CONG] Da cai dat xong toan bo thu vien!
echo Ban co the chay file: start-app.bat de mo ung dung.
echo ========================================================
pause
