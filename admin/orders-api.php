<?php
/**
 * Orders API — JSON-file backed (admin/order_data/orders.json).
 *
 * This is the live order pipeline: checkout.js, order-tracking.js,
 * order-confirmation.html and orders-admin.html all target this file.
 * New orders are mirrored into Supabase client-side (js/api.js
 * syncOrderToSupabase) so the customer account area and the main admin
 * dashboard (admin-dashboard.php) can read them without a second backend.
 */

ini_set('display_errors', 0);
error_reporting(E_ALL);

$_allowedOrigins = ['http://127.0.0.1:8000','http://localhost:8000','https://omegateksolutions.co.za','https://www.omegateksolutions.co.za'];
$_reqOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (!empty($_reqOrigin)) {
    if (in_array($_reqOrigin, $_allowedOrigins, true)) {
        header('Access-Control-Allow-Origin: ' . $_reqOrigin);
        header('Vary: Origin');
    } else {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Origin not permitted']);
        exit;
    }
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/secure-config.php';
require_once __DIR__ . '/../config/admin-auth.php';
require_once __DIR__ . '/../config/rate-limit.php';

header('Content-Type: application/json');

define('ORDERS_FILE', __DIR__ . '/order_data/orders.json');

function loadOrders(): array {
    if (!file_exists(ORDERS_FILE)) {
        return [];
    }
    $raw = @file_get_contents(ORDERS_FILE);
    $data = $raw ? json_decode($raw, true) : [];
    return is_array($data) ? $data : [];
}

function saveOrders(array $orders): void {
    $dir = dirname(ORDERS_FILE);
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    file_put_contents(ORDERS_FILE, json_encode($orders, JSON_PRETTY_PRINT), LOCK_EX);
}

/**
 * Look up a product's authoritative name/price/image in Supabase by part_no.
 * Returns null if the product doesn't exist — callers must reject the item.
 */
function fetchCatalogProduct(string $partNo): ?array {
    $url = rtrim(SUPABASE_URL, '/') . '/rest/v1/products?part_no=eq.' . urlencode($partNo) . '&select=part_no,name,price,image_url&limit=1';
    $ch  = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'apikey: '        . SUPABASE_ANON_KEY,
            'Authorization: Bearer ' . SUPABASE_ANON_KEY,
        ],
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_TIMEOUT        => 8,
        CURLOPT_CONNECTTIMEOUT => 5,
    ]);
    $resp     = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if (!$resp || $httpCode !== 200) {
        return null;
    }
    $rows = @json_decode($resp, true);
    return (is_array($rows) && !empty($rows[0])) ? $rows[0] : null;
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'place_order':
        placeOrder();
        break;
    case 'get_order':
        getOrder();
        break;
    case 'get_orders':
        requireAdminAuth();
        getOrders();
        break;
    case 'update_order_status':
        requireAdminAuth();
        updateOrderStatus();
        break;
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
}

