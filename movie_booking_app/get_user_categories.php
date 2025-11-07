<?php
header('Content-Type: application/json');

$usersFile = __DIR__ . '/users.json';
$email = $_GET['email'] ?? '';

if (!$email) {
    echo json_encode(['categories' => []]);
    exit;
}

if (!file_exists($usersFile)) {
    echo json_encode(['categories' => []]);
    exit;
}

$contents = file_get_contents($usersFile);
$users = json_decode($contents ?: '[]', true) ?: [];

foreach ($users as $user) {
    if (strcasecmp($user['email'] ?? '', $email) === 0) {
        echo json_encode([
            'categories' => $user['categories'] ?? []
        ]);
        exit;
    }
}

echo json_encode(['categories' => []]);
?>