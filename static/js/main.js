let html5QrcodeScanner = null;
let isScanning = false;
let isCameraActive = false;
let currentMessageTimeout = null;
let lastUploadedFile = localStorage.getItem('lastUploadedFile') || null;

// 添加基础URL配置
const BASE_URL = window.location.origin;  // 自动适应部署环境

// 添加语音对象
const successAudio = new Audio("data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAADAAAGhgBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVWqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr///////////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAAAAYbUjEkJAAAAAAAAAAAAAAAAAAAA//tQxAAB8AAAf4AAAAwAAAP8AAAABAA1VAuD4PwkHQfB8Hwfg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+AA");

document.addEventListener('DOMContentLoaded', function() {
    // 获取摄像头选择下拉框
    const cameraSelect = document.getElementById('cameraSelect');
    
    if (!cameraSelect) {
        console.error('Camera select element not found');
        return;
    }
    
    // 检查是否支持摄像头访问
    if (!window.isSecureContext) {
        const currentUrl = window.location.href;
        const httpUrl = currentUrl.replace('https://', 'http://');
        showResult(`请使用 HTTP 访问: ${httpUrl}`, 'warning');
        cameraSelect.innerHTML = '<option value="">请使用HTTP访问</option>';
        return;
    }
    
    // 获取可用的摄像头列表
    Html5Qrcode.getCameras().then(devices => {
        // 清空下拉框
        cameraSelect.innerHTML = '';
        
        if (devices && devices.length) {
            // 添加摄像头选项
            devices.forEach(device => {
                const option = document.createElement('option');
                option.value = device.id;
                option.text = device.label || `摄像头 ${device.id}`;
                cameraSelect.appendChild(option);
            });
        } else {
            cameraSelect.innerHTML = '<option value="">未检测到摄像头</option>';
            showResult('未检测到摄像头设备', 'warning');
        }
    }).catch(err => {
        console.error('获取摄像头列表失败:', err);
        if (err.toString().includes('NotAllowedError')) {
            showResult('请允许访问摄像头', 'warning');
        } else {
            showResult('获取摄像头失败，请确保已授予摄像头权限', 'danger');
        }
        cameraSelect.innerHTML = '<option value="">获取摄像头失败</option>';
    });
    
    // 监听摄像头选择变化
    cameraSelect.addEventListener('change', function() {
        if (this.value && isCameraActive) {
            stopCamera().then(() => startCamera());
        }
    });
    
    // 恢复文件状态显示
    updateFileDisplay();
    
    // 加载Excel预览
    refreshExcelPreview();
    
    // 添加文件输入监听
    const fileInput = document.getElementById('excelFile');
    fileInput.addEventListener('change', function() {
        if (lastUploadedFile && this.files.length > 0) {
            const confirmUpdate = confirm('已有上传的文件，是否要更新？');
            if (!confirmUpdate) {
                this.value = '';
                return;
            }
        }
    });
});

function startCamera() {
    const cameraId = document.getElementById('cameraSelect').value;
    if (!cameraId) {
        showResult('请选择摄像头', 'warning');
        return;
    }
    
    if (!html5QrcodeScanner) {
        html5QrcodeScanner = new Html5Qrcode("reader");
    }
    
    const config = {
        fps: 30,
        qrbox: { width: 200, height: 200 },
        aspectRatio: 1.0,
        formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.DATA_MATRIX
        ],
        experimentalFeatures: {
            useBarCodeDetectorIfSupported: false
        },
        disableFlip: false,
        videoConstraints: {
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
            facingMode: "environment",
            advanced: [{
                focusMode: "continuous",
                zoom: 1.5,
                brightness: 1.2,
                contrast: 1.5
            }]
        },
        verbose: true,
        rememberLastUsedCamera: true,
        useGrayscaleImage: true,
        threshold: {
            perfect: 0.1,
            good: 0.05,
            valid: 0.02
        }
    };
    
    document.getElementById('reader-container').style.display = 'block';
    document.getElementById('startButton').style.display = 'none';
    document.getElementById('stopButton').style.display = 'inline-block';
    
    html5QrcodeScanner.start(
        cameraId, 
        config,
        (decodedText, decodedResult) => {
            if (isScanning) {
                onScanSuccess(decodedText, decodedResult);
            }
        },
        onScanError
    ).then(() => {
        isCameraActive = true;
        showResult('摄像头已开启，点击"开始扫描"按钮开始扫描', 'info');
    }).catch(err => {
        console.error('启动扫描器失败:', err);
        showResult('启动扫描器失败，请刷新页面重试', 'danger');
    });
}

