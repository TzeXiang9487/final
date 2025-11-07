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
$categories = $data['categories'] ?? [];

if (!$email || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'email and password required']);
    exit;
}

if (!file_exists($usersFile)) {
    @file_put_contents($usersFile, "[]");
}

$fp = @fopen($usersFile, 'c+');
if (!$fp) {
    http_response_code(500);
    echo json_encode(['error' => 'cannot open users file']);
    exit;
}

flock($fp, LOCK_EX);
$contents = stream_get_contents($fp);
rewind($fp);
$users = json_decode($contents ?: '[]', true) ?: [];

foreach ($users as $u) {
    if (strcasecmp($u['email'] ?? '', $email) === 0) {
        flock($fp, LOCK_UN);
        fclose($fp);
        http_response_code(409);
        echo json_encode(['error' => 'account exists']);
        exit;
    }
}

$passwordHash = password_hash($password, PASSWORD_DEFAULT);
$users[] = [
    'email' => $email,
    'passwordHash' => $passwordHash,
    'categories' => $categories,
    'createdAt' => date('c')
];

ftruncate($fp, 0);
rewind($fp);
fwrite($fp, json_encode($users, JSON_PRETTY_PRINT));
flock($fp, LOCK_UN);
fclose($fp);

// Also store in localStorage for immediate frontend access (optional)
$userData = [
    'email' => $email,
    'categories' => $categories,
    'createdAt' => date('c')
];

// This will be used by the frontend to show sparkle icons immediately
$responseData = [
    'ok' => true,
    'message' => "Account created successfully.",
    'userData' => $userData
];

echo json_encode($responseData);
?>