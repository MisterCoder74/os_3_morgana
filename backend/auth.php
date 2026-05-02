<?php
/**
 * OS/3 WebWarp — backend/auth.php
 * Single-endpoint auth API.
 *
 * Actions (POST JSON body):
 *   login    { username, password }              → { ok, user } | { error }
 *   logout   {}                                  → { ok }
 *   register { username, password }              → { ok, user } | { error }
 *   check    (GET)                               → { ok, user } | { ok: false }
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/storage.php';
require_once __DIR__ . '/lib/users.php';

// ── CORS headers ─────────────────────────────────────────────
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: '  . CORS_ORIGIN);
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

// ── Session setup ─────────────────────────────────────────────
session_name(SESSION_NAME);
session_set_cookie_params([
    'lifetime' => SESSION_LIFETIME,
    'path'     => '/',
    'secure'   => isset($_SERVER['HTTPS']),
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();

// ── Helper ────────────────────────────────────────────────────
function respond(array $data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

// ── GET → check ───────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!empty($_SESSION['username'])) {
        $profile = user_load($_SESSION['username']);
        respond(['ok' => true, 'user' => $profile ? user_public($profile) : ['username' => $_SESSION['username']]]);
    }
    respond(['ok' => false]);
}

// ── POST → parse JSON body ────────────────────────────────────
$raw  = file_get_contents('php://input');
$body = json_decode($raw, true);
if (!is_array($body)) {
    respond(['error' => 'Invalid JSON body.'], 400);
}

$action = trim($body['action'] ?? '');

// ── ACTION: login ─────────────────────────────────────────────
if ($action === 'login') {
    $username = trim($body['username'] ?? '');
    $password = $body['password'] ?? '';

    $profile = user_authenticate($username, $password);
    if (!$profile) {
        respond(['error' => 'Invalid username or password.'], 401);
    }

    $_SESSION['username'] = $profile['username'];
    $_SESSION['role']     = $profile['role'] ?? 'user';
    user_touch_login($profile['username']);

    respond(['ok' => true, 'user' => user_public($profile)]);
}

// ── ACTION: logout ────────────────────────────────────────────
if ($action === 'logout') {
    session_destroy();
    respond(['ok' => true]);
}

// ── ACTION: register ──────────────────────────────────────────
if ($action === 'register') {
    if (!OPEN_REGISTRATION) {
        respond(['error' => 'Registration is currently closed.'], 403);
    }

    $username = trim($body['username'] ?? '');
    $password = $body['password'] ?? '';

    $result = user_create($username, $password);
    if (!empty($result['error'])) {
        respond($result, 409);
    }

    // Auto-login after registration
    $profile = user_load($username);
    $_SESSION['username'] = $profile['username'];
    $_SESSION['role']     = $profile['role'] ?? 'user';
    user_touch_login($username);

    respond(['ok' => true, 'user' => user_public($profile)]);
}

// ── Unknown action ────────────────────────────────────────────
respond(['error' => 'Unknown action: ' . htmlspecialchars($action)], 400);
