<?php
require_once 'config/database.php';

$error = '';

// 如果已登录，直接跳转到首页
if (isset($_SESSION['user_id'])) {
    header('Location: dashboard.php');
    exit();
}

// 处理登录请求
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username']);
    $password = $_POST['password'];
    
    $db = getDB();
    $stmt = $db->prepare("SELECT id, username, real_name, password_hash FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user && password_verify($password, $user['password_hash'])) {
        // 登录成功，保存用户信息到Session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['real_name'] = $user['real_name'];
        
        // 跳转到仪表板
        header('Location: dashboard.php');
        exit();
    } else {
        $error = '用户名或密码错误！';
    }
}
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>登录 - 班级管理系统</title>
    <link href="assets/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
            height: 100vh;
            display: flex;
            align-items: center;
        }
        .login-card {
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            padding: 2.5rem;
        }
        .logo {
            text-align: center;
            margin-bottom: 1.5rem;
            color: #2575fc;
            font-weight: bold;
            font-size: 1.8rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-md-5">
                <div class="login-card">
                    <div class="logo">班级管理系统</div>
                    
                    <?php if ($error): ?>
                    <div class="alert alert-danger"><?php echo $error; ?></div>
                    <?php endif; ?>
                    
                    <form method="POST">
                        <div class="mb-3">
                            <label for="username" class="form-label">用户名</label>
                            <input type="text" class="form-control" id="username" name="username" 
                                   placeholder="请输入用户名" required>
                        </div>
                        <div class="mb-3">
                            <label for="password" class="form-label">密码</label>
                            <input type="password" class="form-control" id="password" name="password" 
                                   placeholder="请输入密码" required>
                        </div>
                        <div class="d-grid">
                            <button type="submit" class="btn btn-primary btn-lg">登录系统</button>
                        </div>
                    </form>
                    
                    <div class="mt-4 text-center text-muted">
                        <small>首次使用请联系管理员获取账号</small>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>