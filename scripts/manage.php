<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require __DIR__.'/../server/bootstrap.php';
try {
    $command=$argv[1]??'';
    if(in_array('--json-stdin',$argv,true)){$d=json_decode(stream_get_contents(STDIN),true,32,JSON_THROW_ON_ERROR);}
    else {
        $d=[];
        if($command==='create-admin')$d['name']=readline('Administrator full name: ');
        $d['email']=readline('Email: ');
        if($command!=='issue-reset'){
            if(!stream_isatty(STDIN))throw new RuntimeException('Use an interactive terminal or --json-stdin with a private input pipe.');
            fwrite(STDOUT,'New password (hidden): ');system('stty -echo');
            try{$d['password']=rtrim(fgets(STDIN),"\r\n");}finally{system('stty echo');fwrite(STDOUT,"\n");}
        }
    }
    $email=email($d['email']??null);
    if($command==='create-admin'){
        $name=text($d['name']??null,2,80,'name');$password=password($d['password']??null);
        query("INSERT INTO users (id,name,email,password_hash,role) VALUES (?,?,?,?,'Admin')",[uid(),$name,$email,password_hash($password,PASSWORD_DEFAULT)]);
        echo "Administrator created. No credentials are printed or stored outside the password hash.\n";
    }elseif($command==='reset-password'){
        $password=password($d['password']??null);$u=row("SELECT id FROM users WHERE email=? AND status='Active'",[$email]);if(!$u)throw new RuntimeException('Active user not found.');
        transaction(function()use($password,$u){query('UPDATE users SET password_hash=?,session_version=session_version+1 WHERE id=?',[password_hash($password,PASSWORD_DEFAULT),$u['id']]);query('UPDATE password_resets SET used_at=UTC_TIMESTAMP() WHERE user_id=?',[$u['id']]);});
        echo "Password changed; all existing sessions revoked. Deliver the new password privately.\n";
    }elseif($command==='issue-reset'){
        $u=row("SELECT id FROM users WHERE email=? AND status='Active'",[$email]);if(!$u)throw new RuntimeException('Active user not found.');
        $token=bin2hex(random_bytes(32));query('INSERT INTO password_resets (token_hash,user_id,expires_at) VALUES (?,?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 30 MINUTE))',[hash('sha256',$token),$u['id']]);
        // Local operator only: never served through the web. Do not log/share publicly.
        echo rtrim(config()['base_url'],'/').'/reset-password.html#token='.$token."\n";
    }else throw new RuntimeException('Use create-admin, reset-password or issue-reset.');
}catch(Throwable $e){fwrite(STDERR,"Setup failed: ".$e->getMessage()."\n");exit(1);}
