<?php
/**
 * OS/3 WebWarp — backend/config.php
 * Central configuration. Adjust paths for your hosting environment.
 */

define('ROOT_DIR',    dirname(__DIR__) . '/');
define('DATA_DIR',    ROOT_DIR . 'data/');
define('USERS_DIR',   DATA_DIR . 'users/');

define('SESSION_NAME',     'OS3_SID');
define('SESSION_LIFETIME', 60 * 60 * 24 * 7);   // 7 days

// Minimum password length
define('MIN_PASS_LEN', 6);

// Asset Versioning for Cache Busting
define('ASSET_VERSION', '0.6.1');

// Allow public registration (true) or invite-only (false)
define('OPEN_REGISTRATION', true);

// CORS — set to your domain in production, '*' for dev
define('CORS_ORIGIN', '*');
