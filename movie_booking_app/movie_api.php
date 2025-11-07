<?php
// Set the content type header to application/json
header('Content-Type: application/json');

// Define the file path for the movie data
$json_file = 'movie_data.json';

/**
 * Reads movie data from the JSON file.
 * @param string $file The path to the JSON file.
 * @return array The decoded movie data array, or an empty array on error.
 */
function read_movies($file) {
    if (!file_exists($file)) {
        return [];
    }
    // Read the file content
    $json_data = file_get_contents($file);
    // Decode JSON into an associative array, return empty array if decoding fails
    return json_decode($json_data, true) ?: [];
}

/**
 * Writes movie data back to the JSON file.
 * @param string $file The path to the JSON file.
 * @param array $data The movie data array to encode and write.
 * @return bool True on success, false on failure.
 */
function write_movies($file, $data) {
    // Encode data with pretty printing for readability
    $json_data = json_encode($data, JSON_PRETTY_PRINT);
    // Write content, using LOCK_EX to prevent concurrent write issues
    return file_put_contents($file, $json_data, LOCK_EX) !== false;
}

// Get the request method
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // --- READ Operation ---
        $movies = read_movies($json_file);
        echo json_encode(['status' => 'success', 'movies' => $movies]);
        break;

    case 'POST':
        // --- CREATE Operation (Add Movie) ---
        $movies = read_movies($json_file);
        // Get JSON input from the request body
        $input = json_decode(file_get_contents('php://input'), true);

        // Validate required fields
        if (!isset($input['title'], $input['description'], $input['trailer'], $input['image'])) {
            http_response_code(400); // Bad Request
            echo json_encode(['status' => 'error', 'message' => 'Missing required fields.']);
            exit;
        }

        $title = trim($input['title']);
        
        // Check if the movie already exists
        if (isset($movies[$title])) {
            http_response_code(409); // Conflict
            echo json_encode(['status' => 'error', 'message' => "Movie '{$title}' already exists."]);
            exit;
        }

// Add the new movie data
$movies[$title] = [
    'description' => $input['description'],
    'trailer' => $input['trailer'],
    'image' => $input['image'],
    'rating' => isset($input['rating']) ? floatval($input['rating']) : null,
    'labels' => isset($input['labels']) ? array_map('trim', explode(',', $input['labels'])) : []
];

        // Save the updated list
        if (write_movies($json_file, $movies)) {
            echo json_encode(['status' => 'success', 'message' => "Movie '{$title}' added successfully."]);
        } else {
            http_response_code(500); // Internal Server Error
            echo json_encode(['status' => 'error', 'message' => 'Failed to save movie data. Check file permissions on movie_data.json.']);
        }
        break;

    case 'DELETE':
        // --- DELETE Operation ---
        $movies = read_movies($json_file);
        // Get the movie title from the query string
        $title_to_delete = $_GET['title'] ?? null;

        if (!$title_to_delete) {
            http_response_code(400); // Bad Request
            echo json_encode(['status' => 'error', 'message' => 'Missing movie title for deletion.']);
            exit;
        }

        // Check if the movie exists
        if (!isset($movies[$title_to_delete])) {
            http_response_code(404); // Not Found
            echo json_encode(['status' => 'error', 'message' => "Movie '{$title_to_delete}' not found."]);
            exit;
        }

        // Remove the movie
        unset($movies[$title_to_delete]);

        // Save the updated list
        if (write_movies($json_file, $movies)) {
            echo json_encode(['status' => 'success', 'message' => "Movie '{$title_to_delete}' deleted successfully."]);
        } else {
            http_response_code(500); // Internal Server Error
            echo json_encode(['status' => 'error', 'message' => 'Failed to save data after deletion. Check file permissions.']);
        }
        break;

    default:
        // --- Handle other methods ---
        http_response_code(405); // Method Not Allowed
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed.']);
        break;
        
case 'PUT':
    // --- UPDATE Operation ---
    $movies = read_movies($json_file);
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (!isset($input['original_title'], $input['title'], $input['description'], $input['trailer'], $input['image'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Missing required fields.']);
        exit;
    }
    
    $originalTitle = trim($input['original_title']);
    $newTitle = trim($input['title']);
    
    // Check if original movie exists
    if (!isset($movies[$originalTitle])) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => "Movie '{$originalTitle}' not found."]);
        exit;
    }
    
    // If title changed, check if new title already exists
    if ($originalTitle !== $newTitle && isset($movies[$newTitle])) {
        http_response_code(409);
        echo json_encode(['status' => 'error', 'message' => "Movie '{$newTitle}' already exists."]);
        exit;
    }
    
    // Get the movie data
    $movieData = $movies[$originalTitle];
    
    // Remove old entry if title changed
    if ($originalTitle !== $newTitle) {
        unset($movies[$originalTitle]);
    }
    
    // Update movie data
    $movies[$newTitle] = [
        'description' => $input['description'],
        'trailer' => $input['trailer'],
        'image' => $input['image'],
        'rating' => isset($input['rating']) ? floatval($input['rating']) : null,
        'labels' => isset($input['labels']) ? array_map('trim', explode(',', $input['labels'])) : []
    ];
    
    // Save updated data
    if (write_movies($json_file, $movies)) {
        echo json_encode(['status' => 'success', 'message' => "Movie updated successfully."]);
    } else {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Failed to save movie data.']);
    }
    break;
}
?>