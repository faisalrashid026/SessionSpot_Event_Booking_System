<?php
declare(strict_types=1);
function schedule(array $d): array {
    $date=$d['date']??''; $range=$d['time']??'';
    if(!is_string($date)||!preg_match('/^(20\d{2})-(\d{2})-(\d{2})$/',$date,$m)||!checkdate((int)$m[2],(int)$m[3],(int)$m[1]))fail('Choose a valid event date.');
    if(!is_string($range)||!preg_match('/^\s*(.+?)\s*[–—-]\s*(.+?)\s*$/u',$range,$parts))fail('Use a start and end time, for example 9:00 AM – 5:00 PM.');
    $times=[];
    foreach([$parts[1],$parts[2]] as $part) {
        $part=strtoupper(trim($part));$time=false;
        foreach(['!g:i A','!H:i'] as $format) {
            $candidate=DateTimeImmutable::createFromFormat($format,$part,new DateTimeZone('UTC'));
            $errors=DateTimeImmutable::getLastErrors();
            if($candidate && (!$errors || !$errors['warning_count']&&!$errors['error_count'])){$time=$candidate->format('H:i');break;}
        }
        if(!$time)fail('Enter valid start and end times.'); $times[]=$time;
    }
    if($times[0]>=$times[1])fail('The end time must be after the start time on the same day.');
    $utc=[];
    foreach($times as $t) {
        $dt=DateTimeImmutable::createFromFormat('!Y-m-d H:i',"$date $t",new DateTimeZone('America/Vancouver'));
        if(!$dt||$dt->format('Y-m-d H:i')!=="$date $t")fail('That time does not exist in Vancouver due to daylight saving.');
        $utc[]=$dt->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s');
    }
    return [$date,$times[0],$times[1],...$utc];
}
function store_poster(mixed $data): array {
    if(!is_string($data)||strlen($data)>1398150||!preg_match('#^data:image/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$#D',$data,$m))fail('Use a PNG, JPEG or WebP poster up to 1 MB.');
    $bytes=base64_decode($m[2],true);if($bytes===false||strlen($bytes)>1048576)fail('The poster is too large or invalid.');
    $mime=(new finfo(FILEINFO_MIME_TYPE))->buffer($bytes); $size=@getimagesizefromstring($bytes);
    if($mime!=='image/'.$m[1]||!$size||$size[0]*$size[1]>20000000)fail('The poster must be a readable PNG, JPEG or WebP up to 20 million pixels.');
    $image=@imagecreatefromstring($bytes);if(!$image)fail('The image could not be decoded.');
    $directory=dirname(__DIR__).'/storage/posters';
    if(!is_dir($directory)&&!mkdir($directory,0700,true)){imagedestroy($image);fail('Poster storage is unavailable.',503);}
    $file=uid().'.png';imagesavealpha($image,true);$ok=imagepng($image,$directory.'/'.$file);imagedestroy($image);
    if(!$ok)fail('The poster could not be stored. Nothing was published.',503);
    chmod($directory.'/'.$file,0600);return [$file,'image/png'];
}
function save_event(array $d): string {
    $u=actor();$id=$d['id']??null;$fields=$d['fields']??[];$newPoster=null;$oldPoster=null;
    try {
        $result=transaction(function()use($u,$id,$fields,&$newPoster,&$oldPoster){
            $existing=$id?event_row($id,true):null;if($existing)require_event_owner($existing);
            $title=text($fields['title']??null,4,140,'event title'); $description=text($fields['description']??null,15,5000,'description');
            $location=text($fields['location']??null,3,160,'location/address'); $venue=text($fields['venue']??$location,2,160,'venue');
            $category=$fields['category']??'';$status=$fields['status']??'';
            if(!in_array($category,['Education','Business','Community','Arts & culture'],true)||!in_array($status,['Draft','Published'],true))fail('Choose a valid category and status.');
            $schedule=schedule($fields);
            if($status==='Published'&&$schedule[3]<=gmdate('Y-m-d H:i:s'))fail('A published event must start in the future in Vancouver time.');
            $org=$fields['organizationId']??null;if($org==='')$org=null;
            if($org) {
                $organization=row("SELECT * FROM organizations WHERE id=? AND status='Active'",[$org]);
                $owner=$existing['owner_id']??$u['id'];
                if(!$organization||$organization['owner_id']!==$owner)fail('Choose an active organization you own.',403);
            }
            $inputs=$fields['tickets']??null;if(!is_array($inputs)||count($inputs)<1||count($inputs)>5)fail('Use one to five ticket types.');
            $previous=$existing?query('SELECT * FROM ticket_types WHERE event_id=? ORDER BY id FOR UPDATE',[$id])->fetchAll():[];
            $old=array_column($previous,null,'client_key');$names=[];$keys=[];$tickets=[];
            foreach($inputs as $t) {
                $key=$t['id']??'';if(!is_string($key)||!preg_match('/^[A-Za-z0-9_-]{1,80}$/D',$key)||isset($keys[$key]))fail('Ticket identities must be distinct and stable.');
                $name=text($t['name']??null,2,80,'ticket name');$normalized=mb_strtolower(preg_replace('/\s+/u',' ',$name));
                if(isset($names[$normalized]))fail('Use distinct ticket names.');$names[$normalized]=true;$keys[$key]=true;
                $price=cents($t['price']??null);$capacity=whole($t['capacity']??null,1,100000,'capacity');$sold=(int)($old[$key]['sold']??0);
                if($capacity<$sold)fail('Capacity cannot be below reserved tickets.');
                if($status==='Draft'&&$sold)fail('An event with reservations cannot become a draft. Cancel the event instead.');
                $tickets[]=[$old[$key]['id']??uid(),$key,$name,text($t['description']??'',0,160,'ticket description'),$price,$capacity];
            }
            foreach($old as $key=>$t)if(!isset($keys[$key]))fail('Existing ticket types cannot be removed; their booking history must be preserved.');
            $posterFile=$existing['poster_file']??null;$posterMime=$existing['poster_mime']??null;$oldPoster=$posterFile;
            if(array_key_exists('posterImage',$fields)) {
                $p=$fields['posterImage'];
                if($p===null||$p===''){$posterFile=null;$posterMime=null;}
                elseif(is_string($p)&&str_starts_with($p,'data:')){[$posterFile,$posterMime]=store_poster($p);$newPoster=$posterFile;}
                elseif(!$existing||$p!==poster_url($existing))fail('The poster reference is invalid.');
            }
            $eventId=$id?:uid();
            if($existing)query('UPDATE events SET organization_id=?,title=?,description=?,category=?,venue=?,location=?,event_date=?,start_time=?,end_time=?,starts_at=?,ends_at=?,status=?,poster_file=?,poster_mime=? WHERE id=?',[$org,$title,$description,$category,$venue,$location,...$schedule,$status,$posterFile,$posterMime,$eventId]);
            else query('INSERT INTO events (id,owner_id,organization_id,title,description,category,venue,location,event_date,start_time,end_time,starts_at,ends_at,status,poster_file,poster_mime) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',[$eventId,$u['id'],$org,$title,$description,$category,$venue,$location,...$schedule,$status,$posterFile,$posterMime]);
            foreach($tickets as [$ticketId,$key,$name,$desc,$price,$capacity]) {
                if(isset($old[$key]))query('UPDATE ticket_types SET name=?,description=?,price_cents=?,capacity=? WHERE id=?',[$name,$desc,$price,$capacity,$ticketId]);
                else query('INSERT INTO ticket_types (id,event_id,client_key,name,description,price_cents,capacity) VALUES (?,?,?,?,?,?,?)',[$ticketId,$eventId,$key,$name,$desc,$price,$capacity]);
            }
            audit('event.save',$eventId);return $eventId;
        });
        if($oldPoster&&$oldPoster!==$newPoster&&($newPoster||($fields['posterImage']??'')===null))@unlink(dirname(__DIR__).'/storage/posters/'.$oldPoster);
        return $result;
    } catch(Throwable $e) { if($newPoster)@unlink(dirname(__DIR__).'/storage/posters/'.$newPoster);throw $e; }
}
function set_event_status(array $d): bool {
    return transaction(function()use($d){
        $e=event_row((string)($d['id']??''),true);require_event_owner($e);$action=$d['status']??'';
        $status=$action==='Restore'?($e['before_archive']??'Draft'):$action;
        if(!in_array($status,['Draft','Published','Archived'],true))fail('Choose a valid event status.');
        if($status==='Published'&&$e['starts_at']<=gmdate('Y-m-d H:i:s'))fail('An event that has started cannot be published.');
        if($status==='Draft'&&row('SELECT id FROM ticket_types WHERE event_id=? AND sold>0',[$e['id']]))fail('An event with reservations cannot become a draft.');
        if($status==='Archived') {
            // Event cancellation is serialized with every reservation on this event row.
            query("UPDATE bookings SET status='Cancelled',cancelled_at=UTC_TIMESTAMP() WHERE event_id=? AND status='Confirmed'",[$e['id']]);
            query('UPDATE ticket_types SET sold=0 WHERE event_id=?',[$e['id']]);
        }
        query('UPDATE events SET status=?,before_archive=? WHERE id=?',[$status,$status==='Archived'&&$e['status']!=='Archived'?$e['status']:$e['before_archive'],$e['id']]);
        audit('event.status',$e['id']);return true;
    });
}
function poster_url(array $e): ?string { return $e['poster_file']?'api/index.php?action=poster&event='.$e['id'].'&v='.rawurlencode($e['poster_file']):null; }
