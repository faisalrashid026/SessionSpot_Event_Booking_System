<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require __DIR__.'/../server/bootstrap.php';
require __DIR__.'/../server/events.php';
try {
    $options = getopt('', ['owner:', 'yes']);
    $email = email($options['owner'] ?? readline('Email of the account that will own the sample events: '));
    $user = row("SELECT * FROM users WHERE email=? AND status='Active'", [$email]);
    if (!$user) fail('Register the owner account first. No accounts or passwords are seeded.');
    if (!array_key_exists('yes', $options) && readline('Create two clearly labeled educational sample events? Type SEED: ') !== 'SEED') exit("No changes made.\n");
    // Trusted local operator only; the public application has no identity shortcut.
    $_SESSION = ['user_id'=>$user['id'], 'version'=>(int)$user['session_version']];
    $today = new DateTimeImmutable('today', new DateTimeZone('America/Vancouver'));
    $samples = [
        ['Sample — Community Skills Exchange', 'Community', 14, 0, 40, 'Community Learning Room'],
        ['Sample — Creative Ideas Workshop', 'Education', 21, 12.5, 30, 'Workshop Studio'],
    ];
    $created = 0;
    foreach ($samples as [$title, $category, $days, $price, $capacity, $venue]) {
        if (row('SELECT id FROM events WHERE owner_id=? AND title=?', [$user['id'],$title])) continue;
        save_event(['id'=>null, 'fields'=>[
            'title'=>$title, 'description'=>'Educational sample event for learning and instructor evaluation. This is not an actual third-party event; do not travel or make payment for it.',
            'category'=>$category, 'venue'=>$venue, 'location'=>'Illustrative venue — no real event location',
            'date'=>$today->modify("+$days days")->format('Y-m-d'), 'time'=>'10:00 AM – 12:00 PM',
            'status'=>'Published', 'organizationId'=>null, 'posterImage'=>null,
            'tickets'=>[
                ['id'=>'general', 'name'=>'General admission', 'price'=>$price, 'capacity'=>$capacity, 'description'=>'Educational sample admission'],
                ['id'=>'student', 'name'=>'Student ticket', 'price'=>0, 'capacity'=>10, 'description'=>'Free educational sample admission'],
            ],
        ]]);
        ++$created;
    }
    echo "$created sample event(s) created; existing matching samples left unchanged. No bookings were seeded.\n";
} catch (Throwable $e) { fwrite(STDERR, $e->getMessage()."\n"); exit(1); }
