<?php
require_once '../config/database.php';

header('Content-Type: application/json');
session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => '未登录']);
    exit();
}

$user_id = $_SESSION['user_id'];
$db = getDB();

try {
    // 获取当前用户的课代表学科
    $stmt = $db->prepare("
        SELECT 
            sr.subject_id,
            s.subject_name,
            s.color
        FROM subject_representatives sr
        JOIN subjects s ON sr.subject_id = s.id
        WHERE sr.user_id = :user_id
        ORDER BY s.subject_name
    ");
    $stmt->bindValue(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();
    
    $representatives = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => [
            'representatives' => $representatives,
            'count' => count($representatives)
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false, 
        'message' => '获取课代表学科失败: ' . $e->getMessage()
    ]);
}
?>