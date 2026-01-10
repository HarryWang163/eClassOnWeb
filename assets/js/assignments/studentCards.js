
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