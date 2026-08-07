<?php
/**
 * Shared admin authentication helper.
 * Verifies a Supabase JWT (Authorization: Bearer <token>) against Supabase,
 * then checks the returned email against ADMIN_EMAIL / ADMIN_EMAILS.
 * Used by every admin-only PHP endpoint so the check lives in one place.
 */

require_once __DIR__ . '/secure-config.php';

function getBearerToken(): ?string {
    $headers    = array_change_key_case(getallheaders() ?: [], CASE_LOWER);
    $authHeader = $headers['authorization']
        ?? $_SERVER['HTTP_AUTHORIZATION']
        ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
        ?? '';
    if (preg_match('/Bearer\s+(.+)$/i', $authHeader, $m)) {
        return trim($m[1]);
    }
    return null;
}

/**
 * Returns ['id' => ..., 'email' => ...] for a valid admin session,
 * or sends a 401/403 JSON response and exits.
 */
function requireAdminAuth(): array {
    $jwt = getBearerToken();
    if (empty($jwt)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Authentication required.']);
        exit;
    }

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
        CURLOPT_CONNECTTIMEOUT => 5,
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
    if (empty($user['id']) || empty($user['email'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Could not retrieve user']);
        exit;
    }

    $adminEmail = trim(env('ADMIN_EMAIL', ''));
    if (empty($adminEmail)) {
        $adminEmail = trim(env('ADMIN_EMAILS', ''));
    }
    if (empty($adminEmail)) {
        error_log('SECURITY: ADMIN_EMAIL not set in .env — admin access blocked');
        http_response_code(503);
        echo json_encode(['success' => false, 'message' => 'Admin configuration missing']);
        exit;
    }

    $adminEmails = array_map('trim', explode(',', strtolower($adminEmail)));
    $userEmail   = strtolower(trim($user['email']));

    if (!in_array($userEmail, $adminEmails, true)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied']);
        exit;
    }

    return ['id' => $user['id'], 'email' => $userEmail];
}