function placeOrder(): void {
    rate_limit('place_order', 10, 300);

    $data = json_decode(file_get_contents('php://input'), true);
    if (!is_array($data) || empty($data['customer']) || empty($data['address']) || empty($data['items']) || !is_array($data['items'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        return;
    }

    $customer = $data['customer'];
    $address  = $data['address'];

    $email = filter_var(trim($customer['email'] ?? ''), FILTER_VALIDATE_EMAIL);
    if (!$email) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'A valid email address is required']);
        return;
    }
    $fullName = trim($customer['fullName'] ?? '');
    if ($fullName === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Full name is required']);
        return;
    }

    // Validate items against the live catalogue — price/name/image always
    // come from Supabase, never from the client, so a tampered cart total
    // can never reach an order.
    $validatedItems = [];
    $subtotalCalc   = 0;
    foreach ($data['items'] as $item) {
        $partNo = trim((string)($item['id'] ?? ''));
        $qty    = max(1, intval($item['quantity'] ?? $item['qty'] ?? 1));

        if ($partNo === '') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid item in cart']);
            return;
        }

        $product = fetchCatalogProduct($partNo);
        if (!$product) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'One or more items are no longer available. Please refresh your cart.']);
            return;
        }

        $price = floatval($product['price']);
        $validatedItems[] = [
            'id'       => $partNo,
            'name'     => $product['name'],
            'image'    => $product['image_url'] ?? ($item['image'] ?? ''),
            'price'    => $price,
            'quantity' => $qty,
        ];
        $subtotalCalc += $price * $qty;
    }

    $province    = trim($address['province'] ?? '');
    $deliveryFee = calculateDeliveryFee($province, $subtotalCalc);
    $total       = $subtotalCalc + $deliveryFee;

    $orderId = 'OMG-' . strtoupper(substr(uniqid(), -8));
    $now     = date('Y-m-d H:i:s');

    $order = [
        'orderId'       => $orderId,
        'orderDate'     => $now,
        'status'        => 'pending',
        'paymentStatus' => 'pending',
        'statusHistory' => [
            ['status' => 'pending', 'timestamp' => $now, 'note' => 'Order placed'],
        ],
        'customer' => [
            'fullName' => htmlspecialchars($fullName, ENT_QUOTES, 'UTF-8'),
            'email'    => $email,
            'phone'    => htmlspecialchars(trim($customer['phone'] ?? ''), ENT_QUOTES, 'UTF-8'),
            'altPhone' => htmlspecialchars(trim($customer['altPhone'] ?? ''), ENT_QUOTES, 'UTF-8'),
        ],
        'address' => [
            'street'     => htmlspecialchars(trim($address['street'] ?? ''), ENT_QUOTES, 'UTF-8'),
            'suburb'     => htmlspecialchars(trim($address['suburb'] ?? ''), ENT_QUOTES, 'UTF-8'),
            'city'       => htmlspecialchars(trim($address['city'] ?? ''), ENT_QUOTES, 'UTF-8'),
            'province'   => htmlspecialchars($province, ENT_QUOTES, 'UTF-8'),
            'postalCode' => htmlspecialchars(trim($address['postalCode'] ?? ''), ENT_QUOTES, 'UTF-8'),
        ],
        'paymentMethod' => htmlspecialchars(trim($data['paymentMethod'] ?? 'pending'), ENT_QUOTES, 'UTF-8'),
        'notes'         => htmlspecialchars(trim($data['notes'] ?? ''), ENT_QUOTES, 'UTF-8'),
        'items'         => $validatedItems,
        'subtotal'      => round($subtotalCalc, 2),
        'deliveryFee'   => round($deliveryFee, 2),
        'total'         => round($total, 2),
    ];

    $orders   = loadOrders();
    $orders[] = $order;
    saveOrders($orders);

    if ($order['paymentMethod'] === 'payfast') {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $_SESSION['pending_payfast_order'] = $order;

        echo json_encode([
            'success'     => true,
            'orderId'     => $orderId,
            'payfast'     => true,
            'redirectUrl' => '/payfast/payfast-payment.php',
        ]);
        return;
    }

    echo json_encode(['success' => true, 'orderId' => $orderId]);
}

function calculateDeliveryFee(string $province, float $subtotal): float {
    if ($subtotal >= 500) {
        return 0;
    }
    $fees = [
        'Gauteng' => 50, 'Western Cape' => 100, 'KwaZulu-Natal' => 100,
        'Eastern Cape' => 120, 'Free State' => 100, 'Limpopo' => 120,
        'Mpumalanga' => 100, 'North West' => 100, 'Northern Cape' => 150,
    ];
    return $fees[$province] ?? 100;
}

function getOrder(): void {
    rate_limit('get_order', 30, 300);

    $orderId = trim($_GET['orderId'] ?? '');
    if ($orderId === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Order ID required']);
        return;
    }

    foreach (loadOrders() as $order) {
        if (($order['orderId'] ?? '') === $orderId) {
            echo json_encode(['success' => true, 'order' => $order]);
            return;
        }
    }

    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Order not found']);
}

function getOrders(): void {
    $orders = loadOrders();
    usort($orders, fn($a, $b) => strcmp($b['orderDate'] ?? '', $a['orderDate'] ?? ''));
    echo json_encode(['success' => true, 'orders' => $orders]);
}

function updateOrderStatus(): void {
    $data    = json_decode(file_get_contents('php://input'), true);
    $orderId = trim($data['orderId'] ?? '');
    $status  = trim($data['status'] ?? '');
    $note    = trim($data['note'] ?? '');

    $validStatuses = ['pending', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled'];
    if ($orderId === '' || !in_array($status, $validStatuses, true)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Valid order ID and status required']);
        return;
    }

    $orders = loadOrders();
    $found  = false;
    foreach ($orders as &$order) {
        if (($order['orderId'] ?? '') === $orderId) {
            $order['status'] = $status;
            $order['statusHistory'][] = [
                'status'    => $status,
                'timestamp' => date('Y-m-d H:i:s'),
                'note'      => htmlspecialchars($note, ENT_QUOTES, 'UTF-8'),
            ];
            $found = true;
            break;
        }
    }
    unset($order);

    if (!$found) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Order not found']);
        return;
    }

    saveOrders($orders);
    echo json_encode(['success' => true, 'message' => 'Status updated']);
}
