<?php //TRIGGER: user clicks Delete (X) button on a task card.
session_start();
if (!isset($_SESSION['user_id'])) { exit; }
require 'db.php';

$id = $_POST['id'] ?? null;
$user_id = $_SESSION['user_id'];

if (!$id) {
    echo json_encode(['success' => false]);
    exit;
}

$stmt = $pdo->prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?");
$success = $stmt->execute([$id, $user_id]);

echo json_encode(['success' => $success]);
?>