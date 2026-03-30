@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

where ffmpeg >nul 2>nul
if errorlevel 1 (
    echo [LocalTube] 提示: PATH 中未检测到 ffmpeg。若已写在 backend\.env 的 FFMPEG_PATH，可继续。
)

where node >nul 2>nul
if errorlevel 1 (
    echo [LocalTube] 未找到 Node.js，请安装 Node 18+ 或使用手动分别启动 backend / frontend
    exit /b 1
)

if not exist "node_modules\concurrently" (
    echo [LocalTube] 正在安装根目录依赖 concurrently ...
    call npm install
)

echo [LocalTube] 启动后端与前端（Ctrl+C 可同时结束）...
echo   前端 http://localhost:5173
echo   后端 http://localhost:8000
echo.
call npm start

endlocal
