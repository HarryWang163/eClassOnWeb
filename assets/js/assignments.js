// 作业模块功能
let assignmentsData = null;
let filteredAssignments = null;
let currentDate = null;

// 初始化作业页面
function initAssignmentsPage() {
    // 设置日期选择器为今天
    const today = getLocalDateString(); 
    const datePicker = document.getElementById('datePicker');
    if (datePicker) {
        datePicker.value = today;
        currentDate = today;
    }
    
    loadAssignmentsData();
    
    // 添加日期选择器事件监听
    setupDatePicker();
}

// 设置日期选择器
function setupDatePicker() {
    const datePicker = document.getElementById('datePicker');
    if (datePicker) {
        datePicker.addEventListener('change', function() {
            currentDate = this.value;
            loadAssignmentsData();
        });
    }
    
    // 添加上一天/下一天按钮事件
    const prevBtn = document.getElementById('prevDateBtn');
    const nextBtn = document.getElementById('nextDateBtn');
    const todayBtn = document.getElementById('todayBtn');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            changeDate(-1);
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            changeDate(1);
        });
    }
    
    if (todayBtn) {
        todayBtn.addEventListener('click', function() {
            const today = getLocalDateString();
            const datePicker = document.getElementById('datePicker');
            if (datePicker) {
                datePicker.value = today;
                currentDate = today;
                loadAssignmentsData();
            }
        });
    }
}

// 更改日期（增减天数）
function changeDate(days) {
    if (!currentDate) {
        currentDate = getLocalDateString();
    }
    
    const date = new Date(currentDate);
    date.setDate(date.getDate() + days);
    const newDate = getLocalDateString(date);

    const datePicker = document.getElementById('datePicker');
    if (datePicker) {
        datePicker.value = newDate;
        currentDate = newDate;
        loadAssignmentsData();
    }
}

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

