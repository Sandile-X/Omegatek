<?php
/**
 * Google Sheets CSV Proxy
 * Fetches a public Google Sheets CSV export server-side (bypasses browser CORS).
 * Only allows requests from our own admin dashboard.
 */

// CORS — only allow same-origin admin requests
$allowedOrigins = ['http://localhost:8000', 'http://127.0.0.1:8000', 'https://omegateksolutions.co.za', 'https://www.omegateksolutions.co.za'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$url = trim($_GET['url'] ?? '');

// Validate it's a Google Sheets export URL (CSV or XLSX only)
if (!$url || !preg_match('#^https://docs\.google\.com/spreadsheets/d/[A-Za-z0-9_-]+/export\?format=(csv|xlsx)(&|$)#', $url)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Invalid URL. Must be a Google Sheets export URL (csv or xlsx).']);
    exit;
}
$isXlsx = (strpos($url, 'format=xlsx') !== false);

$ctx = stream_context_create([
    'http' => [
        'method'          => 'GET',
        'timeout'         => 20,
        'follow_location' => 1,
        'max_redirects'   => 5,
        'user_agent'      => 'Mozilla/5.0 (compatible; OmegatekAdmin/1.0)',
        'header'          => "Accept: text/csv,text/plain,*/*\r\n"
    ]
]);

$csv = @file_get_contents($url, false, $ctx);

if ($csv === false) {
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Could not fetch the spreadsheet. Make sure it is shared as "Anyone with the link → Viewer".']);
    exit;
}

// Check if Google redirected to login page (sheet is not public)
// Only relevant for text responses (not applicable to binary XLSX)
if (!$isXlsx && (strpos($csv, 'accounts.google.com') !== false || strpos($csv, 'ServiceLogin') !== false)) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Sheet is not publicly accessible. Share it as "Anyone with the link → Viewer" in Google Sheets.']);
    exit;
}

$contentType = $isXlsx
    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    : 'text/csv; charset=utf-8';
header('Content-Type: ' . $contentType);
header('Cache-Control: no-store');
echo $csv;
