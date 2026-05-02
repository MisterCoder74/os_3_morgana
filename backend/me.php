<?php
/**
 * OS/3 WebWarp — backend/me.php
 * Returns the currently logged-in user's public profile.
 * Called by index.html on load to verify session.
 * Redirects to login.html if not authenticated.
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/storage.php';
require_once __DIR__ . '/lib/users.php';

session_name(SESSION_NAME);
session_start();

header('Content-Type: application/json; charset=utf-8');

if (empty($_SESSION['username'])) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'redirect' => 'login.html']);
    exit;
}

$profile = user_load($_SESSION['username']);
if (!$profile) {
    session_destroy();
    http_response_code(401);
    echo json_encode(['ok' => false, 'redirect' => 'login.html']);
    exit;
}

echo json_encode(['ok' => true, 'user' => user_public($profile)]);
