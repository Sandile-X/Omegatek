<?php
/**
 * Admin Verification Endpoint
 * Validates a Supabase JWT and checks whether the authenticated user
 * is an authorised admin — completely server-side, no email in frontend.
 */

ini_set('display_errors', 0);
error_reporting(E_ALL);

// Only known origins may call this
$_allowedOrigins = [
    'http://127.0.0.1:8000',
    'http://localhost:8000',
    'https://omegateksolutions.co.za',
    'https://www.omegateksolutions.co.za',
];
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
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../config/secure-config.php';

header('Content-Type: application/json');

// ── Server-side IP-based rate limiting ───────────────────────────────────────
function checkAdminRateLimit(): void {
    $ip      = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $rateDir = __DIR__ . '/rate_limit_data';
    if (!is_dir($rateDir)) @mkdir($rateDir, 0700, true);

    $file    = $rateDir . '/' . md5('admin_verify_' . $ip) . '.json';
    $now     = time();
    $window  = 300;   // 5-minute window
    $maxHits = 10;    // max 10 verify attempts per window

    $hits = [];
    if (file_exists($file)) {
        $raw  = @file_get_contents($file);
        $hits = $raw ? (@json_decode($raw, true) ?: []) : [];
    }
    $hits = array_values(array_filter($hits, fn($t) => $now - $t < $window));

    if (count($hits) >= $maxHits) {
        http_response_code(429);
        echo json_encode(['success' => false, 'message' => 'Too many requests. Try again later.']);
        exit;
    }
    $hits[] = $now;
    @file_put_contents($file, json_encode($hits));
}

checkAdminRateLimit();

// ── Pull JWT from Authorization header ────────────────────────────────────────
$headers    = getallheaders() ?: [];
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
$jwt        = '';
if (preg_match('/Bearer\s+(.+)$/i', $authHeader, $m)) {
    $jwt = trim($m[1]);
}

if (empty($jwt)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No token provided']);
    exit;
}

// ── Verify JWT against Supabase and retrieve the user's email ─────────────────
$ch = curl_init(SUPABASE_URL . '/auth/v1/user');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer ' . $jwt,
        'apikey: '              . SUPABASE_ANON_KEY,
    ],
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
    CURLOPT_TIMEOUT        => 8,
]);
$resp     = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if (!$resp || $httpCode !== 200) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Token validation failed']);
    exit;
}

$user = @json_decode($resp, true);
if (empty($user['email'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Could not retrieve user']);
    exit;
}

// ── Compare against admin email stored securely in .env ──────────────────────
$adminEmail = trim(env('ADMIN_EMAIL', ''));
if (empty($adminEmail)) {
    // Fallback: check ADMIN_EMAILS (comma-separated list)
    $adminEmail = trim(env('ADMIN_EMAILS', ''));
}

if (empty($adminEmail)) {
    error_log('SECURITY: ADMIN_EMAIL not set in .env — admin access blocked');
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'Admin configuration missing']);
    exit;
}

// Support comma-separated list of admin emails
$adminEmails = array_map('trim', explode(',', strtolower($adminEmail)));
$userEmail   = strtolower(trim($user['email']));

if (!in_array($userEmail, $adminEmails, true)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied']);
    exit;
}

// ── Authorised ────────────────────────────────────────────────────────────────
echo json_encode([
    'success'    => true,
    'authorised' => true,
    'user_id'    => $user['id'],
]);
