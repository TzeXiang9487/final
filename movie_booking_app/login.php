<?php
header('Content-Type: application/json');

$usersFile = __DIR__ . '/users.json';
$body = file_get_contents('php://input');
$data = [];
if (!empty($body) && (strpos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false)) {
    $data = json_decode($body, true) ?? [];
} else {
    $data['email'] = $_POST['email'] ?? '';
    $data['password'] = $_POST['password'] ?? '';
}

$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if (!$email || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'email and password required']);
    exit;
}

if (!file_exists($usersFile)) {
    http_response_code(401);
    echo json_encode(['error' => 'invalid credentials']);
    exit;
}

$contents = file_get_contents($usersFile);
$users = json_decode($contents ?: '[]', true) ?: [];

foreach ($users as $u) {
    if (strcasecmp($u['email'] ?? '', $email) === 0) {
        $hash = $u['passwordHash'] ?? '';
        // NOTE: Keeping file-based user management for functionality, but this should be database-based.
        if ($hash && password_verify($password, $hash)) { 
            echo json_encode(['ok' => true, 'email' => $email]);
            exit;
        }
    }
}

http_response_code(401);
echo json_encode(['ok' => false, 'error' => 'invalid credentials']);
exit;