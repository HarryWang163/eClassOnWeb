<?php
require_once '../config/database.php';

// 检查是否已登录
if (!isset($_SESSION['user_id'])) {
    echo '<div class="alert alert-danger">请先登录</div>';
    exit();
}

$db = getDB();
?>
<div class="d-flex justify-content-between align-items-center mb-4">
    <div>
        <h2 class="h4 fw-bold mb-4 animate-fade-in-up"><i class="bi bi-journal-bookmark-fill me-2"></i>作业中心</h2>
        <div class="col-md-6">
                    <div class="d-flex align-items-center gap-2">
                        <button class="btn btn-outline-primary" id="prevDateBtn" title="上一天">
                            <i class="bi bi-chevron-left"></i>
                        </button>
                        <div class="input-group flex-nowrap">
                            <span class="input-group-text"><i class="bi bi-calendar"></i></span>
                            <input type="date" class="form-control" id="datePicker">
                        </div>
                        <button class="btn btn-outline-primary" id="nextDateBtn" title="下一天">
                            <i class="bi bi-chevron-right"></i>
                        </button>
                        <button class="btn btn-primary" id="todayBtn" title="今天">
                            <i class="bi bi-calendar-check"></i> 今天
                        </button>
                    </div>
                </div>
        <p class="text-muted mt-3 mb-0 animate-fade-in-up delay-1" id="assignmentsStats">正在加载统计信息...</p>
    </div>
</div>

<!-- 学科卡片容器 -->
<div class="row g-4" id="subjectCardsContainer">
    <!-- 这里将通过JavaScript动态加载学科卡片 -->
    <div class="col-12 text-center py-5">
        <div class="spinner-border text-primary mb-3" role="status">
            <span class="visually-hidden">加载中...</span>
        </div>
        <p class="text-muted">正在加载作业数据...</p>
    </div>
</div>


<!-- 加载脚本 -->
<script>
// 将PHP的学科数据传递给JavaScript
window.subjectsData = <?php 
    $stmt = $db->query("SELECT * FROM subjects ORDER BY sort_order");
    $subjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($subjects);
?>;
</script>

<!-- 添加一些CSS样式 -->
<style>
    /* 日期选择器美化 */
    .input-group-lg .input-group-text {
        padding: 0.75rem 1rem;
    }
    
    .input-group-lg .form-control {
        padding: 0.75rem;
        font-size: 1rem;
    }
    
    /* 今天按钮样式 */
    #todayBtn {
        min-width: 100px;
        font-weight: 500;
    }
    
    /* 响应式调整 */
    @media (max-width: 768px) {
        .input-group-lg {
            min-width: 100% !important;
        }
        
        #todayBtn {
            min-width: 80px;
            padding: 0.75rem 1rem;
        }
        
        .btn-group .btn {
            padding: 0.75rem 1rem;
        }
    }
    
    /* 按钮悬停效果 */
    .btn-outline-primary:hover {
        background-color: var(--bs-primary);
        color: white;
    }
</style>