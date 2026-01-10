// 作业模块功能
let assignmentsData = null;
let filteredAssignments = null;
let currentDate = null;

// 更新加载作业内容的函数
function loadAssignmentsContent() {
    fetchTemplate('pages/assignments_content.php')
        .then(html => {
            updateContent(html);
            
            // 添加动画类
            addAnimationClasses();
            
            // 初始化作业页面
            initAssignmentsPage();
            
        })
        .catch(error => {
            console.error('加载作业内容失败:', error);
            showError('加载作业页面失败');
        });
}

// 加载作业数据
function loadAssignmentsData() {
    const dateParam = currentDate ? currentDate : getLocalDateString();
    const url = `api/get_assignments.php?date=${dateParam}`;
    
    // 显示加载状态
    const container = document.getElementById('subjectCardsContainer');
    if (container) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">加载中...</span>
                </div>
                <p class="text-muted">正在加载 ${formatDisplayDate(dateParam)} 的作业数据...</p>
            </div>
        `;
    }
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                assignmentsData = data.data;
                filteredAssignments = data.data.assignments;
                renderSubjectCards();
                updateStatsDisplay();
                updateQueryInfo(data.data.query_info);
            } else {
                showError('加载作业数据失败: ' + data.message);
            }
        })
        .catch(error => {
            console.error('加载作业数据失败:', error);
            showError('加载作业数据失败，请检查网络连接');
        });
}



// 更新查询信息显示
function updateQueryInfo(queryInfo) {
    const queryInfoElement = document.getElementById('queryInfo');
    if (!queryInfoElement) return;
    
    if (queryInfo && queryInfo.selected_date) {
        queryInfoElement.innerHTML = `
            <div class="alert alert-info mb-3 animate-fade-in">
                <i class="bi bi-info-circle me-2"></i>
                <strong>查询说明：</strong> ${queryInfo.query_description}
            </div>
        `;
    }
}



// 更新统计信息显示
function updateStatsDisplay() {
    if (!assignmentsData || !assignmentsData.total_stats) return;
    
    const statsElement = document.getElementById('assignmentsStats');
    if (!statsElement) return;
    
    const stats = assignmentsData.total_stats;
    
    statsElement.innerHTML = `
        共 <span class="text-primary fw-bold">${stats.total_subjects}</span> 个学科，
        总作业 <span class="text-primary fw-bold">${stats.total_assignments_all}</span> 项，
        需提交 <span class="text-danger fw-bold">${stats.total_need_submit_all}</span> 项
        ${currentDate ? ` | 今日查询：${stats.total_assignments_filtered} 项作业，${stats.total_need_submit_filtered} 项需提交` : ''}
    `;
}

// 标记作业为已完成
function markAsSubmitted(assignmentId) {
    if (!assignmentId) return;
    
    fetch('api/mark_assignment_completed.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            assignment_id: assignmentId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccess('标记为已完成');
            // 重新加载数据
            loadAssignmentsData();
        } else {
            showError('操作失败: ' + data.message);
        }
    })
    .catch(error => {
        console.error('标记作业失败:', error);
        showError('操作失败，请检查网络连接');
    });
}

// 取消完成标记
function unmarkAsSubmitted(assignmentId) {
    if (!assignmentId) return;
    
    if (!confirm('确定要取消完成标记吗？')) {
        return;
    }
    
    fetch('api/unmark_assignment_completed.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            assignment_id: assignmentId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccess('已取消完成标记');
            // 重新加载数据
            loadAssignmentsData();
        } else {
            showError('操作失败: ' + data.message);
        }
    })
    .catch(error => {
        console.error('取消标记失败:', error);
        showError('操作失败，请检查网络连接');
    });
}

// 显示成功消息
function showSuccess(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 end-0 m-3 animate-fade-in';
    alertDiv.style.zIndex = '1060';
    alertDiv.innerHTML = `
        <i class="bi bi-check-circle me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// 显示错误消息
function showError(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 end-0 m-3 animate-fade-in';
    alertDiv.style.zIndex = '1060';
    alertDiv.innerHTML = `
        <i class="bi bi-exclamation-triangle me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}
