@echo off

cd /d "%~dp0\.."

:: Run fetchLocation.js 
node src/fetchLocation.js
IF %ERRORLEVEL% NEQ 0 (
    EXIT /B 1
)

:: Run fetchStore.js if there are search results
node src/fetchStore.js