// 扫描器相关代码
let html5QrcodeScanner = null;
let isScanning = false;
let isCameraActive = false;
let isTransitioning = false;  // 添加状态转换标志
let lastScannedCode = null;  // 添加变量记录上一次扫描的代码
let lastScanTime = 0;        // 添加变量记录上一次扫描的时间
const SCAN_COOLDOWN = 2000;  // 设置扫描冷却时间（毫秒）

// 在文件顶部添加音效对象
const successBeep = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");
const errorBeep = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");

// 修改配置
const config = {
    fps: 30,  // 提高帧率使追踪更流畅
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0,
    formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ],
};

// 更新追踪点位置的函数
function updateTrackingDot(location) {
    const dot = document.querySelector('.tracking-dot');
    const scanRegion = document.getElementById('reader__scan_region');
    
    if (dot && scanRegion && location) {
        // 计算中心点
        const centerX = (location.topLeftCorner.x + location.topRightCorner.x + location.bottomLeftCorner.x + location.bottomRightCorner.x) / 4;
        const centerY = (location.topLeftCorner.y + location.topRightCorner.y + location.bottomLeftCorner.y + location.bottomRightCorner.y) / 4;
        
        // 获取扫描区域的尺寸
        const scanRegionRect = scanRegion.getBoundingClientRect();
        
        // 计算相对位置
        const relativeX = (centerX / scanRegion.offsetWidth) * 100;
        const relativeY = (centerY / scanRegion.offsetHeight) * 100;
        
        // 设置点的位置（使用百分比）
        dot.style.left = `${relativeX}%`;
        dot.style.top = `${relativeY}%`;
        dot.style.display = 'block';
        
        // 添加调试信息
        console.log('QR Code Location:', {
            center: { x: centerX, y: centerY },
            relative: { x: relativeX, y: relativeY }
        });
    }
}

// 初始化扫描器
async function initScanner(cameraId) {
    try {
        const reader = document.getElementById('reader');
        const placeholder = document.getElementById('camera-placeholder');
        
        html5QrcodeScanner = new Html5Qrcode('reader');
        
        await html5QrcodeScanner.start(
            { facingMode: "environment" },
            {
                ...config,
                qrbox: function(viewfinderWidth, viewfinderHeight) {
                    let minEdgePercentage = 0.7;
                    let minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
                    let qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
                    return {
                        width: qrboxSize,
                        height: qrboxSize
                    };
                }
            },
            (decodedText, decodedResult) => {
                if (isScanning) {
                    // 更新追踪点位置
                    updateTrackingDot(decodedResult.location);
                    handleScanResult(decodedText);
                }
            },
            (errorMessage) => {
                // 当没有检测到二维码时隐藏追踪点
                const dot = document.querySelector('.tracking-dot');
                if (dot) dot.style.display = 'none';
            }
        );
        
        // 添加追踪点
        const scanRegion = document.getElementById('reader__scan_region');
        if (!document.querySelector('.tracking-dot')) {
            const dot = document.createElement('div');
            dot.className = 'tracking-dot';
            scanRegion.appendChild(dot);
        }
        
        // 等待扫描器初始化完成
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 更新UI
        if (placeholder) placeholder.style.display = 'none';
        if (reader) reader.style.display = 'block';
        
        isCameraActive = true;
        isScanning = false;  // 默认不扫描
        
        updateCameraButton();
        updateScanButton();
        showResult('摄像头已打开，点击"开始扫描"进行扫描', 'info');
        
        // 显示扫描按钮
        const scanButton = document.getElementById('scanButton');
        if (scanButton) scanButton.style.display = 'block';
        
    } catch (err) {
        console.error('启动摄像头失败:', err);
        showResult('启动摄像头失败：' + err.message, 'danger');
        throw err;
    }
}

