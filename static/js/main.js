// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化摄像头列表
    initCameraList();
    
    // 加载备份列表
    refreshBackupList();
    
    // 更新文件显示
    updateFileDisplay();
    
    // 获取初始统计信息
    refreshStatistics();
    
    // 定期更新统计信息
    setInterval(refreshStatistics, 30000);
    
    // 初始化文件拖放功能
    initFileDragDrop();
});

// 初始化摄像头列表
async function initCameraList() {
    try {
        const devices = await Html5Qrcode.getCameras();
        const cameraSelect = document.getElementById('cameraSelect');
        cameraSelect.innerHTML = '';
        
        if (devices && devices.length) {
            devices.forEach(device => {
                const option = document.createElement('option');
                option.value = device.id;
                option.text = device.label || `摄像头 ${device.id}`;
                cameraSelect.appendChild(option);
            });
            
            if (devices.length > 0) {
                cameraSelect.value = devices[0].id;
                // 显示扫描按钮
                document.getElementById('scanButton').style.display = 'block';
            }
        } else {
            cameraSelect.innerHTML = '<option value="">未检测到摄像头</option>';
            showResult('未检测到摄像头设备', 'warning');
        }
    } catch (err) {
        console.error('获取摄像头列表失败:', err);
        showResult('获取摄像头失败：' + err.message, 'danger');
    }
}

// 初始化文件拖放功能
function initFileDragDrop() {
    const uploadArea = document.querySelector('.upload-area');
    if (!uploadArea) return;

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            document.getElementById('excelFile').files = files;
            uploadExcel();
        }
    });
}

async function uploadTemplate() {
    const fileInput = document.getElementById('templateFile');
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    try {
        const response = await fetch(`${BASE_URL}/upload_template`, {
            method: 'POST',
            body: formData  // 不要设置 Content-Type，让浏览器自动处理
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '上传失败');
        }
        
        showResult('模板文件上传成功', 'success');
        updateFileDisplay();
        
    } catch (error) {
        console.error('文件上传失败:', error);
        showResult('文件上传失败: ' + error.message, 'danger');
    }
}

async function clearDatabase() {
    const password = document.getElementById('clearPassword').value;
    if (!password) {
        showResult('请输入密码', 'warning');
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/api/clear_database`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || '清除失败');
        }

        // 关闭模态框
        const modal = bootstrap.Modal.getInstance(document.getElementById('clearConfirmModal'));
        modal.hide();
        
        // 清空密码输入
        document.getElementById('clearPassword').value = '';
        
        // 显示成功消息
        showResult(`数据库清除成功，共清除 ${data.count} 条记录`, 'success');
        
    } catch (error) {
        console.error('清除数据库失败:', error);
        showResult('清除数据库失败: ' + error.message, 'danger');
    }
}

// 将函数添加到全局作用域
Object.assign(window, {
    clearDatabase,
    showClearConfirm: () => {
        const modal = new bootstrap.Modal(document.getElementById('clearConfirmModal'));
        modal.show();
    }
}); 