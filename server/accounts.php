<?php
declare(strict_types=1);
const ORG_CATEGORIES=['Business / Company','University / Educational institution','Nonprofit / Charity','Community organization','Government / Public institution','Other'];
function organization_fields(array $d): array {
    $name=text($d['name']??null,2,120,'organization name'); $category=$d['category']??'';
    if (!in_array($category,ORG_CATEGORIES,true)) fail('Choose a valid organization category.');
    $website=text($d['website']??'',0,500,'website');
    if ($website && (!filter_var($website,FILTER_VALIDATE_URL) || !in_array(parse_url($website,PHP_URL_SCHEME),['http','https'],true))) fail('Use an http or https website address.');
    return [$name,$category,$website,multiline($d['description']??'',0,2000,'organization description')];
}
function register_account(array $d): array {
    rate_limit('registration',30);
    $name=text($d['name']??null,2,80,'full name'); $email=email($d['email']??null); $pass=password($d['password']??null);
    if (!hash_equals($pass,(string)($d['confirm']??''))) fail('Passwords do not match.');
    if (($d['terms']??false)!==true) fail('Please agree to the terms and privacy policy.');
    $type=$d['accountType']??'individual'; if (!in_array($type,['individual','organization'],true)) fail('Choose an individual or organization account.');
    $intent=$d['intent']??'Attendee'; if(!in_array($intent,['Attendee','Organizer'],true)) fail('Choose a valid initial intention.');
    if($type==='organization'&&!is_array($d['organization']??null))fail('Enter the organization details.');
    $org=$type==='organization' ? organization_fields($d['organization']) : null;
    $id=uid(); $hash=password_hash($pass,PASSWORD_DEFAULT);
    transaction(function() use ($id,$name,$email,$hash,$intent,$org) {
        if (row('SELECT id FROM users WHERE email=?',[$email])) fail('That email is already registered. Sign in instead.',409);
        query('INSERT INTO users (id,name,email,password_hash,intent) VALUES (?,?,?,?,?)',[$id,$name,$email,$hash,$intent]);
        if($org) query('INSERT INTO organizations (id,owner_id,name,category,website,description) VALUES (?,?,?,?,?,?)',[uid(),$id,...$org]);
    });
    // Registration persists an account; sign-in still verifies the actual password.
    return ['id'=>$id,'email'=>$email];
}
function login_account(array $d): array {
    $email=email($d['email']??null); $pass=is_string($d['password']??null)?$d['password']:'';
    rate_limit('login-ip',100); rate_limit('login-'.$email,10);
    $u=row('SELECT * FROM users WHERE email=?',[$email]);
    $dummy='$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';
    if (!password_verify($pass,$u['password_hash']??$dummy) || !$u || $u['status']!=='Active') fail('Email or password is incorrect, or the account is suspended.',401);
    if (password_needs_rehash($u['password_hash'],PASSWORD_DEFAULT)) query('UPDATE users SET password_hash=? WHERE id=?',[password_hash($pass,PASSWORD_DEFAULT),$u['id']]);
    session_regenerate_id(true); $_SESSION['user_id']=$u['id']; $_SESSION['version']=(int)$u['session_version'];
    $_SESSION['csrf']=bin2hex(random_bytes(32)); $_SESSION['created_at']=time();
    audit('login',$u['id']); return public_user($u);
}
function logout_account(): bool {
    $_SESSION=[]; session_regenerate_id(true); $_SESSION['csrf']=bin2hex(random_bytes(32)); $_SESSION['created_at']=time(); return true;
}
function update_profile(array $d): bool {
    $u=actor(); $name=text($d['name']??null,2,80,'full name');$email=email($d['email']??null);
    if ($email!==$u['email'] && !password_verify((string)($d['current']??''),$u['password_hash'])) fail('Enter your current password to change your email.',403);
    if(row('SELECT id FROM users WHERE email=? AND id<>?',[$email,$u['id']])) fail('That email is already registered.',409);
    query('UPDATE users SET name=?,email=? WHERE id=?',[$name,$email,$u['id']]); return true;
}
function change_password(array $d): bool {
    $u=actor(); if(!password_verify((string)($d['current']??''),$u['password_hash'])) fail('Your current password is incorrect.',403);
    $pass=password($d['password']??null);if(!hash_equals($pass,(string)($d['confirm']??''))) fail('Passwords do not match.');
    query('UPDATE users SET password_hash=?,session_version=session_version+1 WHERE id=?',[password_hash($pass,PASSWORD_DEFAULT),$u['id']]);
    $_SESSION['version']=(int)$u['session_version']+1;session_regenerate_id(true);return true;
}
function save_organization(array $d): string {
    $u=actor(); $fields=organization_fields($d); $id=$d['id']??null;
    if($id) {
        $org=row('SELECT * FROM organizations WHERE id=?',[$id]);
        if(!$org || ($org['owner_id']!==$u['id'] && $u['role']!=='Admin')) fail('You cannot edit this organization.',403);
        query('UPDATE organizations SET name=?,category=?,website=?,description=? WHERE id=?',[...$fields,$id]);
    } else { $id=uid();query('INSERT INTO organizations (id,owner_id,name,category,website,description) VALUES (?,?,?,?,?,?)',[$id,$u['id'],...$fields]); }
    audit('organization.save',$id); return $id;
}
function request_reset(array $d): array {
    $email=email($d['email']??null);rate_limit('reset',5);
    $c=config(); if(empty($c['mail_enabled']) || !filter_var($c['mail_from']??'',FILTER_VALIDATE_EMAIL)) fail('Password-reset email is not configured. Contact the site administrator for private account recovery.',503);
    $u=row("SELECT * FROM users WHERE email=? AND status='Active'",[$email]);
    if($u) {
        $token=bin2hex(random_bytes(32)); $hash=hash('sha256',$token);
        query('DELETE FROM password_resets WHERE user_id=?',[$u['id']]);
        query('INSERT INTO password_resets (token_hash,user_id,expires_at) VALUES (?,?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 30 MINUTE))',[$hash,$u['id']]);
        $url=rtrim($c['base_url'],'/').'/reset-password.html#token='.$token;
        if(!mail($u['email'],'Reset your SessionSpot password',"Use this single-use link within 30 minutes:\n".$url,"From: ".$c['mail_from'])) {
            query('DELETE FROM password_resets WHERE token_hash=?',[$hash]); fail('Email delivery failed. Contact the site administrator for recovery.',503);
        }
    }
    return ['message'=>'If an active account matches, a password-reset email has been accepted for delivery.'];
}
function reset_password(array $d): bool {
    $pass=password($d['password']??null);if(!hash_equals($pass,(string)($d['confirm']??'')))fail('Passwords do not match.');
    $token=$d['token']??'';if(!is_string($token)||!preg_match('/^[a-f0-9]{64}$/',$token))fail('The recovery link is invalid or expired.');
    transaction(function()use($pass,$token){
        $r=row('SELECT * FROM password_resets WHERE token_hash=? FOR UPDATE',[hash('sha256',$token)]);
        if(!$r||$r['used_at']||$r['expires_at']<=gmdate('Y-m-d H:i:s'))fail('The recovery link is invalid or expired.');
        query('UPDATE users SET password_hash=?,session_version=session_version+1 WHERE id=?',[password_hash($pass,PASSWORD_DEFAULT),$r['user_id']]);
        query('UPDATE password_resets SET used_at=UTC_TIMESTAMP() WHERE user_id=?',[$r['user_id']]);
    });return true;
}
