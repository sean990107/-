from pymongo import MongoClient
from gridfs import GridFS
import logging
import os

# 设置日志
logger = logging.getLogger(__name__)

# 设置备份目录
BACKUP_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backups')
os.makedirs(BACKUP_DIR, exist_ok=True)
logger.info(f"备份目录路径: {BACKUP_DIR}")

# MongoDB 连接配置
DB_USERNAME = "chaosenhao"
DB_PASSWORD = "csh12300.."
MONGO_URI = f"mongodb+srv://{DB_USERNAME}:{DB_PASSWORD}@cluster0.5k29k.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

# 创建数据库连接
client = MongoClient(MONGO_URI)
db = client['qrcode_scanner']
records = db.scan_records
fs = GridFS(db)
statistics = db['statistics']

def init_db():
    try:
        client.admin.command('ping')
        logger.info("MongoDB 连接成功!")
        return True
    except Exception as e:
        logger.error(f"MongoDB 连接错误: {str(e)}")
        raise

# 文件相关配置
ALLOWED_EXTENSIONS = {'xlsx', 'xls'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS