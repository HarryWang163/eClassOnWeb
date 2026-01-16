
// 显示作业详情
async function showAssignmentDetail(assignmentId) {
    if (!assignmentsData || !assignmentsData.assignments) return;
    
    // 在所有学科中查找指定作业
    let assignment = null;
    assignmentsData.assignments.forEach(subjectData => {
        const today_published = subjectData.today_published || [];
        const future_due = subjectData.future_due || [];
        const allAssignments = [...today_published, ...future_due];

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
