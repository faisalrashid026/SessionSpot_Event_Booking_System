<?php
declare(strict_types=1);
function serialize_event(array $e): array {
    $organization=$e['organization_id']?row('SELECT name FROM organizations WHERE id=?',[$e['organization_id']]):null;
    $owner=row('SELECT name FROM users WHERE id=?',[$e['owner_id']]);
    $tickets=[];
    foreach(query('SELECT * FROM ticket_types WHERE event_id=? ORDER BY client_key',[$e['id']])->fetchAll() as $t)
        $tickets[]=['id'=>$t['client_key'],'name'=>$t['name'],'description'=>$t['description'],'price'=>(int)$t['price_cents']/100,'capacity'=>(int)$t['capacity'],'sold'=>(int)$t['sold']];
    return ['id'=>$e['id'],'ownerId'=>$e['owner_id'],'organizationId'=>$e['organization_id'],'title'=>$e['title'],'description'=>$e['description'],'category'=>$e['category'],'venue'=>$e['venue'],'location'=>$e['location'],'organizer'=>$organization['name']??$owner['name'],'date'=>$e['event_date'],'time'=>date('g:i A',strtotime($e['start_time'])).' – '.date('g:i A',strtotime($e['end_time'])),'startsAt'=>str_replace(' ','T',$e['starts_at']).'Z','status'=>$e['status'],'theme'=>'lavender','poster'=>'BRING PEOPLE TOGETHER.','headline'=>$e['title'],'posterImage'=>poster_url($e),'tickets'=>$tickets];
}
function serialize_booking(array $b): array {
    $items=[];$prices=[];$names=[];
    foreach(query('SELECT bi.*,t.client_key FROM booking_items bi JOIN ticket_types t ON t.id=bi.ticket_type_id WHERE bi.booking_id=?',[$b['id']])->fetchAll() as $i){$key=$i['client_key'];$items[$key]=(int)$i['quantity'];$prices[$key]=(int)$i['unit_price_cents']/100;$names[$key]=$i['ticket_name'];}
    return ['id'=>$b['reference'],'eventId'=>$b['event_id'],'ownerId'=>$b['user_id'],'name'=>$b['attendee_name'],'email'=>$b['attendee_email'],'status'=>$b['status'],'created'=>(new DateTimeImmutable($b['created_at'],new DateTimeZone('UTC')))->setTimezone(new DateTimeZone('America/Vancouver'))->format('Y-m-d'),'items'=>(object)$items,'prices'=>(object)$prices,'ticketNames'=>(object)$names,'paymentStatus'=>$b['payment_status'],'total'=>(int)$b['total_cents']/100];
}
function server_state(): array {
    $u=actor(false);$admin=$u&&$u['role']==='Admin';$events=[];$bookings=[];
    foreach(query('SELECT * FROM events ORDER BY starts_at')->fetchAll() as $e)if(can_view_event($e,$u))$events[]=serialize_event($e);
    if($u) {
        $records=$admin?query('SELECT * FROM bookings ORDER BY created_at DESC')->fetchAll():query('SELECT b.* FROM bookings b JOIN events e ON e.id=b.event_id WHERE b.user_id=? OR e.owner_id=? ORDER BY b.created_at DESC',[$u['id'],$u['id']])->fetchAll();
        foreach($records as $b)$bookings[]=serialize_booking($b);
    }
    $users=$admin?array_map('public_user',query('SELECT * FROM users ORDER BY created_at')->fetchAll()):($u?[public_user($u)]:[]);
    $organizations=$admin?query('SELECT * FROM organizations')->fetchAll():($u?query('SELECT * FROM organizations WHERE owner_id=?',[$u['id']])->fetchAll():[]);
    foreach($organizations as &$org){$org['verified']=(bool)$org['verified'];$org['ownerId']=$org['owner_id'];}unset($org);
    $saved=$u?array_column(query('SELECT event_id FROM saved_events WHERE user_id=?',[$u['id']])->fetchAll(),'event_id'):[];
    $activity=array_fill(0,7,0);$dates=[];$zone=new DateTimeZone('America/Vancouver');$today=new DateTimeImmutable('today',$zone);
    for($i=0;$i<7;$i++)$dates[]=$today->modify('-'.(6-$i).' days')->format('Y-m-d');
    if($u) foreach(query("SELECT b.created_at,SUM(bi.quantity) AS qty FROM bookings b JOIN booking_items bi ON bi.booking_id=b.id JOIN events e ON e.id=b.event_id WHERE b.status='Confirmed' AND b.created_at>=DATE_SUB(UTC_TIMESTAMP(),INTERVAL 8 DAY)".($admin?'':' AND e.owner_id=?').' GROUP BY b.id,b.created_at',$admin?[]:[$u['id']])->fetchAll() as $b){$day=(new DateTimeImmutable($b['created_at'],new DateTimeZone('UTC')))->setTimezone($zone)->format('Y-m-d');$i=array_search($day,$dates,true);if($i!==false)$activity[$i]+=(int)$b['qty'];}
    return ['currentUserId'=>$u['id']??null,'profile'=>$u?['name'=>$u['name'],'email'=>$u['email']]:['name'=>'Guest','email'=>''],'users'=>$users,'organizations'=>$organizations,'events'=>$events,'bookings'=>$bookings,'saved'=>$saved,'activity'=>$activity,'activityDates'=>$dates,'mailAvailable'=>(bool)(config()['mail_enabled']??false)];
}
