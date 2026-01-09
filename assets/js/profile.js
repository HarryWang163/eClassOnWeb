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