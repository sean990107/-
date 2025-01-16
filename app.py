from flask import Flask, render_template, request, jsonify, send_file
import csv
import os
from werkzeug.utils import secure_filename
from flask_cors import CORS
import logging
import openpyxl  # 使用 openpyxl 处理 Excel 文件

# 配置日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 限制上传文件大小为16MB
ALLOWED_EXTENSIONS = {'xlsx', 'xls'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    try:
        logger.info("访问首页")
        return render_template('index.html')
    except Exception as e:
        logger.error(f"渲染首页时出错: {str(e)}")
        return "服务器错误", 500

@app.route('/upload_excel', methods=['POST'])
def upload_excel():
    try:
        if 'file' not in request.files:
            return jsonify({'error': '没有文件'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': '没有选择文件'}), 400
        
        if file and allowed_file(file.filename):
            try:
                # 使用临时文件进行处理
                temp_filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'temp_upload.xlsx')
                file.save(temp_filepath)
                
                # 验证文件是否为有效的 Excel 文件
                try:
                    wb = openpyxl.load_workbook(temp_filepath)
                    ws = wb.active
                    
                    # 保存到最终位置
                    filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'data.xlsx')
                    os.makedirs(os.path.dirname(filepath), exist_ok=True)
                    wb.save(filepath)
                    wb.close()
                    
                    logger.info(f"文件保存成功: {filepath}")
                    
                    return jsonify({
                        'message': '文件上传成功（注意：新上传的文件会覆盖现有数据）',
                        'filename': file.filename
                    })
                    
                finally:
                    # 清理临时文件
                    try:
                        if os.path.exists(temp_filepath):
                            os.remove(temp_filepath)
                    except Exception as e:
                        logger.error(f"删除临时文件时出错: {str(e)}")
                        
            except Exception as e:
                logger.error(f"处理Excel文件时出错: {str(e)}")
                return jsonify({'error': '无法处理Excel文件，请确保文件格式正确'}), 400
        
        return jsonify({'error': '不支持的文件类型'}), 400
    except Exception as e:
        logger.error(f"上传文件时出错: {str(e)}")
        return jsonify({'error': '文件上传失败'}), 500

@app.route('/check_number', methods=['POST'])
def check_number():
    try:
        data = request.json
        if not data or 'number' not in data:
            return jsonify({'error': '无效的请求数据'}), 400
            
        number = str(data.get('number')).strip()
        
        # 检查前六位数字
        prefix = number[:6] if len(number) >= 6 else ''
        
        # 定义前缀和对应的列
        prefix_columns = {
            '610423': ('C', 'D'),  # C列数据，D列添加说明
            '610481': ('G', 'H'),  # G列数据，H列添加说明
            '610425': ('K', 'L'),  # K列数据，L列添加说明
            '610424': ('O', 'P')   # O列数据，P列添加说明
        }
        
        if prefix not in prefix_columns:
            return jsonify({'error': '无效的编号前缀'}), 400
            
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'data.xlsx')
        if not os.path.exists(filepath):
            return jsonify({'error': '请先上传Excel文件'}), 400
        
        # 使用 with 语句确保文件正确关闭
        with open(filepath, 'rb') as f:
            wb = openpyxl.load_workbook(f)
            ws = wb.active
            
            data_col, note_col = prefix_columns[prefix]
            
            # 检查数字是否已存在
            for cell in ws[data_col]:
                if cell.value and str(cell.value).strip() == number:
                    wb.close()
                    return jsonify({'exists': True, 'message': '该数据已存在'})
            
            # 找到对应列的第一个空单元格
            empty_row = None
            for idx, cell in enumerate(ws[data_col], 1):
                if not cell.value:
                    empty_row = idx
                    break
            
            if not empty_row:
                empty_row = ws.max_row + 1
                
            # 添加数据
            data_cell = ws[f'{data_col}{empty_row}']
            data_cell.value = number
            
            # 设置红色字体
            from openpyxl.styles import Font
            data_cell.font = Font(color="FF0000")
            
            # 添加说明文字
            ws[f'{note_col}{empty_row}'] = '新添加数据'
            
            # 保存文件
            wb.save(filepath)
            wb.close()
        
        return jsonify({
            'exists': False, 
            'message': f'新数据已添加到{data_col}列',
            'row': empty_row,
            'column': data_col
        })
            
    except Exception as e:
        logger.error(f"处理请求时出错: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/download_excel')
def download_excel():
    try:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'data.xlsx')
        if not os.path.exists(filepath):
            return jsonify({'error': '文件不存在'}), 404

        # 复制一个临时文件用于下载
        temp_filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'temp_download.xlsx')
        try:
            # 使用 openpyxl 打开并保存新文件，确保文件完整性
            wb = openpyxl.load_workbook(filepath)
            wb.save(temp_filepath)
            wb.close()

            # 设置响应头，指定正确的文件类型和编码
            response = send_file(
                temp_filepath,
                as_attachment=True,
                download_name='data.xlsx',
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                max_age=0,
                conditional=True,
                etag=True
            )
            
            # 添加必要的响应头
            response.headers['Content-Disposition'] = 'attachment; filename=data.xlsx'
            response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            response.headers['Pragma'] = 'no-cache'
            response.headers['Expires'] = '0'
            
            return response

        finally:
            # 确保临时文件被删除
            try:
                if os.path.exists(temp_filepath):
                    os.remove(temp_filepath)
            except Exception as e:
                logger.error(f"删除临时文件时出错: {str(e)}")
            
    except Exception as e:
        logger.error(f"下载文件时出错: {str(e)}")
        return jsonify({'error': '文件下载失败'}), 500

@app.route('/get_excel_data')
def get_excel_data():
    try:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'data.xlsx')
        if not os.path.exists(filepath):
            return jsonify({'error': '文件不存在'}), 404
            
        wb = openpyxl.load_workbook(filepath)
        ws = wb.active
        
        # 获取列名
        columns = [cell.value for cell in ws[1]]
        
        # 获取数据
        data = []
        for row in ws.iter_rows(min_row=2):
            row_data = {}
            for idx, cell in enumerate(row):
                row_data[columns[idx]] = cell.value or ''
            data.append(row_data)
        
        return jsonify({
            'data': data,
            'columns': columns
        })
    except Exception as e:
        logger.error(f"获取Excel数据时出错: {str(e)}")
        return jsonify({'error': '读取数据失败'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(
        host='0.0.0.0',  # 允许所有设备访问
        port=port,
        debug=True
    ) 