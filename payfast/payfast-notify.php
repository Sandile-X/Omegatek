<?php
/**
 * PayFast ITN (Instant Transaction Notification) Handler
 * This script is called by PayFast to notify of payment status
 * IMPORTANT: This must be publicly accessible and respond quickly
 */

require_once 'payfast-config.php';

// Log all incoming notifications
logPayFastTransaction('ITN Received', $_POST);

// Retrieve POST data
$pfData = $_POST;

// Get source IP
$sourceIP = $_SERVER['REMOTE_ADDR'] ?? '';

// Response to PayFast (must be sent before processing)
header('HTTP/1.0 200 OK');
flush();

// Validate IP address (security check)
if (!isPayFastIP($sourceIP)) {
    logPayFastTransaction('Invalid IP address', ['ip' => $sourceIP]);
    exit;
}

// Validate signature — use passphrase from .env if configured
if (!validatePayFastSignature($pfData, PAYFAST_PASSPHRASE)) {
    logPayFastTransaction('Invalid signature', $pfData);
    exit;
}

// Extract order ID from custom field
$orderId = $pfData['custom_str1'] ?? '';
if (empty($orderId)) {
    logPayFastTransaction('No order ID in notification', $pfData);
    exit;
}

// Load orders — data lives in admin/order_data/ not payfast/order_data/
$ordersFile = __DIR__ . '/../admin/order_data/orders.json';
if (!file_exists($ordersFile)) {
    logPayFastTransaction('Orders file not found', ['order_id' => $orderId]);
    exit;
}

$orders = json_decode(file_get_contents($ordersFile), true);
if (!$orders) {
    $orders = [];
}

// Find the order or load from session
$orderFound = false;
$orderIndex = -1;

foreach ($orders as $index => $order) {
    if ($order['orderId'] === $orderId) {
        $orderFound = true;
        $orderIndex = $index;
        break;
    }
}

// If order not found in file, try to get from session backup
// (PayFast orders are saved in session but not in file until payment confirmed)
if (!$orderFound) {
    session_start();
    if (isset($_SESSION['pending_payfast_order']) && $_SESSION['pending_payfast_order']['orderId'] === $orderId) {
        // Add the order from session to orders array
        $orders[] = $_SESSION['pending_payfast_order'];
        $orderIndex = count($orders) - 1;
        $orderFound = true;
        
        logPayFastTransaction('Order loaded from session', ['order_id' => $orderId]);
    }
}

if (!$orderFound) {
    logPayFastTransaction('Order not found in file or session', ['order_id' => $orderId]);
    exit;
}

// Get reference to the order
$order = &$orders[$orderIndex];

// Validate amount
if (!validatePayFastAmount($pfData['amount_gross'], $order['total'])) {
    logPayFastTransaction('Amount mismatch', [
        'order_id' => $orderId,
        'expected' => $order['total'],
        'received' => $pfData['amount_gross']
    ]);
    exit;
}

// Get payment status
$payment_status = $pfData['payment_status'] ?? '';

// Add PayFast transaction details to order
$order['payfast_transaction'] = [
    'pf_payment_id' => $pfData['pf_payment_id'] ?? '',
    'payment_status' => $payment_status,
    'amount_gross' => $pfData['amount_gross'] ?? '',
    'amount_fee' => $pfData['amount_fee'] ?? '',
    'amount_net' => $pfData['amount_net'] ?? '',
    'signature' => $pfData['signature'] ?? '',
    'processed_at' => date('Y-m-d H:i:s')
];

// Update order status based on payment status
switch ($payment_status) {
    case 'COMPLETE':
        $order['status'] = 'confirmed';
        $order['paymentStatus'] = 'paid';
        $order['statusHistory'][] = [
            'status' => 'confirmed',
            'timestamp' => date('Y-m-d H:i:s'),
            'note' => 'Payment successful via PayFast (Payment ID: ' . ($pfData['pf_payment_id'] ?? 'N/A') . ')'
        ];
        
        logPayFastTransaction('Payment completed successfully', [
            'order_id' => $orderId,
            'pf_payment_id' => $pfData['pf_payment_id'] ?? ''
        ]);
        
        // Send confirmation emails
        sendPaymentConfirmationEmail($order);
        sendAdminNotificationEmail($order);
        
        // Clear session data
        session_start();
        if (isset($_SESSION['pending_payfast_order'])) {
            unset($_SESSION['pending_payfast_order']);
        }
        break;
        
    case 'FAILED':
        $order['paymentStatus'] = 'failed';
        $order['statusHistory'][] = [
            'status' => 'pending',
            'timestamp' => date('Y-m-d H:i:s'),
            'note' => 'Payment failed via PayFast'
        ];
        
        logPayFastTransaction('Payment failed', [
            'order_id' => $orderId,
            'pf_payment_id' => $pfData['pf_payment_id'] ?? ''
        ]);
        break;
        
    case 'CANCELLED':
        $order['paymentStatus'] = 'cancelled';
        $order['statusHistory'][] = [
            'status' => 'pending',
            'timestamp' => date('Y-m-d H:i:s'),
            'note' => 'Payment cancelled by customer'
        ];
        
        logPayFastTransaction('Payment cancelled', [
            'order_id' => $orderId
        ]);
        break;
        
    default:
        logPayFastTransaction('Unknown payment status', [
            'order_id' => $orderId,
            'status' => $payment_status
        ]);
}

