<?php
require_once 'config/database.php';

// 检查是否已登录
if (!isset($_SESSION['user_id'])) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => '未登录']);
    exit();
}

// 只接受 POST 请求
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => '非法请求']);
    exit();
}

// 获取输入数据
$old_password = $_POST['old_password'] ?? '';
$new_password = $_POST['new_password'] ?? '';
$confirm_password = $_POST['confirm_password'] ?? '';

// 验证输入
if (empty($old_password) || empty($new_password) || empty($confirm_password)) {
    echo json_encode(['success' => false, 'message' => '所有字段都必须填写']);
    exit();
}

if ($new_password !== $confirm_password) {
    echo json_encode(['success' => false, 'message' => '新密码和确认密码不一致']);
    exit();
}

if (strlen($new_password) < 6) {
    echo json_encode(['success' => false, 'message' => '新密码长度至少6位']);
    exit();
}

if ($old_password === $new_password) {
    echo json_encode(['success' => false, 'message' => '新密码不能与旧密码相同']);
    exit();
}

$db = getDB();
$user_id = $_SESSION['user_id'];

// 验证旧密码
$stmt = $db->prepare("SELECT password_hash FROM users WHERE id = ?");
$stmt->execute([$user_id]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || !password_verify($old_password, $user['password_hash'])) {
    echo json_encode(['success' => false, 'message' => '旧密码错误']);
    exit();
}

// 更新密码
$new_password_hash = password_hash($new_password, PASSWORD_DEFAULT);
$stmt = $db->prepare("UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
$result = $stmt->execute([$new_password_hash, $user_id]);

if ($result) {
    // 记录密码修改日志
    $stmt = $db->prepare("INSERT INTO user_activities (user_id, activity_type, description) VALUES (?, 'password_change', '用户修改了密码')");
    $stmt->execute([$user_id]);
    
    echo json_encode(['success' => true, 'message' => '密码修改成功']);
} else {
    echo json_encode(['success' => false, 'message' => '密码修改失败，请稍后重试']);
}
?>