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
if (!isset($data['subject_id']) || !is_numeric($data['subject_id'])) {
    echo json_encode(['success' => false, 'message' => (isset($data['subject_id']) ? $data['subject_id'] : '未提供') .'学科ID无效' ]);
    exit();
}

$user_id = $_SESSION['user_id'];
$subject_id = intval($data['subject_id']);
$assignment_id = isset($data['assignment_id']) ? intval($data['assignment_id']) : 0;
$db = getDB();
$response = ['success' => false, 'message' => ''];

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
        $response['message'] = '您不是该学科的课代表，无权限操作';
        echo json_encode($response);
        exit();
    }
    
    // 验证必填字段
    if (!isset($data['assignment_content']) || empty(trim($data['assignment_content']))) {
        $response['message'] = '作业内容不能为空';
        echo json_encode($response);
        exit();
    }
    
    // 准备数据
    $content = trim($data['assignment_content']);
    $deadline = isset($data['assignment_deadline']) && !empty($data['assignment_deadline']) ? $data['assignment_deadline'] : null;
    $need_submit = isset($data['need_submit']) ? ($data['need_submit'] == 1 || $data['need_submit'] === true) : false;
    $submit_items = isset($data['submit_items']) ? trim($data['submit_items']) : null;
    $has_details = isset($data['has_details']) ? ($data['has_details'] == 1 || $data['has_details'] === true) : false;
    $details = isset($data['assignment_details']) ? trim($data['assignment_details']) : null;
    
    // 如果不需要提交，清空提交物品
    if (!$need_submit) {
        $submit_items = null;
    }
    
    // 如果没有详细说明，清空详细内容
    if (!$has_details) {
        $details = null;
    }
    
    if ($assignment_id > 0) {
        // 更新作业
        // 先检查作业是否存在且属于该学科
        $stmt = $db->prepare("
            SELECT id FROM assignments 
            WHERE id = :assignment_id AND subject_id = :subject_id
        ");
        $stmt->bindValue(':assignment_id', $assignment_id, PDO::PARAM_INT);
        $stmt->bindValue(':subject_id', $subject_id, PDO::PARAM_INT);
        $stmt->execute();
        
        if ($stmt->rowCount() === 0) {
            $response['message'] = '作业不存在或不属于该学科';
            echo json_encode($response);
            exit();
        }
        
        // 更新作业
        $stmt = $db->prepare("
            UPDATE assignments SET 
                content = :content,
                deadline = :deadline,
                need_submit = :need_submit,
                submit_items = :submit_items,
                has_details = :has_details,
                details = :details,
                updated_at = NOW()
            WHERE id = :assignment_id
        ");
        
        $stmt->bindValue(':content', $content, PDO::PARAM_STR);
        $stmt->bindValue(':deadline', $deadline, $deadline ? PDO::PARAM_STR : PDO::PARAM_NULL);
        $stmt->bindValue(':need_submit', $need_submit ? 1 : 0, PDO::PARAM_INT);
        $stmt->bindValue(':submit_items', $submit_items, $submit_items ? PDO::PARAM_STR : PDO::PARAM_NULL);
        $stmt->bindValue(':has_details', $has_details ? 1 : 0, PDO::PARAM_INT);
        $stmt->bindValue(':details', $details, $details ? PDO::PARAM_STR : PDO::PARAM_NULL);
        $stmt->bindValue(':assignment_id', $assignment_id, PDO::PARAM_INT);
        
        $stmt->execute();
        
        $response['success'] = true;
        $response['message'] = '作业更新成功';
        $response['assignment_id'] = $assignment_id;
        $response['action'] = 'update';
        
    } else {
        // 新建作业
        $stmt = $db->prepare("
            INSERT INTO assignments (
                subject_id, content, deadline, publisher_id, 
                need_submit, submit_items, has_details, details,
                publish_time, created_at, updated_at
            ) VALUES (
                :subject_id, :content, :deadline, :publisher_id,
                :need_submit, :submit_items, :has_details, :details,
                NOW(), NOW(), NOW()
            )
        ");
        
        $stmt->bindValue(':subject_id', $subject_id, PDO::PARAM_INT);
        $stmt->bindValue(':content', $content, PDO::PARAM_STR);
        $stmt->bindValue(':deadline', $deadline, $deadline ? PDO::PARAM_STR : PDO::PARAM_NULL);
        $stmt->bindValue(':publisher_id', $user_id, PDO::PARAM_INT);
        $stmt->bindValue(':need_submit', $need_submit ? 1 : 0, PDO::PARAM_INT);
        $stmt->bindValue(':submit_items', $submit_items, $submit_items ? PDO::PARAM_STR : PDO::PARAM_NULL);
        $stmt->bindValue(':has_details', $has_details ? 1 : 0, PDO::PARAM_INT);
        $stmt->bindValue(':details', $details, $details ? PDO::PARAM_STR : PDO::PARAM_NULL);
        
        $stmt->execute();
        
        $new_assignment_id = $db->lastInsertId();
        
        $response['success'] = true;
        $response['message'] = '作业创建成功';
        $response['assignment_id'] = $new_assignment_id;
        $response['action'] = 'create';
    }
    
    // 返回更新后的作业信息
    $stmt = $db->prepare("
        SELECT a.*, s.subject_name
        FROM assignments a
        JOIN subjects s ON a.subject_id = s.id
        WHERE a.id = :assignment_id
    ");
    $stmt->bindValue(':assignment_id', $assignment_id > 0 ? $assignment_id : $new_assignment_id, PDO::PARAM_INT);
    $stmt->execute();
    $assignment = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $response['assignment'] = $assignment;
    
} catch (Exception $e) {
    $response['message'] = '保存失败: ' . $e->getMessage();
    error_log('保存作业失败: ' . $e->getMessage());
}

echo json_encode($response);
?>