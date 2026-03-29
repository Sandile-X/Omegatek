<?php
declare(strict_types=1);

$ALLOWED_ORIGINS = [
    'https://www.omegateksolutions.co.za',
    'https://omegateksolutions.co.za',
    'http://localhost',
    'http://127.0.0.1',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $ALLOWED_ORIGINS, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

$APK_DIR = __DIR__ . '/../downloads/apks/';

$APK_REGISTRY = [
    'omegavision' => ['file' => 'OmegaVision.apk',  'name' => 'OmegaVision'],
    'omegaherts'  => ['file' => 'OmegaHerts.apk',   'name' => 'OmegaHerts'],
    'stockflow'   => ['file' => 'StockFlow.apk',     'name' => 'StockFlow'],
    'trendscan'   => ['file' => 'TrendScan.apk',     'name' => 'TrendScan'],
    'assetize'    => ['file' => 'Assetize.apk',      'name' => 'Assetize'],
];

define('RATE_LIMIT_MAX',    10);
define('RATE_LIMIT_WINDOW', 3600);

function getClientIp(): string
{
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

function checkRateLimit(string $ip): bool
{
    $safeIp  = preg_replace('/[^a-f0-9:\.]/i', '_', $ip);
    $tmpDir  = sys_get_temp_dir() . '/omegatek_apk_rl/';
    $file    = $tmpDir . $safeIp . '.json';

    if (!is_dir($tmpDir)) {
        mkdir($tmpDir, 0700, true);
    }

    $now  = time();
    $data = ['count' => 0, 'window_start' => $now];

    if (file_exists($file)) {
        $raw = file_get_contents($file);
        if ($raw !== false) {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                $data = $decoded;
            }
        }
    }

    if ($now - $data['window_start'] >= RATE_LIMIT_WINDOW) {
        $data = ['count' => 0, 'window_start' => $now];
    }

    if ($data['count'] >= RATE_LIMIT_MAX) {
        return false;
    }

    $data['count']++;
    file_put_contents($file, json_encode($data), LOCK_EX);
    return true;
}

function logDownload(string $ip, string $appSlug): void
{
    $logDir  = __DIR__ . '/../logs/';
    $logFile = $logDir . 'apk-downloads.log';

    if (!is_dir($logDir)) {
        mkdir($logDir, 0750, true);
    }

    $line = implode(' | ', [
        date('Y-m-d H:i:s'),
        $ip,
        $appSlug,
        $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
    ]) . PHP_EOL;

    file_put_contents($logFile, $line, FILE_APPEND | LOCK_EX);
}

function jsonError(int $code, string $message): void
{
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode(['error' => $message]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError(405, 'Method not allowed');
}

$rawApp = $_GET['app'] ?? '';
if (!preg_match('/^[a-z0-9_\-]{1,50}$/', $rawApp)) {
    jsonError(400, 'Invalid app identifier');
}

$appSlug = strtolower($rawApp);

if (!array_key_exists($appSlug, $APK_REGISTRY)) {
    jsonError(404, 'App not found');
}

$app        = $APK_REGISTRY[$appSlug];
$filePath   = realpath($APK_DIR . $app['file']);
$realApkDir = realpath($APK_DIR);
if (
    $filePath === false ||
    $realApkDir === false ||
    strpos($filePath, $realApkDir . DIRECTORY_SEPARATOR) !== 0
) {
    jsonError(404, 'App file not available yet. Please try again later.');
}

// Rate-limit check
$ip = getClientIp();
if (!checkRateLimit($ip)) {
    http_response_code(429);
    header('Retry-After: 3600');
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Too many download requests. Please try again in an hour.']);
    exit;
}

// Log the download before serving
logDownload($ip, $appSlug);

// Serve the APK file
$filename = $app['name'] . '-Trial.apk';
$filesize = filesize($filePath);

header('Content-Type: application/vnd.android.package-archive');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Content-Length: ' . $filesize);
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');

// Stream the file — avoids loading the whole APK into PHP memory
readfile($filePath);
exit;
