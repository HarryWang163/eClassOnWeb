<?php
require_once '../config/database.php';

// 设置响应头为JSON
header('Content-Type: application/json');

// 设置时区
date_default_timezone_set('Asia/Shanghai');

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
    // 验证用户权限：必须是该学科课代表
    $stmt = $db->prepare("
        SELECT a.id, a.subject_id, s.subject_name
        FROM assignments a
        JOIN subjects s ON a.subject_id = s.id
        LEFT JOIN subject_representatives sr ON sr.subject_id = a.subject_id 
            AND sr.user_id = :user_id
        WHERE a.id = :assignment_id
    ");
    $stmt->bindValue(':assignment_id', $assignment_id, PDO::PARAM_INT);
    $stmt->bindValue(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        $response['message'] = '作业不存在';
        echo json_encode($response);
        exit();
    }
    
    $assignment = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // 检查是否是课代表
    if (!$assignment['subject_id']) {
        $response['message'] = '无权限删除此作业';
        echo json_encode($response);
        exit();
    }
    
    // 删除相关完成记录（级联删除）
    $stmt = $db->prepare("DELETE FROM assignment_completions WHERE assignment_id = :assignment_id");
    $stmt->bindValue(':assignment_id', $assignment_id, PDO::PARAM_INT);
    $stmt->execute();
    
    // 删除作业
    $stmt = $db->prepare("DELETE FROM assignments WHERE id = :assignment_id");
    $stmt->bindValue(':assignment_id', $assignment_id, PDO::PARAM_INT);
    $stmt->execute();
    
    $response['success'] = true;
    $response['message'] = '作业删除成功';
    $response['deleted_assignment'] = $assignment;
    
} catch (Exception $e) {
    $response['message'] = '删除失败: ' . $e->getMessage();
    error_log('删除作业失败: ' . $e->getMessage());
}

echo json_encode($response);
?>