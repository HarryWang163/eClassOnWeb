
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