// 更新内容区域
function updateContent(html) {
    const contentArea = document.getElementById('dynamicContent');
    contentArea.innerHTML = html;
}

// 添加动画类
function addAnimationClasses() {
    const contentArea = document.getElementById('dynamicContent');
    const elementsToAnimate = contentArea.querySelectorAll('.card, .btn, .table, .alert, h1, h2, h3, h4, h5, h6, p, .badge');
    
    elementsToAnimate.forEach((el, index) => {
        if (!el.classList.contains('animate-fade-in-up') && 
            !el.classList.contains('animate-fade-in-right') && 
            !el.classList.contains('animate-fade-in')) {
            el.classList.add('animate-fade-in-up');
            el.style.animationDelay = `${0.1 + (index * 0.05)}s`;
            el.style.opacity = '0';
        }
    });
}

// 获取模板文件
async function fetchTemplate(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch template: ${response.statusText}`);
    }
    return await response.text();
}

// 格式化日期时间
function formatDateTime(datetimeStr) {
    if (!datetimeStr) return '未知时间';
    const date = new Date(datetimeStr);
    const now = new Date();
    
    // 如果是今天
    if (date.toDateString() === now.toDateString()) {
        return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // 如果是昨天
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// 计算天数差
function getDaysSince(createdAt) {
    if (!createdAt) return '未知';
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}
