<?php
require_once 'config/database.php';
require_once 'config/captcha.php';

$error = '';
$requires_captcha = false;
$username = '';

// 如果已登录，直接跳转到首页
if (isset($_SESSION['user_id'])) {
    header('Location: dashboard.php');
    exit();
}

// 处理登录请求
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username']);
    $password = $_POST['password'];
    $captcha = $_POST['captcha'] ?? '';
    $client_ip = getClientIP();
    $session_id = session_id();
    
    // 检查是否需要验证码
    $requires_captcha = requiresCaptcha($username, $client_ip);
    
    // 如果需要验证码，先验证验证码
    if ($requires_captcha) {
        if (empty($captcha)) {
            $error = '请输入验证码';
        } elseif (!verifyCaptcha($session_id, $captcha)) {
            $error = '验证码错误';
            // 验证码错误也算一次失败尝试
            recordFailedAttempt($username, $client_ip);
        }
    }
    
    // 如果验证码通过或不需要验证码，验证用户名密码
    if (empty($error)) {
        $db = getDB();
        $stmt = $db->prepare("SELECT id, username, real_name, password_hash FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && password_verify($password, $user['password_hash'])) {
            // 登录成功，清除失败记录
            clearFailedAttempts($username, $client_ip);
            
            // 保存用户信息到Session
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['real_name'] = $user['real_name'];
            
            // 跳转到仪表板
            header('Location: dashboard.php');
            exit();
        } else {
            // 登录失败，记录失败尝试
            recordFailedAttempt($username, $client_ip);
            
            // 重新检查是否需要验证码（可能刚刚达到3次失败）
            $requires_captcha = requiresCaptcha($username, $client_ip);
            
            if ($requires_captcha) {
                $error = '密码错误，请输入验证码继续尝试';
            } else {
                // 检查剩余尝试次数
                $db = getDB();
                $stmt = $db->prepare("
                    SELECT COUNT(*) as attempt_count 
                    FROM login_attempts 
                    WHERE username = ? 
                    AND ip_address = ?
                    AND attempt_time > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
                ");
                $stmt->execute([$username, $client_ip]);
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                
                $remaining = 3 - $result['attempt_count'];
                $error = "用户名或密码错误！剩余尝试次数：{$remaining}次";
            }
        }
    }
} else {
    // GET请求时检查是否需要显示验证码（根据当前IP和可能存在的用户名）
    if (isset($_GET['username'])) {
        $username = trim($_GET['username']);
        $client_ip = getClientIP();
        $requires_captcha = requiresCaptcha($username, $client_ip);
    }
}
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>登录 - eClass班级管理系统</title>
    <link href="assets/css/bootstrap.min.css" rel="stylesheet">
    <link href="assets/css/bootstrap-icons.css" rel="stylesheet">
    <style>
        body {
            background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
            height: 100vh;
            display: flex;
            align-items: center;
        }
        .login-card {
            background: white;
            border-radius: 20px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.25);
            padding: 2.5rem;
            position: relative;
            overflow: hidden;
        }
        .login-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 5px;
            background: linear-gradient(90deg, #6a11cb 0%, #2575fc 100%);
        }
        .logo {
            text-align: center;
            margin-bottom: 2rem;
            color: #2575fc;
            font-weight: bold;
            font-size: 2rem;
        }
        .logo i {
            font-size: 2.5rem;
            margin-right: 0.5rem;
        }
        .captcha-container {
            position: relative;
        }
        .captcha-image {
            cursor: pointer;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8f9fa;
        }
        .captcha-image img {
            max-height: 100%;
            max-width: 100%;
        }
        .captcha-refresh {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #6c757d;
            cursor: pointer;
        }
        .captcha-refresh:hover {
            color: #2575fc;
        }
        .alert {
            border-radius: 10px;
            border: none;
        }
        .form-control:focus {
            border-color: #2575fc;
            box-shadow: 0 0 0 0.25rem rgba(37, 117, 252, 0.25);
        }
        .btn-primary {
            background: linear-gradient(135deg, #2575fc 0%, #6a11cb 100%);
            border: none;
            padding: 0.75rem;
            font-weight: 500;
        }
        .btn-primary:hover {
            opacity: 0.9;
        }
        .login-footer {
            text-align: center;
            margin-top: 1.5rem;
            color: #6c757d;
            font-size: 0.875rem;
        }
        .security-info {
            font-size: 0.75rem;
            color: #6c757d;
            margin-top: 0.5rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-md-5">
                <div class="login-card">
                    <div class="logo">
                        <i class="bi bi-mortarboard-fill"></i>
                        eClass
                    </div>
                    
                    <?php if ($error): ?>
                    <div class="alert alert-danger alert-dismissible fade show" role="alert">
                        <i class="bi bi-exclamation-triangle-fill me-2"></i>
                        <?php echo $error; ?>
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                    <?php endif; ?>
                    
                    <form method="POST" id="loginForm">
                        <div class="mb-3">
                            <label for="username" class="form-label">用户名</label>
                            <div class="input-group">
                                <span class="input-group-text">
                                    <i class="bi bi-person"></i>
                                </span>
                                <input type="text" class="form-control" id="username" name="username" 
                                       placeholder="请输入用户名" value="<?php echo htmlspecialchars($username); ?>" 
                                       required autocomplete="username">
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label for="password" class="form-label">密码</label>
                            <div class="input-group">
                                <span class="input-group-text">
                                    <i class="bi bi-lock"></i>
                                </span>
                                <input type="password" class="form-control" id="password" name="password" 
                                       placeholder="请输入密码" required autocomplete="current-password">
                                <button class="btn btn-outline-secondary" type="button" id="togglePassword">
                                    <i class="bi bi-eye"></i>
                                </button>
                            </div>
                        </div>
                        
                        <!-- 验证码区域 -->
                        <?php if ($requires_captcha): ?>
                        <div class="mb-3 captcha-area" id="captchaArea">
                            <label for="captcha" class="form-label">验证码</label>
                            <div class="row g-2">
                                <div class="col-8">
                                    <div class="input-group">
                                        <span class="input-group-text">
                                            <i class="bi bi-shield-check"></i>
                                        </span>
                                        <input type="text" class="form-control" id="captcha" name="captcha" 
                                               placeholder="请输入验证码" maxlength="4" autocomplete="off">
                                    </div>
                                </div>
                                <div class="col-4">
                                    <div class="captcha-image" id="captchaImageContainer">
                                        <img src="captcha.php?session_id=<?php echo session_id(); ?>&t=<?php echo time(); ?>" 
                                             alt="验证码" id="captchaImage" class="rounded">
                                    </div>
                                </div>
                            </div>
                            <div class="security-info">
                                <i class="bi bi-info-circle me-1"></i>连续3次密码错误后需要验证码
                            </div>
                        </div>
                        <?php endif; ?>
                        
                        <div class="d-grid mb-3">
                            <button type="submit" class="btn btn-primary btn-lg" id="loginBtn">
                                <i class="bi bi-box-arrow-in-right me-2"></i>登录系统
                            </button>
                        </div>
                        
                        <div class="text-center mb-3">
                            <a href="javascript:void(0);" onclick="showSecurityInfo()" class="text-decoration-none small">
                                <i class="bi bi-shield-check me-1"></i>账户安全提示
                            </a>
                        </div>
                    </form>
                    
                    <div class="login-footer">
                        <small>首次使用请联系管理员获取账号</small>
                        <div class="mt-2">
                            <small class="text-muted">© 2024 eClass班级管理系统</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 安全提示模态框 -->
    <div class="modal fade" id="securityModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title">
                        <i class="bi bi-shield-check me-2"></i>账户安全提示
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-info">
                        <h6><i class="bi bi-info-circle me-2"></i>登录安全保护机制：</h6>
                        <ul class="mb-0">
                            <li>连续3次密码错误后，需要输入验证码才能继续尝试</li>
                            <li>验证码有效期为5分钟</li>
                            <li>登录成功后，失败记录将被清除</li>
                            <li>请勿在公共计算机上保存登录信息</li>
                            <li>建议定期修改密码以保证账户安全</li>
                        </ul>
                    </div>
                    <div class="alert alert-warning">
                        <h6><i class="bi bi-exclamation-triangle me-2"></i>如果忘记密码：</h6>
                        <p class="mb-0">请联系班级管理员或系统管理员重置密码。</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Bootstrap JavaScript -->
    <script src="assets/js/bootstrap.bundle.min.js"></script>
    
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // 密码显示/隐藏切换
            const togglePasswordBtn = document.getElementById('togglePassword');
            const passwordInput = document.getElementById('password');
            
            if (togglePasswordBtn && passwordInput) {
                togglePasswordBtn.addEventListener('click', function() {
                    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                    passwordInput.setAttribute('type', type);
                    
                    const icon = this.querySelector('i');
                    icon.className = type === 'password' ? 'bi bi-eye' : 'bi bi-eye-slash';
                });
            }
            
            // 验证码刷新
            const captchaImageContainer = document.getElementById('captchaImageContainer');
            const captchaImage = document.getElementById('captchaImage');
            
            if (captchaImageContainer && captchaImage) {
                captchaImageContainer.addEventListener('click', function() {
                    refreshCaptcha();
                });
                
                // 初始加载验证码
                refreshCaptcha();
            }
            
            // 表单提交前验证
            const loginForm = document.getElementById('loginForm');
            const loginBtn = document.getElementById('loginBtn');
            
            if (loginForm) {
                loginForm.addEventListener('submit', function(e) {
                    if (loginBtn) {
                        loginBtn.disabled = true;
                        loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>登录中...';
                    }
                });
            }
        });
        
        // 刷新验证码
        function refreshCaptcha() {
            const captchaImage = document.getElementById('captchaImage');
            if (captchaImage) {
                const timestamp = new Date().getTime();
                captchaImage.src = 'captcha.php?session_id=' + getSessionId() + '&t=' + timestamp;
            }
        }
        
        // 获取会话ID
        function getSessionId() {
            return '<?php echo session_id(); ?>';
        }
        
        // 显示安全提示
        function showSecurityInfo() {
            const modal = new bootstrap.Modal(document.getElementById('securityModal'));
            modal.show();
        }
        
        // 自动检查是否需要验证码
        function checkCaptchaRequirement() {
            const username = document.getElementById('username').value;
            if (!username) return;
            
            fetch('check_captcha.php?username=' + encodeURIComponent(username))
                .then(response => response.json())
                .then(data => {
                    if (data.requires_captcha && !document.getElementById('captchaArea')) {
                        // 动态添加验证码区域
                        addCaptchaField();
                    }
                });
        }
        
        // 用户名输入框失去焦点时检查
        document.getElementById('username')?.addEventListener('blur', checkCaptchaRequirement);
    </script>
</body>
</html>