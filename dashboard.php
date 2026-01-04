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

// 获取用户的标签信息
$stmt_tags = $db->prepare("
    SELECT 
        t.id,
        t.tag_name,
        t.color,
        t.description,
        tt.type_name,
        tt.sort_order
    FROM user_tags ut
    JOIN tags t ON ut.tag_id = t.id
    JOIN tag_types tt ON t.tag_type_id = tt.id
    WHERE ut.user_id = ?
    ORDER BY tt.sort_order, t.tag_name
");
$stmt_tags->execute([$user_id]);
$user_tags = $stmt_tags->fetchAll(PDO::FETCH_ASSOC);

// 按标签类型分组
$grouped_tags = [];
foreach ($user_tags as $tag) {
    $type_name = $tag['type_name'];
    if (!isset($grouped_tags[$type_name])) {
        $grouped_tags[$type_name] = [];
    }
    $grouped_tags[$type_name][] = $tag;
}

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
    
    <!-- CSS 文件 -->
    <link href="assets/css/bootstrap.min.css" rel="stylesheet">
    <link href="assets/css/bootstrap-icons.css" rel="stylesheet">
    <link href="assets/css/dock.css" rel="stylesheet">
    <link href="assets/css/dashboard.css" rel="stylesheet">
    <!-- 在 dashboard.php 的 head 部分添加 -->
<script>
    // 确保在页面加载前定义全局变量
    window.userData = {
        user: <?php echo json_encode($user); ?>,
        user_tags: <?php echo json_encode($user_tags); ?>,
        grouped_tags: <?php echo json_encode($grouped_tags); ?>,
        greeting: '<?php echo $greeting; ?>'
    };
    
    // 设置基础路径
    window.BASE_PATH = '<?php echo dirname($_SERVER['SCRIPT_NAME']); ?>';
</script>

<!-- 确保正确加载JS文件 -->
<script src="assets/js/dashboard.js"></script>
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
                <!-- 初始加载仪表板内容 -->
                <div class="text-center py-5 my-5 animate-fade-in">
                    <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;">
                        <span class="visually-hidden">加载中...</span>
                    </div>
                    <p class="lead">正在加载系统...</p>
                </div>
            </div>
        </div>
    </div>

    <!-- 移动端底部导航 -->
    <div class="mobile-dock d-lg-none animate-fade-in-up delay-6">
        <div class="mobile-dock-container">
            <div class="mobile-dock-item active" data-action="mobile-nav">
                <i class="bi bi-house-door"></i>
                <small>首页</small>
            </div>
            <div class="mobile-dock-item" data-action="mobile-nav">
                <i class="bi bi-journal-text"></i>
                <small>作业</small>
            </div>
            <div class="mobile-dock-item" data-action="mobile-nav">
                <i class="bi bi-megaphone"></i>
                <small>通知</small>
            </div>
            <div class="mobile-dock-item" data-action="mobile-nav">
                <i class="bi bi-person"></i>
                <small>我的</small>
            </div>
        </div>
    </div>

    <!-- 引入修改密码模态框 -->
    <div id="passwordModalContainer" style="z-index: 1051;"></div>

    <!-- 作业详情模态框 -->
    <div class="modal fade show" id="assignmentDetailModal" style="z-index: 1051;">

    </div>

    <!-- JavaScript 文件 -->
    <script src="assets/js/bootstrap.bundle.min.js"></script>
    
    <!-- 传递PHP数据到JavaScript -->
    <script>
        // 全局数据对象
        window.userData = {
            user: <?php echo json_encode($user); ?>,
            user_tags: <?php echo json_encode($user_tags); ?>,
            grouped_tags: <?php echo json_encode($grouped_tags); ?>,
            greeting: '<?php echo $greeting; ?>'
        };
    </script>
    
    <script src="assets/js/dashboard.js"></script>
</body>
</html>