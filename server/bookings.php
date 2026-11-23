<?php
declare(strict_types=1);
function reserve_tickets(array $d): string {
    $u=actor();$eventId=(string)($d['eventId']??'');$key=$d['submissionId']??'';
    if(!is_string($key)||!preg_match('/^[A-Za-z0-9_-]{16,100}$/D',$key))fail('A valid reservation request identifier is required.');
    $items=$d['items']??null;if(!is_array($items)||!$items||count($items)>5)fail('Choose ticket quantities.');
    $name=text($d['details']['name']??null,2,80,'attendee name');$email=email($d['details']['email']??null);
    // Close the session lock so simultaneous requests really reach InnoDB concurrently.
    session_write_close();
    return transaction(function()use($u,$eventId,$key,$items,$name,$email){
        $e=event_row($eventId,true);
        $types=query('SELECT * FROM ticket_types WHERE event_id=? ORDER BY id FOR UPDATE',[$eventId])->fetchAll();
        $byKey=array_column($types,null,'client_key');$clean=[];$total=0;
        foreach($items as $ticketKey=>$input) {
            if(!isset($byKey[$ticketKey]))fail('Unknown ticket category.');
            $qty=whole($input,0,10,'ticket quantity');if($qty)$clean[$ticketKey]=$qty;
        }
        if(!$clean)fail('Select at least one ticket.');ksort($clean);
        $hash=hash('sha256',json_encode([$eventId,$clean,$name,$email],JSON_THROW_ON_ERROR));
        $prior=row('SELECT * FROM bookings WHERE user_id=? AND idempotency_key=?',[$u['id'],$key]);
        if($prior) {if(!hash_equals($prior['request_hash'],$hash))fail('That request identifier belongs to a different reservation.',409);return $prior['reference'];}
        if(!is_public($e))fail('This event is unavailable for reservations.',409);
        foreach($clean as $ticketKey=>$qty) {
            $t=$byKey[$ticketKey];if((int)$t['capacity']-(int)$t['sold']<$qty)fail('Not enough tickets remain for '.$t['name'].'.',409);
            $total+=(int)$t['price_cents']*$qty;
        }
        $id=uid();$reference='SS-'.strtoupper(bin2hex(random_bytes(8)));
        query('INSERT INTO bookings (id,reference,user_id,event_id,attendee_name,attendee_email,payment_status,total_cents,idempotency_key,request_hash) VALUES (?,?,?,?,?,?,?,?,?,?)',[$id,$reference,$u['id'],$eventId,$name,$email,$total?'DueAtVenue':'Free',$total,$key,$hash]);
        foreach($clean as $ticketKey=>$qty) {
            $t=$byKey[$ticketKey];
            query('INSERT INTO booking_items (booking_id,ticket_type_id,quantity,unit_price_cents,ticket_name) VALUES (?,?,?,?,?)',[$id,$t['id'],$qty,$t['price_cents'],$t['name']]);
            query('UPDATE ticket_types SET sold=sold+? WHERE id=?',[$qty,$t['id']]);
        }
        audit('booking.create',$id);return $reference;
    });
}
function cancel_reservation(array $d): bool {
    $u=actor();$reference=(string)($d['id']??'');
    $snapshot=row('SELECT event_id FROM bookings WHERE reference=?',[$reference]);if(!$snapshot)fail('Booking not found.',404);
    session_write_close();
    return transaction(function()use($u,$reference,$snapshot){
        $e=event_row($snapshot['event_id'],true);
        $b=row('SELECT * FROM bookings WHERE reference=? FOR UPDATE',[$reference]);
        if($b['user_id']!==$u['id']&&!manages($e,$u))fail('You cannot access this booking.',403);
        if($b['status']==='Cancelled')return false;
        if($e['starts_at']<=gmdate('Y-m-d H:i:s'))fail('This event has started; the cancellation period has ended.',409);
        foreach(query('SELECT * FROM booking_items WHERE booking_id=? ORDER BY ticket_type_id',[$b['id']])->fetchAll() as $item)
            query('UPDATE ticket_types SET sold=sold-? WHERE id=? AND sold>=?',[$item['quantity'],$item['ticket_type_id'],$item['quantity']]);
        query("UPDATE bookings SET status='Cancelled',cancelled_at=UTC_TIMESTAMP() WHERE id=?",[$b['id']]);
        audit('booking.cancel',$b['id']);return true;
    });
}
