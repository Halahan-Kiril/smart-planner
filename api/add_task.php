<?php
// Trigger: submit the "Add Task" form
session_start();
if (!isset($_SESSION['user_id'])) { exit; }
require 'db.php';

$id = $_POST['id'];
$title = $_POST['title'];
$description = $_POST['description'] ?? '';
$due_date = $_POST['due_date'] ?? '';
$status = $_POST['status'] ?? 'todo';
$user_id = $_SESSION['user_id'];

$stmt = $pdo->prepare("INSERT INTO tasks (id, user_id, title, description, due_date, status) VALUES (?, ?, ?, ?, ?, ?)");  //prepare() returns PDOStatement object
$success = $stmt->execute([$id, $user_id, $title, $description, $due_date, $status]);
?>