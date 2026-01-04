
// 全局变量
// let currentUser = null;
// let userTags = [];

// DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initDashboard();
});

// 初始化仪表板
function initDashboard() {
    initNavigation();
    initMobileNavigation();
    loadInitialContent();
}

// 初始化桌面端导航
function initNavigation() {
    const dockItems = document.querySelectorAll('.dock-item:not(.dock-logo)');
    
    dockItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.dataset.page;
            const action = this.dataset.action;
            
            if (action === 'logout') {
                handleLogout();
                return;
            }
            
            if (page) {
                // 更新活动状态
                dockItems.forEach(i => i.classList.remove('active'));
                this.classList.add('active');
                
                // 加载对应页面
                loadPage(page);
            }
        });
    });
}

// 初始化移动端导航
function initMobileNavigation() {
    const mobileItems = document.querySelectorAll('.mobile-dock-item');
    
    mobileItems.forEach(item => {
        item.addEventListener('click', function() {
            const text = this.querySelector('small').textContent;
            const pageMap = {
                '首页': 'dashboard',
                '作业': 'assignments',
                '通知': 'notices',
                '我的': 'profile'
            };
            
            const page = pageMap[text];
            if (page) {
                // 更新活动状态
                mobileItems.forEach(i => i.classList.remove('active'));
                this.classList.add('active');
                
                // 同步桌面导航
                syncDesktopNav(page);
                
                // 加载页面
                loadPage(page);
            }
        });
    });
}


// 初始化密码修改功能
function initPasswordChange() {
    // 修改密码按钮
    const changePasswordBtn = document.getElementById('btnChangePassword');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', showChangePasswordModal);
    }
    
    // 模态框内的按钮
    const savePasswordBtn = document.getElementById('savePasswordBtn');
    const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
    
    if (savePasswordBtn) {
        savePasswordBtn.addEventListener('click', handlePasswordChange);
    }
    
    if (cancelPasswordBtn) {
        cancelPasswordBtn.addEventListener('click', resetPasswordForm);
    }
    
    // 监听输入框，实时验证密码强度
    const newPasswordInput = document.getElementById('new_password');
    const confirmPasswordInput = document.getElementById('confirm_password');
    
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', updatePasswordStrength);
    }
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', validatePasswordMatch);
    }
}

// 显示修改密码模态框
function showChangePasswordModal() {
    const modal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
    modal.show();
    resetPasswordForm();
}

// 重置密码表单
function resetPasswordForm() {
    const form = document.getElementById('passwordChangeForm');
    if (form) {
        form.reset();
    }
    
    // 隐藏所有验证消息
    const feedbacks = document.querySelectorAll('.password-feedback');
    feedbacks.forEach(feedback => {
        feedback.style.display = 'none';
    });
    
    // 重置密码强度指示器
    const strengthBar = document.getElementById('passwordStrengthBar');
    const strengthText = document.getElementById('passwordStrengthText');
    if (strengthBar) {
        strengthBar.style.width = '0%';
        strengthBar.className = 'progress-bar';
        strengthText.textContent = '';
    }
    
    // 启用保存按钮
    const saveBtn = document.getElementById('savePasswordBtn');
    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i>保存修改';
    }
}

// 更新密码强度指示器
function updatePasswordStrength() {
    const password = document.getElementById('new_password').value;
    const strengthBar = document.getElementById('passwordStrengthBar');
    const strengthText = document.getElementById('passwordStrengthText');
    
    if (!password) {
        strengthBar.style.width = '0%';
        strengthBar.className = 'progress-bar';
        strengthText.textContent = '';
        return;
    }
    
    // 计算密码强度
    let strength = 0;
    let message = '';
    
    // 长度检查
    if (password.length >= 6) strength += 20;
    if (password.length >= 8) strength += 20;
    
    // 字符类型检查
    if (/[a-z]/.test(password)) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 10;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
    
    // 设置进度条颜色和文本
    strengthBar.style.width = Math.min(strength, 100) + '%';
    
    if (strength < 40) {
        strengthBar.className = 'progress-bar bg-danger';
        message = '密码强度：弱';
    } else if (strength < 70) {
        strengthBar.className = 'progress-bar bg-warning';
        message = '密码强度：中等';
    } else {
        strengthBar.className = 'progress-bar bg-success';
        message = '密码强度：强';
    }
    
    strengthText.textContent = message;
}

