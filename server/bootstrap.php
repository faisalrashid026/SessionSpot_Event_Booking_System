<?php
declare(strict_types=1);
date_default_timezone_set('UTC');
final class ApiError extends RuntimeException {
    public function __construct(string $message, public int $status = 422) { parent::__construct($message); }
}
function fail(string $message, int $status = 422): never { throw new ApiError($message, $status); }
function config(): array {
    static $c;
    if ($c === null) {
        $file = __DIR__.'/config.local.php';
        if (!is_file($file)) fail('Service not configured. Follow DATABASE_SETUP.md to configure PHP and MySQL.', 503);
        $c = require $file;
    }
    return $c;
}
function db(): PDO {
    static $pdo;
    if (!$pdo) {
        $c = config();
        $pdo = new PDO($c['dsn'], $c['db_user'], $c['db_password'], [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES=>false]);
        $pdo->exec("SET time_zone = '+00:00'");
    }
    return $pdo;
}
function query(string $sql, array $params = []): PDOStatement { $s = db()->prepare($sql); $s->execute($params); return $s; }
function row(string $sql, array $params = []): ?array { return query($sql,$params)->fetch() ?: null; }
function uid(): string { return bin2hex(random_bytes(16)); }
function text(mixed $s, int $min, int $max, string $label): string {
    if (!is_string($s)) fail("Check $label.");
    $s = trim(preg_replace('/\s+/u', ' ', $s) ?? '');
    if (mb_strlen($s) < $min || mb_strlen($s) > $max || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', $s)) fail("Check $label ($min–$max characters).");
    return $s;
}
function email(mixed $s): string {
    if (!is_string($s)) fail('Enter a valid email address.');
    $s = strtolower(trim($s));
    if (strlen($s)>254 || !filter_var($s,FILTER_VALIDATE_EMAIL)) fail('Enter a valid email address.');
    return $s;
}
function password(mixed $s): string {
    if (!is_string($s) || strlen($s)<8 || strlen($s)>72 || !preg_match('/[0-9]/',$s) || preg_match('/[\x00-\x1F\x7F]/',$s)) fail('Use 8–72 bytes, including a number, for your password.');
    return $s;
}
function whole(mixed $n, int $min, int $max, string $label): int {
    if ((!is_int($n) && !is_string($n)) || !preg_match('/^\d+$/',(string)$n) || (int)$n<$min || (int)$n>$max) fail("Check $label: use a whole number from $min to $max.");
    return (int)$n;
}
function cents(mixed $n): int {
    if ((!is_float($n) && !is_int($n)) || !is_finite((float)$n) || $n<0 || $n>10000 || abs($n*100-round($n*100))>.000001) fail('Use a CAD price from 0 to 10,000 with at most two decimals.');
    return (int)round($n*100);
}
function transaction(callable $work): mixed {
    db()->beginTransaction();
    try { $result=$work(); db()->commit(); return $result; }
    catch (Throwable $e) { if(db()->inTransaction()) db()->rollBack(); throw $e; }
}
function audit(string $action, ?string $target=null): void { query('INSERT INTO audit_log (actor_id,action,target_id) VALUES (?,?,?)',[$_SESSION['user_id']??null,$action,$target]); }
function start_session(): void {
    if (session_status()===PHP_SESSION_ACTIVE) return;
    ini_set('session.use_strict_mode','1'); ini_set('session.use_only_cookies','1');
    session_name('sessionspot_session');
    $path = parse_url(config()['base_url'],PHP_URL_PATH) ?: '/';
    session_set_cookie_params(['lifetime'=>0,'path'=>rtrim($path,'/').'/', 'httponly'=>true,'secure'=>!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS']!=='off','samesite'=>'Lax']);
    session_start();
    if (isset($_SESSION['last_seen']) && (time()-$_SESSION['last_seen']>1800 || time()-($_SESSION['created_at']??0)>43200)) $_SESSION=[];
    $_SESSION['csrf'] ??= bin2hex(random_bytes(32)); $_SESSION['created_at'] ??= time(); $_SESSION['last_seen']=time();
}
function actor(bool $required=true): ?array {
    $id=$_SESSION['user_id']??null;
    $user=$id ? row('SELECT * FROM users WHERE id=?',[$id]) : null;
    if ($user && ($user['status']!=='Active' || (int)$user['session_version']!==($_SESSION['version']??0))) {
        unset($_SESSION['user_id'],$_SESSION['version']); $user=null;
    }
    if (!$user && $required) fail('Please sign in to continue.',401);
    return $user;
}
function administrator(): array { $u=actor(); if ($u['role']!=='Admin') fail('Administrator access required.',403); return $u; }
function csrf(): void {
    $value=$_SERVER['HTTP_X_CSRF_TOKEN']??'';
    if (!is_string($value) || !hash_equals($_SESSION['csrf'],$value)) fail('Your session form token expired. Reload and try again.',403);
    if (($_SERVER['HTTP_SEC_FETCH_SITE']??'')==='cross-site') fail('Cross-site request refused.',403);
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        $base=parse_url(config()['base_url']);
        $expected=$base['scheme'].'://'.$base['host'].(isset($base['port'])?':'.$base['port']:'');
        if (!hash_equals($expected,$_SERVER['HTTP_ORIGIN'])) fail('Request origin refused.',403);
    }
}
function rate_limit(string $scope, int $max=30, int $seconds=900): void {
    $bucket=hash('sha256',($_SERVER['REMOTE_ADDR']??'cli').'|'.$scope);
    query('INSERT INTO rate_limits (bucket,attempts,resets_at) VALUES (?,1,DATE_ADD(UTC_TIMESTAMP(),INTERVAL ? SECOND)) ON DUPLICATE KEY UPDATE attempts=IF(resets_at<UTC_TIMESTAMP(),1,attempts+1), resets_at=IF(resets_at<UTC_TIMESTAMP(),VALUES(resets_at),resets_at)',[$bucket,$seconds]);
    if ((int)row('SELECT attempts FROM rate_limits WHERE bucket=?',[$bucket])['attempts']>$max) fail('Too many attempts. Please try again later.',429);
}
function public_user(array $u): array { return ['id'=>$u['id'],'name'=>$u['name'],'email'=>$u['email'],'role'=>$u['role'],'intent'=>$u['intent'],'active'=>$u['status']==='Active','status'=>$u['status']]; }
function event_row(string $id, bool $lock=false): array {
    return row('SELECT * FROM events WHERE id=?'.($lock?' FOR UPDATE':''),[$id]) ?? throw new ApiError('Event not found.',404);
}
function manages(array $event, array $u): bool { return $u['role']==='Admin' || $event['owner_id']===$u['id']; }
function require_event_owner(array $event): array { $u=actor(); if (!manages($event,$u)) fail('You cannot manage this event.',403); return $u; }
function is_public(array $event): bool {
    if ($event['status']!=='Published' || $event['starts_at']<=gmdate('Y-m-d H:i:s')) return false;
    if (!row("SELECT id FROM users WHERE id=? AND status='Active'",[$event['owner_id']])) return false;
    return !$event['organization_id'] || (bool)row("SELECT id FROM organizations WHERE id=? AND status='Active'",[$event['organization_id']]);
}
function can_view_event(array $event, ?array $u): bool {
    return is_public($event) || $u && (manages($event,$u) || row('SELECT id FROM bookings WHERE event_id=? AND user_id=?',[$event['id'],$u['id']]));
}
