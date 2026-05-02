<?php
/**
 * OS/3 WebWarp — backend/ai/chat.php
 * Proxies chat requests to OpenAI ChatCompletions API.
 * Reads API key from logged-in user profile.
 *
 * POST { messages: [...], model: "gpt-4o-mini", max_tokens: 2048 }
 * GET  → { ok, has_key }
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

function respond(array $d, int $code = 200): void {
    http_response_code($code); echo json_encode($d); exit;
}

// Must be logged in
if (empty($_SESSION['username'])) {
    respond(['error' => 'Not authenticated.'], 401);
}

$profile = user_load($_SESSION['username']);
$apiKey  = $profile['prefs']['openai_api_key'] ?? '';

// GET — check key
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    respond(['ok' => true, 'has_key' => !empty($apiKey)]);
}

// POST — proxy
$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) respond(['error' => 'Invalid JSON.'], 400);

if (empty($apiKey)) {
    respond(['error' => 'No OpenAI API key configured. Set it in System Setup → API Keys.'], 403);
}

$messages  = $body['messages']   ?? [];
$model     = $body['model']      ?? 'gpt-4o-mini';
$maxTokens = (int)($body['max_tokens'] ?? 2048);

$allowedModels = ['gpt-4o-mini','gpt-4o','gpt-3.5-turbo'];
if (!in_array($model, $allowedModels, true)) $model = 'gpt-4o-mini';

$payload = json_encode([
    'model'      => $model,
    'messages'   => $messages,
    'max_tokens' => $maxTokens,
]);

$ctx = stream_context_create([
    'http' => [
        'method'        => 'POST',
        'header'        => "Content-Type: application/json\r\nAuthorization: Bearer {$apiKey}\r\n",
        'content'       => $payload,
        'ignore_errors' => true,
        'timeout'       => 60,
    ],
]);

$raw = @file_get_contents('https://api.openai.com/v1/chat/completions', false, $ctx);

if ($raw === false) {
    respond(['error' => 'Network error contacting OpenAI.'], 502);
}

$data = json_decode($raw, true);

if (!empty($data['error'])) {
    respond(['error' => $data['error']['message'] ?? 'OpenAI error.'], 502);
}

$text = $data['choices'][0]['message']['content'] ?? '';
respond([
    'ok'    => true,
    'text'  => $text,
    'model' => $model,
    'usage' => $data['usage'] ?? null,
]);
