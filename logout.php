<?php
session_start();
// 清除所有Session变量
$_SESSION = array();
// 销毁Session
session_destroy();
// 跳转到登录页
header('Location: login.php');
exit();
?>