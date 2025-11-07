<?php
include 'config.php';

header('Content-Type: application/json');

// Initialize response
$response = ['status' => 'error', 'message' => 'Invalid request'];

if ($_SERVER['REQUEST_METHOD'] === 'DELETE' || $_SERVER['REQUEST_METHOD'] === 'GET') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    
    if ($id) {
        // First check if booking exists
        $stmt = $conn->prepare("SELECT id FROM bookings WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            // Booking exists, proceed with deletion
            $stmt = $conn->prepare("DELETE FROM bookings WHERE id = ?");
            $stmt->bind_param("i", $id);
            
            if ($stmt->execute()) {
                $response = [
                    'status' => 'success',
                    'message' => 'Booking deleted successfully',
                    'id' => $id
                ];
            } else {
                $response['message'] = 'Failed to delete booking: ' . $conn->error;
            }
        } else {
            $response['message'] = 'Booking not found with ID: ' . $id;
        }
        $stmt->close();
    }
}

$conn->close();
echo json_encode($response);