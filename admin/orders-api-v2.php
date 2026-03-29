<?php
/**
 * Orders Management API
 * Database-backed order and repair ticket operations
 */

// Suppress error display for clean JSON responses
ini_set('display_errors', 0);
error_reporting(E_ALL);

// CORS — admin-only endpoint: restrict to known origins
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

require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? 'get_orders';

// Helper to get authorization — only from Authorization header, never GET params
function getAuthToken() {
    $headers = array_change_key_case(getallheaders() ?: [], CASE_LOWER);
    $auth    = $headers['authorization']
             ?? $_SERVER['HTTP_AUTHORIZATION']
             ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
             ?? '';
    if (preg_match('/Bearer\s+(.+)$/i', $auth, $m)) {
        return trim($m[1]);
    }
    return null; // Never accept tokens via GET — they end up in server logs
}

function requireAuth() {
    $token = getAuthToken();
    
    if (!$token) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit;
    }
    
    $session = fetchOne("SELECT user_id FROM sessions WHERE token = ?", [$token]);
    if (!$session) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid token']);
        exit;
    }
    
    return $session['user_id'];
}

switch ($action) {
    case 'get_orders':
        getOrders();
        break;
    case 'get_customer_orders':
        $userId = requireAuth();
        getCustomerOrders($userId);
        break;
    case 'get_order':
        getOrder();
        break;
    case 'create_order':
        createOrder();
        break;
    case 'update_order':
        updateOrder();
        break;
    case 'get_customer_repairs':
        $userId = requireAuth();
        getCustomerRepairs($userId);
        break;
    case 'create_repair_ticket':
        $userId = requireAuth();
        createRepairTicket($userId);
        break;
    case 'get_products':
        getProducts();
        break;
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
}

function getOrders() {
    global $dbConnected, $pdo;

    // Auth required even for the JSON fallback path
    requireAuth();
    
    // Check if database is available
    if (!$dbConnected || !$pdo) {
        // Fallback to orders.json — auth has already been verified above
        $jsonPath = __DIR__ . '/order_data/orders.json';
        if (file_exists($jsonPath)) {
            $raw    = @file_get_contents($jsonPath);
            $orders = $raw ? (json_decode($raw, true) ?: []) : [];
            echo json_encode([
                'success' => true,
                'orders'  => $orders,
                'source'  => 'json_fallback',
            ]);
            return;
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Service temporarily unavailable.',
                'orders'  => [],
            ]);
            return;
        }
    }
    
    // Try database query
    try {
        $status = $_GET['status'] ?? null;
        $limit = intval($_GET['limit'] ?? 50);
        $offset = intval($_GET['offset'] ?? 0);
        
        $query = "SELECT id, order_number, customer_name, customer_email, status, total_amount, payment_status, created_at 
                  FROM orders WHERE 1=1";
        $params = [];
        
        if ($status) {
            $query .= " AND status = ?";
            $params[] = $status;
        }
        
        $query .= " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $orders = fetchAll($query, $params);
        
        echo json_encode([
            'success' => true, 
            'orders' => $orders,
            'source' => 'database'
        ]);
    } catch (PDOException $e) {
        // Log the real error server-side — never expose DB internals to client
        error_log('Orders DB error: ' . $e->getMessage());
        // Fallback to JSON if table doesn’t exist yet
        $jsonPath = __DIR__ . '/order_data/orders.json';
        if (file_exists($jsonPath)) {
            $orders = json_decode(file_get_contents($jsonPath), true);
            echo json_encode([
                'success' => true,
                'orders'  => is_array($orders) ? $orders : [],
                'source'  => 'json_fallback',
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Service temporarily unavailable. Please try again later.',
                'orders'  => [],
            ]);
        }
    }
}

function getCustomerOrders($userId) {
    $orders = fetchAll(
        "SELECT id, order_number, customer_name, status, total_amount, payment_status, created_at 
         FROM orders WHERE customer_id = ? ORDER BY created_at DESC",
        [$userId]
    );
    
    // Get order items for each order
    foreach ($orders as &$order) {
        $order['items'] = fetchAll(
            "SELECT product_name, quantity, unit_price, total_price FROM order_items WHERE order_id = ?",
            [$order['id']]
        );
    }
    
    echo json_encode(['success' => true, 'orders' => $orders]);
}

