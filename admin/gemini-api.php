<?php
/**
 * OpenRouter AI Integration API
 * Secure server-side AI proxy — keeps OpenRouter key off the frontend.
 * Database-free: orders loaded from JSON file; blog via Supabase JS.
 *
 * Models are selected by the frontend; default: openai/gpt-4o-mini
 */

ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/../config/secure-config.php';

session_start();

// ── Authentication ─────────────────────────────────────────
// Method 1: existing PHP session (set on previous valid auth)
// Method 2: Supabase JWT Bearer token (sent by aiFetch helper in dashboard JS)
// Method 3: admin_pin in POST/GET (fallback for local/dev use)
function checkAuth(): void {
    if (!empty($_SESSION['admin_authenticated'])) {
        return;
    }

    // Method 2: validate Supabase JWT against /auth/v1/user
    // getallheaders() can be unreliable on PHP CLI server on Windows
    // so also check $_SERVER which is always populated
    $headers    = getallheaders() ?: [];
    $authHeader = $headers['Authorization']
        ?? $headers['authorization']
        ?? $_SERVER['HTTP_AUTHORIZATION']
        ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
        ?? '';
    if (preg_match('/Bearer\s+(.+)$/i', $authHeader, $m)) {
        $jwt = trim($m[1]);
        if (!empty($jwt)) {
            // Cache successful JWT verifications in the PHP session so we
            // don't hit Supabase on every single AI request
            $jwtHash = substr(hash('sha256', $jwt), 0, 16);
            if (!empty($_SESSION['ai_jwt_hash']) && $_SESSION['ai_jwt_hash'] === $jwtHash) {
                $_SESSION['admin_authenticated'] = true;
                return;
            }
            $ch = curl_init(SUPABASE_URL . '/auth/v1/user');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $jwt,
                'apikey: ' . SUPABASE_ANON_KEY,
            ]);
            curl_setopt($ch, CURLOPT_TIMEOUT,        10);
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
            $resp = curl_exec($ch);
            curl_close($ch);
            if ($resp) {
                $user = @json_decode($resp, true);
                if (!empty($user['id'])) {
                    $_SESSION['admin_authenticated'] = true;
                    $_SESSION['ai_jwt_hash']         = $jwtHash;
                    return;
                }
            }
        }
    }

    // Method 3: PIN fallback (POST only — never accept via GET to avoid log/cache leakage)
    $pin = trim($_POST['admin_pin'] ?? '');
    if ($pin !== '' && hash_equals(ADMIN_PIN, $pin)) {
        $_SESSION['admin_authenticated'] = true;
        return;
    }

    http_response_code(401);
    echo json_encode([
        'success'    => false,
        'message'    => 'Authentication required.',
        'error_code' => 'AUTH_REQUIRED',
    ]);
    error_log('Unauthorised AI API access from: ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
    exit;
}

checkAuth();

// CORS — admin-only: restrict to known origins (must be set after auth so 401 also has CORS headers)
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
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

// Lightweight ping — auth verified above, no OpenRouter call needed
if ($action === 'ping') {
    echo json_encode(['success' => true, 'status' => 'ok']);
    exit;
}

if (empty(OPENROUTER_API_KEY)) {
    http_response_code(500);
    echo json_encode([
        'success'    => false,
        'message'    => 'AI service not configured. Add OPENROUTER_API_KEY to .env file.',
        'error_code' => 'CONFIG_MISSING',
    ]);
    exit;
}

try {
    switch ($action) {
        case 'analyze_orders':    analyzeOrdersAndRepairs(); break;
        case 'generate_blog':     generateBlogContent();     break;
        case 'optimize_newsletter': optimizeNewsletter();    break;
        case 'send_reminders':    sendAutomatedReminders();  break;
        case 'analyze_customers': analyzeCustomerInteractions(); break;
        case 'custom_prompt':     handleCustomPrompt();      break;
        case 'chat_proxy':        handleChatProxy();         break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action specified']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred processing your request.',
        'error'   => $e->getMessage(),
    ]);
    error_log('AI API Error: ' . $e->getMessage());
}