function toggleScanning() {
    const scanButton = document.getElementById('scanButton');
    
    if (!isScanning) {
        // 开始扫描
        isScanning = true;
        scanButton.innerHTML = '<i class="bi bi-stop-circle"></i> 停止扫描';
        scanButton.classList.add('scanning');
        showResult('扫描已开启', 'info');
        if (html5QrcodeScanner) {
            html5QrcodeScanner.resume();
        }
    } else {
        // 停止扫描
        isScanning = false;
        scanButton.innerHTML = '<i class="bi bi-qr-code-scan"></i> 开始扫描';
        scanButton.classList.remove('scanning');
        showResult('扫描已停止', 'warning');
        if (html5QrcodeScanner) {
            html5QrcodeScanner.pause();
        }
    }
}

function stopCamera() {
    if (html5QrcodeScanner && isCameraActive) {
        isScanning = false;
        return html5QrcodeScanner.stop().then(() => {
            isCameraActive = false;
            document.getElementById('reader-container').style.display = 'none';
            document.getElementById('startButton').style.display = 'inline-block';
            document.getElementById('stopButton').style.display = 'none';
            const scanButton = document.getElementById('scanButton');
            scanButton.innerHTML = '<i class="bi bi-qr-code-scan"></i> 开始扫描';
            scanButton.classList.remove('scanning');
            showResult('摄像头已关闭', 'info');
        }).catch((err) => {
            console.error('停止扫描器失败:', err);
            showResult('停止扫描器失败', 'danger');
        });
    }
    return Promise.resolve();
}

async function onScanSuccess(decodedText, decodedResult) {
    try {
        // 播放提示音
        successAudio.play().catch(e => console.error('播放提示音失败:', e));
        
        // 暂停扫描
        isScanning = false;
        
        // 显示处理中的提示
        showResult('正在处理...', 'info');
        
        // 发送到服务器验证
        const data = await checkNumber(decodedText);
        
        if (data.exists) {
            showResult(data.message, 'warning');
        } else {
            showResult(data.message, 'success');
        }
        
        // 延迟后恢复扫描
        setTimeout(() => {
            isScanning = true;
        }, 1500);
        
    } catch (error) {
        console.error('处理扫描结果时出错:', error);
        showResult(error.message || '处理失败，请重试', 'danger');
        // 延迟后恢复扫描
        setTimeout(() => {
            isScanning = true;
        }, 1500);
    }
}

function onScanError(errorMessage) {
    // 只在控制台记录错误，不显示给用户
    console.debug('扫描中...', errorMessage);
}

async function checkNumber(number) {
    try {
        // 验证扫描到的数据
        if (!number || number.trim() === '') {
            throw new Error('无效的扫描数据');
        }

        console.log('发送请求到服务器:', number.trim());

        const response = await fetch(`${BASE_URL}/check_number`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ number: number.trim() })
        });
        
        console.log('服务器响应状态:', response.status);
        
        const data = await response.json();
        console.log('服务器响应数据:', data);
        
        if (!response.ok) {
            throw new Error(data.error || `服务器错误 (${response.status})`);
        }
        
        return data;
    } catch (error) {
        console.error('检查数字时出错:', error);
        throw error;
    }
}

async function uploadExcel() {
    const fileInput = document.getElementById('excelFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showResult('请选择文件', 'warning');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        showResult('正在上传文件...', 'info');
        
        const response = await fetch(`${BASE_URL}/upload_excel`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `上传失败 (${response.status})`);
        }
        
        // 更新文件状态
        updateFileStatus(file.name);
        showResult(data.message, 'success');
        
        // 刷新Excel预览
        refreshExcelPreview();
        
        // 清空文件输入框
        fileInput.value = '';
    } catch (error) {
        console.error('上传文件时出错:', error);
        showResult(error.message || '上传失败，请重试', 'danger');
    }
}

