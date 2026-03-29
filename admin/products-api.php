<?php
/**
 * Products Management API
 * Database-backed product CRUD operations
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

$action = $_GET['action'] ?? 'get_products';

// Admin authorization check
function requireAdmin() {
    $headers = getallheaders();
    $token = null;
    
    if (isset($headers['Authorization'])) {
        preg_match('/Bearer\s+(.*)$/i', $headers['Authorization'], $matches);
        $token = $matches[1] ?? null;
    }
    
    if (!$token) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit;
    }
    
    // Verify token is valid and belongs to an admin role
    $session = fetchOne(
        "SELECT s.user_id, u.role FROM sessions s
         INNER JOIN users u ON u.id = s.user_id
         WHERE s.token = ? AND s.expires_at > NOW()",
        [$token]
    );
    if (!$session) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid or expired token']);
        exit;
    }
    if (($session['role'] ?? '') !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Admin access required']);
        exit;
    }
}

switch ($action) {
    case 'get_products':
        getProducts();
        break;
    case 'get_product':
        getProduct();
        break;
    case 'create_product':
        requireAdmin();
        createProduct();
        break;
    case 'update_product':
        requireAdmin();
        updateProduct();
        break;
    case 'delete_product':
        requireAdmin();
        deleteProduct();
        break;
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
}

function getProducts() {
    global $dbConnected, $pdo;
    
    // Check if database is available
    if (!$dbConnected || !$pdo) {
        // Fallback to products.json
        $jsonPath = __DIR__ . '/../data/products.json';
        if (file_exists($jsonPath)) {
            $products = json_decode(file_get_contents($jsonPath), true);
            echo json_encode([
                'success' => true,
                'products' => $products,
                'total' => count($products),
                'source' => 'json_fallback'
            ]);
            return;
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Database unavailable and no products.json found',
                'products' => []
            ]);
            return;
        }
    }
    
    // Try database query
    try {
        $category = $_GET['category'] ?? null;
        $limit = intval($_GET['limit'] ?? 50);
        $offset = intval($_GET['offset'] ?? 0);
        
        $query = "SELECT * FROM products WHERE is_active = 1";
        $params = [];
        
        if ($category) {
            $query .= " AND category = ?";
            $params[] = $category;
        }
        
        $query .= " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $products = fetchAll($query, $params);
        
        // Get total count
        $countQuery = "SELECT COUNT(*) as total FROM products WHERE is_active = 1";
        $countParams = [];
        
        if ($category) {
            $countQuery .= " AND category = ?";
            $countParams[] = $category;
        }
        
        $countResult = fetchOne($countQuery, $countParams);
        
        echo json_encode([
            'success' => true,
            'products' => $products,
            'total' => $countResult['total'],
            'limit' => $limit,
            'offset' => $offset,
            'source' => 'database'
        ]);
    } catch (PDOException $e) {
        // If table doesn't exist, fallback to JSON
        $jsonPath = __DIR__ . '/../data/products.json';
        if (file_exists($jsonPath)) {
            $products = json_decode(file_get_contents($jsonPath), true);
            echo json_encode([
                'success' => true,
                'products' => $products,
                'total' => count($products),
                'source' => 'json_fallback',
                'db_error' => $e->getMessage()
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Database error and no fallback data',
                'error' => $e->getMessage()
            ]);
        }
    }
}

function getProduct() {
    $id = intval($_GET['id'] ?? 0);
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Product ID required']);
        return;
    }
    
    $product = fetchOne("SELECT * FROM products WHERE id = ? AND is_active = 1", [$id]);
    
    if (!$product) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Product not found']);
        return;
    }
    
    echo json_encode(['success' => true, 'product' => $product]);
}

function createProduct() {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    $required = ['name', 'price', 'category'];
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => "Missing required field: $field"]);
            return;
        }
    }
    
    try {
        execute(
            "INSERT INTO products (name, description, price, category, image_url, stock_quantity, sku) 
             VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
                htmlspecialchars($data['name']),
                htmlspecialchars($data['description'] ?? ''),
                floatval($data['price']),
                htmlspecialchars($data['category']),
                htmlspecialchars($data['image_url'] ?? ''),
                intval($data['stock_quantity'] ?? 0),
                htmlspecialchars($data['sku'] ?? '')
            ]
        );
        
        $productId = getPdo()->lastInsertId();
        $product = fetchOne("SELECT * FROM products WHERE id = ?", [$productId]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Product created',
            'product' => $product
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function updateProduct() {
    $id = intval($_GET['id'] ?? 0);
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Product ID required']);
        return;
    }
    
    try {
        $updates = [];
        $params = [];
        
        $fields = ['name', 'description', 'price', 'category', 'image_url', 'stock_quantity', 'sku'];
        foreach ($fields as $field) {
            if (isset($data[$field])) {
                $updates[] = "$field = ?";
                if ($field === 'price') {
                    $params[] = floatval($data[$field]);
                } elseif ($field === 'stock_quantity') {
                    $params[] = intval($data[$field]);
                } else {
                    $params[] = htmlspecialchars($data[$field]);
                }
            }
        }
        
        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No fields to update']);
            return;
        }
        
        $params[] = $id;
        $query = "UPDATE products SET " . implode(', ', $updates) . " WHERE id = ?";
        
        execute($query, $params);
        
        $product = fetchOne("SELECT * FROM products WHERE id = ?", [$id]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Product updated',
            'product' => $product
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function deleteProduct() {
    $id = intval($_GET['id'] ?? 0);
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Product ID required']);
        return;
    }
    
    try {
        // Soft delete (mark as inactive)
        execute("UPDATE products SET is_active = 0 WHERE id = ?", [$id]);
        
        echo json_encode(['success' => true, 'message' => 'Product deleted']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function getPdo() {
    global $pdo;
    return $pdo;
}

?>
