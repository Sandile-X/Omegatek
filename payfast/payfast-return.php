<?php
/**
 * PayFast Return Handler
 * Customer is redirected here after successful payment
 */

session_start();
require_once 'payfast-config.php';

// Get order ID from GET parameter or session
$orderId = $_GET['order'] ?? ($_SESSION['pending_payfast_order']['orderId'] ?? '');

// Clear session data
if (isset($_SESSION['pending_payfast_order'])) {
    unset($_SESSION['pending_payfast_order']);
}

// If no order ID, redirect to homepage
if (empty($orderId)) {
    header('Location: index.html');
    exit;
}

// Load order data
$ordersFile = __DIR__ . '/order_data/orders.json';
$order = null;

if (file_exists($ordersFile)) {
    $orders = json_decode(file_get_contents($ordersFile), true);
    foreach ($orders as $o) {
        if ($o['orderId'] === $orderId) {
            $order = $o;
            break;
        }
    }
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Successful | Omegatek Solutions</title>
    <link rel="icon" type="image/png" href="images2/OMEGATEK%20ICON%20ONLY.png">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#b30ce6',
                    }
                }
            }
        }
    </script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
        }
        
        .success-animation {
            animation: scaleIn 0.5s ease-out;
        }
        
        @keyframes scaleIn {
            0% {
                transform: scale(0);
                opacity: 0;
            }
            50% {
                transform: scale(1.1);
            }
            100% {
                transform: scale(1);
                opacity: 1;
            }
        }
        
        .fade-in {
            animation: fadeIn 0.8s ease-out 0.3s both;
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    </style>
</head>
<body class="flex items-center justify-center p-4">
    <div class="max-w-2xl w-full">
        <!-- Success Card -->
        <div class="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <!-- Header with gradient -->
            <div class="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center text-white">
                <div class="success-animation mb-4">
                    <div class="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full">
                        <i class="fas fa-check text-5xl text-green-500"></i>
                    </div>
                </div>
                <h1 class="text-4xl font-bold mb-2">Payment Successful!</h1>
                <p class="text-xl opacity-90">Thank you for your payment</p>
            </div>
            
            <!-- Content -->
            <div class="p-8 fade-in">
                <?php if ($order): ?>
                    <div class="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-6">
                        <div class="flex items-start gap-3">
                            <i class="fas fa-info-circle text-green-600 text-2xl mt-1"></i>
                            <div>
                                <h3 class="font-bold text-green-900 text-lg mb-2">Payment Confirmed</h3>
                                <p class="text-green-800">Your payment has been successfully processed. Your order is now confirmed and being prepared for dispatch.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="space-y-4 mb-8">
                        <div class="flex justify-between py-3 border-b">
                            <span class="text-gray-600 font-medium">Order Number:</span>
                            <span class="font-bold text-primary text-lg"><?php echo htmlspecialchars($orderId); ?></span>
                        </div>
                        <div class="flex justify-between py-3 border-b">
                            <span class="text-gray-600 font-medium">Payment Method:</span>
                            <span class="font-semibold">Card Payment (PayFast)</span>
                        </div>
                        <div class="flex justify-between py-3 border-b">
                            <span class="text-gray-600 font-medium">Amount Paid:</span>
                            <span class="font-bold text-xl text-green-600">R<?php echo number_format($order['total'], 2); ?></span>
                        </div>
                        <div class="flex justify-between py-3 border-b">
                            <span class="text-gray-600 font-medium">Status:</span>
                            <span class="bg-green-100 text-green-800 px-4 py-1 rounded-full font-semibold">Confirmed</span>
                        </div>
                    </div>
                    
                    <div class="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
                        <div class="flex items-start gap-3">
                            <i class="fas fa-envelope text-blue-600 text-2xl mt-1"></i>
                            <div>
                                <h3 class="font-bold text-blue-900 mb-1">Confirmation Email Sent</h3>
                                <p class="text-blue-800 text-sm">We've sent a confirmation email to <strong><?php echo htmlspecialchars($order['customer']['email']); ?></strong> with your order details and receipt.</p>
                            </div>
                        </div>
                    </div>
                <?php else: ?>
                    <div class="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-6">
                        <div class="flex items-start gap-3">
                            <i class="fas fa-exclamation-triangle text-yellow-600 text-2xl mt-1"></i>
                            <div>
                                <h3 class="font-bold text-yellow-900 mb-1">Payment Processing</h3>
                                <p class="text-yellow-800">Your payment is being processed. You'll receive a confirmation email shortly.</p>
                                <p class="text-yellow-800 mt-2">Order Reference: <strong><?php echo htmlspecialchars($orderId); ?></strong></p>
                            </div>
                        </div>
                    </div>
                <?php endif; ?>
                
                <!-- Action Buttons -->
                <div class="flex flex-col sm:flex-row gap-4">
                    <a href="order-tracking.html?order=<?php echo urlencode($orderId); ?>" 
                       class="flex-1 bg-primary text-white text-center py-4 px-6 rounded-xl font-semibold text-lg hover:opacity-90 transition-all transform hover:scale-105 shadow-lg">
                        <i class="fas fa-search mr-2"></i>Track Your Order
                    </a>
                    <a href="products.html" 
                       class="flex-1 bg-gray-200 text-gray-800 text-center py-4 px-6 rounded-xl font-semibold text-lg hover:bg-gray-300 transition-all transform hover:scale-105">
                        <i class="fas fa-shopping-bag mr-2"></i>Continue Shopping
                    </a>
                </div>
                
                <div class="text-center mt-8">
                    <a href="index.html" class="text-primary hover:underline font-medium">
                        <i class="fas fa-home mr-2"></i>Return to Homepage
                    </a>
                </div>
            </div>
        </div>
        
        <!-- Additional Info -->
        <div class="mt-6 text-center text-gray-600">
            <p class="mb-2">Need help? Contact us:</p>
            <p><i class="fas fa-envelope mr-2"></i>sales@omegateksolutions.co.za</p>
            <p><i class="fas fa-phone mr-2"></i>073 653 8207</p>
        </div>
    </div>
    
    <script>
        // Redirect to order confirmation page after a delay
        <?php if ($order): ?>
        setTimeout(function() {
            window.location.href = 'order-confirmation.html?order=<?php echo urlencode($orderId); ?>';
        }, 5000);
        <?php endif; ?>
    </script>
</body>
</html>