function showResult(message, type) {
    const resultDiv = document.getElementById('result');
    if (!resultDiv) {
        console.error('Result div not found');
        return;
    }
    
    // 清除之前的定时器
    if (currentMessageTimeout) {
        clearTimeout(currentMessageTimeout);
        currentMessageTimeout = null;
    }
    
    // 清除之前的动画和类
    resultDiv.style.animation = '';
    resultDiv.style.display = 'none';
    
    // 设置新的消息和样式
    resultDiv.textContent = message;
    resultDiv.className = `alert alert-${type}`;
    
    // 重新触发动画
    void resultDiv.offsetWidth; // 触发重排以重启动画
    resultDiv.style.display = 'block';
    resultDiv.style.animation = 'slideDown 0.3s ease-out';
    
    // 如果不是"正在处理"或"正在上传"的消息，设置自动隐藏
    if (!message.includes('正在处理') && !message.includes('正在上传')) {
        currentMessageTimeout = setTimeout(() => {
            resultDiv.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                if (resultDiv.style.animation.includes('fadeOut')) {
                    resultDiv.style.display = 'none';
                }
            }, 300);
        }, 5000); // 增加到5秒
    }
}

function refreshExcelPreview() {
    fetch(`${BASE_URL}/get_excel_data`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            updateExcelPreview(data);
        })
        .catch(error => {
            console.error('获取Excel数据失败:', error);
            showResult('获取Excel数据失败', 'danger');
        });
}

function updateExcelPreview(data) {
    const headerRow = document.getElementById('previewHeader');
    const tableBody = document.getElementById('previewBody');
    const emptyMessage = document.getElementById('previewEmpty');
    
    if (!headerRow || !tableBody || !emptyMessage) {
        console.error('Excel preview elements not found');
        return;
    }
    
    // 清空现有内容
    headerRow.innerHTML = '';
    tableBody.innerHTML = '';
    
    if (!data.columns || !data.data || data.data.length === 0) {
        emptyMessage.style.display = 'block';
        return;
    }
    
    emptyMessage.style.display = 'none';
    
    // 添加表头
    data.columns.forEach(column => {
        const th = document.createElement('th');
        th.textContent = column;
        headerRow.appendChild(th);
    });
    
    // 添加数据行
    data.data.forEach(row => {
        const tr = document.createElement('tr');
        data.columns.forEach(column => {
            const td = document.createElement('td');
            td.textContent = row[column] || '';
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });
}

function updateFileStatus(filename) {
    lastUploadedFile = filename;
    localStorage.setItem('lastUploadedFile', filename);
    updateFileDisplay();
}

function updateFileDisplay() {
    const fileInput = document.getElementById('excelFile');
    if (!fileInput) {
        console.error('File input element not found');
        return;
    }

    const uploadButton = fileInput.nextElementSibling;
    const fileNameDisplay = document.getElementById('currentFileName');
    
    if (lastUploadedFile) {
        if (uploadButton) {
            uploadButton.innerHTML = '<i class="bi bi-upload"></i> 更新';
        }
        if (fileNameDisplay) {
            fileNameDisplay.innerHTML = `当前文件：<strong>${lastUploadedFile}</strong>`;
        }
    }
}

// 页面加载时检查是否已有数据
window.onload = function() {
    checkExistingData();
}

function checkExistingData() {
    // 先检查元素是否存在
    const uploadStatus = document.getElementById('upload-status');
    if (!uploadStatus) {
        console.warn('upload-status element not found, creating it');
        // 如果元素不存在，尝试创建它
        const cardBody = document.querySelector('.card-body');
        if (cardBody) {
            const statusDiv = document.createElement('div');
            statusDiv.id = 'upload-status';
            statusDiv.className = 'mb-3';
            cardBody.insertBefore(statusDiv, cardBody.firstChild);
        } else {
            console.error('Could not find .card-body element');
            return;
        }
    }

    fetch(`${BASE_URL}/get_excel_data`)
        .then(response => response.json())
        .then(data => {
            if (data.data && data.data.length > 0) {
                const status = document.getElementById('upload-status');
                if (status) {
                    status.innerHTML = 
                        '<div class="alert alert-warning">已存在数据表，重复上传会覆盖现有数据。</div>';
                }
                // 显示现有数据
                displayExistingData(data);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showResult('获取数据失败', 'danger');
        });
}

function displayExistingData(data) {
    // 如果需要显示现有数据，在这里实现
    console.log('现有数据:', data);
} 