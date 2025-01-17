// 文件管理相关代码

const BASE_URL = '';  // 使用相对路径

async function uploadExcel() {
    const fileInput = document.getElementById('excelFile');
    if (!fileInput.files || !fileInput.files[0]) {
        showResult('请选择文件', 'warning');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        
        const response = await fetch(`${BASE_URL}/api/upload_template`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || '上传失败');
        }
        
        showResult('文件上传成功', 'success');
        updateFileDisplay();
        fileInput.value = ''; // 清空文件选择
        
    } catch (error) {
        console.error('文件上传失败:', error);
        showResult('文件上传失败: ' + error.message, 'danger');
    }
}

async function downloadExcel(type = 'current') {
    try {
        const response = await fetch(`${BASE_URL}/api/download_template?type=${type}`);
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || '下载失败');
        }
        
        // 获取文件名
        const filename = response.headers.get('content-disposition')
            ?.split('filename=')[1]
            ?.replace(/"/g, '') || `扫描数据_${new Date().getTime()}.xlsx`;
        
        // 创建下载链接
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showResult('文件下载成功', 'success');
        
    } catch (error) {
        console.error('下载文件失败:', error);
        showResult('下载文件失败：' + error.message, 'danger');
    }
}

async function deleteExcel() {
    if (!confirm('确定要删除模板文件吗？')) return;
    
    try {
        const response = await fetch(`${BASE_URL}/api/delete_template`, {
            method: 'POST'
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || '删除失败');
        }
        
        showResult('文件已删除', 'success');
        updateFileDisplay();
        
    } catch (error) {
        console.error('文件删除失败:', error);
        showResult('文件删除失败: ' + error.message, 'danger');
    }
}

async function checkFileStatus() {
    try {
        const response = await fetch(`${BASE_URL}/api/check_template`);
        const data = await response.json();
        return data.exists;
    } catch (error) {
        console.error('检查文件状态失败:', error);
        return false;
    }
}

// 添加文件选择监听器
document.getElementById('excelFile').addEventListener('change', function(e) {
    const fileName = e.target.files[0]?.name;
    const uploadLabel = document.getElementById('uploadLabel');
    if (fileName) {
        uploadLabel.innerHTML = `
            <i class="bi bi-file-earmark-excel"></i>
            <span class="selected-file">${fileName}</span>
            <small class="text-muted d-block">点击更改文件</small>
        `;
    } else {
        uploadLabel.innerHTML = `
            <i class="bi bi-cloud-arrow-up"></i>
            <span>选择Excel文件</span>
            <small class="text-muted d-block">或将文件拖放到这里</small>
        `;
    }
});

// 更新文件状态显示
function updateFileDisplay() {
    const fileStatus = document.getElementById('fileStatus');
    if (!fileStatus) return;
    
    checkFileStatus().then(exists => {
        if (exists) {
            fileStatus.innerHTML = `
                <div class="d-flex align-items-center justify-content-between w-100">
                    <div>
                        <i class="bi bi-file-earmark-check"></i> 
                        当前文件: Excel文件已上传
                    </div>
                </div>`;
            fileStatus.className = 'alert alert-success mt-3';
        } else {
            fileStatus.innerHTML = `
                <div class="d-flex align-items-center justify-content-between w-100">
                    <div>
                        <i class="bi bi-file-earmark-x"></i> 
                        未上传Excel文件
                    </div>
                </div>`;
            fileStatus.className = 'alert alert-warning mt-3';
        }
    });
}

// 将函数添加到全局作用域
Object.assign(window, {
    uploadExcel,
    downloadExcel,
    deleteExcel,
    checkFileStatus,
    updateFileDisplay
});

// 页面加载时更新文件显示
document.addEventListener('DOMContentLoaded', updateFileDisplay); 