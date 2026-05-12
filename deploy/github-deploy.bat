@echo off
echo 🚀 GitHub Pages Deployment for Climate Monitor
echo ==============================================
echo.

echo 📋 Step 1: Create GitHub repository at github.com
echo    Repository name: climate-monitor
echo    Make it PUBLIC (required for free Pages)
echo.

echo 📋 Step 2: Copy these commands after creating repository:
echo.
echo cd /d "C:\Users\asus\CascadeProjects\climate_monitor\web\deploy"
echo git init
echo git add .
echo git commit -m "Initial climate monitor deployment"
echo git branch -M main
echo git remote add origin https://github.com/YOUR_USERNAME/climate-monitor.git
echo git push -u origin main
echo.

echo 📋 Step 3: Enable GitHub Pages
echo    1. Go to your repository on GitHub
echo    2. Click Settings → Pages
echo    3. Source: Deploy from branch → main → Root
echo    4. Save and wait 2-5 minutes
echo.

echo 📋 Step 4: Visit your website:
echo    https://YOUR_USERNAME.github.io/climate-monitor
echo.

echo 📋 Replace YOUR_USERNAME with your actual GitHub username
echo.

pause
