<?php
require_once 'config/database.php';

session_start();

// 设置响应头为PNG图片
header('Content-Type: image/png');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// 获取会话ID
$session_id = $_GET['session_id'] ?? session_id();

// 生成随机验证码（4位数字+字母）
function generateCaptchaCode($length = 4) {
    $chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    $code = '';
    for ($i = 0; $i < $length; $i++) {
        $code .= $chars[random_int(0, strlen($chars) - 1)];
    }
    return $code;
}

// 生成验证码
$captcha_code = generateCaptchaCode(4);

// 存储到数据库
$db = getDB();
$expires_at = date('Y-m-d H:i:s', time() + 300); // 5分钟后过期

$stmt = $db->prepare("INSERT INTO captcha_sessions (session_id, captcha_code, expires_at) VALUES (?, ?, ?) 
                      ON DUPLICATE KEY UPDATE captcha_code = ?, expires_at = ?");
$stmt->execute([$session_id, $captcha_code, $expires_at, $captcha_code, $expires_at]);

// 创建图片
$width = 120;
$height = 40;
$image = imagecreatetruecolor($width, $height);

// 设置颜色
$background_color = imagecolorallocate($image, 255, 255, 255);
$text_color = imagecolorallocate($image, 0, 0, 0);
$noise_color = imagecolorallocate($image, 150, 150, 150);
$line_color = imagecolorallocate($image, 200, 200, 200);

// 填充背景
imagefilledrectangle($image, 0, 0, $width, $height, $background_color);

// 添加噪点
for ($i = 0; $i < 100; $i++) {
    imagesetpixel($image, rand(0, $width), rand(0, $height), $noise_color);
}

// 添加干扰线
for ($i = 0; $i < 5; $i++) {
    imageline($image, rand(0, $width), rand(0, $height), rand(0, $width), rand(0, $height), $line_color);
}

// 使用TTF字体（确保字体文件存在）
$font_file = 'assets/fonts/arial.ttf'; // 需要准备一个字体文件

// 如果没有字体文件，使用内置字体
if (file_exists($font_file)) {
    // 使用TrueType字体
    $font_size = 16;
    $angle = rand(-5, 5);
    $x = 10;
    $y = 28;
    
    for ($i = 0; $i < strlen($captcha_code); $i++) {
        $char = $captcha_code[$i];
        $color = imagecolorallocate($image, rand(0, 150), rand(0, 150), rand(0, 150));
        imagettftext($image, $font_size, $angle, $x + ($i * 25), $y, $color, $font_file, $char);
    }
} else {
    // 使用内置字体
    $font_size = 5;
    $x = 10;
    $y = 15;
    
    for ($i = 0; $i < strlen($captcha_code); $i++) {
        $char = $captcha_code[$i];
        $color = imagecolorallocate($image, rand(0, 150), rand(0, 150), rand(0, 150));
        imagestring($image, $font_size, $x + ($i * 25), $y, $char, $color);
    }
}

// 输出图片
imagepng($image);
imagedestroy($image);
?>