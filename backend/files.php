<?php
/* OS/3 WebWarp — File Manager Backend */
require_once __DIR__ . '/config.php';
header('Content-Type: application/json');

session_name(SESSION_NAME);
session_start();

if (!isset($_SESSION['username'])) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Not authenticated']);
    exit;
}

$user    = preg_replace('/[^a-zA-Z0-9_\-]/', '', $_SESSION['username']);
$userDir = USERS_DIR . $user . '/files/';

if (!is_dir($userDir)) {
    mkdir($userDir, 0755, true);
}

$action = $_GET['action'] ?? 'list';

switch ($action) {
    case 'list':
        $files = [];
        foreach (glob($userDir . '*') as $path) {
            if (is_file($path)) {
                $files[] = [
                    'name'     => basename($path),
                    'size'     => filesize($path),
                    'modified' => filemtime($path),
                ];
            }
        }
        usort($files, fn($a, $b) => $b['modified'] - $a['modified']);
        echo json_encode(['ok' => true, 'files' => $files]);
        break;

    case 'upload':
        if (empty($_FILES['file'])) {
            echo json_encode(['ok' => false, 'error' => 'No file received']);
            exit;
        }
        $f    = $_FILES['file'];
        $name = preg_replace('/[^a-zA-Z0-9._\-]/', '_', basename($f['name']));
        if (!$name) { echo json_encode(['ok' => false, 'error' => 'Invalid filename']); exit; }
        $dest = $userDir . $name;
        if (move_uploaded_file($f['tmp_name'], $dest)) {
            echo json_encode(['ok' => true, 'name' => $name, 'size' => filesize($dest)]);
        } else {
            echo json_encode(['ok' => false, 'error' => 'Upload failed']);
        }
        break;

    case 'download':
        $name = basename($_GET['name'] ?? '');
        $path = $userDir . $name;
        if (!$name || !is_file($path)) {
            http_response_code(404);
            echo json_encode(['ok' => false, 'error' => 'File not found']);
            exit;
        }
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="' . addslashes($name) . '"');
        header('Content-Length: ' . filesize($path));
        header('Cache-Control: no-cache');
        readfile($path);
        exit;

    case 'delete':
        $name = basename($_GET['name'] ?? '');
        $path = $userDir . $name;
        if (!$name || !is_file($path)) {
            echo json_encode(['ok' => false, 'error' => 'File not found']);
            exit;
        }
        unlink($path);
        echo json_encode(['ok' => true]);
        break;

    case 'save':
        // Save text content as a named file
        $raw  = file_get_contents('php://input');
        $data = json_decode($raw, true);
        $name = basename($data['name'] ?? '');
        $name = preg_replace('/[^a-zA-Z0-9._\-]/', '_', $name);
        if (!$name) { echo json_encode(['ok' => false, 'error' => 'Invalid filename']); exit; }
        $content = $data['content'] ?? '';
        $dest    = $userDir . $name;
        if (file_put_contents($dest, $content) !== false) {
            echo json_encode(['ok' => true, 'name' => $name, 'size' => strlen($content)]);
        } else {
            echo json_encode(['ok' => false, 'error' => 'Write failed']);
        }
        break;

    case 'read':
        $name = basename($_GET['name'] ?? '');
        $path = $userDir . $name;
        if (!$name || !is_file($path)) {
            echo json_encode(['ok' => false, 'error' => 'File not found']);
            exit;
        }
        header('Content-Type: application/json');
        echo json_encode(['ok' => true, 'name' => $name, 'content' => file_get_contents($path)]);
        break;

    case 'rename':
        $raw  = file_get_contents('php://input');
        $data = json_decode($raw, true);
        $old  = basename($data['old'] ?? '');
        $new  = preg_replace('/[^a-zA-Z0-9._\-]/', '_', basename($data['new'] ?? ''));
        if (!$old || !$new) { echo json_encode(['ok' => false, 'error' => 'Invalid names']); exit; }
        $src  = $userDir . $old;
        $dst  = $userDir . $new;
        if (!is_file($src)) { echo json_encode(['ok' => false, 'error' => 'Source not found']); exit; }
        rename($src, $dst);
        echo json_encode(['ok' => true]);
        break;

    default:
        echo json_encode(['ok' => false, 'error' => 'Unknown action']);
}
