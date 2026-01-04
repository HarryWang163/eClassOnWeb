<?php
require_once '../config/database.php';

// 设置响应头为JSON
header('Content-Type: application/json');

// 检查是否已登录
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => '未登录']);
    exit();
}

$db = getDB();
$response = ['success' => true, 'data' => []];

try {
    // 获取所有学科
    $stmt = $db->query("SELECT * FROM subjects ORDER BY sort_order");
    $subjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 获取所有活跃的作业
    $stmt = $db->query("
        SELECT 
            a.*,
            s.subject_name,
            s.color,
            s.icon_class,
            u.real_name as publisher_name,
            u.username as publisher_username,
            CASE 
                WHEN a.submit_deadline < CURDATE() THEN '已过期'
                WHEN a.submit_deadline = CURDATE() THEN '今日截止'
                WHEN a.submit_deadline = DATE_ADD(CURDATE(), INTERVAL 1 DAY) THEN '明日截止'
                WHEN DATEDIFF(a.submit_deadline, CURDATE()) <= 3 THEN '三天内截止'
                ELSE '进行中'
            END as deadline_status,
            DATEDIFF(a.submit_deadline, CURDATE()) as days_remaining
        FROM assignments a
        LEFT JOIN subjects s ON a.subject_id = s.id
        LEFT JOIN users u ON a.publisher_id = u.id
        WHERE a.status = 'active'
        ORDER BY 
            s.sort_order,
            CASE 
                WHEN a.submit_deadline = CURDATE() THEN 1
                WHEN a.submit_deadline = DATE_ADD(CURDATE(), INTERVAL 1 DAY) THEN 2
                WHEN DATEDIFF(a.submit_deadline, CURDATE()) <= 3 THEN 3
                ELSE 4
            END,
            a.is_important DESC,
            a.publish_time DESC
    ");
    $assignments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 按学科分组作业
    $groupedAssignments = [];
    foreach ($subjects as $subject) {
        $subjectId = $subject['id'];
        $groupedAssignments[$subjectId] = [
            'subject_info' => $subject,
            'assignments' => []
        ];
    }
    
    foreach ($assignments as $assignment) {
        $subjectId = $assignment['subject_id'];
        if (isset($groupedAssignments[$subjectId])) {
            $groupedAssignments[$subjectId]['assignments'][] = $assignment;
        }
    }
    
    // 计算每个学科的统计信息
    foreach ($groupedAssignments as $subjectId => &$data) {
        $assignmentsList = $data['assignments'];
        $total = count($assignmentsList);
        $needSubmitCount = 0;
        $urgentCount = 0;
        $importantCount = 0;
        
        foreach ($assignmentsList as $assignment) {
            if ($assignment['need_submit']) $needSubmitCount++;
            if ($assignment['deadline_status'] === '今日截止' || $assignment['deadline_status'] === '明日截止') {
                if ($assignment['need_submit']) $urgentCount++;
            }
            if ($assignment['is_important']) $importantCount++;
        }
        
        $data['stats'] = [
            'total' => $total,
            'need_submit' => $needSubmitCount,
            'urgent' => $urgentCount,
            'important' => $importantCount
        ];
    }
    
    $response['data'] = $groupedAssignments;
    
} catch (Exception $e) {
    $response = ['success' => false, 'message' => '获取数据失败: ' . $e->getMessage()];
}

echo json_encode($response);
?>