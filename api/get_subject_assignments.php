<?php
require_once '../config/database.php';

header('Content-Type: application/json');
session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => '未登录']);
    exit();
}

$user_id = $_SESSION['user_id'];
$subject_id = isset($_GET['subject_id']) ? intval($_GET['subject_id']) : 0;
$db = getDB();

if ($subject_id <= 0) {
    echo json_encode(['success' => false, 'message' => '学科ID无效']);
    exit();
}

try {
    // 验证用户是否是该学科的课代表
    $stmt = $db->prepare("
        SELECT id FROM subject_representatives 
        WHERE user_id = :user_id AND subject_id = :subject_id
    ");
    $stmt->bindValue(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->bindValue(':subject_id', $subject_id, PDO::PARAM_INT);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        echo json_encode(['success' => false, 'message' => '无权限访问']);
        exit();
    }
    
    // 获取该学科的所有作业
    $stmt = $db->prepare("
        SELECT a.*, s.subject_name
        FROM assignments a
        JOIN subjects s ON a.subject_id = s.id
        WHERE a.subject_id = :subject_id
        ORDER BY a.publish_time DESC
    ");
    $stmt->bindValue(':subject_id', $subject_id, PDO::PARAM_INT);
    $stmt->execute();
    $assignments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => [
            'subject_id' => $subject_id,
            'assignments' => $assignments
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => '获取数据失败: ' . $e->getMessage()]);
}
?>