// 切换摄像头
async function toggleCamera() {
    if (isTransitioning) return;  // 如果正在转换状态，直接返回
    
    try {
        isTransitioning = true;  // 开始状态转换
        
        if (isCameraActive) {
            // 停止摄像头
            if (html5QrcodeScanner) {
                isScanning = false;
                await html5QrcodeScanner.stop();
                html5QrcodeScanner = null;
            }
            
            // 更新UI
            const reader = document.getElementById('reader');
            const placeholder = document.getElementById('camera-placeholder');
            const scanButton = document.getElementById('scanButton');
            
            if (reader) reader.style.display = 'none';
            if (placeholder) placeholder.style.display = 'flex';
            if (scanButton) scanButton.style.display = 'none';
            
            isCameraActive = false;
            
        } else {
            // 启动摄像头
            const cameraId = document.getElementById('cameraSelect').value;
            if (!cameraId) {
                showResult('请选择摄像头', 'warning');
                return;
            }
            await initScanner(cameraId);
        }
        
        // 更新UI
        updateCameraButton();
        updateScanButton();
        
    } catch (error) {
        console.error('切换摄像头失败:', error);
        showResult('切换摄像头失败：' + error.message, 'danger');
    } finally {
        isTransitioning = false;  // 状态转换结束
    }
}

// 切换扫描状态
async function toggleScanning() {
    if (!html5QrcodeScanner || !isCameraActive) {
        showResult('请先打开摄像头', 'warning');
        return;
    }
    
    try {
        isScanning = !isScanning;
        console.log(isScanning ? '开始扫描...' : '扫描已暂停');
        
        // 更新UI
        updateScanButton();
        showResult(isScanning ? '正在扫描...' : '扫描已暂停，点击"开始扫描"继续', 'info');
        
    } catch (error) {
        console.error('切换扫描状态失败:', error);
        showResult('切换扫描状态失败：' + error.message, 'danger');
    }
}

// 处理扫描结果
async function handleScanResult(decodedText) {
    try {
        // 检查是否是重复扫描
        const now = Date.now();
        if (decodedText === lastScannedCode && (now - lastScanTime) < SCAN_COOLDOWN) {
            console.log('忽略重复扫描');
            return;
        }
        
        // 立即播放声音和震动提示
        successBeep.play().catch(() => {});
        navigator.vibrate && navigator.vibrate(100);
        
        // 更新扫描记录
        lastScannedCode = decodedText;
        lastScanTime = now;
        
        // 立即暂停扫描
        isScanning = false;
        updateScanButton();
        
        const response = await fetch(`${BASE_URL}/api/scan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ number: decodedText })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (data.status === 'success') {
                await updateStatistics('success');
                showResult('扫描成功，点击"开始扫描"继续', 'success');
            } else if (data.status === 'duplicate') {
                await updateStatistics('duplicate');
                errorBeep.play().catch(() => {});  // 如果是重复，再播放一次错误音
                navigator.vibrate && navigator.vibrate([100,100]);
                showResult('编号重复，点击"开始扫描"继续', 'warning');
            } else if (data.status === 'invalid') {
                await updateStatistics('invalid');
                errorBeep.play().catch(() => {});  // 如果是无效，再播放一次错误音
                navigator.vibrate && navigator.vibrate([100,100,100]);
                showResult('无效编号，点击"开始扫描"继续', 'danger');
            }
        } else {
            await updateStatistics('invalid');
            errorBeep.play().catch(() => {});  // 如果失败，再播放一次错误音
            navigator.vibrate && navigator.vibrate([100,100,100]);
            showResult('扫描失败，点击"开始扫描"继续', 'danger');
        }
        
    } catch (error) {
        console.error('扫描处理失败:', error);
        errorBeep.play().catch(() => {});
        navigator.vibrate && navigator.vibrate([100,100,100]);
        showResult('扫描处理失败，点击"开始扫描"继续', 'danger');
    }
}

// 将函数添加到全局作用域
Object.assign(window, {
    toggleCamera,
    toggleScanning
}); 

// 修改 toggleScanning 函数
function toggleScanning() {
    isScanning = !isScanning;
    updateScanButton();
    
    const scanLine = document.querySelector('.scan-line');
    if (scanLine) {
        if (isScanning) {
            scanLine.style.display = 'block';
            scanLine.style.animation = 'scanning 2s linear infinite';
        } else {
            scanLine.style.display = 'none';
            scanLine.style.animation = 'none';
        }
    }
}

// 添加到 style.css 或在 index.html 中添加样式
const style = document.createElement('style');
style.textContent = `
    #reader {
        position: relative;
        overflow: hidden;
    }
    
    .scan-line {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 2px;
        background: #28a745;
        box-shadow: 0 0 8px #28a745;
        display: none;
        z-index: 9999;
    }
    
    @keyframes scanning {
        0% {
            transform: translateY(0);
        }
        50% {
            transform: translateY(300px);
        }
        100% {
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style); 