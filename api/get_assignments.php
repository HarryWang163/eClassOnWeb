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

$user_id = $_SESSION['user_id'];
$db = getDB();
$response = ['success' => true, 'data' => []];

try {
    // 获取前端传递的日期参数
    $selected_date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');
    
    // 验证日期格式
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $selected_date)) {
        echo json_encode(['success' => false, 'message' => '日期格式错误']);
        exit();
    }
    
    // 1. 查询当前用户是否是课代表，以及是哪些学科的课代表
    $stmt = $db->prepare("
        SELECT sr.subject_id, s.subject_name 
        FROM subject_representatives sr
        JOIN subjects s ON sr.subject_id = s.id
        WHERE sr.user_id = :user_id
    ");
    $stmt->bindValue(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();
    $user_subject_representatives = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 转换为方便查找的格式
    $subject_representative_map = [];
    foreach ($user_subject_representatives as $rep) {
        $subject_representative_map[$rep['subject_id']] = true;
    }
    
    // 2. 获取所有学科
    $stmt = $db->query("SELECT * FROM subjects ORDER BY id");
    $subjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 3. 获取作业数据
    $query = "
        SELECT 
            a.*,
            s.subject_name,
            CASE 
                WHEN DATE(a.publish_time) = :selected_date THEN 'today_published'
                WHEN a.deadline IS NOT NULL AND a.deadline = :selected_date2 THEN 'today_due'
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
        LEFT JOIN assignment_completions ac ON a.id = ac.assignment_id AND ac.user_id = :user_id
        WHERE 
            (DATE(CONVERT_TZ(a.publish_time, '+00:00', '+08:00')) = :selected_date4
             OR (a.deadline IS NOT NULL AND a.deadline >= :selected_date5))
        ORDER BY s.id, 
            CASE 
                WHEN DATE(CONVERT_TZ(a.publish_time, '+00:00', '+08:00')) = :selected_date6 THEN 1
                WHEN a.deadline = :selected_date7 THEN 2
                WHEN a.deadline > :selected_date8 THEN 3
            END,
            a.publish_time DESC
    ";
    
    $stmt = $db->prepare($query);
    $stmt->bindValue(':selected_date', $selected_date);
    $stmt->bindValue(':selected_date2', $selected_date);
    $stmt->bindValue(':selected_date3', $selected_date);
    $stmt->bindValue(':selected_date4', $selected_date);
    $stmt->bindValue(':selected_date5', $selected_date);
    $stmt->bindValue(':selected_date6', $selected_date);
    $stmt->bindValue(':selected_date7', $selected_date);
    $stmt->bindValue(':selected_date8', $selected_date);
    $stmt->bindValue(':user_id', $user_id);
    $stmt->execute();
    $assignments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 4. 组织数据（原有逻辑保持不变）
    $total_assignments = 0;
    $total_need_submit = 0;
    $subjects_stats = [];
    $groupedAssignments = [];
    
    foreach ($subjects as $subject) {
        $subjectId = $subject['id'];
        
        // 检查当前用户是否是此学科的课代表
        $is_representative = isset($subject_representative_map[$subjectId]);
        
        $groupedAssignments[$subjectId] = [
            'subject_info' => $subject,
            'today_published' => [],
            'today_due' => [],
            'future_due' => [],
            'stats' => [
                'total_assignments' => 0,
                'need_submit_count' => 0,
                'completed_count' => 0
            ],
            'is_representative' => $is_representative  // 新增字段
        ];
        
        $subjects_stats[$subjectId] = [
            'subject_name' => $subject['subject_name'],
            'total_assignments' => 0,
            'need_submit_count' => 0,
            'completed_count' => 0
        ];
    }
    
    // 处理作业数据（原有逻辑保持不变）
    foreach ($assignments as $assignment) {
        $subjectId = $assignment['subject_id'];
        $assignmentType = $assignment['assignment_type'];
        unset($assignment['assignment_type']);
        
        if (isset($groupedAssignments[$subjectId])) {
            if ($assignmentType === 'today_published') {
                $groupedAssignments[$subjectId]['today_published'][] = $assignment;
            } elseif ($assignmentType === 'today_due') {
                $groupedAssignments[$subjectId]['today_due'][] = $assignment;
            } elseif ($assignmentType === 'future_due') {
                $groupedAssignments[$subjectId]['future_due'][] = $assignment;
            }
            
            // 更新统计
            $groupedAssignments[$subjectId]['stats']['total_assignments']++;
            $total_assignments++;
            
            if ($assignment['need_submit'] == 1) {
                $groupedAssignments[$subjectId]['stats']['need_submit_count']++;
                $total_need_submit++;
            }
            
            if ($assignment['is_completed'] == 1) {
                $groupedAssignments[$subjectId]['stats']['completed_count']++;
            }
            
            $subjects_stats[$subjectId]['total_assignments']++;
            if ($assignment['need_submit'] == 1) {
                $subjects_stats[$subjectId]['need_submit_count']++;
            }
            if ($assignment['is_completed'] == 1) {
                $subjects_stats[$subjectId]['completed_count']++;
            }
        }
    }
    
    // 过滤掉没有作业的学科
    $filteredGroupedAssignments = array_filter($groupedAssignments, function($subjectData) {
        return !empty($subjectData['today_published']) || 
               !empty($subjectData['today_due']) || 
               !empty($subjectData['future_due']);
    });
    
    // 5. 构建响应数据
    $response['data'] = [
        'query_info' => [
            'selected_date' => $selected_date,
            'query_description' => "查询日期：{$selected_date}"
        ],
        'total_stats' => [
            'total_assignments_all' => $total_assignments,
            'total_need_submit_all' => $total_need_submit,
            'total_assignments_filtered' => $total_assignments,
            'total_need_submit_filtered' => $total_need_submit,
            'total_subjects' => count($subjects),
            'subjects_with_submissions' => count(array_filter($subjects_stats, function($stat) {
                return $stat['need_submit_count'] > 0;
            }))
        ],
        'subjects_stats' => array_values($subjects_stats),
        'assignments' => array_values($filteredGroupedAssignments)
    ];
    
} catch (Exception $e) {
    $response = ['success' => false, 'message' => '获取数据失败: ' . $e->getMessage()];
    error_log('作业查询错误: ' . $e->getMessage());
}

echo json_encode($response);
?>