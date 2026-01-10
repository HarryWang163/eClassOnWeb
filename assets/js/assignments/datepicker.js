
// 初始化作业页面
function initAssignmentsPage() {
    // 设置日期选择器为今天
    const today = getLocalDateString(); 
    const datePicker = document.getElementById('datePicker');
    if (datePicker) {
        datePicker.value = today;
        currentDate = today;
    }
    
    loadAssignmentsData();
    
    // 添加日期选择器事件监听
    setupDatePicker();
}

// 设置日期选择器
function setupDatePicker() {
    const datePicker = document.getElementById('datePicker');
    if (datePicker) {
        datePicker.addEventListener('change', function() {
            currentDate = this.value;
            loadAssignmentsData();
        });
    }
    
    // 添加上一天/下一天按钮事件
    const prevBtn = document.getElementById('prevDateBtn');
    const nextBtn = document.getElementById('nextDateBtn');
    const todayBtn = document.getElementById('todayBtn');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            changeDate(-1);
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            changeDate(1);
        });
    }
    
    if (todayBtn) {
        todayBtn.addEventListener('click', function() {
            const today = getLocalDateString();
            const datePicker = document.getElementById('datePicker');
            if (datePicker) {
                datePicker.value = today;
                currentDate = today;
                loadAssignmentsData();
            }
        });
    }
}

// 更改日期（增减天数）
function changeDate(days) {
    if (!currentDate) {
        currentDate = getLocalDateString();
    }
    
    const date = new Date(currentDate);
    date.setDate(date.getDate() + days);
    const newDate = getLocalDateString(date);

    const datePicker = document.getElementById('datePicker');
    if (datePicker) {
        datePicker.value = newDate;
        currentDate = newDate;
        loadAssignmentsData();
    }
}
