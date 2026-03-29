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

define('PAYFAST_MODE', 'live');
define('PAYFAST_LIVE_URL', 'https://www.payfast.co.za/eng/process');
define('PAYFAST_SANDBOX_URL', 'https://sandbox.payfast.co.za/eng/process');

function getPayFastUrl() {
    return PAYFAST_MODE === 'live' ? PAYFAST_LIVE_URL : PAYFAST_SANDBOX_URL;
}

define('SITE_NAME',        'Omegatek Solutions');
define('SITE_URL',         'https://omegatek.co.za');
define('MERCHANT_EMAIL',   'sales@omegateksolutions.co.za');
define('PAYFAST_RETURN_URL', SITE_URL . '/payfast-return.php');
define('PAYFAST_CANCEL_URL', SITE_URL . '/payfast-cancel.php');
define('PAYFAST_NOTIFY_URL', SITE_URL . '/payfast-notify.php');

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

function validatePayFastSignature($pfData, $pfParamString) {
    if (!isset($pfData['signature'])) {
        return false;
    }
    
    $signature = $pfData['signature'];
    $result = $pfData;
    unset($result['signature']);
    
    $pfParamString = '';
    foreach ($result as $key => $val) {
        if ($key !== 'signature') {
            $pfParamString .= $key . '=' . urlencode(stripslashes($val)) . '&';
        }
    }
    
    $pfParamString     = substr($pfParamString, 0, -1);
    $tempParamString    = $pfParamString;
    $calculatedSignature = md5($tempParamString);
    
    return ($calculatedSignature === $signature);
}

function isPayFastIP($sourceIP) {
    $validHosts = [
        'www.payfast.co.za',
        'sandbox.payfast.co.za',
        'w1w.payfast.co.za',
        'w2w.payfast.co.za',
    ];
    
    $validIps = [];
    foreach ($validHosts as $pfHostname) {
        $ips = gethostbynamel($pfHostname);
        if ($ips !== false) {
            $validIps = array_merge($validIps, $ips);
        }
    }
    
    $validIps = array_unique($validIps);
    return in_array($sourceIP, $validIps);
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
