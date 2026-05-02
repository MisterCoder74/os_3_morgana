<?php
/**
 * OS/3 WebWarp — backend/ai/image.php
 * Proxies image generation requests to OpenAI Images API (DALL-E).
 *
 * POST { prompt: "...", size: "1024x1024", n: 1, model: "dall-e-3" }
 */

require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/lib/storage.php';
require_once dirname(__DIR__) . '/lib/users.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . CORS_ORIGIN);
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

session_name(SESSION_NAME);
session_start();

function respond(array $d, int $code = 200): void {
    http_response_code($code); echo json_encode($d); exit;
}

if (empty($_SESSION['username'])) respond(['error' => 'Not authenticated.'], 401);

$profile = user_load($_SESSION['username']);
$apiKey  = $profile['prefs']['openai_api_key'] ?? '';

if (empty($apiKey)) {
    respond(['error' => 'No OpenAI API key configured. Set it in System Setup → API Keys.'], 403);
}

$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body) || empty($body['prompt'])) {
    respond(['error' => 'Invalid request.'], 400);
}

$prompt  = substr(trim($body['prompt']), 0, 1000);
$size    = in_array($body['size'] ?? '', ['256x256','512x512','1024x1024','1792x1024','1024x1792'])
           ? $body['size'] : '1024x1024';
$model   = $body['model'] === 'dall-e-2' ? 'dall-e-2' : 'dall-e-3';

$payload = json_encode(['model'=>$model,'prompt'=>$prompt,'n'=>1,'size'=>$size,'response_format'=>'url']);

$ctx = stream_context_create([
    'http' => [
        'method'        => 'POST',
        'header'        => "Content-Type: application/json\r\nAuthorization: Bearer {$apiKey}\r\n",
        'content'       => $payload,
        'ignore_errors' => true,
        'timeout'       => 90,
    ],
]);

$raw  = @file_get_contents('https://api.openai.com/v1/images/generations', false, $ctx);
if ($raw === false) respond(['error' => 'Network error.'], 502);

$data = json_decode($raw, true);
if (!empty($data['error'])) respond(['error' => $data['error']['message'] ?? 'OpenAI error.'], 502);

$url = $data['data'][0]['url'] ?? null;
respond(['ok' => true, 'url' => $url, 'revised_prompt' => $data['data'][0]['revised_prompt'] ?? $prompt]);
