
// 将学科数据按布局要求分组
function getGroupedSubjectsByLayout() {
    if (!filteredAssignments) return { firstRow: [], otherRows: [] };
    
    const firstRowSubjects = ['语文', '英语'];
    const otherSubjects = ['数学', '物理', '化学', '地理', '生物', '政治', '历史'];
    
    const firstRowData = [];
    const otherRowsData = [];
    
    // 处理第一行学科
    firstRowSubjects.forEach(subjectName => {
        const subjectData = findSubjectDataByName(subjectName);
        if (subjectData) {
            firstRowData.push(subjectData);
        }
    });
    
    // 处理其他学科
    otherSubjects.forEach(subjectName => {
        const subjectData = findSubjectDataByName(subjectName);
        if (subjectData) {
            otherRowsData.push(subjectData);
        }
    });
    
    return { firstRow: firstRowData, otherRows: otherRowsData };
}

// 根据学科名称查找学科数据
function findSubjectDataByName(subjectName) {
    if (!filteredAssignments) return null;
    
    for (const subjectData of filteredAssignments) {
        if (subjectData.subject_info && subjectData.subject_info.subject_name === subjectName) {
            // 检查是否有作业
            const hasAssignments = 
                (subjectData.today_published && subjectData.today_published.length > 0) ||
                (subjectData.today_due && subjectData.today_due.length > 0);
            
            if (hasAssignments) {
                return subjectData;
            }
        }
    }
    return null;
}



// 获取颜色类名
function getColorClass(color) {
    const colorMap = {
        '#007bff': 'primary',    // 语文
        '#fd7e14': 'orange',     // 数学
        '#e83e8c': 'pink',       // 英语
        '#17a2b8': 'info',       // 物理
        '#ffc107': 'warning',    // 化学
        '#8B4513': 'brown',      // 地理
        '#20c997': 'success',    // 生物
        '#dc3545': 'danger',     // 政治
        '#B22222': 'brick'       // 历史
    };
    
    return colorMap[color] || 'primary';
}

// 获取徽章颜色类
function getBadgeColorClass(color) {
    const colorClass = getColorClass(color);
    return `bg-${colorClass}`;
}

// 格式化作业内容
function formatAssignmentContent(content) {
    if (!content) return '';
    
    // 截断过长的内容
    if (content.length > 100) {
        return content.substring(0, 100) + '...';
    }
    
    return content.replace(/\n/g, '<br>');
}

// 获取截止时间文本
function getDeadlineText(deadlineDate) {
    if (!deadlineDate) return '';
    
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    if (deadlineDate === today) {
        return '今日截止';
    } else if (deadlineDate === tomorrow) {
        return '明日截止';
    } else {
        // 计算剩余天数
        const deadline = new Date(deadlineDate);
        const todayObj = new Date();
        const diffTime = deadline - todayObj;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return '已过期';
        } else if (diffDays <= 3) {
            return `${diffDays}天后截止`;
        } else {
            return deadlineDate;
        }
    }
}

// 获取截止时间徽章类
function getDeadlineBadgeClass(deadlineDate) {
    if (!deadlineDate) return 'bg-light text-dark';
    
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const deadline = new Date(deadlineDate);
    const todayObj = new Date();
    const diffTime = deadline - todayObj;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (deadlineDate === today) {
        return 'bg-danger';
    } else if (deadlineDate === tomorrow) {
        return 'bg-warning text-dark';
    } else if (diffDays < 0) {
        return 'bg-secondary';
    } else if (diffDays <= 3) {
        return 'bg-info';
    } else {
        return 'bg-light text-dark';
    }
}

// 格式化日期时间
function formatDateTime(dateTimeString, timeOnly = false) {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    
    if (timeOnly) {
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    
    return date.toLocaleString('zh-CN', { 
        month: 'numeric', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 格式化显示日期
function formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
        return '今天';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return '明天';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return '昨天';
    } else {
        return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
}