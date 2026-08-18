<?php //TRIGGER: user clicks the "Logout" button
session_start(); // Open/access the current session
session_destroy(); // Delete all session data
?>