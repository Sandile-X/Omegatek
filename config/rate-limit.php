<?php
/**
 * Reusable server-side IP rate limiter
 * File-based, no database required.
 *
 * Usage:
 *   require_once __DIR__ . '/../config/rate-limit.php';
 *   rate_limit('contact_form', 5, 300);  // max 5 requests per 5-minute window
 */

function rate_limit(string $key, int $maxRequests = 10, int $windowSeconds = 60): void {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

    // Normalise IPv6 loopback to keep local dev working
    if ($ip === '::1') $ip = '127.0.0.1';

    $rateDir = sys_get_temp_dir() . '/omegatek_rate_limits';
    if (!is_dir($rateDir)) {
        @mkdir($rateDir, 0700, true);
    }

    $file = $rateDir . '/' . md5($key . '_' . $ip) . '.json';
    $now  = time();

    $hits = [];
    if (file_exists($file)) {
        $raw  = @file_get_contents($file);
        $hits = $raw ? (@json_decode($raw, true) ?: []) : [];
    }

    // Slide the window: drop hits older than $windowSeconds
    $hits = array_values(array_filter($hits, fn($t) => ($now - $t) < $windowSeconds));

    if (count($hits) >= $maxRequests) {
        $retryAfter = $windowSeconds - ($now - min($hits));
        http_response_code(429);
        header('Retry-After: ' . max(1, $retryAfter));
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => 'Too many requests. Please try again later.',
            'retry_after' => max(1, $retryAfter),
        ]);
        exit;
    }

    $hits[] = $now;
    @file_put_contents($file, json_encode($hits), LOCK_EX);
}

/**
 * Strict rate limiter — exits with a plain-text 429 (for non-JSON contexts)
 */
function rate_limit_strict(string $key, int $maxRequests = 5, int $windowSeconds = 300): void {
    $ip      = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    if ($ip === '::1') $ip = '127.0.0.1';

    $rateDir = sys_get_temp_dir() . '/omegatek_rate_limits';
    if (!is_dir($rateDir)) @mkdir($rateDir, 0700, true);

    $file = $rateDir . '/' . md5($key . '_' . $ip) . '.json';
    $now  = time();

    $hits = [];
    if (file_exists($file)) {
        $raw  = @file_get_contents($file);
        $hits = $raw ? (@json_decode($raw, true) ?: []) : [];
    }
    $hits = array_values(array_filter($hits, fn($t) => ($now - $t) < $windowSeconds));

    if (count($hits) >= $maxRequests) {
        http_response_code(429);
        echo '429 Too Many Requests';
        exit;
    }

    $hits[] = $now;
    @file_put_contents($file, json_encode($hits), LOCK_EX);
}
