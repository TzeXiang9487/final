document.addEventListener('DOMContentLoaded', () => {
    const orderIdSpan = document.getElementById('order-id');
    const paymentTotalSpan = document.getElementById('payment-total');
    const payNowBtn = document.getElementById('pay-now-btn');

    // Get order data from localStorage
    const lastOrder = JSON.parse(localStorage.getItem('lastOrder'));

    if (lastOrder) {
        orderIdSpan.textContent = lastOrder.orderId || 'N/A';
        paymentTotalSpan.textContent = `RM ${lastOrder.total.toFixed(2)}`;
    } else {
        orderIdSpan.textContent = 'No order found.';
        paymentTotalSpan.textContent = 'RM 0.00';
        payNowBtn.disabled = true;
        // Optionally, redirect back to index.html if no order is found
        // window.location.href = 'index.html';
    }

    payNowBtn.addEventListener('click', () => {
        // In a real application, you would collect payment details here
        // (e.g., card number, expiry, CVC) and send them securely.

        // Simulate a payment request to payment.php
        // For simplicity, we just send the orderId and total
        const paymentData = {
            orderId: lastOrder ? lastOrder.orderId : null,
            amount: lastOrder ? lastOrder.total : 0,
            paymentMethod: document.querySelector('input[name="payment-method"]:checked').value
        };

        // Show a loading indicator (optional)
        payNowBtn.textContent = 'Processing...';
        payNowBtn.disabled = true;

        fetch('payment.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(paymentData),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Payment Success:', data);
            if (data.status === 'success') {
                // Payment successful, redirect to confirmation page
                // The confirmation.php will read 'lastOrder' from localStorage
                window.location.href = 'confirmation.php';
            } else {
                alert(`Payment failed: ${data.message || 'Unknown error.'}`);
                payNowBtn.textContent = 'Pay Now';
                payNowBtn.disabled = false;
            }
        })
        .catch(error => {
            console.error('Error during payment processing:', error);
            alert('An error occurred during payment. Please try again.');
            payNowBtn.textContent = 'Pay Now';
            payNowBtn.disabled = false;
        });
    });
});