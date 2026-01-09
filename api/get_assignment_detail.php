<?php
require_once '../config/database.php';

header('Content-Type: application/json');
session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => '未登录']);
    exit();
}

$user_id = $_SESSION['user_id'];
$assignment_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
$db = getDB();

if ($assignment_id <= 0) {
    echo json_encode(['success' => false, 'message' => '作业ID无效']);
    exit();
}

try {
    // 获取作业详情并验证权限
    $stmt = $db->prepare("
        SELECT a.*, s.subject_name, sr.id as is_representative
        FROM assignments a
        JOIN subjects s ON a.subject_id = s.id
        LEFT JOIN subject_representatives sr ON sr.subject_id = s.id 
            AND sr.user_id = :user_id
        WHERE a.id = :assignment_id
    ");
    $stmt->bindValue(':assignment_id', $assignment_id, PDO::PARAM_INT);
    $stmt->bindValue(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        echo json_encode(['success' => false, 'message' => '作业不存在']);
        exit();
    }
    
    $assignment = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // 检查是否是课代表
    if (!$assignment['is_representative']) {
        echo json_encode(['success' => false, 'message' => '无权限编辑此作业']);
        exit();
    }
    
    // 移除不必要的字段
    unset($assignment['is_representative']);
    
    echo json_encode([
        'success' => true,
        'data' => $assignment
    ]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => '获取数据失败: ' . $e->getMessage()]);
}
?>