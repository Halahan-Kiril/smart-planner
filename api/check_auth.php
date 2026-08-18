<?php
/* TRIGGER: window.onload() (in checkAuth() )
LOGIC: Checks if a valid session exists so JS knows whether to show the Kanban board or the login form.*/
session_start();

// If the user_id variable exists in the server session, it means the user is logged in
if (isset($_SESSION['user_id'])) {
    echo json_encode(['authenticated' => true]); 
} else {
    echo json_encode(['authenticated' => false]); // false - Show the login form
}
?>