function getCustomerRepairs($userId) {
    $tickets = fetchAll(
        "SELECT id, ticket_number, device_type, issue_description, status, priority, assigned_technician, 
                estimated_cost, actual_cost, created_at, updated_at
         FROM repair_tickets WHERE customer_id = ? ORDER BY created_at DESC",
        [$userId]
    );
    
    echo json_encode(['success' => true, 'tickets' => $tickets]);
}

function getOrder() {
    $id = intval($_GET['id'] ?? 0);
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Order ID required']);
        return;
    }
    
    $order = fetchOne("SELECT * FROM orders WHERE id = ?", [$id]);
    
    if (!$order) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Order not found']);
        return;
    }
    
    $order['items'] = fetchAll("SELECT * FROM order_items WHERE order_id = ?", [$id]);
    
    echo json_encode(['success' => true, 'order' => $order]);
}

function createOrder() {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['customer_email']) || !isset($data['items'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        return;
    }
    
    try {
        $orderNumber = 'OMG-' . strtoupper(substr(uniqid(), -8));
        $totalAmount = 0;
        
        // Calculate total
        foreach ($data['items'] as $item) {
            $totalAmount += floatval($item['total_price']);
        }
        
        // Create order
        execute(
            "INSERT INTO orders (order_number, customer_email, customer_name, customer_phone, total_amount, payment_method, status) 
             VALUES (?, ?, ?, ?, ?, ?, 'pending')",
            [
                $orderNumber,
                filter_var($data['customer_email'], FILTER_SANITIZE_EMAIL),
                htmlspecialchars($data['customer_name'] ?? ''),
                htmlspecialchars($data['customer_phone'] ?? ''),
                $totalAmount,
                htmlspecialchars($data['payment_method'] ?? 'pending')
            ]
        );
        
        global $pdo;
        $orderId = $pdo->lastInsertId();
        
        // Add order items
        foreach ($data['items'] as $item) {
            execute(
                "INSERT INTO order_items (order_id, product_name, quantity, unit_price, total_price) 
                 VALUES (?, ?, ?, ?, ?)",
                [
                    $orderId,
                    htmlspecialchars($item['product_name']),
                    intval($item['quantity']),
                    floatval($item['unit_price']),
                    floatval($item['total_price'])
                ]
            );
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Order created',
            'order_id' => $orderId,
            'order_number' => $orderNumber
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function updateOrder() {
    $id = intval($_GET['id'] ?? 0);
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Order ID required']);
        return;
    }
    
    try {
        $updates = [];
        $params = [];
        
        $fields = ['status', 'payment_status', 'shipping_address', 'notes'];
        foreach ($fields as $field) {
            if (isset($data[$field])) {
                $updates[] = "$field = ?";
                $params[] = htmlspecialchars($data[$field]);
            }
        }
        
        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No fields to update']);
            return;
        }
        
        $params[] = $id;
        execute("UPDATE orders SET " . implode(', ', $updates) . " WHERE id = ?", $params);
        
        echo json_encode(['success' => true, 'message' => 'Order updated']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function createRepairTicket($userId) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['device_type']) || !isset($data['issue_description'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        return;
    }
    
    try {
        $ticketNumber = 'REPAIR-' . strtoupper(substr(uniqid(), -8));
        
        execute(
            "INSERT INTO repair_tickets (ticket_number, customer_id, customer_email, customer_name, customer_phone, 
                                        device_type, device_description, issue_description, status, priority) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)",
            [
                $ticketNumber,
                $userId,
                htmlspecialchars($data['customer_email'] ?? ''),
                htmlspecialchars($data['customer_name'] ?? ''),
                htmlspecialchars($data['customer_phone'] ?? ''),
                htmlspecialchars($data['device_type']),
                htmlspecialchars($data['device_description'] ?? ''),
                htmlspecialchars($data['issue_description']),
                htmlspecialchars($data['priority'] ?? 'medium')
            ]
        );
        
        global $pdo;
        $ticketId = $pdo->lastInsertId();
        
        echo json_encode([
            'success' => true,
            'message' => 'Repair ticket created',
            'ticket_id' => $ticketId,
            'ticket_number' => $ticketNumber
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function getProducts() {
    $products = fetchAll(
        "SELECT id, name, price, category FROM products WHERE is_active = 1 ORDER BY name"
    );
    
    echo json_encode(['success' => true, 'products' => $products]);
}

?>