// 验证密码是否匹配
function validatePasswordMatch() {
    const newPassword = document.getElementById('new_password').value;
    const confirmPassword = document.getElementById('confirm_password').value;
    const matchFeedback = document.getElementById('passwordMatchFeedback');
    
    if (!newPassword || !confirmPassword) {
        matchFeedback.style.display = 'none';
        return;
    }
    
    if (newPassword === confirmPassword) {
        matchFeedback.style.display = 'block';
        matchFeedback.className = 'password-feedback text-success small';
        matchFeedback.innerHTML = '<i class="bi bi-check-circle me-1"></i>密码匹配';
    } else {
        matchFeedback.style.display = 'block';
        matchFeedback.className = 'password-feedback text-danger small';
        matchFeedback.innerHTML = '<i class="bi bi-exclamation-circle me-1"></i>密码不匹配';
    }
}

// 处理密码修改
async function handlePasswordChange() {
    const oldPassword = document.getElementById('old_password').value;
    const newPassword = document.getElementById('new_password').value;
    const confirmPassword = document.getElementById('confirm_password').value;
    
    // 简单的前端验证
    if (!oldPassword || !newPassword || !confirmPassword) {
        showPasswordError('请填写所有字段');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showPasswordError('新密码和确认密码不一致');
        return;
    }
    
    if (newPassword.length < 6) {
        showPasswordError('新密码长度至少6位');
        return;
    }
    
    if (oldPassword === newPassword) {
        showPasswordError('新密码不能与旧密码相同');
        return;
    }
    
    // 禁用按钮，防止重复提交
    const saveBtn = document.getElementById('savePasswordBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>处理中...';
    
    try {
        const formData = new FormData();
        formData.append('old_password', oldPassword);
        formData.append('new_password', newPassword);
        formData.append('confirm_password', confirmPassword);
        
        const response = await fetch('update_password.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 显示成功消息
            showPasswordSuccess(result.message);
            
            // 3秒后关闭模态框
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
                modal.hide();
                resetPasswordForm();
            }, 3000);
        } else {
            showPasswordError(result.message);
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i>保存修改';
        }
    } catch (error) {
        console.error('密码修改失败:', error);
        showPasswordError('网络错误，请稍后重试');
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i>保存修改';
    }
}

