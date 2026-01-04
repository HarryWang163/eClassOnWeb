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
        <h2 class="h4 fw-bold mb-0 animate-fade-in-up"><i class="bi bi-journal-bookmark-fill me-2"></i>作业中心</h2>
        <p class="text-muted mb-0 animate-fade-in-up delay-1" id="assignmentsStats">正在加载统计信息...</p>
    </div>
    <div class="animate-fade-in-up delay-2">
        <button class="btn btn-sm btn-outline-secondary me-2" id="filterBtn">
            <i class="bi bi-filter"></i> 筛选
        </button>
        <button class="btn btn-sm btn-primary" id="btnNewAssignment">
            <i class="bi bi-plus-circle me-1"></i>新建作业
        </button>
    </div>
</div>

<!-- 筛选面板 -->
<div class="card border-0 shadow-sm mb-4 animate-fade-in-up delay-3" id="filterPanel" style="display: none;">
    <div class="card-body">
        <div class="row g-3">
            <div class="col-md-4">
                <label class="form-label small">学科筛选</label>
                <select class="form-select form-select-sm" id="subjectFilter">
                    <option value="all">所有学科</option>
                    <?php
                    $stmt = $db->query("SELECT * FROM subjects ORDER BY sort_order");
                    $subjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    foreach ($subjects as $subject) {
                        echo '<option value="' . $subject['id'] . '">' . htmlspecialchars($subject['subject_name']) . '</option>';
                    }
                    ?>
                </select>
            </div>
            <div class="col-md-4">
                <label class="form-label small">状态筛选</label>
                <select class="form-select form-select-sm" id="statusFilter">
                    <option value="all">所有状态</option>
                    <option value="need_submit">需要提交</option>
                    <option value="urgent">紧急作业</option>
                    <option value="important">重要作业</option>
                </select>
            </div>
            <div class="col-md-4">
                <label class="form-label small">截止时间</label>
                <select class="form-select form-select-sm" id="deadlineFilter">
                    <option value="all">所有时间</option>
                    <option value="today">今日截止</option>
                    <option value="tomorrow">明日截止</option>
                    <option value="week">本周内</option>
                </select>
            </div>
        </div>
        <div class="mt-3 d-flex justify-content-between">
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="showDetailsOnly">
                <label class="form-check-label small" for="showDetailsOnly">
                    仅显示有详细信息的作业
                </label>
            </div>
            <div>
                <button class="btn btn-sm btn-outline-secondary" id="resetFilters">重置筛选</button>
                <button class="btn btn-sm btn-primary ms-2" id="applyFilters">应用筛选</button>
            </div>
        </div>
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