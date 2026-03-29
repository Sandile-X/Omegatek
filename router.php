<?php
/**
 * PHP Built-in Server Router
 * Usage: php -S localhost:8000 router.php
 *
 * Replicates the Apache .htaccess clean-URL rules so that
 * /pages/about  →  pages/about.html  (internal, no redirect)
 * while all real files (CSS, JS, images, PHP) are served normally.
 */

$uri  = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
$root = __DIR__;
$file = $root . $uri;

// 1. Serve real files / directories as-is (CSS, JS, images, PHP, etc.)
if ($uri !== '/' && file_exists($file) && !is_dir($file)) {
    return false; // let PHP built-in server handle it
}

// 2. Try appending .html (clean URL → physical file)
$htmlFile = rtrim($file, '/') . '.html';
if (file_exists($htmlFile)) {
    // Set correct MIME type and include the file
    header('Content-Type: text/html; charset=UTF-8');
    include $htmlFile;
    exit;
}

// 3. Directory index
if (is_dir($file)) {
    $index = rtrim($file, '/') . '/index.html';
    if (file_exists($index)) {
        header('Content-Type: text/html; charset=UTF-8');
        include $index;
        exit;
    }
    // Fall through to 404
}

// 4. Homepage
if ($uri === '/') {
    include $root . '/index.html';
    exit;
}

// 5. 404 fallback
http_response_code(404);
$page404 = $root . '/pages/404.html';
if (file_exists($page404)) {
    include $page404;
} else {
    echo '<h1>404 — Not Found</h1>';
}
exit;
