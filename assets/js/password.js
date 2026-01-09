
// 初始化密码修改功能
function initPasswordChange() {
    // 修改密码按钮
    const changePasswordBtn = document.getElementById('btnChangePassword');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', showChangePasswordModal);
    }
    
    // 模态框内的按钮
    const savePasswordBtn = document.getElementById('savePasswordBtn');
    const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
    
    if (savePasswordBtn) {
        savePasswordBtn.addEventListener('click', handlePasswordChange);
    }
    
    if (cancelPasswordBtn) {
        cancelPasswordBtn.addEventListener('click', resetPasswordForm);
    }
    
    // 监听输入框，实时验证密码强度
    const newPasswordInput = document.getElementById('new_password');
    const confirmPasswordInput = document.getElementById('confirm_password');
    
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', updatePasswordStrength);
    }
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', validatePasswordMatch);
    }
}

// 显示修改密码模态框
function showChangePasswordModal() {
    const modal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
    modal.show();
    resetPasswordForm();
}

// 重置密码表单
function resetPasswordForm() {
    const form = document.getElementById('passwordChangeForm');
    if (form) {
        form.reset();
    }
    
    // 隐藏所有验证消息
    const feedbacks = document.querySelectorAll('.password-feedback');
    feedbacks.forEach(feedback => {
        feedback.style.display = 'none';
    });
    
    // 重置密码强度指示器
    const strengthBar = document.getElementById('passwordStrengthBar');
    const strengthText = document.getElementById('passwordStrengthText');
    if (strengthBar) {
        strengthBar.style.width = '0%';
        strengthBar.className = 'progress-bar';
        strengthText.textContent = '';
    }
    
    // 启用保存按钮
    const saveBtn = document.getElementById('savePasswordBtn');
    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i>保存修改';
    }
}

// 更新密码强度指示器
function updatePasswordStrength() {
    const password = document.getElementById('new_password').value;
    const strengthBar = document.getElementById('passwordStrengthBar');
    const strengthText = document.getElementById('passwordStrengthText');
    
    if (!password) {
        strengthBar.style.width = '0%';
        strengthBar.className = 'progress-bar';
        strengthText.textContent = '';
        return;
    }
    
    // 计算密码强度
    let strength = 0;
    let message = '';
    
    // 长度检查
    if (password.length >= 6) strength += 20;
    if (password.length >= 8) strength += 20;
    
    // 字符类型检查
    if (/[a-z]/.test(password)) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 10;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
    
    // 设置进度条颜色和文本
    strengthBar.style.width = Math.min(strength, 100) + '%';
    
    if (strength < 40) {
        strengthBar.className = 'progress-bar bg-danger';
        message = '密码强度：弱';
    } else if (strength < 70) {
        strengthBar.className = 'progress-bar bg-warning';
        message = '密码强度：中等';
    } else {
        strengthBar.className = 'progress-bar bg-success';
        message = '密码强度：强';
    }
    
    strengthText.textContent = message;
}

// 验证密码是否匹配
function validatePasswordMatch() {
    const newPassword = document.getElementById('new_password').value;
    const confirmPassword = document.getElementById('confirm_password').value;
    const matchFeedback = document.getElementById('passwordMatchFeedback');
    
    if (!newPassword || !confirmPassword) {
        matchFeedback.style.display = 'none';
        return;
    }
    
    if (newPassword === confirmPassword) {
        matchFeedback.style.display = 'block';
        matchFeedback.className = 'password-feedback text-success small';
        matchFeedback.innerHTML = '<i class="bi bi-check-circle me-1"></i>密码匹配';
    } else {
        matchFeedback.style.display = 'block';
        matchFeedback.className = 'password-feedback text-danger small';
        matchFeedback.innerHTML = '<i class="bi bi-exclamation-circle me-1"></i>密码不匹配';
    }
}

// 处理密码修改
async function handlePasswordChange() {
    const oldPassword = document.getElementById('old_password').value;
    const newPassword = document.getElementById('new_password').value;
    const confirmPassword = document.getElementById('confirm_password').value;
    
    // 简单的前端验证
    if (!oldPassword || !newPassword || !confirmPassword) {
        showPasswordError('请填写所有字段');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showPasswordError('新密码和确认密码不一致');
        return;
    }
    
    if (newPassword.length < 6) {
        showPasswordError('新密码长度至少6位');
        return;
    }
    
    if (oldPassword === newPassword) {
        showPasswordError('新密码不能与旧密码相同');
        return;
    }
    
    // 禁用按钮，防止重复提交
    const saveBtn = document.getElementById('savePasswordBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>处理中...';
    
    try {
        const formData = new FormData();
        formData.append('old_password', oldPassword);
        formData.append('new_password', newPassword);
        formData.append('confirm_password', confirmPassword);
        
        const response = await fetch('update_password.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 显示成功消息
            showPasswordSuccess(result.message);
            
            // 3秒后关闭模态框
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
                modal.hide();
                resetPasswordForm();
            }, 3000);
        } else {
            showPasswordError(result.message);
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i>保存修改';
        }
    } catch (error) {
        console.error('密码修改失败:', error);
        showPasswordError('网络错误，请稍后重试');
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i>保存修改';
    }
}

// 显示密码错误消息
function showPasswordError(message) {
    const alertDiv = document.getElementById('passwordChangeAlert');
    if (!alertDiv) return;
    
    alertDiv.innerHTML = `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    // 5秒后自动消失
    setTimeout(() => {
        const alert = alertDiv.querySelector('.alert');
        if (alert) {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }
    }, 5000);
}

// 显示密码成功消息
function showPasswordSuccess(message) {
    const alertDiv = document.getElementById('passwordChangeAlert');
    if (!alertDiv) return;
    
    alertDiv.innerHTML = `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            <i class="bi bi-check-circle-fill me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}
