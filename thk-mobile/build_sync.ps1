Set-Location "C:\Users\BIG BOSS\Desktop\thkk\thk-mobile\android\app\thk-app\project"
npx vite build --outDir ../../../../www --emptyOutDir
Set-Location "C:\Users\BIG BOSS\Desktop\thkk\thk-mobile"
npx cap sync android
