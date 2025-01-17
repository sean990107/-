// 生成唯一的设备ID
function generateDeviceId() {
    const storedId = localStorage.getItem('deviceId');
    if (storedId) return storedId;
    
    const newId = 'device_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('deviceId', newId);
    return newId;
}

const deviceId = generateDeviceId();

// 更新统计信息
async function updateStatistics(type) {
    try {
        console.log(`更新统计 - 类型: ${type}, 设备ID: ${deviceId}`);
        const response = await fetch(`${BASE_URL}/api/update_statistics`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                device_id: deviceId,
                type: type
            })
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || '更新统计失败');
        }
        
        // 立即刷新统计显示
        await refreshStatistics();
        
    } catch (error) {
        console.error('更新统计失败:', error);
    }
}

// 刷新统计显示
async function refreshStatistics() {
    try {
        const response = await fetch(`${BASE_URL}/api/get_statistics?device_id=${deviceId}`);
        const data = await response.json();
        
        // 更新本设备统计
        document.getElementById('todayScans').textContent = data.device.today_scans;
        document.getElementById('successScans').textContent = data.device.success_scans;
        document.getElementById('duplicateScans').textContent = data.device.duplicate_scans;
        document.getElementById('invalidScans').textContent = data.device.invalid_scans;
        document.getElementById('lastScanTime').textContent = data.device.last_scan_time;
        
        // 更新总体统计
        document.getElementById('totalTodayScans').textContent = data.total.today_scans;
        document.getElementById('totalSuccessScans').textContent = data.total.success_scans;
        document.getElementById('totalDuplicateScans').textContent = data.total.duplicate_scans;
        document.getElementById('totalInvalidScans').textContent = data.total.invalid_scans;
        
    } catch (error) {
        console.error('获取统计失败:', error);
    }
}

// 定期刷新统计
setInterval(refreshStatistics, 30000);  // 每30秒刷新一次

// 将函数添加到全局作用域
Object.assign(window, {
    updateStatistics,
    refreshStatistics
});

// 页面加载时刷新统计
document.addEventListener('DOMContentLoaded', refreshStatistics);