<?php //TRIGGER: user submits the Login form
session_start();
require 'db.php';

$username = $_POST['username'];
$password = $_POST['password'];

$stmt = $pdo->prepare('SELECT id, password_hash FROM users WHERE username = ?');
$stmt->execute([$username]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);// Get data as an array

// Check: 
// 1. $user (was the username found at all?)
// 2. password_verify - a smart PHP function. It takes the entered password, 
// takes the hash from the DB, and mathematically checks if they match.
if ($user && password_verify($password, $user['password_hash'])) {
    // Regenerate ID to prevent Session Fixation attacks
//Nach einem erfolgreichen Login ändern die Session-ID, damit die alte ID nicht verwendet werden kann,
// um auf die authentifizierte Session zuzugreifen.
    session_regenerate_id(true);

    // correct password - Save the user ID in the Session
    $_SESSION['user_id'] = $user['id'];
    
    echo json_encode(['success' => true, 'message' => 'Logged in successfully']);
} else {
    // Incorrect password or user
    echo json_encode(['success' => false, 'message' => 'Invalid username or password']);
}
?>