@echo off
title CampusShare Real-Time Backend Server
cd /d "%~dp0backend"
echo ===================================================
echo   Starting CampusShare Real-Time Email & API Server
echo ===================================================
echo Server running at: http://localhost:5000
echo.
node server.js
pause
