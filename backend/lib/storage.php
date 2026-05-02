<?php
/**
 * OS/3 WebWarp — backend/lib/storage.php
 * Atomic JSON read/write using flock().
 * Thread-safe for concurrent PHP requests.
 */

/**
 * Read a JSON file and return its decoded contents.
 * Returns $default if the file does not exist.
 */
function json_read(string $path, $default = null) {
    if (!file_exists($path)) return $default;
    $fh = fopen($path, 'r');
    if (!$fh) return $default;
    flock($fh, LOCK_SH);
    $raw = stream_get_contents($fh);
    flock($fh, LOCK_UN);
    fclose($fh);
    return json_decode($raw, true) ?? $default;
}

/**
 * Write $data as JSON to $path atomically.
 * Writes to a temp file then renames to avoid partial reads.
 */
function json_write(string $path, $data): bool {
    $dir  = dirname($path);
    if (!is_dir($dir)) {
        mkdir($dir, 0750, true);
    }
    $tmp = $path . '.tmp.' . getmypid();
    $fh  = fopen($tmp, 'w');
    if (!$fh) return false;
    flock($fh, LOCK_EX);
    fwrite($fh, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    fflush($fh);
    flock($fh, LOCK_UN);
    fclose($fh);
    return rename($tmp, $path);
}

/**
 * Atomically update a JSON file using a callback.
 * $callback receives the current data and returns the modified data.
 * Uses exclusive lock to prevent race conditions.
 */
function json_update(string $path, callable $callback, $default = []): bool {
    $dir = dirname($path);
    if (!is_dir($dir)) mkdir($dir, 0750, true);

    // Open or create the file for read+write
    $fh = fopen($path, file_exists($path) ? 'r+' : 'w+');
    if (!$fh) return false;
    flock($fh, LOCK_EX);

    $raw  = stream_get_contents($fh);
    $data = $raw ? (json_decode($raw, true) ?? $default) : $default;
    $data = $callback($data);

    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    fflush($fh);
    flock($fh, LOCK_UN);
    fclose($fh);
    return true;
}
