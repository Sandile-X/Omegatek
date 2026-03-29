<?php
/**
 * Newsletter Management Backend
 * Phase 3: Newsletter Management System
 */

// Suppress error display for clean JSON responses
ini_set('display_errors', 0);
error_reporting(E_ALL);

// CORS — public actions open to all; admin actions restricted to known origins
$_earlyAction    = $_GET['action'] ?? '';
$_publicActions  = ['subscribe', 'unsubscribe', 'get_subscribers_count'];
$_allowedOrigins = [
    'http://127.0.0.1:8000',
    'http://localhost:8000',
    'https://omegateksolutions.co.za',
    'https://www.omegateksolutions.co.za',
];
$_reqOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($_earlyAction, $_publicActions, true)) {
    header('Access-Control-Allow-Origin: *');
} elseif (!empty($_reqOrigin)) {
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

// Handle OPTIONS preflight request (browser sends this before POST)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();

// Configuration
require_once __DIR__ . '/../config/secure-config.php';

// ── Supabase REST helpers (use service key → bypasses RLS) ────────────────

function sbGet(string $table, array $queryParams = [], string $jwt = ''): array {
    $url    = SUPABASE_URL . '/rest/v1/' . $table;
    if ($queryParams) $url .= '?' . http_build_query($queryParams);
    $bearer = $jwt ?: SUPABASE_ANON_KEY;
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'apikey: '              . SUPABASE_ANON_KEY,
            'Authorization: Bearer ' . $bearer,
            'Accept: application/json',
        ],
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_TIMEOUT        => 10,
    ]);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['code' => $code, 'data' => @json_decode($body, true)];
}

function sbInsert(string $table, array $data, string $jwt = ''): array {
    $bearer = $jwt ?: SUPABASE_ANON_KEY;
    $ch = curl_init(SUPABASE_URL . '/rest/v1/' . $table);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($data),
        CURLOPT_HTTPHEADER     => [
            'apikey: '              . SUPABASE_ANON_KEY,
            'Authorization: Bearer ' . $bearer,
            'Content-Type: application/json',
            'Prefer: return=representation',
        ],
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_TIMEOUT        => 10,
    ]);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['code' => $code, 'data' => @json_decode($body, true)];
}

function sbPatch(string $table, string $column, string $value, array $data, string $jwt = ''): array {
    $bearer = $jwt ?: SUPABASE_ANON_KEY;
    $url    = SUPABASE_URL . '/rest/v1/' . $table . '?' . urlencode($column) . '=eq.' . urlencode($value);
    $ch     = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST  => 'PATCH',
        CURLOPT_POSTFIELDS     => json_encode($data),
        CURLOPT_HTTPHEADER     => [
            'apikey: '              . SUPABASE_ANON_KEY,
            'Authorization: Bearer ' . $bearer,
            'Content-Type: application/json',
            'Prefer: return=minimal',
        ],
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_TIMEOUT        => 10,
    ]);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['code' => $code];
}

// ── Rate limiter (keeps local file on server) ─────────────────────────────

function checkRateLimit(string $key, int $maxReq = 5, int $windowSec = 300): bool {
    $rateDir = __DIR__ . '/newsletter_data/rate_limits';
    if (!file_exists($rateDir)) @mkdir($rateDir, 0700, true);
    $file = $rateDir . '/' . md5($key) . '.json';
    $now  = time();
    $hits = file_exists($file) ? (@json_decode(file_get_contents($file), true) ?: []) : [];
    $hits = array_values(array_filter($hits, fn($t) => $now - $t < $windowSec));
    if (count($hits) >= $maxReq) return false;
    $hits[] = $now;
    file_put_contents($file, json_encode($hits));
    return true;
}

// ── Email sender ──────────────────────────────────────────────────────────

function sendEmail(string $to, string $subject, string $htmlBody): bool {
    $headers  = "From: Omegatek Solutions <noreply@omegateksolutions.co.za>\r\n";
    $headers .= "Reply-To: sales@omegateksolutions.co.za\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();
    return @mail($to, $subject, $htmlBody, $headers);
}

