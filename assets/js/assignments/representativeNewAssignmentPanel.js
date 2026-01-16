// 加载课代表新建作业面板（简化版）
function loadRepresentativeNewAssignmentPanel() {
    const panel = document.getElementById('representativeNewAssignment');
    if (!panel) return;
    // 先显示加载状态
    panel.innerHTML = `
        <div class="d-flex align-items-center gap-2">
            <div class="spinner-border spinner-border-sm text-primary" role="status">
                <span class="visually-hidden">加载中...</span>
            </div>
            <small class="text-muted">加载课代表信息...</small>
        </div>
    `;
    
    // 检查用户是否是课代表
    checkUserRepresentativeStatus();
}

// 检查用户是否是课代表
function checkUserRepresentativeStatus() {
    fetch('api/get_representative_subjects.php')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data && data.data.representatives.length > 0) {
                // 用户是课代表，显示新建作业面板
                renderNewAssignmentPanel(data.data.representatives);
            } else {
                // 用户不是课代表，隐藏面板
                const panel = document.getElementById('representativeNewAssignment');
                if (panel) {
                    panel.innerHTML = '';
                }
            }
        })
        .catch(error => {
            console.error('检查课代表状态失败:', error);
            const panel = document.getElementById('representativeNewAssignment');
            if (panel) {
                panel.innerHTML = '';
            }
        });
}

// 渲染新建作业面板（简化版）
function renderNewAssignmentPanel(representativeSubjects) {
    const panel = document.getElementById('representativeNewAssignment');
    if (!panel) return;
    
    // 如果没有课代表学科，隐藏面板
    if (!representativeSubjects || representativeSubjects.length === 0) {
        panel.innerHTML = '';
        return;
    }
    
    // 如果只有一个学科，直接显示按钮
    if (representativeSubjects.length === 1) {
        const subject = representativeSubjects[0];
        panel.innerHTML = `
            <div class="d-flex align-items-center gap-2">
                <button class="btn btn-sm btn-success" onclick="openNewAssignmentForSubject(${subject.subject_id}, '${subject.subject_name}')">
                    <i class="bi bi-plus-circle me-1"></i>新建 ${subject.subject_name} 作业
                </button>
            </div>
        `;
        return;
    }
    
    // 有多个学科，显示下拉框
    panel.innerHTML = `
        <div class="d-flex align-items-center gap-2">
            <select class="form-select form-select-sm" id="newAssignmentSubjectSelect" style="width: 140px;">
                <option value="" selected disabled>选择学科</option>
                ${representativeSubjects.map(subject => 
                    `<option value="${subject.subject_id}" data-name="${subject.subject_name}">${subject.subject_name}</option>`
                ).join('')}
            </select>
            <button class="btn btn-sm btn-success" id="newAssignmentQuickBtn" onclick="openNewAssignmentFromSelect()" disabled>
                <i class="bi bi-plus-circle me-1"></i>新建作业
            </button>
        </div>
    `;
    
    // 添加下拉框变化事件
    const select = document.getElementById('newAssignmentSubjectSelect');
    if (select) {
        select.addEventListener('change', function() {
            const btn = document.getElementById('newAssignmentQuickBtn');
            if (btn) {
                btn.disabled = !this.value;
            }
        });
    }
}

// 从下拉框打开新建作业
function openNewAssignmentFromSelect() {
    const select = document.getElementById('newAssignmentSubjectSelect');
    if (!select || !select.value) {
        alert('请先选择学科');
        return;
    }
    
    const subjectId = select.value;
    const subjectName = select.options[select.selectedIndex].text;
    currentEditingSubjectId = subjectId;
    
    showEditAssignmentModal(subjectId, subjectName);
}

// 为指定学科打开新建作业
async function openNewAssignmentForSubject(subjectId, subjectName) {
    try {
        console.log('为学科新建作业:', subjectId, subjectName);
        
        // 打开编辑作业模态框，但显示新建表单
        await openEditAssignmentModalForNew(subjectId, subjectName);
        
    } catch (error) {
        console.error('打开新建作业失败:', error);
        showError('打开新建作业失败: ' + error.message);
    }
}

// 打开编辑作业模态框并显示新建表单
async function openEditAssignmentModalForNew(subjectId, subjectName) {
    try {
        console.log('打开编辑模态框用于新建作业:', subjectId, subjectName);
        
        // 2. 创建模态框HTML
        const modalId = 'editAssignmentModal';
        const modalHTML = `
        <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${modalId}Label" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="${modalId}Label">${subjectName} - 新建作业</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div id="assignmentFormContainer">
                            <div class="text-center py-3">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">加载中...</span>
                                </div>
                                <p class="text-muted mt-2">正在加载表单...</p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
                    </div>
                </div>
            </div>
        </div>`;
        
        // 3. 直接添加到body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // 4. 获取模态框元素
        const modalElement = document.getElementById(modalId);
        if (!modalElement) {
            throw new Error('模态框元素创建失败');
        }
        
        // 5. 添加模态框显示事件
        modalElement.addEventListener('shown.bs.modal', async () => {
            console.log('模态框已显示，加载新建表单');
            try {
                await loadNewAssignmentForm(subjectId, subjectName);
            } catch (error) {
                console.error('加载新建表单失败:', error);
                const formContainer = document.getElementById('assignmentFormContainer');
                if (formContainer) {
                    formContainer.innerHTML = `
                        <div class="alert alert-danger">
                            <i class="bi bi-exclamation-triangle me-2"></i>
                            加载表单失败: ${error.message}
                        </div>
                    `;
                }
            }
        });

        showNewAssignmentForm();

        // 6. 添加模态框隐藏事件
        modalElement.addEventListener('hidden.bs.modal', () => {
            console.log('模态框已隐藏，开始清理');
            setTimeout(() => {
                if (modalElement && modalElement.parentNode) {
                    modalElement.remove();
                }
            }, 300);
        });
        
        // 7. 创建并显示模态框
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: true,
            keyboard: true
        });
        
        modal.show();
        console.log('模态框显示指令已发送');
        
    } catch (error) {
        console.error('打开编辑作业模态框失败:', error);
        throw error;
    }
}