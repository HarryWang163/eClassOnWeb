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
    <!-- 本地资源引用 -->
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
        
        /* ==================== 渐入动画 ==================== */
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes fadeInRight {
            from {
                opacity: 0;
                transform: translateX(30px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .animate-fade-in-up {
            animation: fadeInUp 0.8s ease-out forwards;
            opacity: 0;
        }
        
        .animate-fade-in-right {
            animation: fadeInRight 0.8s ease-out forwards;
            opacity: 0;
        }
        
        .animate-fade-in {
            animation: fadeIn 0.8s ease-out forwards;
            opacity: 0;
        }
        
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .delay-4 { animation-delay: 0.4s; }
        .delay-5 { animation-delay: 0.5s; }
        .delay-6 { animation-delay: 0.6s; }
        
        /* ==================== 顶部欢迎栏 ==================== */
        .welcome-card {
            background: linear-gradient(135deg, #ffffff 0%, #fdfdfd 100%);
            border-radius: 24px;
            box-shadow: 0 12px 48px rgba(0, 0, 0, 0.06);
            padding: 2.5rem;
            border: 1px solid rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(10px);
            margin-bottom: 2.5rem;
            opacity: 0; /* 初始透明，由动画控制显示 */
        }
        
        /* ==================== 右侧统计面板 ==================== */
        .stats-panel {
            background: rgba(255, 255, 255, 0.7);
            border-radius: 18px;
            padding: 1.5rem;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
            height: 100%;
        }
        
        .stat-card {
            padding: 1.25rem;
            border-radius: 14px;
            margin-bottom: 1rem;
            transition: all 0.3s ease;
            background: white;
            border: 1px solid rgba(0, 0, 0, 0.05);
            position: relative;
            overflow: hidden;
        }
        
        .stat-card:last-child {
            margin-bottom: 0;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
            border-color: rgba(0, 0, 0, 0.1);
        }
        
        .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            border-radius: 4px 0 0 4px;
        }
        
        .stat-card-primary::before { background-color: var(--primary-color); }
        .stat-card-success::before { background-color: #20c997; }
        .stat-card-info::before { background-color: #17a2b8; }
        
        .stat-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .stat-numbers {
            text-align: left;
        }
        
        .stat-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
        }
        
        .stat-card-primary .stat-icon {
            background-color: rgba(74, 107, 255, 0.1);
            color: var(--primary-color);
        }
        
        .stat-card-success .stat-icon {
            background-color: rgba(32, 201, 151, 0.1);
            color: #20c997;
        }
        
        .stat-card-info .stat-icon {
            background-color: rgba(23, 162, 184, 0.1);
            color: #17a2b8;
        }
        
        .stat-number {
            font-size: 2rem;
            font-weight: 700;
            line-height: 1;
            margin-bottom: 0.25rem;
        }
        
        .stat-label {
            font-size: 0.875rem;
            color: #6c757d;
            font-weight: 500;
        }
        
        /* ==================== 徽章样式 ==================== */
        .badge-pill {
            border-radius: 20px;
            padding: 0.35em 0.9em;
            font-weight: 500;
        }
        
        /* ==================== 自定义颜色定义 ==================== */
        /* 棕色 - 地理 */
        .bg-brown { background-color: #8B4513 !important; }
        .text-brown { color: #8B4513 !important; }
        .border-brown { border-color: #8B4513 !important; }
        
        /* 粉色 - 英语 */
        .bg-pink { background-color: #e83e8c !important; }
        .text-pink { color: #e83e8c !important; }
        .border-pink { border-color: #e83e8c !important; }
        
        /* 橙色 - 数学 */
        .bg-orange { background-color: #fd7e14 !important; }
        .text-orange { color: #fd7e14 !important; }
        .border-orange { border-color: #fd7e14 !important; }
        
        /* 砖色 - 历史 */
        .bg-brick { background-color: #B22222 !important; }
        .text-brick { color: #B22222 !important; }
        .border-brick { border-color: #B22222 !important; }
        
        /* ==================== 自定义颜色卡片增强样式 ==================== */
        /* 地理卡片 - 棕色 */
        .subject-card.border-brown .card-header.bg-brown.bg-opacity-10 {
            background-color: rgba(139, 69, 19, 0.1) !important;
            border-color: rgba(139, 69, 19, 0.25) !important;
        }
        .subject-card.border-brown .subject-icon.bg-brown {
            background-color: rgb(139, 69, 19) !important;
        }
        .subject-card.border-brown .badge.bg-brown {
            background-color: rgb(139, 69, 19) !important;
        }
        
        /* 英语卡片 - 粉色 */
        .subject-card.border-pink .card-header.bg-pink.bg-opacity-10 {
            background-color: rgba(232, 62, 140, 0.1) !important;
            border-color: rgba(232, 62, 140, 0.25) !important;
        }
        .subject-card.border-pink .subject-icon.bg-pink {
            background-color: rgb(232, 62, 140) !important;
        }
        .subject-card.border-pink .badge.bg-pink {
            background-color: rgb(232, 62, 140) !important;
        }
        
        /* 数学卡片 - 橙色 */
        .subject-card.border-orange .card-header.bg-orange.bg-opacity-10 {
            background-color: rgba(253, 126, 20, 0.1) !important;
            border-color: rgba(253, 126, 20, 0.25) !important;
        }
        .subject-card.border-orange .subject-icon.bg-orange {
            background-color: rgb(253, 126, 20) !important;
        }
        .subject-card.border-orange .badge.bg-orange {
            background-color: rgb(253, 126, 20) !important;
        }
        
        /* 历史卡片 - 砖色 */
        .subject-card.border-brick .card-header.bg-brick.bg-opacity-10 {
            background-color: rgba(178, 34, 34, 0.1) !important;
            border-color: rgba(178, 34, 34, 0.25) !important;
        }
        .subject-card.border-brick .subject-icon.bg-brick {
            background-color: rgb(178, 34, 34) !important;
        }
        .subject-card.border-brick .badge.bg-brick {
            background-color: rgb(178, 34, 34) !important;
        }
        
        /* ==================== 响应式调整 ==================== */
        @media (max-width: 992px) {
            .welcome-card {
                padding: 2rem;
            }
            
            .stats-panel {
                padding: 1.25rem;
            }
            
            .stat-card {
                padding: 1rem;
            }
            
            .stat-number {
                font-size: 1.75rem;
            }
        }
        
        @media (max-width: 768px) {
            .content-area {
                margin-left: 0;
                padding: 1.5rem;
                padding-bottom: 100px;
            }
            
            .welcome-card {
                padding: 1.75rem;
            }
            
            .stats-panel {
                margin-top: 1.5rem;
            }
            
            .stat-number {
                font-size: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <!-- macOS风格Dock导航栏 -->
    <div class="mac-dock animate-fade-in-right" id="dock">
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
            <div id="dynamicContent" class="animate-fade-in">
                <!-- 仪表板页面（初始加载） -->
                <div class="welcome-card animate-fade-in-up">
                    <div class="row align-items-center">
                        <!-- 左侧欢迎信息 -->
                        <div class="col-lg-8">
                            <div class="welcome-content">
                                <h1 class="display-6 fw-bold mb-3 animate-fade-in-up delay-1">
                                    <i class="bi bi-sunrise me-2"></i><?php echo $greeting; ?>，
                                    <span class="text-primary">@<?php echo htmlspecialchars($user['username']); ?></span>！
                                </h1>
                                <p class="lead text-muted mb-4 animate-fade-in-up delay-2">
                                    欢迎使用 eClass 班级协作平台，高效管理班级作业与活动。
                                </p>
                                <div class="d-flex flex-wrap gap-2 animate-fade-in-up delay-3">
                                    <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-3 py-2">
                                        <i class="bi bi-journal-check me-1"></i>作业管理
                                    </span>
                                    <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2">
                                        <i class="bi bi-megaphone me-1"></i>通知发布
                                    </span>
                                    <span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 px-3 py-2">
                                        <i class="bi bi-archive me-1"></i>班级档案
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 右侧统计面板 -->
                        <div class="col-lg-4 animate-fade-in-right delay-2">
                            <div class="stats-panel">
                                <!-- 进行中的学科 -->
                                <div class="stat-card stat-card-primary animate-fade-in-up delay-3">
                                    <div class="stat-content">
                                        <div class="stat-numbers">
                                            <div class="stat-number">9</div>
                                            <div class="stat-label">进行中的学科</div>
                                        </div>
                                        <div class="stat-icon">
                                            <i class="bi bi-journal-text"></i>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- 近期活动 -->
                                <div class="stat-card stat-card-success animate-fade-in-up delay-4">
                                    <div class="stat-content">
                                        <div class="stat-numbers">
                                            <div class="stat-number">3</div>
                                            <div class="stat-label">近期活动</div>
                                        </div>
                                        <div class="stat-icon">
                                            <i class="bi bi-calendar-event"></i>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- 未读消息 -->
                                <div class="stat-card stat-card-info animate-fade-in-up delay-5">
                                    <div class="stat-content">
                                        <div class="stat-numbers">
                                            <div class="stat-number">12</div>
                                            <div class="stat-label">未读消息</div>
                                        </div>
                                        <div class="stat-icon">
                                            <i class="bi bi-chat-left-text"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 移动端底部导航 -->
    <div class="mobile-dock d-lg-none animate-fade-in-up delay-6">
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
            
            // 为所有动态加载的内容添加动画类
            function addAnimationClasses(element) {
                const elementsToAnimate = element.querySelectorAll('.card, .btn, .table, .alert, h1, h2, h3, h4, h5, h6, p, .badge');
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
            
            // 初始页面添加动画
            addAnimationClasses(dynamicContent);
            
            // 页面内容定义
            const pageContents = {
                'dashboard': `
                    <div class="welcome-card animate-fade-in-up">
                        <div class="row align-items-center">
                            <div class="col-lg-8">
                                <div class="welcome-content">
                                    <h1 class="display-6 fw-bold mb-3 animate-fade-in-up delay-1">
                                        <i class="bi bi-sunrise me-2"></i><?php echo $greeting; ?>，
                                        <span class="text-primary">@<?php echo htmlspecialchars($user['username']); ?></span>！
                                    </h1>
                                    <p class="lead text-muted mb-4 animate-fade-in-up delay-2">
                                        欢迎使用 eClass 班级协作平台，高效管理班级作业与活动。
                                    </p>
                                    <div class="d-flex flex-wrap gap-2 animate-fade-in-up delay-3">
                                        <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-3 py-2">
                                            <i class="bi bi-journal-check me-1"></i>作业管理
                                        </span>
                                        <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2">
                                            <i class="bi bi-megaphone me-1"></i>通知发布
                                        </span>
                                        <span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 px-3 py-2">
                                            <i class="bi bi-archive me-1"></i>班级档案
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-lg-4 animate-fade-in-right delay-2">
                                <div class="stats-panel">
                                    <div class="stat-card stat-card-primary animate-fade-in-up delay-3">
                                        <div class="stat-content">
                                            <div class="stat-numbers">
                                                <div class="stat-number">9</div>
                                                <div class="stat-label">进行中的学科</div>
                                            </div>
                                            <div class="stat-icon">
                                                <i class="bi bi-journal-text"></i>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="stat-card stat-card-success animate-fade-in-up delay-4">
                                        <div class="stat-content">
                                            <div class="stat-numbers">
                                                <div class="stat-number">3</div>
                                                <div class="stat-label">近期活动</div>
                                            </div>
                                            <div class="stat-icon">
                                                <i class="bi bi-calendar-event"></i>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="stat-card stat-card-info animate-fade-in-up delay-5">
                                        <div class="stat-content">
                                            <div class="stat-numbers">
                                                <div class="stat-number">12</div>
                                                <div class="stat-label">未读消息</div>
                                            </div>
                                            <div class="stat-icon">
                                                <i class="bi bi-chat-left-text"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `,
                'assignments': `
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h2 class="h4 fw-bold mb-0 animate-fade-in-up"><i class="bi bi-journal-bookmark-fill me-2"></i>作业中心</h2>
                            <p class="text-muted mb-0 animate-fade-in-up delay-1">按学科分类查看作业，共 <span class="text-primary fw-bold">9</span> 个学科</p>
                        </div>
                        <div class="animate-fade-in-up delay-2">
                            <button class="btn btn-sm btn-outline-secondary me-2">
                                <i class="bi bi-filter"></i> 筛选
                            </button>
                            <button class="btn btn-sm btn-primary" id="btnNewAssignment">
                                <i class="bi bi-plus-circle me-1"></i>新建作业
                            </button>
                        </div>
                    </div>

                    <div class="row g-4" id="subjectCardsContainer">
                        <!-- 语文卡片 -->
                        <div class="col-xl-6 col-lg-12 animate-fade-in-up delay-3">
                            <div class="card subject-card border-primary border-opacity-25 h-100">
                                <div class="card-header bg-primary bg-opacity-10 border-primary border-opacity-25 d-flex justify-content-between align-items-center">
                                    <div class="d-flex align-items-center">
                                        <div class="subject-icon bg-primary text-white rounded-circle p-2 me-3">
                                            <i class="bi bi-book-fill"></i>
                                        </div>
                                        <div>
                                            <h5 class="fw-bold mb-0">语文</h5>
                                            <small class="text-muted">3项作业</small>
                                        </div>
                                    </div>
                                    <span class="badge bg-primary">进行中</span>
                                </div>
                                <div class="card-body">
                                    <div class="assignment-content">
                                        <ol class="mb-0">
                                            <li class="mb-2">复习《过秦论》下周课前默写。</li>
                                            <li class="mb-2">《始皇本纪3》1张</li>
                                            <li class="mb-2">《大卫科波菲尔》思考题：
                                                <div class="ms-3 mt-1">
                                                    <p class="mb-1">（1）请阅读第一段分析第一人称叙述下"我"的角色内涵。</p>
                                                    <p class="mb-1">（2）米考伯和米考伯太太分别是怎样的?</p>
                                                    <p class="mb-1">（3）大卫与他们生活在一起为何没有更加屈辱，反而患难与共？</p>
                                                    <p class="mb-1">（4）狄更斯写作的目的是什么？</p>
                                                    <p class="mb-1">（5）学习提示中提到"小说展现19世纪英国社会风貌"你从文章中独到什么样的社会？</p>
                                                    <small class="text-muted">（以上问题请用铅笔逐一批注在课本上）</small>
                                                </div>
                                            </li>
                                        </ol>
                                    </div>
                                </div>
                                <div class="card-footer bg-transparent border-top-0 pt-0">
                                    <small class="text-muted"><i class="bi bi-clock me-1"></i>下次语文课：周二上午</small>
                                </div>
                            </div>
                        </div>

                        <!-- 英语卡片 -->
                        <div class="col-xl-6 col-lg-12 animate-fade-in-up delay-4">
                            <div class="card subject-card border-pink border-opacity-25 h-100">
                                <div class="card-header bg-pink bg-opacity-10 border-pink border-opacity-25 d-flex justify-content-between align-items-center">
                                    <div class="d-flex align-items-center">
                                        <div class="subject-icon bg-pink text-white rounded-circle p-2 me-3">
                                            <i class="bi bi-translate"></i>
                                        </div>
                                        <div>
                                            <h5 class="fw-bold mb-0">英语</h5>
                                            <small class="text-muted">3项作业</small>
                                        </div>
                                    </div>
                                    <span class="badge bg-pink">今日截止</span>
                                </div>
                                <div class="card-body">
                                    <div class="assignment-content">
                                        <ol class="mb-0">
                                            <li class="mb-2">有效两套1/5 晚7前智学网提交</li>
                                            <li class="mb-2">报纸和纠错常规</li>
                                            <li class="mb-2">整理有效和周二卷词组笔记本上</li>
                                        </ol>
                                    </div>
                                </div>
                                <div class="card-footer bg-transparent border-top-0 pt-0">
                                    <small class="text-muted"><i class="bi bi-alarm me-1"></i>智学网提交：今日19:00前</small>
                                </div>
                            </div>
                        </div>

                        <!-- 数学卡片 -->
                        <div class="col-xl-4 col-md-6 animate-fade-in-up delay-5">
                            <div class="card subject-card border-orange border-opacity-25 h-100">
                                <div class="card-header bg-orange bg-opacity-10 border-orange border-opacity-25 d-flex justify-content-between align-items-center">
                                    <div class="d-flex align-items-center">
                                        <div class="subject-icon bg-orange text-white rounded-circle p-2 me-3">
                                            <i class="bi bi-calculator-fill"></i>
                                        </div>
                                        <div>
                                            <h5 class="fw-bold mb-0">数学</h5>
                                            <small class="text-muted">2项作业</small>
                                        </div>
                                    </div>
                                    <span class="badge bg-orange">待完成</span>
                                </div>
                                <div class="card-body">
                                    <div class="assignment-content">
                                        <ol class="mb-0">
                                            <li class="mb-2">有效作业</li>
                                            <li class="mb-2">两张复习卷子</li>
                                        </ol>
                                    </div>
                                </div>
                                <div class="card-footer bg-transparent border-top-0 pt-0">
                                    <small class="text-muted"><i class="bi bi-calendar3 me-1"></i>复习重点：函数与几何</small>
                                </div>
                            </div>
                        </div>

                        <!-- 物理卡片 -->
                        <div class="col-xl-4 col-md-6 animate-fade-in-up delay-3">
                            <div class="card subject-card border-info border-opacity-25 h-100">
                                <div class="card-header bg-info bg-opacity-10 border-info border-opacity-25 d-flex justify-content-between align-items-center">
                                    <div class="d-flex align-items-center">
                                        <div class="subject-icon bg-info text-white rounded-circle p-2 me-3">
                                            <i class="bi bi-lightning-charge-fill"></i>
                                        </div>
                                        <div>
                                            <h5 class="fw-bold mb-0">物理</h5>
                                            <small class="text-muted">3项作业</small>
                                        </div>
                                    </div>
                                    <span class="badge bg-info">进行中</span>
                                </div>
                                <div class="card-body">
                                    <div class="assignment-content">
                                        <ol class="mb-0">
                                            <li class="mb-2">波那张卷子全部做完除最后三道</li>
                                            <li class="mb-2">情景题最后一面</li>
                                            <li class="mb-2">元旦练习卷</li>
                                        </ol>
                                    </div>
                                </div>
                                <div class="card-footer bg-transparent border-top-0 pt-0">
                                    <small class="text-muted"><i class="bi bi-info-circle me-1"></i>最后三道题选做</small>
                                </div>
                            </div>
                        </div>

                        <!-- 化学卡片 -->
                        <div class="col-xl-4 col-md-6 animate-fade-in-up delay-4">
                            <div class="card subject-card border-warning border-opacity-25 h-100">
                                <div class="card-header bg-warning bg-opacity-10 border-warning border-opacity-25 d-flex justify-content-between align-items-center">
                                    <div class="d-flex align-items-center">
                                        <div class="subject-icon bg-warning text-white rounded-circle p-2 me-3">
                                            <i class="bi bi-flask"></i>
                                        </div>
                                        <div>
                                            <h5 class="fw-bold mb-0">化学</h5>
                                            <small class="text-muted">2项作业</small>
                                        </div>
                                    </div>
                                    <span class="badge bg-warning">常规</span>
                                </div>
                                <div class="card-body">
                                    <div class="assignment-content">
                                        <ol class="mb-0">
                                            <li class="mb-2">一张卷子</li>
                                            <li class="mb-2">复习</li>
                                        </ol>
                                    </div>
                                </div>
                                <div class="card-footer bg-transparent border-top-0 pt-0">
                                    <small class="text-muted"><i class="bi bi-journal-check me-1"></i>复习有机化学部分</small>
                                </div>
                            </div>
                        </div>

                        <!-- 地理卡片 -->
                        <div class="col-xl-4 col-md-6 animate-fade-in-up delay-5">
                            <div class="card subject-card border-brown border-opacity-25 h-100">
                                <div class="card-header bg-brown bg-opacity-10 border-brown border-opacity-25 d-flex justify-content-between align-items-center">
                                    <div class="d-flex align-items-center">
                                        <div class="subject-icon bg-brown text-white rounded-circle p-2 me-3">
                                            <i class="bi bi-geo-alt-fill"></i>
                                        </div>
                                        <div>
                                            <h5 class="fw-bold mb-0">地理</h5>
                                            <small class="text-muted">5项作业</small>
                                        </div>
                                    </div>
                                    <span class="badge bg-brown">较多</span>
                                </div>
                                <div class="card-body">
                                    <div class="assignment-content">
                                        <ol class="mb-0">
                                            <li class="mb-2">两张试卷</li>
                                            <li class="mb-2">默写卷 答案见钉钉</li>
                                            <li class="mb-2">元旦回来的周四练习课默写</li>
                                            <li class="mb-2">必修一主题六练习册第三、五大题不做</li>
                                            <li class="mb-2">自学主题六 ppt会发</li>
                                        </ol>
                                    </div>
                                </div>
                                <div class="card-footer bg-transparent border-top-0 pt-0">
                                    <small class="text-muted"><i class="bi bi-pin-angle me-1"></i>答案见钉钉群</small>
                                </div>
                            </div>
                        </div>

                        <!-- 生物卡片 -->
                        <div class="col-xl-4 col-md-6 animate-fade-in-up delay-3">
                            <div class="card subject-card border-success border-opacity-25 h-100">
                                <div class="card-header bg-success bg-opacity-10 border-success border-opacity-25 d-flex justify-content-between align-items-center">
                                    <div class="d-flex align-items-center">
                                        <div class="subject-icon bg-success text-white rounded-circle p-2 me-3">
                                            <i class="bi bi-flower1"></i>
                                        </div>
                                        <div>
                                            <h5 class="fw-bold mb-0">生物</h5>
                                            <small class="text-muted">2项作业</small>
                                        </div>
                                    </div>
                                    <span class="badge bg-success">假期后</span>
                                </div>
                                <div class="card-body">
                                    <div class="assignment-content">
                                        <ol class="mb-0">
                                            <li class="mb-2">两张卷子（元旦上来交）</li>
                                            <li class="mb-2">观看作业讲解的录课（在某个神秘的地方，或许不是classin，而是钉钉）</li>
                                        </ol>
                                    </div>
                                </div>
                                <div class="card-footer bg-transparent border-top-0 pt-0">
                                    <small class="text-muted"><i class="bi bi-camera-video me-1"></i>录课平台：钉钉</small>
                                </div>
                            </div>
                        </div>

                        <!-- 政治B卡片 -->
                        <div class="col-xl-4 col-md-6 animate-fade-in-up delay-4">
                            <div class="card subject-card border-danger border-opacity-25 h-100">
                                <div class="card-header bg-danger bg-opacity-10 border-danger border-opacity-25 d-flex justify-content-between align-items-center">
                                    <div class="d-flex align-items-center">
                                        <div class="subject-icon bg-danger text-white rounded-circle p-2 me-3">
                                            <i class="bi bi-building"></i>
                                        </div>
                                        <div>
                                            <h5 class="fw-bold mb-0">政治B</h5>
                                            <small class="text-muted">2项作业</small>
                                        </div>
                                    </div>
                                    <span class="badge bg-danger">轻松</span>
                                </div>
                                <div class="card-body">
                                    <div class="assignment-content">
                                        <ol class="mb-0">
                                            <li class="mb-2">必修四练习册阶段练习三填选 16 18 21</li>
                                            <li class="mb-2">没有卷子</li>
                                        </ol>
                                    </div>
                                </div>
                                <div class="card-footer bg-transparent border-top-0 pt-0">
                                    <small class="text-muted"><i class="bi bi-check2-square me-1"></i>仅选择题</small>
                                </div>
                            </div>
                        </div>

                        <!-- 历史卡片 -->
                        <div class="col-xl-4 col-md-6 animate-fade-in-up delay-5">
                            <div class="card subject-card border-brick border-opacity-25 h-100">
                                <div class="card-header bg-brick bg-opacity-10 border-brick border-opacity-25 d-flex justify-content-between align-items-center">
                                    <div class="d-flex align-items-center">
                                        <div class="subject-icon bg-brick text-white rounded-circle p-2 me-3">
                                            <i class="bi bi-hourglass-top"></i>
                                        </div>
                                        <div>
                                            <h5 class="fw-bold mb-0">历史</h5>
                                            <small class="text-muted">1项作业</small>
                                        </div>
                                    </div>
                                    <span class="badge bg-brick">常规</span>
                                </div>
                                <div class="card-body">
                                    <div class="assignment-content">
                                        <ol class="mb-0">
                                            <li class="mb-2">一张卷子</li>
                                        </ol>
                                    </div>
                                </div>
                                <div class="card-footer bg-transparent border-top-0 pt-0">
                                    <small class="text-muted"><i class="bi bi-file-text me-1"></i>近代史部分</small>
                                </div>
                            </div>
                        </div>
                    </div>
                `,
                'notices': `
                    <div class="card border-0 shadow-sm animate-fade-in-up">
                        <div class="card-header bg-transparent border-0 pb-0">
                            <h2 class="h4 fw-bold mb-0 animate-fade-in-up"><i class="bi bi-megaphone me-2"></i>活动通知</h2>
                            <p class="text-muted animate-fade-in-up delay-1">班级最新动态与公告</p>
                        </div>
                        <div class="card-body">
                            <p class="text-muted animate-fade-in-up delay-2">通知系统开发中，敬请期待...</p>
                        </div>
                    </div>
                `,
                'archive': `
                    <div class="card border-0 shadow-sm animate-fade-in-up">
                        <div class="card-header bg-transparent border-0 pb-0">
                            <h2 class="h4 fw-bold mb-0 animate-fade-in-up"><i class="bi bi-archive me-2"></i>班级档案</h2>
                            <p class="text-muted animate-fade-in-up delay-1">班级资料、相册与历史记录</p>
                        </div>
                        <div class="card-body">
                            <p class="text-muted animate-fade-in-up delay-2">班级档案功能开发中，敬请期待...</p>
                        </div>
                    </div>
                `,
                'profile': `
                    <div class="row">
                        <div class="col-lg-4 animate-fade-in-up">
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
                        <div class="col-lg-8 animate-fade-in-up delay-2">
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
                            <div class="text-center py-5 my-5 animate-fade-in">
                                <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;">
                                    <span class="visually-hidden">加载中...</span>
                                </div>
                                <p class="lead">正在加载页面...</p>
                            </div>
                        `;
                        
                        setTimeout(() => {
                            dynamicContent.innerHTML = pageContents[page] || '<div class="alert alert-warning">页面未找到</div>';
                            // 为新加载的内容添加动画
                            setTimeout(() => addAnimationClasses(dynamicContent), 50);
                        }, 300);
                    }
                });
            });
            
            // 为"新建作业"按钮添加事件
            document.addEventListener('click', function(e) {
                if (e.target && e.target.id === 'btnNewAssignment') {
                    alert('新建作业功能（权限验证、表单弹窗）将在后续开发中实现。');
                }
            });
        });
    </script>
</body>
</html>