from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from config.database import statistics, records
import logging

logger = logging.getLogger(__name__)
stats_bp = Blueprint('statistics', __name__, url_prefix='/api')

@stats_bp.route('/update_statistics', methods=['POST'])
def update_statistics():
    try:
        data = request.get_json()
        device_id = data.get('device_id')
        scan_type = data.get('type')
        
        logger.info(f"更新统计 - 设备: {device_id}, 类型: {scan_type}")
        
        if not device_id or not scan_type:
            logger.warning("统计更新参数不完整")
            return jsonify({'error': '参数不完整'}), 400
            
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # 首先检查文档是否存在
        existing_stats = statistics.find_one({
            'date': today,
            'device_id': device_id
        })
        
        if not existing_stats:
            # 如果不存在，创建新文档
            statistics.insert_one({
                'date': today,
                'device_id': device_id,
                'scans': {
                    'success': 0,
                    'duplicate': 0,
                    'invalid': 0,
                    'total': 0
                },
                'last_scan_time': datetime.now()
            })
        
        # 更新统计数据
        result = statistics.update_one(
            {
                'date': today,
                'device_id': device_id
            },
            {
                '$inc': {
                    f'scans.{scan_type}': 1,
                    'scans.total': 1
                },
                '$set': {
                    'last_scan_time': datetime.now()
                }
            }
        )
        
        logger.info(f"统计更新结果: matched={result.matched_count}, modified={result.modified_count}")
        return jsonify({'message': '统计更新成功'})
        
    except Exception as e:
        logger.error(f"更新统计失败: {str(e)}")
        return jsonify({'error': str(e)}), 500

@stats_bp.route('/get_statistics')
def get_statistics():
    try:
        device_id = request.args.get('device_id')
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # 获取本设备统计
        device_stats = statistics.find_one({
            'date': today,
            'device_id': device_id
        }) or {
            'scans': {
                'success': 0,
                'duplicate': 0,
                'invalid': 0,
                'total': 0
            },
            'last_scan_time': None
        }
        
        # 获取所有设备统计
        pipeline = [
            {
                '$match': {
                    'date': today
                }
            },
            {
                '$group': {
                    '_id': None,
                    'total_success': {'$sum': '$scans.success'},
                    'total_duplicate': {'$sum': '$scans.duplicate'},
                    'total_invalid': {'$sum': '$scans.invalid'},
                    'total_scans': {'$sum': '$scans.total'},
                    'last_scan_time': {'$max': '$last_scan_time'}
                }
            }
        ]
        
        all_stats = list(statistics.aggregate(pipeline))
        total_stats = all_stats[0] if all_stats else {
            'total_success': 0,
            'total_duplicate': 0,
            'total_invalid': 0,
            'total_scans': 0,
            'last_scan_time': None
        }
        
        return jsonify({
            'device': {
                'today_scans': device_stats['scans'].get('total', 0),
                'success_scans': device_stats['scans'].get('success', 0),
                'duplicate_scans': device_stats['scans'].get('duplicate', 0),
                'invalid_scans': device_stats['scans'].get('invalid', 0),
                'last_scan_time': device_stats['last_scan_time'].strftime('%Y-%m-%d %H:%M:%S') if device_stats['last_scan_time'] else '暂无'
            },
            'total': {
                'today_scans': total_stats['total_scans'],
                'success_scans': total_stats['total_success'],
                'duplicate_scans': total_stats['total_duplicate'],
                'invalid_scans': total_stats['total_invalid'],
                'last_scan_time': total_stats['last_scan_time'].strftime('%Y-%m-%d %H:%M:%S') if total_stats['last_scan_time'] else '暂无'
            }
        })
        
    except Exception as e:
        logger.error(f"获取统计失败: {str(e)}")
        return jsonify({'error': str(e)}), 500 