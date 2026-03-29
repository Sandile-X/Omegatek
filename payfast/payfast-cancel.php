<?php
/**
 * PayFast Cancel Handler
 * Customer is redirected here when payment is cancelled
 */

session_start();

// Get order ID if available
$orderId = $_GET['order'] ?? ($_SESSION['pending_payfast_order']['orderId'] ?? '');

// Clear session data
if (isset($_SESSION['pending_payfast_order'])) {
    unset($_SESSION['pending_payfast_order']);
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Cancelled | Omegatek Solutions</title>
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
    </style>
</head>
<body class="flex items-center justify-center p-4">
    <div class="max-w-2xl w-full">
        <!-- Cancel Card -->
        <div class="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <!-- Header -->
            <div class="bg-gradient-to-r from-orange-500 to-red-600 p-8 text-center text-white">
                <div class="mb-4">
                    <div class="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full">
                        <i class="fas fa-times text-5xl text-red-500"></i>
                    </div>
                </div>
                <h1 class="text-4xl font-bold mb-2">Payment Cancelled</h1>
                <p class="text-xl opacity-90">Your payment was not completed</p>
            </div>
            
            <!-- Content -->
            <div class="p-8">
                <div class="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 mb-6">
                    <div class="flex items-start gap-3">
                        <i class="fas fa-info-circle text-orange-600 text-2xl mt-1"></i>
                        <div>
                            <h3 class="font-bold text-orange-900 text-lg mb-2">Payment Not Completed</h3>
                            <p class="text-orange-800">You cancelled the payment process. No charges have been made to your account.</p>
                        </div>
                    </div>
                </div>
                
                <?php if (!empty($orderId)): ?>
                <div class="mb-6">
                    <p class="text-gray-600 mb-2">Order Reference:</p>
                    <p class="font-bold text-primary text-xl"><?php echo htmlspecialchars($orderId); ?></p>
                </div>
                <?php endif; ?>
                
                <div class="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
                    <h3 class="font-bold text-blue-900 mb-3">What would you like to do?</h3>
                    <ul class="space-y-2 text-blue-800">
                        <li class="flex items-start gap-2">
                            <i class="fas fa-check-circle text-blue-600 mt-1"></i>
                            <span>Try payment again with a different card</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <i class="fas fa-check-circle text-blue-600 mt-1"></i>
                            <span>Choose a different payment method (Bank Transfer or Cash on Delivery)</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <i class="fas fa-check-circle text-blue-600 mt-1"></i>
                            <span>Contact us for assistance</span>
                        </li>
                    </ul>
                </div>
                
                <!-- Action Buttons -->
                <div class="space-y-4">
                    <a href="checkout.html" 
                       class="block bg-primary text-white text-center py-4 px-6 rounded-xl font-semibold text-lg hover:opacity-90 transition-all transform hover:scale-105 shadow-lg">
                        <i class="fas fa-redo mr-2"></i>Try Payment Again
                    </a>
                    
                    <div class="flex flex-col sm:flex-row gap-4">
                        <a href="products.html" 
                           class="flex-1 bg-gray-200 text-gray-800 text-center py-3 px-6 rounded-xl font-semibold hover:bg-gray-300 transition-all">
                            <i class="fas fa-shopping-bag mr-2"></i>Continue Shopping
                        </a>
                        <a href="index.html" 
                           class="flex-1 bg-gray-200 text-gray-800 text-center py-3 px-6 rounded-xl font-semibold hover:bg-gray-300 transition-all">
                            <i class="fas fa-home mr-2"></i>Go to Homepage
                        </a>
                    </div>
                </div>
                
                <!-- Contact Info -->
                <div class="mt-8 pt-6 border-t-2 border-gray-200">
                    <h3 class="font-bold text-gray-800 mb-3">Need Help?</h3>
                    <p class="text-gray-600 mb-4">Our support team is here to assist you with any payment issues.</p>
                    <div class="space-y-2">
                        <p class="text-gray-700">
                            <i class="fas fa-envelope text-primary mr-2"></i>
                            <a href="mailto:sales@omegateksolutions.co.za" class="hover:text-primary">sales@omegateksolutions.co.za</a>
                        </p>
                        <p class="text-gray-700">
                            <i class="fas fa-phone text-primary mr-2"></i>
                            <a href="tel:0736538207" class="hover:text-primary">073 653 8207</a>
                        </p>
                        <p class="text-gray-700">
                            <i class="fas fa-clock text-primary mr-2"></i>
                            Mon-Fri: 9:00 AM - 7:00 PM | Sat: 9:00 AM - 7:00 PM
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
