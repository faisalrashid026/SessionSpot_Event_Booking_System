<?php
// Copy to config.local.php, outside version control. All paths stay on this server.
return [
    'dsn' => 'mysql:host=127.0.0.1;port=3306;dbname=sessionspot;charset=utf8mb4',
    'db_user' => 'sessionspot_app',
    'db_password' => 'REPLACE_WITH_A_RANDOM_PASSWORD',
    'base_url' => 'http://localhost/Faisal/projecPart2',
    'mail_enabled' => false, // Enable only after PHP mail() delivery is configured/tested.
    'mail_from' => '',
    'support_email' => '',
];
