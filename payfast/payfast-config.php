<?php
// Load shared secure config
if (!defined('SUPABASE_URL')) {
    require_once __DIR__ . '/../config/secure-config.php';
}

if (!defined('PAYFAST_MERCHANT_ID')) {
    define('PAYFAST_MERCHANT_ID',  env('PAYFAST_MERCHANT_ID',  ''));
    define('PAYFAST_MERCHANT_KEY', env('PAYFAST_MERCHANT_KEY', ''));
    define('PAYFAST_PASSPHRASE',   env('PAYFAST_PASSPHRASE',   ''));
}

if (empty(PAYFAST_MERCHANT_ID) || empty(PAYFAST_MERCHANT_KEY)) {
    error_log('CRITICAL: PayFast credentials missing from .env');
}

define('PAYFAST_MODE', env('PAYFAST_MODE', 'live'));
define('PAYFAST_LIVE_URL', 'https://www.payfast.co.za/eng/process');
define('PAYFAST_SANDBOX_URL', 'https://sandbox.payfast.co.za/eng/process');

function getPayFastUrl() {
    return PAYFAST_MODE === 'live' ? PAYFAST_LIVE_URL : PAYFAST_SANDBOX_URL;
}

define('SITE_NAME',        'Omegatek Solutions');
define('SITE_URL',         env('SITE_URL', 'https://omegateksolutions.co.za'));
define('MERCHANT_EMAIL',   'sales@omegateksolutions.co.za');
// The actual files live under /payfast/ — a bare SITE_URL + filename here
// would send PayFast's server-to-server ITN call to a URL that 404s, so
// notify_url in particular must include the subdirectory.
define('PAYFAST_RETURN_URL', SITE_URL . '/payfast/payfast-return.php');
define('PAYFAST_CANCEL_URL', SITE_URL . '/payfast/payfast-cancel.php');
define('PAYFAST_NOTIFY_URL', SITE_URL . '/payfast/payfast-notify.php');

function generatePayFastSignature($data, $passPhrase = '') {
    $pfOutput = '';
    foreach ($data as $key => $val) {
        if ($val !== '') {
            $pfOutput .= $key . '=' . urlencode(trim($val)) . '&';
        }
    }
    
    $getString = substr($pfOutput, 0, -1);

    if ($passPhrase !== '') {
        $getString .= '&passphrase=' . urlencode(trim($passPhrase));
    }
    
    return md5($getString);
}

function validatePayFastSignature($pfData, $passPhrase = '') {
    if (!isset($pfData['signature'])) {
        return false;
    }

    $signature = $pfData['signature'];
    $result = $pfData;
    unset($result['signature']);

    $pfParamString = '';
    foreach ($result as $key => $val) {
        $pfParamString .= $key . '=' . urlencode(stripslashes($val)) . '&';
    }
    $pfParamString = substr($pfParamString, 0, -1);

    // Must match generatePayFastSignature() exactly — if a passphrase is
    // configured in the PayFast dashboard it has to be appended here too,
    // otherwise validation silently stops depending on the shared secret.
    if ($passPhrase !== '') {
        $pfParamString .= '&passphrase=' . urlencode(trim($passPhrase));
    }

    $calculatedSignature = md5($pfParamString);

    return ($calculatedSignature === $signature);
}

function isPayFastIP($sourceIP) {
    $cacheFile = sys_get_temp_dir() . '/omegatek_payfast_ips.json';
    $cacheTtl  = 3600; // 1 hour

    $validIps = null;
    if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTtl) {
        $cached = @json_decode(@file_get_contents($cacheFile), true);
        if (is_array($cached) && !empty($cached)) {
            $validIps = $cached;
        }
    }

    if ($validIps === null) {
        $validHosts = [
            'www.payfast.co.za',
            'sandbox.payfast.co.za',
            'w1w.payfast.co.za',
            'w2w.payfast.co.za',
        ];

        $validIps    = [];
        $resolveFail = false;
        foreach ($validHosts as $pfHostname) {
            $ips = gethostbynamel($pfHostname);
            if ($ips !== false) {
                $validIps = array_merge($validIps, $ips);
            } else {
                $resolveFail = true;
            }
        }
        $validIps = array_values(array_unique($validIps));

        if (!empty($validIps)) {
            @file_put_contents($cacheFile, json_encode($validIps), LOCK_EX);
        } elseif ($resolveFail) {
            // DNS is down and we have no cache — log distinctly from a
            // genuine IP mismatch so this doesn't look like a spoofed ITN.
            error_log('PayFast IP allowlist: DNS resolution failed for all hosts, no cache available');
        }
    }

    return in_array($sourceIP, $validIps, true);
}

function validatePayFastAmount($amountGross, $expectedAmount) {
    return abs(floatval($amountGross) - floatval($expectedAmount)) < 0.01;
}

function logPayFastTransaction($message, $data = []) {
    $logDir = __DIR__ . '/order_data';
    if (!file_exists($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    $logFile = $logDir . '/payfast_transactions.log';
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[{$timestamp}] {$message}\n";
    
    if (!empty($data)) {
        $logEntry .= "Data: " . json_encode($data, JSON_PRETTY_PRINT) . "\n";
    }
    
    $logEntry .= str_repeat('-', 80) . "\n";
    
    file_put_contents($logFile, $logEntry, FILE_APPEND);
}

?>
