// 备份管理相关代码
async function refreshBackupList() {
    try {
        const response = await fetch(`${BASE_URL}/api/get_backups`);
        if (!response.ok) {
            throw new Error('获取备份列表失败');
        }
        
        const backups = await response.json();
        
        const backupList = document.getElementById('backupList');
        if (!backupList) return;
        
        if (backups.length === 0) {
            backupList.innerHTML = '<div class="text-center text-muted">暂无备份</div>';
            return;
        }
        
        backupList.innerHTML = backups.map(backup => `
            <div class="backup-item">
                <div class="backup-info">
                    <span class="backup-name">${backup.name}</span>
                    <small class="backup-time">${backup.time}</small>
                </div>
                <div class="backup-actions">
                    <button class="btn btn-sm btn-primary" onclick="downloadBackup('${backup.id}')">
                        <i class="bi bi-download"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteBackup('${backup.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('刷新备份列表失败:', error);
        showResult('刷新备份列表失败：' + error.message, 'danger');
    }
}

async function downloadBackup(fileId) {
    try {
        window.location.href = `${BASE_URL}/api/download_backup/${fileId}`;
    } catch (error) {
        console.error('下载备份失败:', error);
        showResult('下载备份失败：' + error.message, 'danger');
    }
}

async function deleteBackup(fileId) {
    if (!confirm('确定要删除这个备份吗？')) return;
    
    try {
        const response = await fetch(`${BASE_URL}/api/delete_backup/${fileId}`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || '删除失败');
        }
        
        showResult('备份已删除', 'success');
        await refreshBackupList();  // 等待刷新完成
        
    } catch (error) {
        console.error('删除备份失败:', error);
        showResult('删除备份失败：' + error.message, 'danger');
    }
}

async function createBackup() {
    const nameInput = document.getElementById('backupName');
    const backupName = nameInput.value.trim();
    
    if (!backupName) {
        showResult('请输入备份名称', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${BASE_URL}/api/create_backup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: backupName })
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || '创建备份失败');
        }
        
        showResult('备份创建成功', 'success');
        nameInput.value = '';  // 清空输入框
        await refreshBackupList();  // 等待刷新完成
        
    } catch (error) {
        console.error('创建备份失败:', error);
        showResult('创建备份失败: ' + error.message, 'danger');
    }
}

// 将函数添加到全局作用域
Object.assign(window, {
    refreshBackupList,
    createBackup,
    downloadBackup,
    deleteBackup
});

// 页面加载时刷新备份列表
document.addEventListener('DOMContentLoaded', refreshBackupList);

// 为刷新按钮添加事件监听
document.getElementById('refreshBackups')?.addEventListener('click', refreshBackupList); 