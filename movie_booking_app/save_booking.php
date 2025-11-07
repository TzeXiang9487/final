<?php
// save_booking.php - Fixed version

// Enable ALL error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

try {
    error_log("=== SAVE_BOOKING.PHP STARTED ===");
    
    // Include config
    include 'config.php';
    
    // Check if database connection exists
    if (!isset($conn)) {
        throw new Exception('Database connection not established');
    }
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Invalid request method. Expected POST, got ' . $_SERVER['REQUEST_METHOD']);
    }
    
    // Get the raw POST data
    $json_data = file_get_contents('php://input');
    
    if (empty($json_data)) {
        throw new Exception('No POST data received');
    }
    
    $data = json_decode($json_data, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('JSON decode error: ' . json_last_error_msg());
    }
    
    if (empty($data)) {
        throw new Exception('Empty data array after JSON decode');
    }
    
    // Extract data with validation
    $userEmail = $data['userEmail'] ?? 'guest@example.com';
    $movieName = $data['movie']['movie'] ?? 'N/A';
    $location = $data['movie']['location'] ?? 'N/A';
    $time = $data['movie']['time'] ?? 'N/A';
    $selectedDate = $data['movie']['date'] ?? 'N/A';
    
    $seatsList = json_encode($data['seats']['seats'] ?? []);
    $seatsCount = (int)($data['seats']['count'] ?? 0);
    $seatsPrice = (float)($data['seats']['price'] ?? 0.00);
    $foodItems = json_encode($data['food']['items'] ?? []);
    $foodTotal = (float)($data['food']['total'] ?? 0.00);
    $grandTotal = (float)($data['total'] ?? 0.00);
    
    // Payment details
    $cardholderName = $data['paymentDetails']['cardName'] ?? 'N/A';
    $cardNumber = $data['paymentDetails']['cardNumber'] ?? '';
    $cardNumberMasked = substr($cardNumber, 0, 4) . 'XXXXXXXX' . substr($cardNumber, -4);
    
    // Prepare SQL statement (without booking_date)
    $sql = "INSERT INTO bookings (
        user_email, movie_name, location, time, selected_date, 
        seats_list, seats_count, seats_price, food_items, food_total, 
        grand_total, cardholder_name, card_number_masked
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    error_log("SQL: " . $sql);
    
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception('Prepare failed: ' . $conn->error);
    }
    
    // Debug: Log the values
    error_log("Values: userEmail=$userEmail, movieName=$movieName, location=$location, time=$time, selectedDate=$selectedDate, seatsCount=$seatsCount, seatsPrice=$seatsPrice, foodTotal=$foodTotal, grandTotal=$grandTotal");
    
    // FIXED: Correct bind_param parameters
    // "sssssisddsss" means:
    // s=string, s=string, s=string, s=string, s=string, s=string, i=integer, s=string, d=double, d=double, s=string, s=string, s=string
    $bind_result = $stmt->bind_param(
        "ssssssidsssss", 
        $userEmail, 
        $movieName, 
        $location, 
        $time, 
        $selectedDate, 
        $seatsList, 
        $seatsCount, 
        $seatsPrice, 
        $foodItems, 
        $foodTotal, 
        $grandTotal, 
        $cardholderName, 
        $cardNumberMasked
    );
    
    if (!$bind_result) {
        throw new Exception('Bind param failed: ' . $stmt->error);
    }
    
    // Execute statement
    $execute_result = $stmt->execute();
    
    if (!$execute_result) {
        throw new Exception('Execute failed: ' . $stmt->error);
    }
    
    $response = [
        'status' => 'success', 
        'message' => 'Booking confirmed!', 
        'orderId' => $conn->insert_id
    ];
    
    $stmt->close();
    
} catch (Exception $e) {
    error_log("ERROR: " . $e->getMessage());
    $response = [
        'status' => 'error', 
        'message' => 'Server error: ' . $e->getMessage()
    ];
}

echo json_encode($response);

if (isset($conn)) {
    $conn->close();
}
?>