<?php
require_once '../config/database.php';

// 设置响应头为JSON
header('Content-Type: application/json');

// 检查是否已登录
session_start();
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => '未登录']);
    exit();
}

// 获取POST数据
$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

// 验证数据
if (!isset($data['assignment_id']) || !is_numeric($data['assignment_id'])) {
    echo json_encode(['success' => false, 'message' => '作业ID无效']);
    exit();
}

$user_id = $_SESSION['user_id'];
$assignment_id = intval($data['assignment_id']);
$db = getDB();
$response = ['success' => false, 'message' => ''];

try {
    // 检查作业是否存在
    $stmt = $db->prepare("SELECT id FROM assignments WHERE id = :assignment_id");
    $stmt->bindValue(':assignment_id', $assignment_id, PDO::PARAM_INT);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        $response['message'] = '作业不存在';
        echo json_encode($response);
        exit();
    }
    
    // 检查是否有完成记录
    $stmt = $db->prepare("SELECT id FROM assignment_completions WHERE assignment_id = :assignment_id AND user_id = :user_id");
    $stmt->bindValue(':assignment_id', $assignment_id, PDO::PARAM_INT);
    $stmt->bindValue(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        $response['message'] = '该作业尚未标记为完成';
        echo json_encode($response);
        exit();
    }
    
    // 删除完成记录
    $stmt = $db->prepare("DELETE FROM assignment_completions WHERE assignment_id = :assignment_id AND user_id = :user_id");
    $stmt->bindValue(':assignment_id', $assignment_id, PDO::PARAM_INT);
    $stmt->bindValue(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();
    
    $response['success'] = true;
    $response['message'] = '取消完成标记成功';
    
    // 获取更新后的作业信息
    $stmt = $db->prepare("
        SELECT 
            a.*,
            s.subject_name,
            CASE 
                WHEN ac.id IS NOT NULL THEN 1 
                ELSE 0 
            END as is_completed,
            ac.completed_at
        FROM assignments a
        JOIN subjects s ON a.subject_id = s.id
        LEFT JOIN assignment_completions ac ON a.id = ac.assignment_id AND ac.user_id = :user_id2
        WHERE a.id = :assignment_id2
    ");
    $stmt->bindValue(':assignment_id2', $assignment_id, PDO::PARAM_INT);
    $stmt->bindValue(':user_id2', $user_id, PDO::PARAM_INT);
    $stmt->execute();
    $assignment = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $response['assignment'] = $assignment;
    
} catch (Exception $e) {
    $response['message'] = '操作失败: ' . $e->getMessage();
    error_log('取消作业完成标记失败: ' . $e->getMessage());
}

echo json_encode($response);
?>