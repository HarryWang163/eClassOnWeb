
// 作业模块功能
let assignmentsData = null;
let filteredAssignments = null;

// 初始化作业页面
function initAssignmentsPage() {
    loadAssignmentsData();
    initAssignmentButtons();
    initFilterPanel();
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


// 初始化作业页面按钮
function initAssignmentButtons() {
    // 新建作业按钮
    const newAssignmentBtn = document.getElementById('btnNewAssignment');
    if (newAssignmentBtn) {
        newAssignmentBtn.addEventListener('click', function() {
            alert('新建作业功能（权限验证、表单弹窗）将在后续开发中实现。');
        });
    }
}

// 加载作业数据
function loadAssignmentsData() {
    fetch('api/get_assignments.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                assignmentsData = data.data;
                filteredAssignments = JSON.parse(JSON.stringify(data.data)); // 深拷贝
                renderSubjectCards();
                updateStatsDisplay();
            } else {
                showError('加载作业数据失败: ' + data.message);
            }
        })
        .catch(error => {
            console.error('加载作业数据失败:', error);
            showError('加载作业数据失败，请检查网络连接');
        });
}
// 渲染学科卡片（简化版）
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
                <button class="btn btn-primary mt-2" id="btnNewAssignment2">
                    <i class="bi bi-plus-circle me-1"></i>创建第一个作业
                </button>
            </div>
        `;
        
        // 为新建作业按钮添加事件
        const newAssignmentBtn2 = document.getElementById('btnNewAssignment2');
        if (newAssignmentBtn2) {
            newAssignmentBtn2.addEventListener('click', showNewAssignmentModal);
        }
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
    const otherSubjects = ['数学', '物理', '化学', '地理', '生物', '政治B', '历史'];
    
    const firstRowData = [];
    const otherRowsData = [];
    
    // 处理第一行学科
    firstRowSubjects.forEach(subjectName => {
        const subjectData = findSubjectDataByName(subjectName);
        if (subjectData && subjectData.assignments && subjectData.assignments.length > 0) {
            firstRowData.push(subjectData);
        }
    });
    
    // 处理其他学科
    otherSubjects.forEach(subjectName => {
        const subjectData = findSubjectDataByName(subjectName);
        if (subjectData && subjectData.assignments && subjectData.assignments.length > 0) {
            otherRowsData.push(subjectData);
        }
    });
    
    return { firstRow: firstRowData, otherRows: otherRowsData };
}
// 根据学科名称查找学科数据
function findSubjectDataByName(subjectName) {
    if (!filteredAssignments) return null;
    
    for (const subjectData of Object.values(filteredAssignments)) {
        if (subjectData.subject_info && subjectData.subject_info.subject_name === subjectName) {
            return subjectData;
        }
    }
    return null;
}
// 渲染单个学科卡片
function renderSubjectCard(subjectData, columnClass, animationDelayIndex) {
    const subject = subjectData.subject_info;
    const assignments = subjectData.assignments;
    const stats = subjectData.stats;
    
    const colorClass = getColorClass(subject.color);
    const badgeClass = getBadgeColorClass(subject.color);
    
    return `
        <div class="${columnClass} animate-fade-in-up delay-${animationDelayIndex}">
            <div class="card subject-card h-100 border-${colorClass} border-opacity-25">
                <div class="card-header bg-${colorClass} bg-opacity-10 border-${colorClass} border-opacity-25 d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <div class="subject-icon bg-${colorClass} text-white rounded-circle p-2 me-3">
                            <i class="${subject.icon_class || 'bi bi-journal-text'}"></i>
                        </div>
                        <div>
                            <h5 class="fw-bold mb-0">${subject.subject_name}</h5>
                            <small class="text-muted">${stats.total}项作业</small>
                        </div>
                    </div>
                    <div class="d-flex gap-1">
                        ${stats.urgent > 0 ? `<span class="badge ${badgeClass}">${stats.urgent}项紧急</span>` : ''}
                        ${stats.important > 0 ? `<span class="badge bg-warning">${stats.important}项重要</span>` : ''}
                    </div>
                </div>
                <div class="card-body">
                    <div class="assignment-content">
                        <ul class="mb-0 list-unstyled">
                            ${assignments.map((assignment, idx) => `
                                <li class="mb-2 p-2 rounded ${idx % 2 === 0 ? 'bg-light' : ''}">
                                    <div class="d-flex justify-content-between align-items-start">
                                        <div class="flex-grow-1">
                                            <div class="mb-1">
                                                ${formatAssignmentContent(assignment.content)}
                                            </div>
                                            <div class="d-flex align-items-center gap-2 small">
                                                ${assignment.need_submit ? `
                                                    <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                                                        <i class="bi bi-upload me-1"></i>需提交${assignment.submit_items ? ': ' + assignment.submit_items : ''}
                                                    </span>
                                                ` : ''}
                                                ${assignment.submit_deadline ? `
                                                    <span class="badge ${getDeadlineBadgeClass(assignment.deadline_status)}">
                                                        <i class="bi bi-calendar-check me-1"></i>${getDeadlineText(assignment.submit_deadline, assignment.days_remaining)}
                                                    </span>
                                                ` : ''}
                                                ${assignment.publish_time ? `
                                                    <span class="text-muted">
                                                        <i class="bi bi-clock me-1"></i>${formatDateTime(assignment.publish_time, true)}
                                                    </span>
                                                ` : ''}
                                            </div>
                                        </div>
                                        <div class="ms-2 d-flex flex-column gap-1">
                                            ${assignment.has_details ? `
                                                <button class="btn btn-sm btn-outline-info" onclick="showAssignmentDetail(${assignment.id})" title="查看详情">
                                                    <i class="bi bi-info-circle"></i>
                                                </button>
                                            ` : ''}
                                            ${assignment.need_submit ? `
                                                <button class="btn btn-sm btn-outline-success" onclick="markAsSubmitted(${assignment.id})" title="标记为已提交">
                                                    <i class="bi bi-check"></i>
                                                </button>
                                            ` : ''}
                                        </div>
                                    </div>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
                <div class="card-footer bg-transparent border-top-0 pt-0">
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">
                            <i class="bi bi-person me-1"></i>发布: ${assignments.length > 0 && assignments[0].publisher_name ? assignments[0].publisher_name : '未知'}
                        </small>
                        <small class="text-muted">
                            <i class="bi bi-${stats.need_submit > 0 ? 'upload' : 'check-circle'} me-1"></i>
                            ${stats.need_submit}项需提交
                        </small>
                    </div>
                </div>
            </div>
        </div>
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
        '#dc3545': 'danger',     // 政治B
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
function getDeadlineText(deadlineDate, daysRemaining) {
    if (!deadlineDate) return '';
    
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    if (deadlineDate === today) {
        return '今日截止';
    } else if (deadlineDate === tomorrow) {
        return '明日截止';
    } else if (daysRemaining !== null && daysRemaining < 0) {
        return '已过期';
    } else if (daysRemaining !== null && daysRemaining <= 3) {
        return `${daysRemaining}天后截止`;
    } else {
        return deadlineDate;
    }
}

// 获取截止时间徽章类
function getDeadlineBadgeClass(status) {
    switch(status) {
        case '今日截止':
            return 'bg-danger';
        case '明日截止':
            return 'bg-warning text-dark';
        case '已过期':
            return 'bg-secondary';
        case '三天内截止':
            return 'bg-info';
        default:
            return 'bg-light text-dark';
    }
}

// 更新统计信息显示
function updateStatsDisplay() {
    if (!filteredAssignments) return;
    
    const statsElement = document.getElementById('assignmentsStats');
    if (!statsElement) return;
    
    let totalAssignments = 0;
    let totalNeedSubmit = 0;
    let totalUrgent = 0;
    let totalSubjects = 0;
    
    Object.values(filteredAssignments).forEach(subjectData => {
        if (subjectData.assignments && subjectData.assignments.length > 0) {
            totalSubjects++;
            totalAssignments += subjectData.assignments.length;
            
            subjectData.assignments.forEach(assignment => {
                if (assignment.need_submit) totalNeedSubmit++;
                if (assignment.deadline_status === '今日截止' || assignment.deadline_status === '明日截止') {
                    if (assignment.need_submit) totalUrgent++;
                }
            });
        }
    });
    
    statsElement.innerHTML = `
        共 <span class="text-primary fw-bold">${totalSubjects}</span> 个学科，
        <span class="text-primary fw-bold">${totalAssignments}</span> 项作业，
        其中 <span class="text-danger fw-bold">${totalNeedSubmit}</span> 项需要提交，
        <span class="text-warning fw-bold">${totalUrgent}</span> 项紧急作业
    `;
}

// 初始化作业页面按钮
function initAssignmentButtons() {
    // 新建作业按钮
    const newAssignmentBtn = document.getElementById('btnNewAssignment');
    if (newAssignmentBtn) {
        newAssignmentBtn.addEventListener('click', showNewAssignmentModal);
    }
    
    // 筛选按钮
    const filterBtn = document.getElementById('filterBtn');
    if (filterBtn) {
        filterBtn.addEventListener('click', toggleFilterPanel);
    }
}

// 显示/隐藏筛选面板
function toggleFilterPanel() {
    const filterPanel = document.getElementById('filterPanel');
    if (filterPanel) {
        const isVisible = filterPanel.style.display !== 'none';
        filterPanel.style.display = isVisible ? 'none' : 'block';
        
        const filterBtn = document.getElementById('filterBtn');
        if (filterBtn) {
            filterBtn.innerHTML = isVisible ? 
                '<i class="bi bi-filter"></i> 筛选' : 
                '<i class="bi bi-filter-circle-fill"></i> 筛选';
            filterBtn.classList.toggle('btn-outline-secondary', isVisible);
            filterBtn.classList.toggle('btn-secondary', !isVisible);
        }
    }
}

// 初始化筛选面板
function initFilterPanel() {
    // 应用筛选按钮
    const applyFiltersBtn = document.getElementById('applyFilters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
    
    // 重置筛选按钮
    const resetFiltersBtn = document.getElementById('resetFilters');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
    }
}

// 应用筛选
function applyFilters() {
    if (!assignmentsData) return;
    
    const subjectFilter = document.getElementById('subjectFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const deadlineFilter = document.getElementById('deadlineFilter').value;
    const showDetailsOnly = document.getElementById('showDetailsOnly').checked;
    
    filteredAssignments = JSON.parse(JSON.stringify(assignmentsData)); // 深拷贝
    
    // 应用筛选
    Object.keys(filteredAssignments).forEach(subjectId => {
        // 学科筛选
        if (subjectFilter !== 'all' && subjectId !== subjectFilter) {
            delete filteredAssignments[subjectId];
            return;
        }
        
        const subjectData = filteredAssignments[subjectId];
        const filteredAssignmentsList = [];
        
        subjectData.assignments.forEach(assignment => {
            let include = true;
            
            // 状态筛选
            if (statusFilter !== 'all') {
                if (statusFilter === 'need_submit' && !assignment.need_submit) {
                    include = false;
                } else if (statusFilter === 'urgent') {
                    const isUrgent = assignment.deadline_status === '今日截止' || 
                                   assignment.deadline_status === '明日截止';
                    if (!isUrgent || !assignment.need_submit) {
                        include = false;
                    }
                } else if (statusFilter === 'important' && !assignment.is_important) {
                    include = false;
                }
            }
            
            // 截止时间筛选
            if (include && deadlineFilter !== 'all') {
                if (deadlineFilter === 'today' && assignment.deadline_status !== '今日截止') {
                    include = false;
                } else if (deadlineFilter === 'tomorrow' && assignment.deadline_status !== '明日截止') {
                    include = false;
                } else if (deadlineFilter === 'week') {
                    const isThisWeek = assignment.days_remaining !== null && 
                                      assignment.days_remaining >= 0 && 
                                      assignment.days_remaining <= 7;
                    if (!isThisWeek) {
                        include = false;
                    }
                }
            }
            
            // 详细信息筛选
            if (include && showDetailsOnly && !assignment.has_details) {
                include = false;
            }
            
            if (include) {
                filteredAssignmentsList.push(assignment);
            }
        });
        
        subjectData.assignments = filteredAssignmentsList;
        
        // 如果该学科没有作业了，移除该学科
        if (filteredAssignmentsList.length === 0) {
            delete filteredAssignments[subjectId];
        }
    });
    
    // 重新渲染
    renderSubjectCards();
    updateStatsDisplay();
}

// 重置筛选
function resetFilters() {
    document.getElementById('subjectFilter').value = 'all';
    document.getElementById('statusFilter').value = 'all';
    document.getElementById('deadlineFilter').value = 'all';
    document.getElementById('showDetailsOnly').checked = false;
    
    filteredAssignments = JSON.parse(JSON.stringify(assignmentsData));
    renderSubjectCards();
    updateStatsDisplay();
}

// 显示作业详情
async function showAssignmentDetail(assignmentId) {
    if (!assignmentsData) return;
    
    // 在所有学科中查找指定作业
    let assignment = null;
    Object.values(assignmentsData).forEach(subjectData => {
        const found = subjectData.assignments.find(a => a.id === assignmentId);
        if (found) assignment = found;
    });
    
    if (!assignment) {
        alert('未找到该作业的详细信息');
        return;
    }
    const [modalTemplate] = await Promise.all([
            fetchTemplate('pages/assignment_detail_modal.html'),

        ]);
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
                    ${assignment.content.replace(/\n/g, '<br>')}
                </div>
            </div>
            
            <div class="row mb-3">
                <div class="col-md-6">
                    <h6 class="text-muted mb-2">基本信息：</h6>
                    <ul class="list-unstyled">
                        <li class="mb-1">
                            <i class="bi bi-person me-2 text-muted"></i>
                            发布人：${assignment.publisher_name}
                        </li>
                        <li class="mb-1">
                            <i class="bi bi-calendar me-2 text-muted"></i>
                            布置时间：${formatDateTime(assignment.publish_time)}
                        </li>
                        ${assignment.need_submit ? `
                            <li class="mb-1">
                                <i class="bi bi-upload me-2 text-muted"></i>
                                需要提交：是
                            </li>
                            ${assignment.submit_items ? `
                                <li class="mb-1">
                                    <i class="bi bi-folder me-2 text-muted"></i>
                                    提交物品：${assignment.submit_items}
                                </li>
                            ` : ''}
                            ${assignment.submit_deadline ? `
                                <li class="mb-1">
                                    <i class="bi bi-clock me-2 text-muted"></i>
                                    截止时间：${getDeadlineText(assignment.submit_deadline, assignment.days_remaining)}
                                </li>
                            ` : ''}
                        ` : `
                            <li class="mb-1">
                                <i class="bi bi-check-circle me-2 text-muted"></i>
                                需要提交：否
                            </li>
                        `}
                    </ul>
                </div>
                <div class="col-md-6">
                    <h6 class="text-muted mb-2">状态信息：</h6>
                    <ul class="list-unstyled">
                        <li class="mb-1">
                            <i class="bi bi-${assignment.is_important ? 'star-fill text-warning' : 'star text-muted'} me-2"></i>
                            重要作业：${assignment.is_important ? '是' : '否'}
                        </li>
                        <li class="mb-1">
                            <i class="bi bi-${assignment.need_submit ? 'upload text-success' : 'check-circle text-muted'} me-2"></i>
                            提交状态：${assignment.need_submit ? '待提交' : '无需提交'}
                        </li>
                        ${assignment.deadline_status ? `
                            <li class="mb-1">
                                <i class="bi bi-calendar-check me-2 text-muted"></i>
                                截止状态：${assignment.deadline_status}
                            </li>
                        ` : ''}
                        ${assignment.days_remaining !== null ? `
                            <li class="mb-1">
                                <i class="bi bi-clock-history me-2 text-muted"></i>
                                剩余天数：${assignment.days_remaining >= 0 ? assignment.days_remaining + '天' : '已过期'}
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
                        ${assignment.details}
                    </div>
                </div>
            `;
        }
        
        modalContent.innerHTML = html;
    }

    const modal = new bootstrap.Modal(document.getElementById('assignmentDetailModal'));
    modal.show();
}

// 标记作业为已提交
function markAsSubmitted(assignmentId) {
    if (confirm('确认标记该作业为已提交吗？')) {
        // 这里应该发送请求到服务器更新状态
        // 暂时只在前端显示提示
        alert('已标记为已提交（此功能将在后续版本中完善）');
        
        // 刷新页面显示
        loadAssignmentsData();
    }
}

// 显示新建作业模态框
function showNewAssignmentModal() {
    alert('新建作业功能（权限验证、表单弹窗）将在后续开发中实现。');
}
