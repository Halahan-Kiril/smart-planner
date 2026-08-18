<?php
// TRIGGER: successful login or when the app screen loads
session_start();
require 'db.php';

// user is not authenticated - Stop execution
if (!isset($_SESSION['user_id'])) { exit; }

$user_id = $_SESSION['user_id'];

/*prepare() - creates PDOStatement with SQL query
execute() - executes the query with $user_id
fetchAll(PDO::FETCH_ASSOC) - gets all query results as a PHP associative array(key = column name: id, title, etc.)
json_encode() - converts PHP array to JSON string
echo - sends JSON to JS as HTTP response (received via fetch())*/

$stmt = $pdo->prepare('SELECT * FROM tasks WHERE user_id = ?');
$stmt->execute([$user_id]);

// fetchAll retrieves ALL found rows as a list (array).
// json_encode converts this array into a JSON format string and sends it to the browser.
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
?>