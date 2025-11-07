<?php
// upload_image.php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $imageUrl = $_POST['image_url'] ?? '';
    
    if (empty($imageUrl)) {
        echo json_encode(['status' => 'error', 'message' => 'No image URL provided']);
        exit;
    }
    
    // Clean the URL - remove any problematic characters for filename
    $cleanUrl = $imageUrl;
    
    // Get image content with proper headers
    $context = stream_context_create([
        'http' => [
            'header' => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\r\n"
        ]
    ]);
    
    $imageData = @file_get_contents($cleanUrl, false, $context);
    
    if ($imageData === false) {
        // Try with cURL as alternative
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $cleanUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        $imageData = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            echo json_encode(['status' => 'error', 'message' => 'Could not download image from URL']);
            exit;
        }
    }
    
    // Create images directory if it doesn't exist - CHANGED PATH
    $uploadDir = 'C:/xampp/htdocs/movie_booking_app/image/movie/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    // Extract and clean filename from URL
    $parsedUrl = parse_url($cleanUrl);
    $path = $parsedUrl['path'] ?? '';
    $pathInfo = pathinfo($path);
    
    // Use the original filename or create one
    $filename = $pathInfo['filename'] ?? 'image';
    $extension = $pathInfo['extension'] ?? 'jpg';
    
    // Sanitize filename
    $filename = preg_replace('/[^a-zA-Z0-9_-]/', '_', $filename);
    $fullFilename = $filename . '.' . $extension;
    
    // Save image
    $filePath = $uploadDir . $fullFilename;
    if (file_put_contents($filePath, $imageData)) {
        // CHANGED: Return path starting from image/movie/
        $relativePath = 'image/movie/' . $fullFilename;
        echo json_encode([
            'status' => 'success', 
            'message' => 'Image uploaded successfully!',
            'path' => $relativePath
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to save image']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
}
?>