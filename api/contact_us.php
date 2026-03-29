<?php
declare(strict_types=1);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=UTF-8');

$_allowedOrigins = [
    'https://omegateksolutions.co.za',
    'https://www.omegateksolutions.co.za',
    'http://127.0.0.1:8000',
    'http://localhost:8000',
];
$_origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (!empty($_origin)) {
    if (in_array($_origin, $_allowedOrigins, true)) {
        header('Access-Control-Allow-Origin: ' . $_origin);
        header('Vary: Origin');
    } else {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Origin not permitted']);
        exit;
    }
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function checkRateLimit(): bool {
    $ip        = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $safeIp    = preg_replace('/[^a-fA-F0-9:.]/', '', $ip);
    $cacheDir  = sys_get_temp_dir() . '/omg_contact_rl';
    if (!is_dir($cacheDir)) {
        @mkdir($cacheDir, 0700, true);
    }
    $cacheFile = $cacheDir . '/' . hash('sha256', $safeIp) . '.json';
    $windowSec = 600;  // 10 minutes
    $maxHits   = 5;
    $now       = time();

    $data = ['hits' => [], 'blocked_until' => 0];
    if (file_exists($cacheFile)) {
        $raw = @file_get_contents($cacheFile);
        if ($raw) $data = json_decode($raw, true) ?: $data;
    }

    if ($data['blocked_until'] > $now) {
        return false; // still blocked
    }

    // Prune hits older than window
    $data['hits'] = array_values(array_filter($data['hits'], fn($t) => ($now - $t) < $windowSec));

    if (count($data['hits']) >= $maxHits) {
        $data['blocked_until'] = $now + $windowSec;
        file_put_contents($cacheFile, json_encode($data), LOCK_EX);
        return false;
    }

    $data['hits'][] = $now;
    file_put_contents($cacheFile, json_encode($data), LOCK_EX);
    return true;
}

function sanitiseHeaderValue(string $val): string {
    $val = str_replace(["\r", "\n", "\0"], '', $val);
    $val = preg_replace('/[\x00-\x08\x0B-\x1F\x7F]/', '', $val);
    return trim($val);
}

$response = ['status' => 'error', 'message' => 'An error occurred'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

if (!checkRateLimit()) {
    http_response_code(429);
    echo json_encode(['status' => 'error', 'message' => 'Too many requests. Please wait a few minutes before trying again.']);
    exit;
}

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (stripos($contentType, 'application/json') !== false) {
    $body = json_decode(file_get_contents('php://input'), true) ?: [];
    $rawName    = $body['name']    ?? '';
    $rawPhone   = $body['phone']   ?? '';
    $rawMessage = $body['message'] ?? '';
} else {
    $rawName    = $_POST['name']    ?? '';
    $rawPhone   = $_POST['phone']   ?? '';
    $rawMessage = $_POST['message'] ?? '';
}

$name    = sanitiseHeaderValue(strip_tags(trim($rawName)));
$phone   = sanitiseHeaderValue(strip_tags(trim($rawPhone)));
$message = strip_tags(trim($rawMessage));

if (!preg_match('/^[\+\d\s\-\(\)]{7,20}$/', $phone)) {
    http_response_code(422);
    echo json_encode(['status' => 'error', 'message' => 'Invalid phone number format']);
    exit;
}

if ($name === '' || strlen($name) > 100 || preg_match('/[<>"\x00-\x1F]/', $name)) {
    http_response_code(422);
    echo json_encode(['status' => 'error', 'message' => 'Invalid name']);
    exit;
}

if (empty($message) || strlen($message) > 5000) {
    http_response_code(422);
    echo json_encode(['status' => 'error', 'message' => 'Message is required and must be under 5000 characters']);
    exit;
}

$to      = 'sales@omegatek.co.za';
$subject = 'New Contact Form Submission from Omegatek Solutions Website';

// Body — plain-text only, no user data in headers
$emailBody  = "You have received a new contact form submission.\n\n";
$emailBody .= "Name:    $name\n";
$emailBody .= "Phone:   $phone\n";
$emailBody .= "Message:\n$message\n";

$headers  = "From: no-reply@omegateksolutions.co.za\r\n";
$headers .= "Reply-To: no-reply@omegateksolutions.co.za\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "X-Mailer: Omegatek-Contact-Form\r\n";

if (mail($to, $subject, $emailBody, $headers)) {
    $response = ['status' => 'success', 'message' => 'Thank you! Your message has been sent.'];
} else {
    error_log('Contact form mail() failed for submission from IP: ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
    $response = ['status' => 'error', 'message' => "Oops! Something went wrong, we couldn't send your message."];
}

echo json_encode($response);
?>
