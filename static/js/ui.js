let currentMessageTimeout = null;

function showResult(message, type = 'info', duration = 10000) {
    const resultDiv = document.getElementById('scanResult');
    if (!resultDiv) return;
    
    // 清除之前的定时器
    if (currentMessageTimeout) {
        clearTimeout(currentMessageTimeout);
        currentMessageTimeout = null;
    }
    
    // 设置提示内容和样式
    resultDiv.className = `alert alert-${type}`;
    resultDiv.textContent = message;
    
    // 显示提示
    resultDiv.style.display = 'block';
    resultDiv.classList.add('alert-show');
    resultDiv.classList.remove('alert-hide');
    
    // 设置自动隐藏
    if (duration > 0) {
        currentMessageTimeout = setTimeout(() => {
            resultDiv.classList.remove('alert-show');
            resultDiv.classList.add('alert-hide');
            setTimeout(() => {
                resultDiv.style.display = 'none';
            }, 300);
        }, duration);
    }
}

function updateScanButton() {
    const scanButton = document.getElementById('scanButton');
    if (scanButton) {
        scanButton.textContent = isScanning ? '停止扫描' : '开始扫描';
        scanButton.className = isScanning ? 'btn btn-danger' : 'btn btn-primary';
    }
}

function updateCameraButton() {
    const cameraButton = document.getElementById('cameraButton');
    if (cameraButton) {
        cameraButton.textContent = isCameraActive ? '关闭摄像头' : '打开摄像头';
        cameraButton.className = isCameraActive ? 'btn btn-danger' : 'btn btn-primary';
    }
}

function updateFileDisplay() {
    const fileStatus = document.getElementById('fileStatus');
    if (!fileStatus) return;
    
    checkFileStatus().then(exists => {
        if (exists) {
            fileStatus.innerHTML = `当前文件: template.xlsx`;
            fileStatus.className = 'alert alert-success mt-3';
        } else {
            fileStatus.innerHTML = '未上传文件';
            fileStatus.className = 'alert alert-warning mt-3';
        }
    });
}

function showClearConfirm() {
    const modal = new bootstrap.Modal(document.getElementById('clearConfirmModal'));
    modal.show();
}

async function clearDatabase() {
    try {
        const password = document.getElementById('clearPassword').value;
        if (!password) {
            showResult('请输入密码', 'warning');
            return;
        }

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
        
        // 刷新统计信息
        refreshStatistics();
        
    } catch (error) {
        console.error('清除数据库失败:', error);
        showResult('清除失败：' + error.message, 'danger');
    }
} 