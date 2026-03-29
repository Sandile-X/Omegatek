<?php
// Prevent direct access
if (basename($_SERVER['PHP_SELF']) === 'secure-config.php') {
    http_response_code(403);
    exit('Forbidden');
}

ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

$envPath = __DIR__ . '/../.env';
if (!file_exists($envPath)) {
    error_log('CRITICAL: .env file missing at ' . $envPath);
    // Continue — some values have safe defaults
} else {
    $lines = @file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#' || strpos($line, '=') === false) continue;
        [$key, $value] = explode('=', $line, 2);
        $key   = trim($key);
        $value = trim($value);
        if (!array_key_exists($key, $_ENV)) {
            $_ENV[$key]  = $value;
            putenv("$key=$value");
        }
    }
}

function env(string $key, string $default = ''): string {
    return $_ENV[$key] ?? getenv($key) ?: $default;
}

define('SUPABASE_URL',         env('SUPABASE_URL'));
define('SUPABASE_ANON_KEY',    env('SUPABASE_ANON_KEY'));
define('SUPABASE_SERVICE_KEY', env('SUPABASE_SERVICE_KEY'));

define('OPENROUTER_API_KEY',       env('OPENROUTER_API_KEY'));
define('OPENROUTER_API_URL',       'https://openrouter.ai/api/v1/chat/completions');
define('OPENROUTER_DEFAULT_MODEL', env('OPENROUTER_DEFAULT_MODEL', 'openai/gpt-4o-mini'));

define('GEMINI_API_KEY', env('GEMINI_API_KEY'));
define('ADMIN_PIN',      env('ADMIN_PIN', ''));

function assertConfigured(string $constant, string $label): void {
    $val = constant($constant);
    if (empty($val)) {
        error_log("CONFIG WARNING: $label is not set in .env");
    }
}

assertConfigured('OPENROUTER_API_KEY', 'OPENROUTER_API_KEY');
assertConfigured('SUPABASE_URL',       'SUPABASE_URL');
assertConfigured('SUPABASE_ANON_KEY',  'SUPABASE_ANON_KEY');
