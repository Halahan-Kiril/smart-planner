<?php //TRIGGER: user submits the Sign Up form
session_start();
require 'db.php';

$username = $_POST['username'];
$password = $_POST['password'];

// Check if the username is already taken
$stmt = $pdo->prepare('SELECT id FROM users WHERE username = ?');
$stmt->execute([$username]);

if ($stmt->fetch()) {// If fetch() found something (returned a row)
    // Respond to the frontend with a JSON error and terminate the script
    echo json_encode(['success' => false, 'message' => 'Username already taken']);
    exit;
}

$hashed_password = password_hash($password, PASSWORD_DEFAULT);

// Save the new user to the DB
$insertStmt = $pdo->prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
$insertStmt->execute([$username, $hashed_password]);

// Get the ID of the newly created user
$new_user_id = $pdo->lastInsertId(); //Returns the ID of the last inserted record into DB through this PDO connection

//Before the user gets authenticated, generate a new session ID to prevent Session Fixation attacks
session_regenerate_id(true);

$_SESSION['user_id'] = $new_user_id;

echo json_encode(['success' => true, 'message' => 'Registered successfully']);
?>