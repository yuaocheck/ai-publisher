@echo off
setlocal enabledelayedexpansion

REM AI Publisher 一键启动脚本 (Windows)
REM 作者: AI Publisher Team
REM 版本: 1.0.0

echo ==================================
echo 🚀 AI Publisher 一键启动脚本
echo ==================================
echo.

REM 检查 Node.js 是否安装
echo [INFO] 检查 Node.js 安装状态...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Node.js 未安装
    echo [INFO] 请访问 https://nodejs.org/ 下载并安装 Node.js 18.0.0 或更高版本
    echo [INFO] 安装完成后重新运行此脚本
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [SUCCESS] Node.js !NODE_VERSION! 已安装
)

REM 检查 npm 是否可用
echo [INFO] 检查 npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm 不可用
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo [SUCCESS] npm !NPM_VERSION! 已安装
)

REM 检查 package.json 是否存在
if not exist "package.json" (
    echo [ERROR] package.json 文件不存在
    echo [ERROR] 请确保在项目根目录运行此脚本
    pause
    exit /b 1
)

REM 安装依赖
echo [INFO] 安装项目依赖...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] 依赖安装失败
    pause
    exit /b 1
)
echo [SUCCESS] 依赖安装完成

REM 设置环境变量
echo [INFO] 设置环境变量...
if not exist ".env.local" (
    if exist ".env.example" (
        copy ".env.example" ".env.local" >nul
        echo [SUCCESS] 已创建 .env.local 文件
        echo [WARNING] 请编辑 .env.local 文件，填入您的配置信息
    ) else (
        echo [WARNING] .env.example 文件不存在，跳过环境变量设置
    )
) else (
    echo [INFO] .env.local 文件已存在
)

REM 检查 Supabase CLI
echo [INFO] 检查 Supabase CLI...
supabase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] 安装 Supabase CLI...
    call npm install -g supabase
    if %errorlevel% neq 0 (
        echo [WARNING] Supabase CLI 安装失败，您可以稍后手动安装
    ) else (
        echo [SUCCESS] Supabase CLI 安装完成
    )
) else (
    echo [SUCCESS] Supabase CLI 已安装
)

echo.
echo [SUCCESS] 环境设置完成！
echo.

REM 询问是否启动开发服务器
set /p "start_server=是否现在启动开发服务器？(y/n): "
if /i "!start_server!"=="y" (
    echo [INFO] 启动开发服务器...
    echo [INFO] 在浏览器中打开 http://localhost:3000
    echo.
    call npm run dev
) else (
    echo.
    echo [INFO] 您可以稍后运行以下命令启动开发服务器：
    echo   npm run dev
    echo.
    echo [INFO] 然后在浏览器中访问: http://localhost:3000
    echo.
    pause
)

endlocal
