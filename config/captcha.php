<?php
// 验证码相关函数

/**
 * 检查是否需要验证码
 */
function requiresCaptcha($username, $ip_address) {
    $db = getDB();
    
    // 检查过去5分钟内该用户的失败尝试次数
    $stmt = $db->prepare("
        SELECT COUNT(*) as attempt_count 
        FROM login_attempts 
        WHERE username = ? 
        AND ip_address = ?
        AND attempt_time > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
    ");
    $stmt->execute([$username, $ip_address]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    return $result['attempt_count'] >= 3;
}

/**
 * 记录登录失败尝试
 */
function recordFailedAttempt($username, $ip_address) {
    $db = getDB();
    
    $stmt = $db->prepare("INSERT INTO login_attempts (username, ip_address) VALUES (?, ?)");
    return $stmt->execute([$username, $ip_address]);
}

/**
 * 清除登录失败记录
 */
function clearFailedAttempts($username, $ip_address) {
    $db = getDB();
    
    $stmt = $db->prepare("DELETE FROM login_attempts WHERE username = ? AND ip_address = ?");
    return $stmt->execute([$username, $ip_address]);
}

/**
 * 验证验证码
 */
function verifyCaptcha($session_id, $user_input) {
    $db = getDB();
    
    // 清理过期的验证码
    $stmt = $db->prepare("DELETE FROM captcha_sessions WHERE expires_at < NOW()");
    $stmt->execute();
    
    // 获取验证码
    $stmt = $db->prepare("SELECT captcha_code FROM captcha_sessions WHERE session_id = ? AND expires_at > NOW() ORDER BY id DESC LIMIT 1");
    $stmt->execute([$session_id]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$result) {
        return false;
    }
    
    // 验证用户输入（不区分大小写）
    if (strtoupper($user_input) === strtoupper($result['captcha_code'])) {
        // 验证成功后删除验证码记录
        $stmt = $db->prepare("DELETE FROM captcha_sessions WHERE session_id = ?");
        $stmt->execute([$session_id]);
        return true;
    }
    
    return false;
}

/**
 * 获取客户端IP地址
 */
function getClientIP() {
    $ip_keys = [
        'HTTP_CLIENT_IP',
        'HTTP_X_FORWARDED_FOR',
        'HTTP_X_FORWARDED',
        'HTTP_X_CLUSTER_CLIENT_IP',
        'HTTP_FORWARDED_FOR',
        'HTTP_FORWARDED',
        'REMOTE_ADDR'
    ];
    
    foreach ($ip_keys as $key) {
        if (array_key_exists($key, $_SERVER) === true) {
            foreach (explode(',', $_SERVER[$key]) as $ip) {
                $ip = trim($ip);
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                    return $ip;
                }
            }
        }
    }
    
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}
?>