// ── Auth guard for admin actions ──────────────────────────────────────────

function requireSupabaseAuth(): string {
    $headers    = getallheaders() ?: [];
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (preg_match('/Bearer\s+(.+)$/i', $authHeader, $m)) {
        $jwt = trim($m[1]);
        if (!empty($jwt)) {
            $ch = curl_init(SUPABASE_URL . '/auth/v1/user');
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER     => [
                    'Authorization: Bearer ' . $jwt,
                    'apikey: ' . SUPABASE_ANON_KEY,
                ],
                CURLOPT_SSL_VERIFYPEER => true,
                CURLOPT_SSL_VERIFYHOST => 2,
                CURLOPT_TIMEOUT        => 5,
            ]);
            $resp = curl_exec($ch);
            curl_close($ch);
            if ($resp) {
                $user = @json_decode($resp, true);
                if (!empty($user['id'])) return $jwt;
            }
        }
    }
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Set headers
header('Content-Type: application/json');

// Get request data
$method = $_SERVER['REQUEST_METHOD'];
$input  = @json_decode(file_get_contents('php://input'), true) ?: [];
$action = $_GET['action'] ?? '';

$response = ['success' => false, 'message' => 'Invalid request'];

try {
    switch ($action) {

        // ── Public: subscribe ────────────────────────────────────────────
        case 'subscribe':
            if ($method === 'POST') {
                $email = filter_var($input['email'] ?? '', FILTER_VALIDATE_EMAIL);
                $name  = substr(strip_tags(htmlspecialchars($input['name'] ?? '', ENT_QUOTES, 'UTF-8')), 0, 100);

                if (!$email) { $response = ['success' => false, 'message' => 'Invalid email address']; break; }

                $clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
                if (!checkRateLimit($clientIp . ':subscribe', 5, 600)) {
                    http_response_code(429);
                    $response = ['success' => false, 'message' => 'Too many requests. Please try again later.'];
                    break;
                }

                // Try INSERT first (works for new subscribers via public INSERT RLS policy)
                $token = bin2hex(random_bytes(32));
                $ins   = sbInsert('newsletter_subscribers', [
                    'email'             => $email,
                    'name'              => $name,
                    'status'            => 'active',
                    'unsubscribe_token' => $token,
                ]);

                if ($ins['code'] >= 300) {
                    // Already exists — re-activate if unsubscribed (uses public UPDATE RLS policy)
                    $patch = sbPatch('newsletter_subscribers', 'email', $email, [
                        'status'          => 'active',
                        'name'            => $name ?: '',
                        'unsubscribed_at' => null,
                    ]);
                    if ($patch['code'] >= 300) {
                        $response = ['success' => false, 'message' => 'Subscription error — please try again later.'];
                        break;
                    }
                    $response = ['success' => true, 'message' => "You're already on our list — stay tuned!"];
                    break;
                }

                // Welcome email
                $welcomeBody = "
                    <html><body style='font-family:Arial,sans-serif;line-height:1.6;'>
                        <h2 style='color:#b30ce6;'>Welcome to Our Newsletter!</h2>
                        <p>Hi " . htmlspecialchars($name ?: 'there', ENT_QUOTES) . ",</p>
                        <p>Thanks for subscribing to Omegatek Solutions. You'll now get updates on our latest services, tech tips, and special offers.</p>
                        <p>Best regards,<br>The Omegatek Team</p>
                        <hr><p style='font-size:12px;color:#999;'>
                            <a href='https://omegateksolutions.co.za/unsubscribe.php?token=" . urlencode($token) . "'>Unsubscribe</a>
                        </p>
                    </body></html>";
                sendEmail($email, 'Welcome to Omegatek Solutions Newsletter!', $welcomeBody);

                $response = ['success' => true, 'message' => 'Successfully subscribed to newsletter'];
            }
            break;

        // ── Public: unsubscribe ──────────────────────────────────────────
        case 'unsubscribe':
            if ($method === 'POST') {
                $token = preg_replace('/[^a-f0-9]/', '', $input['token'] ?? '');
                if (strlen($token) < 32) { $response = ['success' => false, 'message' => 'Invalid token']; break; }

                // PATCH with token as the WHERE — 0 rows affected if token is wrong (safe)
                sbPatch('newsletter_subscribers', 'unsubscribe_token', $token, [
                    'status'          => 'unsubscribed',
                    'unsubscribed_at' => date('c'),
                ]);
                // Always return success to prevent token enumeration
                $response = ['success' => true, 'message' => 'Successfully unsubscribed'];
            }
            break;

        // ── Public: subscriber count for homepage widget ─────────────────
        case 'get_subscribers_count':
            // Use a SECURITY DEFINER RPC so anon key can safely count without exposing emails
            $ch = curl_init(SUPABASE_URL . '/rest/v1/rpc/get_active_subscriber_count');
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => '{}',
                CURLOPT_HTTPHEADER     => [
                    'apikey: '        . SUPABASE_ANON_KEY,
                    'Authorization: Bearer ' . SUPABASE_ANON_KEY,
                    'Content-Type: application/json',
                ],
                CURLOPT_SSL_VERIFYPEER => true,
                CURLOPT_SSL_VERIFYHOST => 2,
                CURLOPT_TIMEOUT        => 5,
            ]);
            $countBody = curl_exec($ch);
            curl_close($ch);
            $count    = (int)(@json_decode($countBody, true) ?? 0);
            $response = ['success' => true, 'count' => $count];
            break;

        // ── Admin: send newsletter (emails + update Supabase status) ─────
        case 'send_newsletter':
            $adminJwt = requireSupabaseAuth();  // returns the validated JWT
            if ($method === 'POST') {
                $id = preg_replace('/[^a-f0-9\-]/', '', $input['id'] ?? '');
                if (!$id) { $response = ['success' => false, 'message' => 'Newsletter ID required']; break; }

                // Load newsletter (authenticated as admin)
                $nlRes = sbGet('newsletters', ['id' => 'eq.' . $id, 'select' => 'id,subject,content'], $adminJwt);
                if (empty($nlRes['data'][0])) {
                    $response = ['success' => false, 'message' => 'Newsletter not found'];
                    break;
                }
                $newsletter = $nlRes['data'][0];

                // Load active subscribers (authenticated as admin)
                $subRes = sbGet('newsletter_subscribers', [
                    'status' => 'eq.active',
                    'select' => 'email,name,unsubscribe_token',
                ], $adminJwt);
                $subscribers = $subRes['data'] ?: [];

                $sentCount = 0;
                foreach ($subscribers as $sub) {
                    $personalised = str_replace(
                        ['{{name}}',  '{{email}}'],
                        [htmlspecialchars($sub['name'] ?: 'Valued Customer', ENT_QUOTES), htmlspecialchars($sub['email'], ENT_QUOTES)],
                        $newsletter['content']
                    );
                    $personalised .= "
                        <hr style='margin-top:30px;'>
                        <p style='font-size:12px;color:#999;text-align:center;'>
                            Don't want these emails?
                            <a href='https://omegateksolutions.co.za/unsubscribe.php?token=" . urlencode($sub['unsubscribe_token']) . "'>Unsubscribe</a>
                        </p>";
                    if (sendEmail($sub['email'], $newsletter['subject'], $personalised)) {
                        $sentCount++;
                    }
                }

                // Update newsletter status in Supabase (authenticated as admin)
                sbPatch('newsletters', 'id', $id, [
                    'status'     => 'sent',
                    'sent_at'    => date('c'),
                    'sent_count' => $sentCount,
                ], $adminJwt);

                $response = ['success' => true, 'message' => "Newsletter sent to $sentCount subscriber" . ($sentCount !== 1 ? 's' : '')];
            }
            break;

        default:
            $response = ['success' => false, 'message' => 'Invalid action'];
    }
} catch (Exception $e) {
    error_log('newsletter-api error: ' . $e->getMessage());
    $response = ['success' => false, 'message' => 'Server error — check logs'];
}

echo json_encode($response);
?>
