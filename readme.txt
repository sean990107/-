二维码扫描系统

本地开发：
1. 安装Python 3.7+
2. 安装依赖：pip install -r requirements.txt
3. 运行服务器：python app.py
4. 访问：http://localhost:5000

部署说明：
1. Railway.app 部署：
   - 注册 Railway 账号
   - 连接 GitHub 仓库
   - 选择 Python 项目
   - 设置环境变量
   - 自动部署

2. Render.com 部署：
   - 注册 Render 账号
   - 连接 GitHub 仓库
   - 选择 Web Service
   - 设置构建命令：pip install -r requirements.txt
   - 设置启动命令：gunicorn app:app
   - 设置环境变量

功能说明：
- 支持多摄像头切换
- 支持Excel文件导入导出
- 支持二维码扫描和数据验证
- 自动保存扫描结果
- 支持多设备访问

注意事项：
1. 首次使用需要授予摄像头权限
2. 建议使用Chrome或Firefox浏览器
3. 确保网络连接稳定