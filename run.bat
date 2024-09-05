@echo off
:: Run fetchLocation.js 
node fetchLocation.js
IF %ERRORLEVEL% NEQ 0 (
    EXIT /B 1
)

:: Run fetchStore.js if there are search results
node fetchStore.js