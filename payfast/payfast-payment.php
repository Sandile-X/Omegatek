<?php
/**
 * PayFast Payment Initiation
 * Redirects customer to PayFast payment page
 */

session_start();
require_once 'payfast-config.php';

// Get order data from session (set by orders-api.php)
if (!isset($_SESSION['pending_payfast_order'])) {
    header('Location: checkout.html');
    exit;
}

$orderData = $_SESSION['pending_payfast_order'];

// Prepare PayFast payment data
$data = [
    // Merchant details
    'merchant_id' => PAYFAST_MERCHANT_ID,
    'merchant_key' => PAYFAST_MERCHANT_KEY,
    'return_url' => PAYFAST_RETURN_URL,
    'cancel_url' => PAYFAST_CANCEL_URL,
    'notify_url' => PAYFAST_NOTIFY_URL,
    
    // Buyer details
    'name_first' => explode(' ', $orderData['customer']['fullName'])[0],
    'name_last' => implode(' ', array_slice(explode(' ', $orderData['customer']['fullName']), 1)) ?: 'Customer',
    'email_address' => $orderData['customer']['email'],
    'cell_number' => preg_replace('/[^0-9]/', '', $orderData['customer']['phone']),
    
    // Transaction details
    'amount' => number_format($orderData['total'], 2, '.', ''),
    'item_name' => 'Order ' . $orderData['orderId'],
    'item_description' => count($orderData['items']) . ' item(s) from Omegatek Solutions',
    'custom_str1' => $orderData['orderId'], // Store order ID for reference
    
    // Transaction options
    'email_confirmation' => '1',
    'confirmation_address' => MERCHANT_EMAIL,
];

// Generate signature
$signature = generatePayFastSignature($data);
$data['signature'] = $signature;

// Log payment initiation
logPayFastTransaction('Payment initiated', [
    'order_id' => $orderData['orderId'],
    'amount' => $data['amount'],
    'customer' => $orderData['customer']['email']
]);

// Get PayFast URL
$payfastUrl = getPayFastUrl();

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redirecting to PayFast...</title>
    <link rel="icon" type="image/png" href="images2/OMEGATEK%20ICON%20ONLY.png">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #b30ce6 0%, #9333ea 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            color: white;
        }
        
        .container {
            text-align: center;
            padding: 3rem;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border-radius: 24px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 500px;
        }
        
        .spinner {
            width: 80px;
            height: 80px;
            margin: 0 auto 2rem;
            border: 8px solid rgba(255, 255, 255, 0.3);
            border-top: 8px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            font-weight: 700;
        }
        
        p {
            font-size: 1.2rem;
            opacity: 0.9;
            line-height: 1.6;
        }
        
        .order-info {
            background: rgba(255, 255, 255, 0.15);
            padding: 1.5rem;
            border-radius: 12px;
            margin: 2rem 0;
        }
        
        .order-info p {
            margin: 0.5rem 0;
        }
        
        .manual-submit {
            margin-top: 2rem;
        }
        
        .btn {
            background: white;
            color: #b30ce6;
            padding: 1rem 2rem;
            border: none;
            border-radius: 12px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: transform 0.3s;
        }
        
        .btn:hover {
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <h1>Redirecting to PayFast</h1>
        <p>Please wait while we redirect you to our secure payment partner...</p>
        
        <div class="order-info">
            <p><strong>Order:</strong> <?php echo htmlspecialchars($orderData['orderId']); ?></p>
            <p><strong>Amount:</strong> R<?php echo number_format($orderData['total'], 2); ?></p>
        </div>
        
        <form action="<?php echo $payfastUrl; ?>" method="post" id="payfastForm" style="display: none;">
            <?php foreach ($data as $key => $value): ?>
                <input type="hidden" name="<?php echo htmlspecialchars($key); ?>" value="<?php echo htmlspecialchars($value); ?>">
            <?php endforeach; ?>
        </form>
        
        <div class="manual-submit">
            <p style="font-size: 0.9rem; opacity: 0.8; margin-bottom: 1rem;">If you are not redirected automatically:</p>
            <button onclick="document.getElementById('payfastForm').submit()" class="btn">
                Click Here to Continue
            </button>
        </div>
    </div>
    
    <script>
        // Auto-submit form after 2 seconds
        setTimeout(function() {
            document.getElementById('payfastForm').submit();
        }, 2000);
    </script>
</body>
</html>
