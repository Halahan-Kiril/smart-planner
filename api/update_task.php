<?php //TRIGGER: task is dropped into a new column (Drag & Drop) or status is changed via dropdown List on mobile
session_start();
if (!isset($_SESSION['user_id'])) { exit; }
require 'db.php';

$id = $_POST['id'];
$status = $_POST['status'];
$user_id = $_SESSION['user_id'];

$stmt = $pdo->prepare("UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?");
$success = $stmt->execute([$status, $id, $user_id]);
/* :name
$stmt = $pdo->prepare( "UPDATE tasks SET status = :status WHERE id = :id");
$stmt->execute([
    "status" => $data['status'],
    "id" => $data['id']
]);
*/
?>