// 加载通知内容
function loadNoticesContent() {
    fetchTemplate('pages/notices_content.html')
        .then(html => {
            updateContent(html);
            addAnimationClasses();
        })
        .catch(error => {
            console.error('加载通知内容失败:', error);
            showError('加载通知页面失败');
        });
}

