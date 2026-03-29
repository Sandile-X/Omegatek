<?php
/**
 * DATABASE CONFIGURATION TEMPLATE
 * 
 * IMPORTANT: Update these credentials with your actual database information
 * NEVER share this file or commit it to version control
 * 
 * Copy to: /config/database.php
 */

// ============================================
// 🔴 UPDATE THESE WITH YOUR DATABASE INFO 🔴
// ============================================

define('DB_HOST', 'localhost');          // Database server (usually localhost)
define('DB_USER', 'root');               // Database username
define('DB_PASS', '');                   // Database password (leave empty if no password)
define('DB_NAME', 'omegatek');           // Database name
define('DB_PORT', 3306);                 // MySQL port (default 3306)

// ============================================
// Do NOT edit below this line
// ============================================

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/db_errors.log');

// Create logs directory if it doesn't exist
if (!is_dir(__DIR__ . '/../logs')) {
    mkdir(__DIR__ . '/../logs', 0755, true);
}

// Connection options
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

// Establish database connection
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        $options
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed',
        'error' => $e->getMessage()
    ]);
    exit;
}

// Helper function to execute queries
function executeQuery($query, $params = []) {
    global $pdo;
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    return $stmt;
}

// Helper function to fetch single row
function fetchOne($query, $params = []) {
    $stmt = executeQuery($query, $params);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

// Helper function to fetch all rows
function fetchAll($query, $params = []) {
    $stmt = executeQuery($query, $params);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Helper function to insert/update/delete
function execute($query, $params = []) {
    $stmt = executeQuery($query, $params);
    return $stmt->rowCount();
}

// CORS headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit;
}

?>
