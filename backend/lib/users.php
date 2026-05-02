<?php
/**
 * OS/3 WebWarp — backend/lib/users.php
 * User account management over JSON storage.
 * Each user has a directory: data/users/{username}/profile.json
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/storage.php';

/**
 * Return the profile path for a given username.
 */
function user_profile_path(string $username): string {
    return USERS_DIR . $username . '/profile.json';
}

/**
 * Check if a username exists.
 */
function user_exists(string $username): bool {
    return file_exists(user_profile_path($username));
}

/**
 * Load a user profile. Returns null if not found.
 */
function user_load(string $username): ?array {
    $path = user_profile_path($username);
    return json_read($path);
}

/**
 * Create a new user.
 * Returns ['ok' => true] on success, ['error' => '...'] on failure.
 */
function user_create(string $username, string $password): array {
    if (!preg_match('/^[a-zA-Z0-9_\-\.]{1,64}$/', $username)) {
        return ['error' => 'Invalid username format.'];
    }
    if (strlen($password) < MIN_PASS_LEN) {
        return ['error' => 'Password too short (min ' . MIN_PASS_LEN . ' chars).'];
    }
    if (user_exists($username)) {
        return ['error' => 'Username already taken.'];
    }

    $profile = [
        'username'   => $username,
        'password'   => password_hash($password, PASSWORD_BCRYPT),
        'created_at' => date('c'),
        'last_login' => null,
        'role'       => 'user',
        'prefs'      => [
            'desktop_color' => '#008080',
            'icon_layout'   => 'right',
        ],
    ];

    $dir = USERS_DIR . $username;
    if (!is_dir($dir)) mkdir($dir, 0750, true);

    if (!json_write(user_profile_path($username), $profile)) {
        return ['error' => 'Could not save user data.'];
    }
    return ['ok' => true, 'username' => $username];
}

/**
 * Verify credentials. Returns the profile array on success, null on failure.
 */
function user_authenticate(string $username, string $password): ?array {
    $profile = user_load($username);
    if (!$profile) return null;
    if (!password_verify($password, $profile['password'])) return null;
    return $profile;
}

/**
 * Update last_login timestamp.
 */
function user_touch_login(string $username): void {
    json_update(user_profile_path($username), function(array $p) {
        $p['last_login'] = date('c');
        return $p;
    });
}

/**
 * Update user preferences (partial merge).
 */
function user_save_prefs(string $username, array $prefs): bool {
    return json_update(user_profile_path($username), function(array $p) use ($prefs) {
        $p['prefs'] = array_merge($p['prefs'] ?? [], $prefs);
        return $p;
    });
}

/**
 * Return a safe public profile (no password hash).
 */
function user_public(array $profile): array {
    unset($profile['password']);
    return $profile;
}
