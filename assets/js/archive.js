
// 加载档案内容
function loadArchiveContent() {
    fetchTemplate('pages/archive_content.html')
        .then(html => {
            updateContent(html);
            addAnimationClasses();
        })
        .catch(error => {
            console.error('加载档案内容失败:', error);
            showError('加载档案页面失败');
        });
}