// Save updated orders
file_put_contents($ordersFile, json_encode($orders, JSON_PRETTY_PRINT));

logPayFastTransaction('Order updated and saved successfully', ['order_id' => $orderId]);

/**
 * Send payment confirmation email
 */
function sendPaymentConfirmationEmail($order) {
    $to = $order['customer']['email'];
    $subject = 'Payment Confirmed - Order ' . $order['orderId'];
    
    $message = "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #b30ce6, #9333ea); padding: 30px; text-align: center; color: white; border-radius: 12px 12px 0 0; }
                .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
                .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 8px; }
                .button { background: #b30ce6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1 style='margin: 0;'>Payment Confirmed!</h1>
                    <p style='margin: 10px 0 0;'>Your payment has been successfully processed</p>
                </div>
                
                <div class='content'>
                    <p>Hi {$order['customer']['fullName']},</p>
                    
                    <div class='success-box'>
                        <h2 style='color: #059669; margin-top: 0;'>✓ Payment Successful</h2>
                        <p style='margin: 5px 0;'><strong>Order Number:</strong> {$order['orderId']}</p>
                        <p style='margin: 5px 0;'><strong>Amount Paid:</strong> R" . number_format($order['total'], 2) . "</p>
                        <p style='margin: 5px 0;'><strong>Payment Method:</strong> Card Payment (PayFast)</p>
                    </div>
                    
                    <p>Your payment has been successfully processed and your order is now confirmed. We're preparing your items for dispatch and will notify you once shipped.</p>
                    
                    <center>
                        <a href='" . SITE_URL . "/order-tracking.html?order={$order['orderId']}' class='button' style='color: white;'>Track Your Order</a>
                    </center>
                    
                    <p style='margin-top: 30px; color: #666; font-size: 14px;'>
                        If you have any questions, please contact us at " . MERCHANT_EMAIL . " or call 073 653 8207.
                    </p>
                </div>
            </div>
        </body>
        </html>
    ";
    
    $headers = "From: Omegatek Solutions <noreply@omegateksolutions.co.za>\r\n";
    $headers .= "Reply-To: " . MERCHANT_EMAIL . "\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    
    mail($to, $subject, $message, $headers);
}

/**
 * Send admin notification email
 */
function sendAdminNotificationEmail($order) {
    $itemsHtml = '';
    foreach ($order['items'] as $item) {
        $itemTotal = $item['price'] * $item['quantity'];
        $itemsHtml .= "<tr><td>{$item['name']}</td><td>x{$item['quantity']}</td><td>R" . number_format($itemTotal, 2) . "</td></tr>";
    }
    
    $subject = 'New Paid Order - ' . $order['orderId'];
    
    $message = "
        <html>
        <body style='font-family: Arial, sans-serif;'>
            <h2 style='color: #10b981;'>✓ New PAID Order Received</h2>
            <p><strong>Order ID:</strong> {$order['orderId']}</p>
            <p><strong>Customer:</strong> {$order['customer']['fullName']}</p>
            <p><strong>Email:</strong> {$order['customer']['email']}</p>
            <p><strong>Phone:</strong> {$order['customer']['phone']}</p>
            <p><strong>Payment Method:</strong> PayFast (PAID)</p>
            <p><strong>Amount:</strong> R" . number_format($order['total'], 2) . "</p>
            <h3>Items:</h3>
            <table border='1' cellpadding='8'>
                <tr><th>Product</th><th>Quantity</th><th>Total</th></tr>
                {$itemsHtml}
            </table>
            <h3>Delivery Address:</h3>
            <p>
                {$order['address']['street']}<br>
                {$order['address']['suburb']}<br>
                {$order['address']['city']}, {$order['address']['province']}<br>
                {$order['address']['postalCode']}
            </p>
            <p><a href='" . SITE_URL . "/admin/orders-admin.html' style='background: #b30ce6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;'>View in Admin Dashboard</a></p>
        </body>
        </html>
    ";
    
    $headers = "From: Omegatek Solutions <noreply@omegateksolutions.co.za>\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    
    mail(MERCHANT_EMAIL, $subject, $message, $headers);
}

?>
