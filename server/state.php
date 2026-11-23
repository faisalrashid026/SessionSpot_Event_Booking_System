<?php
declare(strict_types=1);
function serialize_event(array $e): array {
    $organization=$e['organization_id']?row('SELECT name FROM organizations WHERE id=?',[$e['organization_id']]):null;
    $owner=row('SELECT name FROM users WHERE id=?',[$e['owner_id']]);
    $tickets=[];
    foreach(query('SELECT * FROM ticket_types WHERE event_id=? ORDER BY created_dummy',[]) as $_){} // replaced below during source assembly
    return [];
}
