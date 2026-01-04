<?php
require_once 'config/database.php';
require_once 'config/captcha.php';

header('Content-Type: application/json');

// 获取参数
$username = $_GET['username'] ?? '';
$client_ip = getClientIP();

if (empty($username)) {
    echo json_encode(['requires_captcha' => false]);
    exit();
}

// 检查是否需要验证码
$requires_captcha = requiresCaptcha($username, $client_ip);

// 获取剩余尝试次数
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

$remaining_attempts = max(0, 3 - $result['attempt_count']);

echo json_encode([
    'requires_captcha' => $requires_captcha,
    'remaining_attempts' => $remaining_attempts,
    'attempt_count' => $result['attempt_count']
]);
?>