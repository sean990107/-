from flask import Flask, render_template
from flask_cors import CORS
from routes.scan import scan_bp
from routes.file import file_bp
from routes.backup import backup_bp
from routes.statistics import stats_bp
from config.database import init_db
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logging.getLogger('pymongo').setLevel(logging.WARNING)
logging.getLogger('urllib3').setLevel(logging.WARNING)
logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__)
    CORS(app)  # 启用CORS支持
    
    # 初始化数据库连接
    init_db()
    
    # 注册主页路由
    @app.route('/')
    def index():
        return render_template('index.html')

    # 注册蓝图
    app.register_blueprint(scan_bp)
    app.register_blueprint(file_bp)
    app.register_blueprint(backup_bp)
    app.register_blueprint(stats_bp)
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 