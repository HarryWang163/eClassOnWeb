<?php
require_once 'config/database.php';

// 检查是否已登录
if (!isset($_SESSION['user_id'])) {
    header('Location: index.php');
    exit();
}

$db = getDB();
$user_id = $_SESSION['user_id'];

// 获取用户基本信息
$stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$user_id]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

// 智能时间问候
$hour = date('H');
if ($hour < 6) {
    $greeting = '凌晨好';
} elseif ($hour < 12) {
    $greeting = '早上好';
} elseif ($hour < 14) {
    $greeting = '中午好';
} elseif ($hour < 19) {
    $greeting = '下午好';
} else {
    $greeting = '晚上好';
}
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>eClass - 班级协作平台</title>
    <!-- 本地资源引用 (请确保路径正确) -->
    <link href="assets/css/bootstrap.min.css" rel="stylesheet">
    <link href="assets/css/bootstrap-icons.css" rel="stylesheet">
    <link href="assets/css/dock.css" rel="stylesheet">
    <style>
        :root {
            --dock-bg: rgba(255, 255, 255, 0.95);
            --dock-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            --primary-color: #4a6bff;
            --hover-color: #3a56d4;
        }
        
        body {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            min-height: 100vh;
            overflow-x: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', sans-serif;
        }
        
        .main-container {
            display: flex;
            min-height: 100vh;
        }
        
        .content-area {
            flex: 1;
            margin-left: 100px;
            padding: 2rem;
            transition: all 0.3s ease;
        }
        
        .welcome-card {
            background: linear-gradient(135deg, #ffffff 0%, #fdfdfd 100%);
            border-radius: 24px;
            box-shadow: 0 12px 48px rgba(0, 0, 0, 0.06);
            padding: 2.5rem;
            margin-bottom: 2.5rem;
            border: 1px solid rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(10px);
            animation: fadeIn 0.8s ease-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(24px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .stat-card {
            border: none;
            border-radius: 20px;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
        }
        
        .assignment-row {
            border-left: 4px solid transparent;
            transition: all 0.2s ease;
        }
        
        .assignment-row:hover {
            background-color: #f8fafc;
            border-left-color: var(--primary-color);
        }
        
        .badge-pill {
            border-radius: 20px;
            padding: 0.35em 0.9em;
            font-weight: 500;
        }
        
        @media (max-width: 768px) {
            .content-area {
                margin-left: 0;
                padding: 1.5rem;
                padding-bottom: 100px;
            }
        }
    </style>
</head>
<body>
    <!-- macOS风格Dock导航栏 -->
    <div class="mac-dock" id="dock">
        <div class="dock-container">
            <div class="dock-item dock-logo" data-tooltip="eClass">
                <div class="icon-wrapper">
                    <i class="bi bi-mortarboard-fill"></i>
                </div>
            </div>
            
            <div class="dock-item active" data-page="dashboard" data-tooltip="仪表板">
                <div class="icon-wrapper">
                    <i class="bi bi-speedometer2"></i>
                </div>
            </div>
            
            <div class="dock-item" data-page="assignments" data-tooltip="作业">
                <div class="icon-wrapper">
                    <i class="bi bi-journal-text"></i>
                </div>
            </div>
            
            <div class="dock-item" data-page="notices" data-tooltip="活动通知">
                <div class="icon-wrapper">
                    <i class="bi bi-megaphone"></i>
                </div>
            </div>
            
            <div class="dock-item" data-page="archive" data-tooltip="班级档案">
                <div class="icon-wrapper">
                    <i class="bi bi-archive"></i>
                </div>
            </div>
            
            <div class="dock-item" data-page="profile" data-tooltip="个人中心">
                <div class="icon-wrapper">
                    <i class="bi bi-person-circle"></i>
                </div>
            </div>
            
            <div class="dock-divider"></div>
            
            <div class="dock-item" data-action="logout" data-tooltip="退出登录">
                <div class="icon-wrapper">
                    <i class="bi bi-box-arrow-right"></i>
                </div>
            </div>
        </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-container">
        <div class="content-area" id="contentArea">
            <!-- 动态内容容器 -->
            <div id="dynamicContent">
                <!-- 初始加载仪表板内容 -->
                <?php include 'pages/dashboard_content.php'; ?>
            </div>
        </div>
    </div>

    <!-- 移动端底部导航 -->
    <div class="mobile-dock d-lg-none">
        <div class="mobile-dock-container">
            <div class="mobile-dock-item active">
                <i class="bi bi-house-door"></i>
                <small>首页</small>
            </div>
            <div class="mobile-dock-item">
                <i class="bi bi-journal-text"></i>
                <small>作业</small>
            </div>
            <div class="mobile-dock-item">
                <i class="bi bi-megaphone"></i>
                <small>通知</small>
            </div>
            <div class="mobile-dock-item">
                <i class="bi bi-person"></i>
                <small>我的</small>
            </div>
        </div>
    </div>

    <!-- JavaScript -->
    <script src="assets/js/bootstrap.bundle.min.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const dockItems = document.querySelectorAll('.dock-item:not(.dock-logo)');
            const dynamicContent = document.getElementById('dynamicContent');
            
            const pageContents = {
                'dashboard': `
                    <div class="welcome-card">
                        <div class="row align-items-center">
                            <div class="col-md-8">
                                <h1 class="display-6 fw-bold mb-3">
                                    <i class="bi bi-sunrise me-2"></i><?php echo $greeting; ?>，
                                    <span class="text-primary"><?php echo htmlspecialchars($user['real_name']); ?></span>！
                                </h1>
                                <p class="lead text-muted mb-4">
                                    欢迎使用 eClass 班级协作平台。
                                </p>
                                <div class="d-flex flex-wrap gap-2">
                                    <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-3 py-2">
                                        <i class="bi bi-journal-check me-1"></i>作业管理
                                    </span>
                                    <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2">
                                        <i class="bi bi-megaphone me-1"></i>通知发布
                                    </span>
                                    <span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 px-3 py-2">
                                        <i class="bi bi-people me-1"></i>成员协作
                                    </span>
                                </div>
                            </div>
                            <div class="col-md-4 text-center">
                                <div class="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-4">
                                    <i class="bi bi-mortarboard text-primary fs-1"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row g-4">
                        <div class="col-xl-3 col-md-6">
                            <div class="card stat-card border-primary border-opacity-25">
                                <div class="card-body text-center p-4">
                                    <div class="text-primary mb-3">
                                        <i class="bi bi-journal-text fs-1"></i>
                                    </div>
                                    <h3 class="mb-2">5</h3>
                                    <p class="text-muted mb-0">进行中的作业</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-xl-3 col-md-6">
                            <div class="card stat-card border-success border-opacity-25">
                                <div class="card-body text-center p-4">
                                    <div class="text-success mb-3">
                                        <i class="bi bi-calendar-event fs-1"></i>
                                    </div>
                                    <h3 class="mb-2">3</h3>
                                    <p class="text-muted mb-0">近期活动</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-xl-3 col-md-6">
                            <div class="card stat-card border-info border-opacity-25">
                                <div class="card-body text-center p-4">
                                    <div class="text-info mb-3">
                                        <i class="bi bi-chat-left-text fs-1"></i>
                                    </div>
                                    <h3 class="mb-2">12</h3>
                                    <p class="text-muted mb-0">未读消息</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-xl-3 col-md-6">
                            <div class="card stat-card border-warning border-opacity-25">
                                <div class="card-body text-center p-4">
                                    <div class="text-warning mb-3">
                                        <i class="bi bi-clock-history fs-1"></i>
                                    </div>
                                    <h3 class="mb-2">2</h3>
                                    <p class="text-muted mb-0">即将截止</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `,
                'assignments': `
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h2 class="h4 fw-bold mb-0"><i class="bi bi-journal-text me-2"></i>作业中心</h2>
                            <p class="text-muted mb-0">查看作业详情，课代表、教师及管理员可进行管理</p>
                        </div>
                        <button class="btn btn-primary" id="btnNewAssignment">
                            <i class="bi bi-plus-circle me-1"></i>新建作业
                        </button>
                    </div>
                    <div class="card border-0 shadow-sm">
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-hover align-middle mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th class="border-0 ps-4" style="width: 50px;">#</th>
                                            <th class="border-0">作业标题</th>
                                            <th class="border-0">学科</th>
                                            <th class="border-0">发布者</th>
                                            <th class="border-0">截止日期</th>
                                            <th class="border-0">状态</th>
                                            <th class="border-0 text-end pe-4">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr class="assignment-row">
                                            <td class="ps-4 fw-bold text-primary">1</td>
                                            <td>
                                                <div class="fw-semibold">第三章课后练习题</div>
                                                <small class="text-muted">数学 - 王老师</small>
                                            </td>
                                            <td>数学</td>
                                            <td>
                                                <div class="d-flex align-items-center">
                                                    <div class="bg-primary bg-opacity-10 rounded-circle p-2 me-2">
                                                        <i class="bi bi-person text-primary"></i>
                                                    </div>
                                                    <span>王老师</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div>04月28日</div>
                                                <small class="text-success">还剩3天</small>
                                            </td>
                                            <td>
                                                <span class="badge bg-warning bg-opacity-15 text-warning badge-pill">
                                                    <i class="bi bi-clock me-1"></i>进行中
                                                </span>
                                            </td>
                                            <td class="text-end pe-4">
                                                <button class="btn btn-sm btn-outline-primary me-1">
                                                    <i class="bi bi-eye"></i> 查看
                                                </button>
                                                <button class="btn btn-sm btn-outline-secondary">
                                                    <i class="bi bi-pencil-square"></i> 编辑
                                                </button>
                                            </td>
                                        </tr>
                                        <tr class="assignment-row">
                                            <td class="ps-4 fw-bold text-primary">2</td>
                                            <td>
                                                <div class="fw-semibold">《边城》读后感</div>
                                                <small class="text-muted">语文 - 李老师</small>
                                            </td>
                                            <td>语文</td>
                                            <td>
                                                <div class="d-flex align-items-center">
                                                    <div class="bg-info bg-opacity-10 rounded-circle p-2 me-2">
                                                        <i class="bi bi-person text-info"></i>
                                                    </div>
                                                    <span>李老师</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div>04月25日</div>
                                                <small class="text-danger">今天截止</small>
                                            </td>
                                            <td>
                                                <span class="badge bg-danger bg-opacity-15 text-danger badge-pill">
                                                    <i class="bi bi-exclamation-triangle me-1"></i>即将截止
                                                </span>
                                            </td>
                                            <td class="text-end pe-4">
                                                <button class="btn btn-sm btn-outline-primary me-1">
                                                    <i class="bi bi-eye"></i> 查看
                                                </button>
                                                <button class="btn btn-sm btn-outline-secondary">
                                                    <i class="bi bi-pencil-square"></i> 编辑
                                                </button>
                                            </td>
                                        </tr>
                                        <tr class="assignment-row">
                                            <td class="ps-4 fw-bold text-primary">3</td>
                                            <td>
                                                <div class="fw-semibold">Unit 4 单词听写</div>
                                                <small class="text-muted">英语 - 张老师</small>
                                            </td>
                                            <td>英语</td>
                                            <td>
                                                <div class="d-flex align-items-center">
                                                    <div class="bg-success bg-opacity-10 rounded-circle p-2 me-2">
                                                        <i class="bi bi-person text-success"></i>
                                                    </div>
                                                    <span>张老师</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div>04月20日</div>
                                                <small class="text-muted">已截止</small>
                                            </td>
                                            <td>
                                                <span class="badge bg-secondary bg-opacity-15 text-secondary badge-pill">
                                                    <i class="bi bi-check2-all me-1"></i>已结束
                                                </span>
                                            </td>
                                            <td class="text-end pe-4">
                                                <button class="btn btn-sm btn-outline-primary me-1">
                                                    <i class="bi bi-eye"></i> 查看
                                                </button>
                                                <button class="btn btn-sm btn-outline-secondary" disabled>
                                                    <i class="bi bi-pencil-square"></i> 编辑
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div class="alert alert-info border-info border-opacity-25 bg-info bg-opacity-10 mt-4">
                        <div class="d-flex">
                            <div class="me-3">
                                <i class="bi bi-info-circle fs-4 text-info"></i>
                            </div>
                            <div>
                                <h6 class="alert-heading">功能说明</h6>
                                <p class="mb-0">
                                    <strong>eClass</strong> 的作业模块专注于发布与管理。<strong>课代表、教师及管理员</strong>拥有“新建”与“编辑”权限，负责维护作业信息。所有成员均可在此<strong>查看</strong>作业详情与要求。
                                </p>
                            </div>
                        </div>
                    </div>
                `,
                'notices': `
                    <div class="card border-0 shadow-sm">
                        <div class="card-header bg-transparent border-0 pb-0">
                            <h2 class="h4 fw-bold mb-0"><i class="bi bi-megaphone me-2"></i>活动通知</h2>
                            <p class="text-muted">班级最新动态与公告</p>
                        </div>
                        <div class="card-body">
                            <p class="text-muted">通知系统开发中，敬请期待...</p>
                        </div>
                    </div>
                `,
                'archive': `
                    <div class="card border-0 shadow-sm">
                        <div class="card-header bg-transparent border-0 pb-0">
                            <h2 class="h4 fw-bold mb-0"><i class="bi bi-archive me-2"></i>班级档案</h2>
                            <p class="text-muted">班级资料、相册与历史记录</p>
                        </div>
                        <div class="card-body">
                            <p class="text-muted">班级档案功能开发中，敬请期待...</p>
                        </div>
                    </div>
                `,
                'profile': `
                    <div class="row">
                        <div class="col-lg-4">
                            <div class="card border-0 shadow-sm mb-4">
                                <div class="card-body text-center p-4">
                                    <div class="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-4 mb-3">
                                        <i class="bi bi-person-badge text-primary fs-1"></i>
                                    </div>
                                    <h4 class="mb-1"><?php echo htmlspecialchars($user['real_name']); ?></h4>
                                    <p class="text-muted mb-3">@<?php echo htmlspecialchars($user['username']); ?></p>
                                    <div class="d-flex justify-content-center flex-wrap gap-2 mb-3">
                                        <span class="badge bg-primary">学生</span>
                                        <span class="badge bg-info">课代表</span>
                                    </div>
                                    <div class="text-start">
                                        <p><i class="bi bi-envelope me-2 text-muted"></i> <?php echo htmlspecialchars($user['email'] ?? '未设置'); ?></p>
                                        <?php if ($user['student_number']): ?>
                                        <p><i class="bi bi-credit-card me-2 text-muted"></i> <?php echo htmlspecialchars($user['student_number']); ?></p>
                                        <?php endif; ?>
                                        <p><i class="bi bi-calendar3 me-2 text-muted"></i> 注册于：<?php echo date('Y年m月d日', strtotime($user['created_at'])); ?></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-8">
                            <div class="card border-0 shadow-sm">
                                <div class="card-header bg-transparent border-0">
                                    <h5 class="mb-0">账户概览</h5>
                                </div>
                                <div class="card-body">
                                    <p>个人中心功能开发中，更多设置选项即将上线...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `
            };
            
            dockItems.forEach(item => {
                item.addEventListener('click', function() {
                    const page = this.dataset.page;
                    const action = this.dataset.action;
                    
                    if (action === 'logout') {
                        if (confirm('确定要退出 eClass 吗？')) {
                            window.location.href = 'logout.php';
                        }
                        return;
                    }
                    
                    if (page) {
                        dockItems.forEach(i => i.classList.remove('active'));
                        this.classList.add('active');
                        
                        dynamicContent.innerHTML = `
                            <div class="text-center py-5 my-5">
                                <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;">
                                    <span class="visually-hidden">加载中...</span>
                                </div>
                                <p class="lead">正在加载 ${pageContents[page]?.title || '页面'}...</p>
                            </div>
                        `;
                        
                        setTimeout(() => {
                            dynamicContent.innerHTML = pageContents[page] || '<div class="alert alert-warning">页面未找到</div>';
                        }, 300);
                    }
                });
            });
            
            // 为“新建作业”按钮添加事件（示例）
            document.addEventListener('click', function(e) {
                if (e.target && e.target.id === 'btnNewAssignment') {
                    alert('新建作业功能（权限验证、表单弹窗）将在后续开发中实现。');
                }
            });
        });
    </script>
</body>
</html>