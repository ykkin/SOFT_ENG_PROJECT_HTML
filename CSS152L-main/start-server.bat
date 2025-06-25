@echo off
cd /d "%~dp0main\SOFT_ENG_PROJECT_HTML\backend_wings_things"
call npm install
start "" http://localhost:3000/main/INVENTORY/login/login.html
call npm start
pause 