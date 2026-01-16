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
$date = isset($_GET['date']) ? $_GET['date'] : null;
$all = isset($_GET['all']) && $_GET['all'] === 'true'; // 是否获取所有作业
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
    
    if ($all) {
        // 获取所有作业
        $stmt = $db->prepare("
            SELECT 
                a.*, 
                s.subject_name,
                DATE(a.publish_time) as publish_date,
                CASE 
                    WHEN ac.id IS NOT NULL THEN 1 
                    ELSE 0 
                END as is_completed,
                ac.completed_at
            FROM assignments a
            JOIN subjects s ON a.subject_id = s.id
            LEFT JOIN assignment_completions ac ON a.id = ac.assignment_id AND ac.user_id = :user_id2
            WHERE a.subject_id = :subject_id
            ORDER BY a.publish_time DESC
        ");
        
        $stmt->bindValue(':subject_id', $subject_id, PDO::PARAM_INT);
        $stmt->bindValue(':user_id2', $user_id, PDO::PARAM_INT);
        $stmt->execute();
        
        $assignments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // 获取学科信息
        $stmt = $db->prepare("SELECT * FROM subjects WHERE id = :subject_id");
        $stmt->bindValue(':subject_id', $subject_id, PDO::PARAM_INT);
        $stmt->execute();
        $subject = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'subject' => $subject,
                'assignments' => $assignments,
                'total' => count($assignments),
                'is_all' => true
            ]
        ]);
        
    } else {
        // 如果没有传递日期，使用今天
        if (!$date) {
            $date = date('Y-m-d');
        }
        
        // 验证日期格式
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            echo json_encode(['success' => false, 'message' => '日期格式错误']);
            exit();
        }
        
        // 按日期筛选获取作业（今日发布+未截止）
        $stmt = $db->prepare("
            SELECT 
                a.*, 
                s.subject_name,
                DATE(CONVERT_TZ(a.publish_time, '+00:00', '+08:00')) as publish_date,
                CASE 
                    WHEN DATE(CONVERT_TZ(a.publish_time, '+00:00', '+08:00')) = :selected_date THEN 'today_published'
                    WHEN a.deadline IS NOT NULL AND a.deadline > :selected_date3 THEN 'future_due'
                    ELSE 'other'
                END as assignment_type,
                CASE 
                    WHEN ac.id IS NOT NULL THEN 1 
                    ELSE 0 
                END as is_completed,
                ac.completed_at
            FROM assignments a
            JOIN subjects s ON a.subject_id = s.id
            LEFT JOIN assignment_completions ac ON a.id = ac.assignment_id AND ac.user_id = :user_id2
            WHERE a.subject_id = :subject_id
              AND (
                DATE(CONVERT_TZ(a.publish_time, '+00:00', '+08:00')) = :selected_date4
                OR (a.deadline IS NOT NULL AND a.deadline >= :selected_date5)
              )
            ORDER BY 
                CASE 
                    WHEN DATE(CONVERT_TZ(a.publish_time, '+00:00', '+08:00')) = :selected_date6 THEN 1
                    WHEN a.deadline = :selected_date7 THEN 2
                    WHEN a.deadline > :selected_date8 THEN 3
                END,
                a.publish_time DESC
        ");
        
        // 绑定参数
        $stmt->bindValue(':subject_id', $subject_id, PDO::PARAM_INT);
        $stmt->bindValue(':selected_date', $date);
        $stmt->bindValue(':selected_date3', $date);
        $stmt->bindValue(':selected_date4', $date);
        $stmt->bindValue(':selected_date5', $date);
        $stmt->bindValue(':selected_date6', $date);
        $stmt->bindValue(':selected_date7', $date);
        $stmt->bindValue(':selected_date8', $date);
        $stmt->bindValue(':user_id2', $user_id, PDO::PARAM_INT);
        $stmt->execute();
        
        $assignments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // 按类型分组
        $today_published = [];
        $future_due = [];
        
        foreach ($assignments as $assignment) {
            $type = $assignment['assignment_type'];
            unset($assignment['assignment_type']);
            
            switch ($type) {
                case 'today_published':
                    $today_published[] = $assignment;
                    break;
                case 'future_due':
                    $future_due[] = $assignment;
                    break;
            }
        }
        
        // 获取学科信息
        $stmt = $db->prepare("SELECT * FROM subjects WHERE id = :subject_id");
        $stmt->bindValue(':subject_id', $subject_id, PDO::PARAM_INT);
        $stmt->execute();
        $subject = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'subject' => $subject,
                'assignments' => $assignments,
                'today_published' => $today_published,
                'future_due' => $future_due,
                'total' => count($assignments),
                'query_date' => $date,
                'is_all' => false
            ]
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => '获取数据失败: ' . $e->getMessage()]);
}
?>