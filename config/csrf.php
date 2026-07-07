<?php
/**
 * CSRF Protection Helper
 * Generates and validates CSRF tokens for admin API endpoints.
 *
 * Usage — in your PHP API before processing any mutating request:
 *   require_once __DIR__ . '/../config/csrf.php';
 *   csrf_verify();   // exits with 403 if token is missing or invalid
 *
 * In your admin JS — include the token in every fetch():
 *   headers: { 'X-CSRF-Token': getCsrfToken() }
 *
 * The token is placed in a meta tag by admin-dashboard.php on page load.
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// ── Generate (or retrieve existing) CSRF token ─────────────────────────────
function csrf_token(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

// ── Rotate the token (call after successful form submission) ───────────────
function csrf_rotate(): string {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    return $_SESSION['csrf_token'];
}

// ── Validate the incoming request token ───────────────────────────────────
// Accepts the token from the X-CSRF-Token header (preferred) or POST body.
function csrf_verify(): void {
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

    // Only enforce on state-changing methods
    if (!in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
        return;
    }

    $expected = $_SESSION['csrf_token'] ?? '';

    // Prefer header (avoids BREACH attacks on body compression)
    $headers  = function_exists('getallheaders') ? (getallheaders() ?: []) : [];
    $headers  = array_change_key_case($headers, CASE_LOWER);
    $incoming = $headers['x-csrf-token'] ?? '';

    // Fallback: read from JSON body if header not present
    if ($incoming === '') {
        $body     = @json_decode(file_get_contents('php://input'), true) ?: [];
        $incoming = $body['_csrf'] ?? '';
    }

    // Constant-time comparison to prevent timing attacks
    if ($expected === '' || !hash_equals($expected, $incoming)) {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'CSRF validation failed']);
        exit;
    }
}

// ── Emit a meta tag for the current token (use in dashboard PHP) ───────────
function csrf_meta_tag(): string {
    return '<meta name="csrf-token" content="' . htmlspecialchars(csrf_token(), ENT_QUOTES) . '">';
}
