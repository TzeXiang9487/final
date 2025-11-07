<?php
$file = __DIR__ . '/bookings.json';
$content = json_encode(['test' => 'data'], JSON_PRETTY_PRINT);
if (file_put_contents($file, $content)) {
    echo "Success: File written successfully";
} else {
    echo "Error: Could not write to file";
}
?>