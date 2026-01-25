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
                <button class="btn btn-sm btn-success" onclick="showEditAssignmentModal(${subject.subject_id}, '${subject.subject_name}')">
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

