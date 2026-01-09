@echo off
echo Creating .env.local file for AutoFi Nexus...
cd frontend
echo # AutoFi Nexus Environment Variables > .env.local
echo VITE_VAULT_CONTRACT_ADDRESS=>> .env.local
echo VITE_RPC_URL= >> .env.local
echo.
echo ✅ .env.local file created successfully!
echo.
echo Now restart your frontend server:
echo npm run dev
echo.
pause
