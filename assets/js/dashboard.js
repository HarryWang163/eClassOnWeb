
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
                
                // 加载页面
                loadPage(page);
            }
        });
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