// 显示密码错误消息
function showPasswordError(message) {
    const alertDiv = document.getElementById('passwordChangeAlert');
    if (!alertDiv) return;
    
    alertDiv.innerHTML = `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    // 5秒后自动消失
    setTimeout(() => {
        const alert = alertDiv.querySelector('.alert');
        if (alert) {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }
    }, 5000);
}

// 显示密码成功消息
function showPasswordSuccess(message) {
    const alertDiv = document.getElementById('passwordChangeAlert');
    if (!alertDiv) return;
    
    alertDiv.innerHTML = `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            <i class="bi bi-check-circle-fill me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

// 同步桌面导航状态
function syncDesktopNav(page) {
    const dockItems = document.querySelectorAll('.dock-item:not(.dock-logo)');
    dockItems.forEach(item => {
        if (item.dataset.page === page) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// 加载初始内容
function loadInitialContent() {
    // 显示加载状态
    showLoading();
    
    // 模拟API调用获取用户数据
    setTimeout(() => {
        // 这里应该是从PHP传递的数据
        // 为了演示，我们假设已经通过PHP变量设置了window.userData
        if (window.userData) {
            currentUser = window.userData.user;
            userTags = window.userData.user_tags || [];
            
            // 加载仪表板内容
            loadDashboardContent();
        }
    }, 300);
}

// 加载页面
function loadPage(page) {
    showLoading();
    
    setTimeout(() => {
        switch(page) {
            case 'dashboard':
                loadDashboardContent();
                break;
            case 'assignments':
                loadAssignmentsContent();
                break;
            case 'notices':
                loadNoticesContent();
                break;
            case 'archive':
                loadArchiveContent();
                break;
            case 'profile':
                loadProfileContent();
                break;
            default:
                showError('页面不存在');
        }
    }, 300);
}

// 加载仪表板内容
function loadDashboardContent() {
    fetchTemplate('pages/dashboard_content.html')
        .then(template => {
            const html = template
                .replace(/{greeting}/g, window.userData?.greeting || '您好')
                .replace(/{username}/g, currentUser?.username || '用户');
            updateContent(html);
            addAnimationClasses();
        })
        .catch(error => {
            console.error('加载仪表板内容失败:', error);
            showError('加载仪表板失败');
        });
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
// 加载通知内容
function loadNoticesContent() {
    fetchTemplate('pages/notices_content.html')
        .then(html => {
            updateContent(html);
            addAnimationClasses();
        })
        .catch(error => {
            console.error('加载通知内容失败:', error);
            showError('加载通知页面失败');
        });
}

// 加载档案内容
function loadArchiveContent() {
    fetchTemplate('pages/archive_content.html')
        .then(html => {
            updateContent(html);
            addAnimationClasses();
        })
        .catch(error => {
            console.error('加载档案内容失败:', error);
            showError('加载档案页面失败');
        });
}

// 加载个人资料内容
async function loadProfileContent() {
    if (!currentUser) {
        showError('用户信息加载失败');
        return;
    }
    
    try {
        // 同时加载个人资料内容和密码模态框
        const [profileTemplate, modalTemplate] = await Promise.all([
            fetchTemplate('pages/profile_content.html'),
            fetchTemplate('pages/password_modal.html')
        ]);
        
        const html = populateProfileTemplate(profileTemplate);
        updateContent(html);
        
        // 将模态框添加到页面
        const modalContainer = document.getElementById('passwordModalContainer');
        if (modalContainer) {
            modalContainer.innerHTML = modalTemplate;
        }
        
        addAnimationClasses();
        
        // 初始化密码修改功能
        initPasswordChange();
        
        // 初始化密码显示/隐藏切换
        initPasswordToggle();
        
    } catch (error) {
        console.error('加载个人资料内容失败:', error);
        showError('加载个人资料失败');
    }
}

// 新增：初始化密码显示/隐藏切换
function initPasswordToggle() {
    // 旧密码切换
    const toggleOldBtn = document.getElementById('toggleOldPassword');
    const oldPasswordInput = document.getElementById('old_password');
    
    if (toggleOldBtn && oldPasswordInput) {
        toggleOldBtn.addEventListener('click', () => {
            togglePasswordVisibility(oldPasswordInput, toggleOldBtn);
        });
    }
    
    // 新密码切换
    const toggleNewBtn = document.getElementById('toggleNewPassword');
    const newPasswordInput = document.getElementById('new_password');
    
    if (toggleNewBtn && newPasswordInput) {
        toggleNewBtn.addEventListener('click', () => {
            togglePasswordVisibility(newPasswordInput, toggleNewBtn);
        });
    }
    
    // 确认密码切换
    const toggleConfirmBtn = document.getElementById('toggleConfirmPassword');
    const confirmPasswordInput = document.getElementById('confirm_password');
    
    if (toggleConfirmBtn && confirmPasswordInput) {
        toggleConfirmBtn.addEventListener('click', () => {
            togglePasswordVisibility(confirmPasswordInput, toggleConfirmBtn);
        });
    }
}

// 切换密码可见性
function togglePasswordVisibility(inputElement, buttonElement) {
    const type = inputElement.getAttribute('type') === 'password' ? 'text' : 'password';
    inputElement.setAttribute('type', type);
    
    // 切换图标
    const icon = buttonElement.querySelector('i');
    if (icon) {
        icon.className = type === 'password' ? 'bi bi-eye' : 'bi bi-eye-slash';
    }
}

// 填充个人资料模板
function populateProfileTemplate(template) {
    let html = template;
    
    // 基本用户信息
    html = html.replace(/{id}/g, currentUser.id || '');
    html = html.replace(/{username}/g, currentUser.username || '');
    html = html.replace(/{real_name}/g, currentUser.real_name || '');
    
    // 格式化日期
    const createdDate = new Date(currentUser.created_at);
    html = html.replace(/{created_at_formatted}/g, formatDateTime(currentUser.created_at));
    
    // 更新日期（如果有）
    let updatedAtHtml = '';
    if (currentUser.updated_at && currentUser.updated_at !== currentUser.created_at) {
        updatedAtHtml = `
            <div class="d-flex align-items-center mt-2">
                <i class="bi bi-calendar-check text-muted me-2"></i>
                <span class="text-muted small">最后更新：</span>
                <span class="ms-auto">${formatDateTime(currentUser.updated_at)}</span>
            </div>
        `;
    }
    html = html.replace(/{updated_at_html}/g, updatedAtHtml);
    
    // 学号信息
    let studentNumberHtml = '';
    if (currentUser.student_number) {
        studentNumberHtml = `
            <div class="bg-light rounded-3 p-3 mb-3">
                <div class="d-flex align-items-center">
                    <i class="bi bi-credit-card-2-front text-muted me-2"></i>
                    <span class="text-muted small">学号：</span>
                    <span class="ms-auto fw-bold">${currentUser.student_number}</span>
                </div>
            </div>
        `;
    }
    html = html.replace(/{student_number_html}/g, studentNumberHtml);
    
    // 计算注册天数
    const daysSince = getDaysSince(currentUser.created_at);
    html = html.replace(/{days_since_registered}/g, daysSince);
    
    // 用户类型
    const isTeacher = userTags.some(tag => 
        tag.tag_type_id === 2 || tag.tag_name.includes('老师') || tag.tag_name.includes('管理员')
    );
    html = html.replace(/{user_type}/g, isTeacher ? '教师/管理员' : '学生');
    
    // 标签HTML
    const tagsHtml = generateTagsHtml();
    html = html.replace(/{tags_html}/g, tagsHtml);
    html = html.replace(/{tags_count}/g, userTags.length);
    
     // 添加新的占位符替换
    const lastPasswordChange = getDaysSince(currentUser.updated_at) > 30 
        ? '超过30天前' 
        : formatDateTime(currentUser.updated_at);
    html = html.replace(/{last_password_change}/g, lastPasswordChange);
    
    // 获取客户端IP（模拟）
    const currentIp = '192.168.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255);
    html = html.replace(/{current_ip}/g, currentIp);
    
    return html;
}

// 生成标签HTML
function generateTagsHtml() {
    if (userTags.length === 0) {
        return `
            <div class="text-center py-4">
                <div class="mb-3">
                    <i class="bi bi-tag text-muted fs-1"></i>
                </div>
                <p class="text-muted mb-0">暂无标签</p>
                <small class="text-muted">请联系管理员为您添加标签</small>
            </div>
        `;
    }
    
    // 按标签类型分组
    const groupedTags = {};
    userTags.forEach(tag => {
        const typeName = tag.type_name || '未分类';
        if (!groupedTags[typeName]) {
            groupedTags[typeName] = [];
        }
        groupedTags[typeName].push(tag);
    });
    
    const typeNames = Object.keys(groupedTags);
    let html = '';
    
    typeNames.forEach((typeName, typeIndex) => {
        const tags = groupedTags[typeName];
        html += `
            <div class="mb-${typeIndex < typeNames.length - 1 ? '4' : '0'}">
                <h6 class="text-muted mb-2 tag-type-header">${typeName}</h6>
                <div class="d-flex flex-wrap gap-2 mb-3">
                    ${tags.map(tag => `
                    <span class="badge rounded-pill d-flex align-items-center" 
                          style="background-color: ${tag.color || '#6c757d'}; color: white;"
                          title="${tag.description || ''}">
                        ${tag.tag_name}
                        ${tag.description ? '<i class="bi bi-info-circle ms-1" style="font-size: 0.8rem;"></i>' : ''}
                    </span>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    return html;
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

// 处理退出登录
function handleLogout() {
    if (confirm('确定要退出 eClass 吗？')) {
        window.location.href = 'logout.php';
    }
}

// 显示加载状态
function showLoading() {
    const contentArea = document.getElementById('dynamicContent');
    contentArea.innerHTML = `
        <div class="text-center py-5 my-5 animate-fade-in">
            <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;">
                <span class="visually-hidden">加载中...</span>
            </div>
            <p class="lead">正在加载页面...</p>
        </div>
    `;
}

// 显示错误信息
function showError(message) {
    const contentArea = document.getElementById('dynamicContent');
    contentArea.innerHTML = `
        <div class="alert alert-danger animate-fade-in-up" role="alert">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            ${message}
        </div>
    `;
}

// 更新内容区域
function updateContent(html) {
    const contentArea = document.getElementById('dynamicContent');
    contentArea.innerHTML = html;
}

// 添加动画类
function addAnimationClasses() {
    const contentArea = document.getElementById('dynamicContent');
    const elementsToAnimate = contentArea.querySelectorAll('.card, .btn, .table, .alert, h1, h2, h3, h4, h5, h6, p, .badge');
    
    elementsToAnimate.forEach((el, index) => {
        if (!el.classList.contains('animate-fade-in-up') && 
            !el.classList.contains('animate-fade-in-right') && 
            !el.classList.contains('animate-fade-in')) {
            el.classList.add('animate-fade-in-up');
            el.style.animationDelay = `${0.1 + (index * 0.05)}s`;
            el.style.opacity = '0';
        }
    });
}

// 获取模板文件
async function fetchTemplate(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch template: ${response.statusText}`);
    }
    return await response.text();
}

// 格式化日期时间
function formatDateTime(datetimeStr) {
    if (!datetimeStr) return '未知时间';
    const date = new Date(datetimeStr);
    const now = new Date();
    
    // 如果是今天
    if (date.toDateString() === now.toDateString()) {
        return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // 如果是昨天
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// 计算天数差
function getDaysSince(createdAt) {
    if (!createdAt) return '未知';
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// 处理移动端退出登录
function handleMobileLogout() {
    if (confirm('确定要退出 eClass 吗？')) {
        // 显示加载状态
        const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
        if (mobileLogoutBtn) {
            mobileLogoutBtn.disabled = true;
            mobileLogoutBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>退出中...';
        }
        
        // 跳转到退出页面
        setTimeout(() => {
            window.location.href = 'logout.php';
        }, 500);
    }
}

// 作业模块功能
let assignmentsData = null;
let filteredAssignments = null;

// 初始化作业页面
function initAssignmentsPage() {
    loadAssignmentsData();
    initAssignmentButtons();
    initFilterPanel();
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
