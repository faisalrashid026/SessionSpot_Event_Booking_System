<?php
declare(strict_types=1);
require __DIR__.'/../server/bootstrap.php';
require __DIR__.'/../server/accounts.php';
require __DIR__.'/../server/events.php';
require __DIR__.'/../server/bookings.php';
require __DIR__.'/../server/state.php';
require __DIR__.'/../server/admin.php';
header('Cache-Control: no-store');header('Content-Type: application/json; charset=utf-8');header('X-Content-Type-Options: nosniff');
try {
    start_session();db();$action=$_GET['action']??'';$method=$_SERVER['REQUEST_METHOD'];
    if($method==='GET'&&$action==='bootstrap')$result=server_state();
    elseif($method==='GET'&&$action==='poster'){
        $e=event_row((string)($_GET['event']??''));if(!can_view_event($e,actor(false)))fail('Poster not found.',404);
        $file=$e['poster_file'];if(!$file||!preg_match('/^[a-f0-9]{32}\.png$/D',$file))fail('Poster not found.',404);
        $path=__DIR__.'/../storage/posters/'.$file;if(!is_file($path))fail('Poster not found.',404);
        session_write_close();header('Content-Type: image/png');header('Content-Length: '.filesize($path));readfile($path);exit;
    }else{
        if($method!=='POST')fail('Endpoint not found.',404);csrf();
        if(!str_starts_with($_SERVER['CONTENT_TYPE']??'','application/json'))fail('Use JSON request data.',415);
        if((int)($_SERVER['CONTENT_LENGTH']??0)>1500000)fail('The request is too large.',413);
        $d=json_decode(file_get_contents('php://input'),true,32,JSON_THROW_ON_ERROR);if(!is_array($d)||array_is_list($d)&&$d!==[])fail('Use a JSON object.');
        $result=match($action){
            'register'=>register_account($d),'login'=>login_account($d),'logout'=>logout_account(),
            'profile'=>update_profile($d),'password'=>change_password($d),'forgot'=>request_reset($d),'reset'=>reset_password($d),
            'organization'=>save_organization($d),'event'=>save_event($d),'event-status'=>set_event_status($d),
            'reserve'=>reserve_tickets($d),'cancel'=>cancel_reservation($d),'admin-user'=>admin_user($d),'admin-organization'=>admin_organization($d),
            'saved'=>(function()use($d){$u=actor();$e=event_row((string)($d['id']??''));if(!can_view_event($e,$u))fail('Event unavailable.',404);$old=row('SELECT event_id FROM saved_events WHERE user_id=? AND event_id=?',[$u['id'],$e['id']]);if($old)query('DELETE FROM saved_events WHERE user_id=? AND event_id=?',[$u['id'],$e['id']]);else query('INSERT INTO saved_events VALUES (?,?)',[$u['id'],$e['id']]);return true;})(),
            'contact'=>(function()use($d){rate_limit('contact',5);$c=config();$email=email($d['email']??null);$message=text($d['message']??null,10,4000,'message');if(empty($c['mail_enabled'])||!filter_var($c['support_email']??'',FILTER_VALIDATE_EMAIL)||!filter_var($c['mail_from']??'',FILTER_VALIDATE_EMAIL))fail('Support email is not configured. Please contact the event organizer directly.',503);if(!mail($c['support_email'],'SessionSpot support request',"Reply to: $email\n\n$message",'From: '.$c['mail_from']))fail('The message could not be delivered. Please try again later.',503);return true;})(),
            default=>throw new ApiError('Endpoint not found.',404),
        };
    }
    echo json_encode(['ok'=>true,'result'=>$result,'csrf'=>$_SESSION['csrf']],JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE);
}catch(ApiError $e){http_response_code($e->status);echo json_encode(['ok'=>false,'error'=>$e->getMessage()]);}
catch(JsonException $e){http_response_code(400);echo json_encode(['ok'=>false,'error'=>'Invalid JSON request.']);}
catch(PDOException $e){error_log('SessionSpot database error: '.$e->getCode());$duplicate=$e->getCode()==='23000';http_response_code($duplicate?409:503);echo json_encode(['ok'=>false,'error'=>$duplicate?'A conflicting record already exists. Reload and try again.':'Database service unavailable. Nothing was confirmed. Contact the administrator.']);}
catch(Throwable $e){error_log('SessionSpot service error: '.$e->getMessage());http_response_code(500);echo json_encode(['ok'=>false,'error'=>'The operation could not be completed. Nothing was confirmed. Please try again.']);}
