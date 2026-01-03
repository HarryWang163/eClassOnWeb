// dashboard.js - 主仪表板交互逻辑

// 全局变量
let currentUser = null;
let userTags = [];

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

// 加载作业内容
function loadAssignmentsContent() {
    fetchTemplate('pages/assignments_content.html')
        .then(html => {
            updateContent(html);
            addAnimationClasses();
            initAssignmentButtons();
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
function loadProfileContent() {
    if (!currentUser) {
        showError('用户信息加载失败');
        return;
    }
    
    fetchTemplate('pages/profile_content.html')
        .then(template => {
            const html = populateProfileTemplate(template);
            updateContent(html);
            addAnimationClasses();
        })
        .catch(error => {
            console.error('加载个人资料内容失败:', error);
            showError('加载个人资料失败');
        });
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