// 渲染学科卡片
function renderSubjectCards() {
    const container = document.getElementById('subjectCardsContainer');
    if (!container) return;
    
    if (!filteredAssignments) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">加载中...</span>
                </div>
                <p class="text-muted">正在加载作业数据...</p>
            </div>
        `;
        return;
    }
    
    if (filteredAssignments.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5 animate-fade-in-up">
                <div class="mb-3">
                    <i class="bi bi-journal-text text-muted fs-1"></i>
                </div>
                <h5 class="text-muted">${formatDisplayDate(currentDate)}没有作业</h5>
                <p class="text-muted small">在 ${formatDisplayDate(currentDate)} 没有需要完成的作业</p>
            </div>
        `;
        return;
    }
    
    const grouped = getGroupedSubjectsByLayout();
    const hasContent = grouped.firstRow.length > 0 || grouped.otherRows.length > 0;
    
    if (!hasContent) {
        container.innerHTML = `
            <div class="col-12 text-center py-5 animate-fade-in-up">
                <div class="mb-3">
                    <i class="bi bi-journal-text text-muted fs-1"></i>
                </div>
                <h5 class="text-muted">暂无作业</h5>
                <p class="text-muted small">当前没有需要完成的作业</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    let animationDelay = 0.3;
    
    // 第一行：语文和英语
    grouped.firstRow.forEach((subjectData, index) => {
        html += renderSubjectCard(subjectData, 'col-xl-6 col-lg-6 col-md-12', index + 3);
        animationDelay += 0.1;
    });
    
    // 其他行：每行3个
    grouped.otherRows.forEach((subjectData, index) => {
        html += renderSubjectCard(subjectData, 'col-xl-4 col-lg-4 col-md-6', index + 3);
        animationDelay += 0.1;
    });
    
    container.innerHTML = html;
    addAnimationClasses();
}

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

// 渲染单个学科卡片
function renderSubjectCard(subjectData, columnClass, animationDelayIndex) {
    const subject = subjectData.subject_info;
    const todayPublished = subjectData.today_published || [];
    const todayDue = subjectData.today_due || [];
    const futureDue = subjectData.future_due || [];
    const stats = subjectData.stats;
    const isRepresentative = subjectData.is_representative || false;
    
    const colorClass = getColorClass(subject.color);
    const badgeClass = getBadgeColorClass(subject.color);
    
    return `
        <div class="${columnClass} animate-fade-in-up delay-${animationDelayIndex}">
            <div class="card subject-card h-100 border-${colorClass} border-opacity-25 shadow-sm">
                <div class="card-header bg-${colorClass} bg-opacity-10 border-${colorClass} border-opacity-25 d-flex justify-content-between align-items-center position-relative">
                    <div class="d-flex align-items-center">
                        <div class="subject-icon bg-${colorClass} text-white rounded-circle p-2 me-3">
                            <i class="${subject.icon_class || 'bi bi-journal-text'}"></i>
                        </div>
                        <div>
                            <h5 class="fw-bold mb-0">${subject.subject_name}</h5>
                            <small class="text-muted">${stats.total_assignments}项作业</small>
                        </div>
                    </div>
                    <div class="d-flex gap-1 align-items-center">
                        <!-- 课代表徽章（如果需要显示） -->
                        ${isRepresentative ? `
                            <span class="badge bg-warning text-dark me-2">
                                <i class="bi bi-award me-1"></i>课代表
                            </span>
                        ` : ''}
                        
                        ${stats.need_submit_count > 0 ? `<span class="badge ${badgeClass}">${stats.need_submit_count}项需提交</span>` : ''}
                        ${stats.completed_count > 0 ? `<span class="badge bg-success">${stats.completed_count}项已完成</span>` : ''}
                        
                        <!-- 课代表编辑按钮（右上角） -->
                        ${isRepresentative ? `
                            <button class="btn btn-sm btn-outline-secondary ms-2" 
                                    onclick="showEditAssignmentModal(${subject.id}, '${subject.subject_name}')"
                                    title="编辑作业">
                                <i class="bi bi-pencil"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
                <div class="card-body">
                    <div class="assignment-content">
                        <!-- 今天发布的作业 -->
                        ${todayPublished.length > 0 ? `
                            <div class="mb-3">
                                <h6 class="text-muted mb-2"><i class="bi bi-calendar-plus me-1"></i>今天发布</h6>
                                <ul class="mb-0 list-unstyled">
                                    ${todayPublished.map((assignment, idx) => renderAssignmentItem(assignment, idx, 'today_published')).join('')}
                                </ul>
                            </div>
                        ` : ''}
                        
                        <!-- 今天截止的作业 -->
                        ${todayDue.length > 0 ? `
                            <div class="mb-3">
                                <h6 class="text-muted mb-2"><i class="bi bi-exclamation-triangle me-1"></i>今天截止</h6>
                                <ul class="mb-0 list-unstyled">
                                    ${todayDue.map((assignment, idx) => renderAssignmentItem(assignment, idx, 'today_due')).join('')}
                                </ul>
                            </div>
                        ` : ''}
                        
                    </div>
                </div>
            </div>
        </div>
    `;
}
// 显示编辑作业模态框
async function showEditAssignmentModal(subjectId, subjectName) {
    try {
        // 获取模态框模板
        const modalTemplate = await fetchTemplate('modals/edit_assignment_modal.html');
        
        // 将模态框添加到页面
        const modalContainer = document.getElementById('editAssignmentModal');
        if (modalContainer) {
            modalContainer.innerHTML = modalTemplate;
        }
        
        // 设置模态框标题
        const modalTitle = document.getElementById('editAssignmentModalLabel');
        if (modalTitle) {
            modalTitle.textContent = `${subjectName} - 编辑作业`;
        }
        
        // 加载学科对应的作业列表
        await loadSubjectAssignments(subjectId);
        
        // 显示模态框
        const modal = new bootstrap.Modal(document.getElementById('editAssignmentModal'));
        modal.show();
        
    } catch (error) {
        console.error('加载编辑作业模态框失败:', error);
        showError('加载编辑页面失败');
    }
}
// 渲染单个作业项
function renderAssignmentItem(assignment, index) {
    const deadlineText = getDeadlineText(assignment.deadline);
    const deadlineBadgeClass = getDeadlineBadgeClass(assignment.deadline);
    
    return `
        <li class="mb-2 p-2 rounded ${index % 2 === 0 ? 'bg-light' : ''}">
            <div class="d-flex justify-content-between align-items-center">
                <div class="flex-grow-1">
                    <div class="mb-1">
                        ${formatAssignmentContent(assignment.content)}
                    </div>
                    <div class="d-flex align-items-center gap-2 small flex-wrap">
                        
                        <!-- 提交要求标签 -->
                        ${assignment.need_submit ? `
                            <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                                <i class="bi bi-upload me-1"></i>需提交${assignment.submit_items ? ': ' + assignment.submit_items : ''}
                            </span>
                        ` : ''}
                        
                        <!-- 截止日期标签 -->
                        ${assignment.deadline ? `
                            <span class="badge ${deadlineBadgeClass}">
                                <i class="bi bi-calendar-check me-1"></i>${deadlineText}
                            </span>
                        ` : ''}
                        
                    </div>
                </div>
                <div class="ms-2 d-flex flex-row gap-1">
                    
                    <button class="btn btn-sm ${assignment.has_details ? `btn-outline-warning` : 'btn-outline-info'}" onclick="showAssignmentDetail(${assignment.id})" title="查看详情">
                        <i class="bi bi-info-circle"></i>
                    </button>
                    
                    <button class="btn btn-sm ${assignment.is_completed ? 'btn-success' : 'btn-outline-success'}" 
                            onclick="${assignment.is_completed ? 'unmarkAsSubmitted' : 'markAsSubmitted'}(${assignment.id})" 
                            title="${assignment.is_completed ? '取消完成标记' : '标记为已完成'}">
                        <i class="bi ${assignment.is_completed ? 'bi-check-circle' : 'bi-check'}"></i>
                    </button>
                </div>
            </div>
        </li>
    `;
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

// 显示作业详情
async function showAssignmentDetail(assignmentId) {
    if (!assignmentsData || !assignmentsData.assignments) return;
    
    // 在所有学科中查找指定作业
    let assignment = null;
    assignmentsData.assignments.forEach(subjectData => {
        const publishedToday = subjectData.published_today || [];
        const notDue = subjectData.not_due || [];
        const allAssignments = [...publishedToday, ...notDue];
        
        const found = allAssignments.find(a => a.id === assignmentId);
        if (found) {
            assignment = found;
            assignment.subject_name = subjectData.subject_info.subject_name;
        }
    });
    
    if (!assignment) {
        alert('未找到该作业的详细信息');
        return;
    }
    
    const modalTemplate = await fetchTemplate('modals/assignment_detail_modal.html');
    
    // 将模态框添加到页面
    const modalContainer = document.getElementById('assignmentDetailModal');
    if (modalContainer) {
        modalContainer.innerHTML = modalTemplate;
    }
    
    const modalTitle = document.getElementById('assignmentDetailTitle');
    const modalContent = document.getElementById('assignmentDetailContent');
    
    if (modalTitle) {
        modalTitle.innerHTML = `
            <i class="bi bi-journal-text me-2"></i>
            ${assignment.subject_name} - 作业详情
        `;
    }
    
    if (modalContent) {
        let html = `
            <div class="mb-4">
                <h6 class="text-muted mb-2">作业内容：</h6>
                <div class="p-3 bg-light rounded">
                    ${assignment.content ? assignment.content.replace(/\n/g, '<br>') : '无内容'}
                </div>
            </div>
            
            <div class="row mb-3">
                <div class="col-md-6">
                    <ul class="list-unstyled">
                        <li class="mb-2">
                            <i class="bi bi-person me-2 text-muted"></i>
                            <strong>发布人ID：</strong> ${assignment.publisher_id}
                        </li>
                        <li class="mb-2">
                            <i class="bi bi-calendar me-2 text-muted"></i>
                            <strong>布置时间：</strong> ${formatDateTime(assignment.publish_time)}
                        </li>
                        ${assignment.deadline ? `
                            <li class="mb-2">
                                <i class="bi bi-calendar-x me-2 text-muted"></i>
                                <strong>截止日期：</strong> ${assignment.deadline}
                                <span class="badge ${getDeadlineBadgeClass(assignment.deadline)} ms-2">
                                    ${getDeadlineText(assignment.deadline)}
                                </span>
                            </li>
                        ` : ''}
                    </ul>
                </div>
                <div class="col-md-6">
                    <ul class="list-unstyled">
                        <li class="mb-2">
                            <i class="bi bi-${assignment.need_submit ? 'upload text-success' : 'check-circle text-muted'} me-2"></i>
                            <strong>提交要求：</strong> ${assignment.need_submit ? '需要提交' : '无需提交'}
                        </li>
                        ${assignment.need_submit && assignment.submit_items ? `
                            <li class="mb-2">
                                <i class="bi bi-folder me-2 text-muted"></i>
                                <strong>提交物品：</strong> ${assignment.submit_items}
                            </li>
                        ` : ''}
                        <li class="mb-2">
                            <i class="bi bi-${assignment.is_completed ? 'check-circle text-success' : 'clock text-warning'} me-2"></i>
                            <strong>完成状态：</strong> ${assignment.is_completed ? '已完成' : '未完成'}
                        </li>
                        ${assignment.is_completed && assignment.completed_at ? `
                            <li class="mb-2">
                                <i class="bi bi-clock-history me-2 text-muted"></i>
                                <strong>完成时间：</strong> ${formatDateTime(assignment.completed_at)}
                            </li>
                        ` : ''}
                    </ul>
                </div>
            </div>
        `;
        
        if (assignment.details) {
            html += `
                <div class="mb-3">
                    <h6 class="text-muted mb-2">详细信息：</h6>
                    <div class="p-3 border rounded">
                        ${assignment.details.replace(/\n/g, '<br>')}
                    </div>
                </div>
            `;
        }
        
        if (assignment.attachment_path || assignment.attachment_name) {
            html += `
                <div class="mb-3">
                    <h6 class="text-muted mb-2">附件：</h6>
                    <div class="p-3 border rounded">
                        ${assignment.attachment_path ? `
                            <p><i class="bi bi-paperclip me-2"></i><strong>附件路径：</strong> ${assignment.attachment_path}</p>
                        ` : ''}
                        ${assignment.attachment_name ? `
                            <p><i class="bi bi-file-earmark me-2"></i><strong>附件名称：</strong> ${assignment.attachment_name}</p>
                        ` : ''}
                    </div>
                </div>
            `;
        }
        
        modalContent.innerHTML = html;
    }

    const modal = new bootstrap.Modal(document.getElementById('assignmentDetailModal'));
    modal.show();
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

// 加载学科作业列表
async function loadSubjectAssignments(subjectId) {
    try {
        // 显示加载状态
        const assignmentsList = document.getElementById('editAssignmentsList');
        if (assignmentsList) {
            assignmentsList.innerHTML = `
                <div class="text-center py-3">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">加载中...</span>
                    </div>
                    <p class="text-muted mt-2">正在加载作业列表...</p>
                </div>
            `;
        }
        
        // 调用API获取该学科的所有作业
        const response = await fetch(`api/get_subject_assignments.php?subject_id=${subjectId}`);
        const data = await response.json();
        
        if (data.success) {
            renderSubjectAssignments(data.data.assignments);
        } else {
            throw new Error(data.message || '加载失败');
        }
        
    } catch (error) {
        console.error('加载学科作业失败:', error);
        showError('加载作业列表失败: ' + error.message);
    }
}

// 渲染学科作业列表
function renderSubjectAssignments(assignments) {
    const assignmentsList = document.getElementById('editAssignmentsList');
    if (!assignmentsList) return;
    
    if (!assignments || assignments.length === 0) {
        assignmentsList.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-journal-text text-muted fs-1 mb-3"></i>
                <p class="text-muted">该学科暂无作业</p>
                <button class="btn btn-primary" onclick="showNewAssignmentForm()">
                    <i class="bi bi-plus-circle me-1"></i>新建作业
                </button>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">作业列表</h6>
            <button class="btn btn-sm btn-primary" onclick="showNewAssignmentForm()">
                <i class="bi bi-plus-circle me-1"></i>新建作业
            </button>
        </div>
        <div class="list-group">
    `;
    
    assignments.forEach((assignment, index) => {
        const deadlineClass = getDeadlineBadgeClass(assignment.deadline);
        const deadlineText = getDeadlineText(assignment.deadline);
        
        html += `
            <div class="list-group-item list-group-item-action">
                <div class="d-flex w-100 justify-content-between align-items-start">
                    <div class="flex-grow-1 me-3">
                        <h6 class="mb-1">${assignment.content.substring(0, 60)}${assignment.content.length > 60 ? '...' : ''}</h6>
                        <div class="d-flex flex-wrap gap-2 mt-2">
                            ${assignment.need_submit ? `
                                <span class="badge bg-success">需提交</span>
                            ` : ''}
                            ${assignment.deadline ? `
                                <span class="badge ${deadlineClass}">${deadlineText}</span>
                            ` : ''}
                            <small class="text-muted">发布时间: ${formatDateTime(assignment.publish_time)}</small>
                        </div>
                    </div>
                    <div class="d-flex flex-column gap-1">
                        <button class="btn btn-sm btn-outline-primary" onclick="editAssignment(${assignment.id})" title="编辑">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteAssignment(${assignment.id}, '${assignment.content.substring(0, 30)}...')" title="删除">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    assignmentsList.innerHTML = html;
}

// 显示新建作业表单
async function showNewAssignmentForm() {
    try {
        const formTemplate = await fetchTemplate('modals/new_assignment_form.html');
        
        const formContainer = document.getElementById('assignmentFormContainer');
        if (formContainer) {
            formContainer.innerHTML = formTemplate;
        }
        
        // 初始化表单
        initAssignmentForm();
        
    } catch (error) {
        console.error('加载新建作业表单失败:', error);
        showError('加载表单失败');
    }
}

// 初始化作业表单
function initAssignmentForm() {
    // 这里可以添加表单初始化逻辑，如日期选择器初始化等
    const today = getLocalDateString();
    const deadlineInput = document.getElementById('assignmentDeadline');
    if (deadlineInput) {
        deadlineInput.min = today;
    }
    
    // 初始化富文本编辑器（如果需要）
    initRichTextEditor();
}

// 初始化富文本编辑器
function initRichTextEditor() {
    // 这里可以集成富文本编辑器，如Quill、TinyMCE等
    // 简化版：使用textarea
}

// 编辑单个作业
async function editAssignment(assignmentId) {
    try {
        // 获取作业详情
        const response = await fetch(`api/get_assignment_detail.php?id=${assignmentId}`);
        const data = await response.json();
        
        if (data.success) {
            // 加载编辑表单模板
            const formTemplate = await fetchTemplate('modals/edit_assignment_form.html');
            
            const formContainer = document.getElementById('assignmentFormContainer');
            if (formContainer) {
                formContainer.innerHTML = formTemplate;
            }
            
            // 填充表单数据
            populateAssignmentForm(data.data);
            
        } else {
            throw new Error(data.message || '加载作业详情失败');
        }
        
    } catch (error) {
        console.error('编辑作业失败:', error);
        showError('编辑作业失败: ' + error.message);
    }
}

// 填充作业表单（使用逻辑与运算符）
function populateAssignmentForm(assignment) {
    const form = document.getElementById('assignmentForm');
    if (!form) return;
    
    // 使用逻辑与运算符进行安全赋值
    const elements = form.elements;
    
    elements['assignment_id'] && (elements['assignment_id'].value = assignment.id || 0);
    elements['assignment_content'] && (elements['assignment_content'].value = assignment.content || '');
    elements['assignment_deadline'] && (elements['assignment_deadline'].value = assignment.deadline || '');
    elements['need_submit'] && (elements['need_submit'].checked = assignment.need_submit == 1);
    elements['submit_items'] && (elements['submit_items'].value = assignment.submit_items || '');
    elements['has_details'] && (elements['has_details'].checked = assignment.has_details == 1);
    elements['assignment_details'] && (elements['assignment_details'].value = assignment.details || '');
    
    // 初始化表单交互
    initFormInteractions();
}

// 初始化表单交互
function initFormInteractions() {
    const form = document.getElementById('assignmentForm');
    if (!form) return;
    
    const needSubmit = form.elements['need_submit'];
    const submitItems = form.elements['submit_items'];
    const hasDetails = form.elements['has_details'];
    const detailsField = document.getElementById('detailsField');
    
    // 初始化提交物品字段状态
    if (needSubmit && submitItems) {
        submitItems.disabled = !needSubmit.checked;
    }
    
    // 初始化详细信息字段状态
    if (hasDetails && detailsField) {
        detailsField.style.display = hasDetails.checked ? 'block' : 'none';
    }
}

// 删除作业
function deleteAssignment(assignmentId, assignmentTitle) {
    if (!confirm(`确定要删除作业"${assignmentTitle}"吗？此操作不可撤销。`)) {
        return;
    }
    
    fetch('api/delete_assignment.php', {
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
            showSuccess('作业删除成功');
            // 重新加载作业列表
            const modal = bootstrap.Modal.getInstance(document.getElementById('editAssignmentModal'));
            if (modal) {
                modal.hide();
            }
            loadAssignmentsData();
        } else {
            showError('删除失败: ' + data.message);
        }
    })
    .catch(error => {
        console.error('删除作业失败:', error);
        showError('删除失败，请检查网络连接');
    });
}