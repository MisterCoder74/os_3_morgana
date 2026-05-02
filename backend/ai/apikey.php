<?php
/**
 * OS/3 WebWarp — backend/ai/apikey.php
 * Save / retrieve the user's OpenAI API key in their profile prefs.
 *
 * GET  → { ok, has_key, key_preview }
 * POST { key: "sk-..." } → { ok }
 * POST { key: "" }       → { ok }  (clears key)
 */

require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/lib/storage.php';
require_once dirname(__DIR__) . '/lib/users.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . CORS_ORIGIN);
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

session_name(SESSION_NAME);
session_start();

if (empty($_SESSION['username'])) { http_response_code(401); echo '{"error":"Not authenticated."}'; exit; }

$user = $_SESSION['username'];

function respond(array $d, int $c=200): void { http_response_code($c); echo json_encode($d); exit; }

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $profile = user_load($user);
    $key     = $profile['prefs']['openai_api_key'] ?? '';
    $preview = $key ? substr($key,0,7).'…'.substr($key,-4) : '';
    respond(['ok'=>true,'has_key'=>!empty($key),'key_preview'=>$preview]);
}

$body = json_decode(file_get_contents('php://input'), true);
$key  = trim($body['key'] ?? '');

user_save_prefs($user, ['openai_api_key' => $key]);
respond(['ok' => true]);
