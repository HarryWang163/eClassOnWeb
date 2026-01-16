let currentEditingSubjectId = null;
// 显示编辑作业模态框
async function showEditAssignmentModal(subjectId, subjectName) {
    try {
        currentEditingSubjectId = subjectId
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
        const assignmentsList = document.getElementById('assignmentFormContainer');
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
        
        // 使用当前选择的日期
        const queryDate = currentDate || getLocalDateString();
        
        // 调用API获取该学科的作业（按日期筛选）
        const response = await fetch(`api/get_subject_assignments.php?subject_id=${subjectId}&date=${queryDate}`);
        const data = await response.json();
        
        if (data.success) {
            // 传递日期参数给渲染函数
            renderSubjectAssignments(data.data, subjectId);
        } else {
            throw new Error(data.message || '加载失败');
        }
        
    } catch (error) {
        console.error('加载学科作业失败:', error);
        showError('加载作业列表失败: ' + error.message);
    }
}

// 渲染学科作业列表（修改版）
function renderSubjectAssignments(data, subjectId) {
    const assignmentsList = document.getElementById('assignmentFormContainer');
    if (!assignmentsList) return;
    
    const todayPublished = data.today_published || [];
    const futureDue = data.future_due || [];
    const queryDate = data.query_date || currentDate || getLocalDateString();
    
    // 检查是否有作业
    const hasAssignments = todayPublished.length > 0 || futureDue.length > 0;
    
    if (!hasAssignments) {
        assignmentsList.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-journal-text text-muted fs-1 mb-3"></i>
                <p class="text-muted mb-4">${formatDisplayDate(queryDate)} 该学科暂无作业</p>
                <button class="btn btn-primary" onclick="showNewAssignmentForm()">
                    <i class="bi bi-plus-circle me-1"></i>新建作业
                </button>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
                <h6 class="mb-0">作业列表</h6>
                <small class="text-muted">${formatDisplayDate(queryDate)} 的作业</small>
            </div>
            <button class="btn btn-sm btn-primary" onclick="showNewAssignmentForm()">
                <i class="bi bi-plus-circle me-1"></i>新建作业
            </button>
        </div>
    `;
    
    // 今天发布的作业
    if (todayPublished.length > 0) {
        html += `
            <div class="mb-4">
                <h6 class="text-muted mb-2"><i class="bi bi-calendar-plus me-1"></i>今天发布</h6>
                <div class="list-group">
                    ${todayPublished.map(assignment => renderAssignmentItemForEdit(assignment)).join('')}
                </div>
            </div>
        `;
    }
    
    // 未来截止的作业
    if (futureDue.length > 0) {
        const isToday = isSelectedDateToday();
        html += `
            <div class="mb-4">
                <h6 class="text-muted mb-2"><i class="bi bi-calendar-check me-1"></i>${isToday ? '未来截止' : '未到期'}</h6>
                <div class="list-group">
                    ${futureDue.map(assignment => renderAssignmentItemForEdit(assignment)).join('')}
                </div>
            </div>
        `;
    }
    
    // 添加查看所有作业的选项
    html += `
        <div class="text-center mt-4">
            <button class="btn btn-sm btn-outline-secondary" onclick="loadAllAssignments(${subjectId})">
                <i class="bi bi-list-check me-1"></i>查看该学科所有作业
            </button>
        </div>
    `;
    
    assignmentsList.innerHTML = html;
}

// 渲染编辑模态框中的单个作业项
function renderAssignmentItemForEdit(assignment) {
    const deadlineClass = getDeadlineBadgeClass(assignment.deadline);
    const deadlineText = getDeadlineText(assignment.deadline);
    const contentPreview = assignment.content ? 
        (assignment.content.length > 60 ? assignment.content.substring(0, 60) + '...' : assignment.content) : 
        '无内容';
    const deletePreview = assignment.content ? 
        (assignment.content.length > 30 ? assignment.content.substring(0, 30) + '...' : assignment.content) : 
        '此作业';
    
    return `
        <div class="list-group-item">
            <div class="d-flex w-100 justify-content-between align-items-start">
                <div class="flex-grow-1 me-3">
                    <h6 class="mb-1">${contentPreview}</h6>
                    <div class="d-flex flex-wrap gap-2 mt-2">
                        ${assignment.need_submit == 1 ? `
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
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteAssignment(${assignment.id}, '${deletePreview}')" title="删除">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// 检查选择的日期是否是今天
function isSelectedDateToday() {
    if (!currentDate) return true;
    const today = getLocalDateString();
    return currentDate === today;
}

// 查看所有作业（不按日期筛选）
async function loadAllAssignments(subjectId) {
    try {
        const assignmentsList = document.getElementById('assignmentFormContainer');
        if (assignmentsList) {
            assignmentsList.innerHTML = `
                <div class="text-center py-3">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">加载中...</span>
                    </div>
                    <p class="text-muted mt-2">正在加载所有作业...</p>
                </div>
            `;
        }
        
        // 不传递日期参数，获取所有作业
        const response = await fetch(`api/get_subject_assignments.php?subject_id=${subjectId}&all=true`);
        const data = await response.json();
        
        if (data.success) {
            renderAllAssignments(data.data.assignments, subjectId);
        } else {
            throw new Error(data.message || '加载失败');
        }
        
    } catch (error) {
        console.error('加载所有作业失败:', error);
        showError('加载作业列表失败: ' + error.message);
    }
}

// 渲染所有作业（不分日期）
function renderAllAssignments(assignments, subjectId) {
    const assignmentsList = document.getElementById('assignmentFormContainer');
    if (!assignmentsList) return;
    
    if (!assignments || assignments.length === 0) {
        assignmentsList.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-journal-text text-muted fs-1 mb-3"></i>
                <p class="text-muted mb-4">该学科暂无作业</p>
                <button class="btn btn-primary" onclick="showNewAssignmentForm()">
                    <i class="bi bi-plus-circle me-1"></i>新建作业
                </button>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
                <h6 class="mb-0">所有作业列表</h6>
                <small class="text-muted">共 ${assignments.length} 项作业</small>
            </div>
            <div>
                <button class="btn btn-sm btn-outline-secondary me-2" onclick="loadSubjectAssignments(${subjectId})">
                    <i class="bi bi-calendar me-1"></i>返回日期筛选
                </button>
                <button class="btn btn-sm btn-primary" onclick="showNewAssignmentForm()">
                    <i class="bi bi-plus-circle me-1"></i>新建作业
                </button>
            </div>
        </div>
        <div class="list-group" style="max-height: 500px; overflow-y: auto;">
    `;
    
    // 按发布日期分组
    const groupedByDate = {};
    assignments.forEach(assignment => {
        const publishDate = assignment.publish_time ? assignment.publish_time.split(' ')[0] : '未知日期';
        if (!groupedByDate[publishDate]) {
            groupedByDate[publishDate] = [];
        }
        groupedByDate[publishDate].push(assignment);
    });
    
    // 按日期倒序排列
    const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));
    
    sortedDates.forEach(date => {
        html += `
            <div class="list-group-item list-group-item-light">
                <div class="fw-bold mb-2">${date}</div>
                <div class="list-group list-group-flush">
        `;
        
        groupedByDate[date].forEach(assignment => {
            const deadlineClass = getDeadlineBadgeClass(assignment.deadline);
            const deadlineText = getDeadlineText(assignment.deadline);
            const contentPreview = assignment.content ? 
                (assignment.content.length > 50 ? assignment.content.substring(0, 50) + '...' : assignment.content) : 
                '无内容';
            const deletePreview = assignment.content ? 
                (assignment.content.length > 30 ? assignment.content.substring(0, 30) + '...' : assignment.content) : 
                '此作业';
            
            html += `
                <div class="list-group-item">
                    <div class="d-flex w-100 justify-content-between align-items-start">
                        <div class="flex-grow-1 me-3">
                            <div class="mb-1">${contentPreview}</div>
                            <div class="d-flex flex-wrap gap-2 mt-1 small">
                                ${assignment.need_submit == 1 ? `
                                    <span class="badge bg-success">需提交</span>
                                ` : ''}
                                ${assignment.deadline ? `
                                    <span class="badge ${deadlineClass}">${deadlineText}</span>
                                ` : ''}
                            </div>
                        </div>
                        <div class="d-flex flex-column gap-1">
                            <button class="btn btn-sm btn-outline-primary" onclick="editAssignment(${assignment.id})" title="编辑">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteAssignment(${assignment.id}, '${deletePreview}')" title="删除">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
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
    
    // 需要提交复选框事件
    const needSubmitCheckbox = document.getElementById('needSubmit');
    const submitItemsInput = document.getElementById('submitItems');
    
    if (needSubmitCheckbox && submitItemsInput) {

        
        // 初始状态
        submitItemsInput.disabled = !needSubmitCheckbox.checked;
        
        // 添加change事件
        needSubmitCheckbox.addEventListener('change', function() {

            submitItemsInput.disabled = !this.checked;
            if (!this.checked) {
                submitItemsInput.value = '';
            }
        });
    }
    
    // 详细说明复选框事件
    const hasDetailsCheckbox = document.getElementById('hasDetails');
    const detailsField = document.getElementById('detailsField');
    const detailsTextarea = document.getElementById('assignmentDetails');
    
    if (hasDetailsCheckbox && detailsField) {

        
        // 初始状态
        detailsField.style.display = hasDetailsCheckbox.checked ? 'block' : 'none';
        
        // 添加change事件
        hasDetailsCheckbox.addEventListener('change', function() {

            detailsField.style.display = this.checked ? 'block' : 'none';
            if (!this.checked && detailsTextarea) {
                detailsTextarea.value = '';
            }
        });
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
            const formTemplate = await fetchTemplate('modals/new_assignment_form.html');

            const formContainer = document.getElementById('assignmentFormContainer');
            if (formContainer) {
                formContainer.innerHTML = formTemplate;
            }
            initAssignmentForm();
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


// 保存作业
function saveAssignment(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // 处理复选框值
    data.need_submit = form.elements['need_submit'].checked ? 1 : 0;
    data.has_details = form.elements['has_details'].checked ? 1 : 0;
    
    // 添加学科ID（需要从上下文获取）
    const subjectId = currentEditingSubjectId;
    data.subject_id = subjectId;

    fetch('api/save_assignment.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccess('作业保存成功');
            // 重新加载列表
            loadSubjectAssignments(subjectId);
            loadAssignmentsContent();
            // 重置表单（如果是新建）
            if (form.elements['assignment_id'].value === '0') {
                form.reset();
            }
        } else {
            showError('保存失败: ' + data.message);
        }
    })
    .catch(error => {
        console.error('保存作业失败:', error);
        showError('保存失败，请检查网络连接');
    });
}

// 取消表单
function cancelForm() {
    // 返回作业列表视图
    loadSubjectAssignments(currentEditingSubjectId);
}