// ── Helpers ────────────────────────────────────────────────

/**
 * Load all orders from the local JSON store.
 */
function loadOrdersFromJson(): array {
    $path = __DIR__ . '/order_data/orders.json';
    if (!file_exists($path)) return [];
    $raw = @file_get_contents($path);
    if ($raw === false) return [];
    $decoded = @json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

/**
 * Return the model to use for this request.
 * Frontend passes `model` in POST; falls back to OPENROUTER_DEFAULT_MODEL.
 */
function getRequestedModel(): string {
    $m = trim($_POST['model'] ?? $_GET['model'] ?? '');
    // Allowlist: only valid OpenRouter model-id characters
    if ($m !== '' && preg_match('/^[a-zA-Z0-9\/:._-]+$/', $m)) return $m;
    return OPENROUTER_DEFAULT_MODEL;
}

/**
 * Call OpenRouter AI (OpenAI-compatible API) with error handling.
 *
 * @param string $prompt      User / system prompt
 * @param float  $temperature 0.0–1.0
 * @param string $model       Override model (empty = use request model)
 */
function callAI(string $prompt, float $temperature = 0.7, string $model = ''): array {
    if ($model === '') $model = getRequestedModel();

    $data = [
        'model'       => $model,
        'messages'    => [['role' => 'user', 'content' => $prompt]],
        'max_tokens'  => 2048,
        'temperature' => $temperature,
    ];

    $ch = curl_init(OPENROUTER_API_URL);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST,           true);
    curl_setopt($ch, CURLOPT_POSTFIELDS,     json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . OPENROUTER_API_KEY,
        'Content-Type: application/json',
        'HTTP-Referer: https://omegateksolutions.co.za',
        'X-Title: Omegatek Solutions Admin',
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT,        60);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 15);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr  = curl_error($ch);
    curl_close($ch);

    if ($curlErr) throw new Exception('AI API connection error: ' . $curlErr);

    $decoded = @json_decode($response, true);

    if ($httpCode === 429) {
        $retryAfter = $decoded['error']['metadata']['retry_after'] ?? null;
        $msg = 'Rate limit reached.';
        if ($retryAfter) $msg .= " Try again in {$retryAfter} seconds.";
        throw new Exception($msg);
    }
    if ($httpCode !== 200) {
        $errMsg = $decoded['error']['message'] ?? "HTTP {$httpCode}";
        error_log("OpenRouter {$httpCode}: {$response}");
        throw new Exception("AI service error: {$errMsg}");
    }
    if (json_last_error() !== JSON_ERROR_NONE) throw new Exception('Invalid JSON from AI service');
    return $decoded;
}

/** Extract text content from an OpenRouter response. */
function aiText(array $ai): string {
    return $ai['choices'][0]['message']['content'] ?? '';
}

// ── Action Functions ───────────────────────────────────────

function analyzeOrdersAndRepairs(): void {
    $orders  = loadOrdersFromJson();
    $pending = array_values(array_filter($orders, fn($o) =>
        !in_array(strtolower($o['status'] ?? ''), ['completed', 'cancelled'])
    ));

    if (empty($pending)) {
        echo json_encode([
            'success' => true,
            'summary' => '✅ All orders are up to date. No outstanding items.',
            'data'    => ['pending_orders' => 0, 'pending_repairs' => 0, 'priority_tasks' => []],
        ]);
        return;
    }

    $prompt = "You are an AI Business Operations Manager for Omegatek Solutions, a South African tech company.\n\n"
            . 'OUTSTANDING ORDERS (' . count($pending) . "):\n"
            . json_encode(array_slice($pending, 0, 50), JSON_PRETTY_PRINT)
            . "\n\nProvide:\n"
            . "1. Priority ranking of urgent tasks\n"
            . "2. Recommended customer follow-up messages\n"
            . "3. Suggested actions for the admin team\n"
            . "4. Any patterns or concerns you notice\n\n"
            . "Format your response clearly with sections and bullet points.";

    $ai = callAI($prompt, 0.5);

    echo json_encode([
        'success' => true,
        'summary' => aiText($ai) ?: 'Analysis unavailable.',
        'data'    => ['pending_orders' => count($pending), 'pending_repairs' => 0, 'orders' => $pending],
    ]);
}

