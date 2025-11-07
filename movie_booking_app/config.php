<?php
// config.php - Database Connection Configuration
// Do not output PHP errors to the browser (keeps API JSON clean)
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors.log');

$servername = "localhost";
$username   = "root";
$password   = "";
$dbname     = "movie_booking";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    error_log("DB connect error: " . $conn->connect_error);
    http_response_code(500);
    // stop - do not echo HTML or text here
    exit;
}
?>