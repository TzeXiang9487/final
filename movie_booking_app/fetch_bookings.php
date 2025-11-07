<?php
include 'config.php';
header('Content-Type: application/json; charset=utf-8');

$response = ['status' => 'error', 'message' => 'No bookings found.', 'bookings' => []];

// --- IMPROVEMENT: Get filter parameters from GET request ---
$movieName = $_GET['movie'] ?? null;
$location = $_GET['location'] ?? null;
$time = $_GET['time'] ?? null;
$selectedDate = $_GET['date'] ?? null;

// Build the WHERE clause dynamically
$whereClauses = [];
$bindTypes = '';
$bindParams = [];

if ($movieName) {
    $whereClauses[] = "movie_name = ?";
    $bindTypes .= "s";
    $bindParams[] = $movieName;
}
if ($location) {
    $whereClauses[] = "location = ?";
    $bindTypes .= "s";
    $bindParams[] = $location;
}
if ($time) {
    $whereClauses[] = "time = ?";
    $bindTypes .= "s";
    $bindParams[] = $time;
}
if ($selectedDate) {
    $whereClauses[] = "selected_date = ?";
    $bindTypes .= "s";
    $bindParams[] = $selectedDate;
}

$sql = "SELECT * FROM bookings";
if (!empty($whereClauses)) {
    $sql .= " WHERE " . implode(" AND ", $whereClauses);
}
$sql .= " ORDER BY id DESC";

try {
    if (!empty($bindParams)) {
        // Use prepared statement for filtering
        $stmt = $conn->prepare($sql);
        // Using variadic arguments (...) to bind parameters dynamically
        $stmt->bind_param($bindTypes, ...$bindParams);
        $stmt->execute();
        $result = $stmt->get_result();
    } else {
        // If no filters are provided (e.g., for admin panel), run simple query
        $result = $conn->query($sql);
    }

    if ($result && $result->num_rows > 0) {
        // ... (rest of the logic for normalizing bookings is the same and remains below)
        $bookings = [];
        while ($row = $result->fetch_assoc()) {
            // Normalize selected_date (support old booking_date)
            $row['selected_date'] = $row['selected_date'] ?? $row['booking_date'] ?? '';

            // Normalize seats_list -> always array
            if (!empty($row['seats_list'])) {
                $decoded = json_decode($row['seats_list'], true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $row['seats_list'] = $decoded;
                } else {
                    // fallback: comma-separated string
                    $row['seats_list'] = array_values(array_filter(array_map('trim', explode(',', $row['seats_list']))));
                }
            } else {
                $row['seats_list'] = [];
            }

            // Normalize food_items -> array of objects or strings
            if (!empty($row['food_items'])) {
                $decodedFood = json_decode($row['food_items'], true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decodedFood)) {
                    // convert plain strings to {name: ...} for consistency
                    $normalized = [];
                    foreach ($decodedFood as $fi) {
                        if (is_string($fi)) $normalized[] = ['name' => $fi];
                        elseif (is_array($fi) && isset($fi['name'])) $normalized[] = $fi;
                        else $normalized[] = is_array($fi) ? $fi : ['name' => (string)$fi];
                    }
                    $row['food_items'] = $normalized;
                } else {
                    // fallback: comma-separated string -> array of objects
                    $parts = array_values(array_filter(array_map('trim', explode(',', $row['food_items']))));
                    $row['food_items'] = array_map(function($i){ return ['name' => $i]; }, $parts);
                }
            } else {
                $row['food_items'] = [];
            }

            $bookings[] = $row;
        }

        $response = [
            'status' => 'success',
            'message' => 'Bookings fetched successfully',
            'bookings' => $bookings
        ];
    } else {
        $response['message'] = 'No bookings found.';
    }
    
    if (isset($stmt)) $stmt->close();

} catch (Exception $e) {
    error_log("fetch_bookings error: " . $e->getMessage());
    $response = ['status' => 'error', 'message' => 'Server error while fetching bookings.'];
}

echo json_encode($response);
$conn->close();
?>