function generateBlogContent(): void {
    $topic = $_POST['topic'] ?? $_GET['topic'] ?? 'Latest Technology Trends in South Africa';

    $prompt = "You are a professional tech writer for Omegatek Solutions.\n\n"
            . "Write a complete blog post about: $topic\n\n"
            . "Requirements:\n"
            . "- SEO-optimized title (60 chars max)\n"
            . "- Engaging meta description (155 chars max)\n"
            . "- 600-800 words of content\n"
            . "- Include actionable tips for South African tech users\n"
            . "- Format in clean HTML with proper heading tags\n"
            . "- End with a call-to-action mentioning Omegatek Solutions services\n\n"
            . 'Output ONLY valid JSON: {"title":"...","meta_description":"...","content":"<html content>"}';

    $ai      = callAI($prompt, 0.8);
    $content = aiText($ai);

    if (preg_match('/\{[\s\S]*\}/', $content, $m)) {
        $parsed = json_decode($m[0], true);
        if ($parsed) { echo json_encode(['success' => true, 'blog' => $parsed]); return; }
    }

    echo json_encode(['success' => true, 'content' => $content, 'raw' => true]);
}

function optimizeNewsletter(): void {
    $raw = $_POST['content'] ?? '';
    if (empty($raw)) { echo json_encode(['success' => false, 'message' => 'No content provided']); return; }

    $ai = callAI(
        "You are a marketing expert for Omegatek Solutions.\n\nImprove this newsletter for higher engagement:\n$raw\n\nReturn the optimized HTML-formatted newsletter.",
        0.7
    );

    echo json_encode([
        'success'           => true,
        'optimized_content' => aiText($ai) ?: $raw,
    ]);
}

function sendAutomatedReminders(): void {
    $orders    = loadOrdersFromJson();
    $reminders = [];
    $now       = time();

    foreach ($orders as $order) {
        if (strtolower($order['status'] ?? '') !== 'pending') continue;
        $created = strtotime($order['created_at'] ?? $order['date'] ?? '') ?: 0;
        if (!$created) continue;
        $days = (int) round(($now - $created) / 86400);
        if ($days <= 3) continue;
        $reminders[] = [
            'type'             => 'order',
            'id'               => $order['order_number'] ?? $order['orderId'] ?? 'N/A',
            'customer'         => $order['customer_name'] ?? $order['customerName'] ?? 'Unknown',
            'email'            => $order['customer_email'] ?? $order['email'] ?? '',
            'days_pending'     => $days,
            'suggested_action' => 'Follow up on order status',
        ];
    }

    echo json_encode(['success' => true, 'reminders' => $reminders, 'count' => count($reminders)]);
}

function analyzeCustomerInteractions(): void {
    $orders    = loadOrdersFromJson();
    $customers = [];

    foreach ($orders as $o) {
        $email = $o['customer_email'] ?? $o['email'] ?? null;
        if (!$email) continue;
        if (!isset($customers[$email])) {
            $customers[$email] = ['customer_email' => $email, 'order_count' => 0, 'total_spent' => 0.0];
        }
        $customers[$email]['order_count']++;
        $customers[$email]['total_spent'] += (float)($o['total_amount'] ?? $o['total'] ?? 0);
    }

    usort($customers, fn($a, $b) => $b['total_spent'] <=> $a['total_spent']);
    $top = array_slice(array_values($customers), 0, 20);

    if (empty($top)) {
        echo json_encode([
            'success'  => true,
            'analysis' => 'No customer data available yet. Start taking orders to unlock customer insights.',
            'data'     => [],
        ]);
        return;
    }

    $ai = callAI(
        "Analyze these customer purchase patterns for Omegatek Solutions:\n"
        . json_encode($top, JSON_PRETTY_PRINT)
        . "\n\nProvide insights on:\n- Top customers who deserve VIP treatment\n- Customers to re-engage\n- Upsell opportunities",
        0.6
    );

    echo json_encode([
        'success'  => true,
        'analysis' => aiText($ai) ?: 'No insights available.',
        'data'     => $top,
    ]);
}

