@echo off
cd /d "%~dp0"
echo Starting Nu, Pogodi! on http://localhost:8123 (close this window to stop)
start "" "http://localhost:8123/play.html"
where py >nul 2>nul && (py -m http.server 8123) || (python -m http.server 8123)
pause