function handleCustomPrompt(): void {
    $input = trim($_POST['prompt'] ?? $_GET['prompt'] ?? '');
    if ($input === '') { echo json_encode(['success' => false, 'message' => 'No prompt provided']); return; }

    $ai = callAI(
        "You are an AI assistant for Omegatek Solutions admin dashboard.\n\nAdmin query: $input\n\nProvide a helpful, actionable response specific to managing a South African tech business.",
        0.8
    );

    echo json_encode([
        'success'  => true,
        'response' => aiText($ai) ?: 'No response generated.',
    ]);
}

/**
 * Generic chat proxy — accepts a messages array from the dashboard JS.
 * The OpenRouter key stays server-side; the browser never sees it.
 */
function handleChatProxy(): void {
    $rawBody = file_get_contents('php://input');
    $body    = $rawBody ? @json_decode($rawBody, true) : [];

    // Fall back to POST fields if JSON body is empty
    if (empty($body)) {
        $body = $_POST;
    }

    $messages = $body['messages'] ?? [];
    $modelRaw = $body['model']    ?? '';

    // Validate model ID — allowlist characters only
    $model = (is_string($modelRaw) && preg_match('/^[a-zA-Z0-9\/:._-]+$/', $modelRaw))
        ? $modelRaw
        : OPENROUTER_DEFAULT_MODEL;

    if (empty($messages) || !is_array($messages)) {
        echo json_encode(['success' => false, 'message' => 'No messages provided']);
        return;
    }

    // Sanitise and limit messages
    $allowedRoles = ['system', 'user', 'assistant'];
    $cleanMsgs = [];
    foreach (array_slice($messages, 0, 50) as $m) {
        $role    = in_array($m['role'] ?? '', $allowedRoles) ? $m['role'] : 'user';
        $content = substr(strip_tags((string)($m['content'] ?? '')), 0, 8000);
        $cleanMsgs[] = ['role' => $role, 'content' => $content];
    }

    // Call OpenRouter via cURL
    $payload = [
        'model'       => $model,
        'messages'    => $cleanMsgs,
        'max_tokens'  => 1200,
        'temperature' => 0.7,
    ];

    $ch = curl_init(OPENROUTER_API_URL);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST,           true);
    curl_setopt($ch, CURLOPT_POSTFIELDS,     json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . OPENROUTER_API_KEY,
        'Content-Type: application/json',
        'HTTP-Referer: https://omegateksolutions.co.za',
        'X-Title: Omegatek Solutions Admin',
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT,        60);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 15);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr  = curl_error($ch);
    curl_close($ch);

    if ($curlErr) {
        http_response_code(502);
        echo json_encode(['success' => false, 'message' => 'AI connection error: ' . $curlErr]);
        return;
    }

    $decoded = @json_decode($response, true);
    if ($httpCode === 402) {
        echo json_encode(['success' => false, 'message' => 'OpenRouter account has insufficient credits. Top up at openrouter.ai/credits.']);
        return;
    }
    if ($httpCode === 401) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'AI service configuration error.']);
        error_log('OpenRouter 401: invalid API key in server config');
        return;
    }
    if ($httpCode !== 200) {
        $errMsg = $decoded['error']['message'] ?? "HTTP {$httpCode}";
        http_response_code(502);
        echo json_encode(['success' => false, 'message' => 'AI service error: ' . $errMsg]);
        return;
    }

    $text = $decoded['choices'][0]['message']['content'] ?? '';
    echo json_encode(['success' => true, 'response' => trim($text) ?: '(no response)']);
}

