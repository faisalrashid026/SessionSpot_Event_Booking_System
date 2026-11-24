<?php
declare(strict_types=1);
function admin_user(array $d): bool {
    $u=administrator();$id=(string)($d['id']??'');$role=$d['role']??null;$status=$d['status']??null;
    return transaction(function()use($u,$id,$role,$status){
        // Lock the complete administrator set to protect the last active administrator.
        $admins=query("SELECT id FROM users WHERE role='Admin' AND status='Active' ORDER BY id FOR UPDATE")->fetchAll();
        $target=row('SELECT * FROM users WHERE id=? FOR UPDATE',[$id]);if(!$target)fail('User not found.',404);
        $newRole=$role??$target['role'];$newStatus=$status??$target['status'];
        if(!in_array($newRole,['User','Admin'],true)||!in_array($newStatus,['Active','Suspended'],true))fail('Choose a valid role and account status.');
        if($id===$u['id']&&($newRole!=='Admin'||$newStatus!=='Active'))fail('You cannot demote or suspend your own administrator account.');
        if($target['role']==='Admin'&&$target['status']==='Active'&&($newRole!=='Admin'||$newStatus!=='Active')&&count($admins)<2)fail('Keep at least one active administrator.');
        query('UPDATE users SET role=?,status=?,session_version=session_version+1 WHERE id=?',[$newRole,$newStatus,$id]);
        if($id===$u['id'])$_SESSION['version']=(int)$target['session_version']+1;
        audit('admin.user',$id);return true;
    });
}
function admin_organization(array $d): bool {
    administrator();$status=$d['status']??'';if(!in_array($status,['Active','Suspended'],true))fail('Choose a valid organization status.');
    if(!row('SELECT id FROM organizations WHERE id=?',[$d['id']??'']))fail('Organization not found.',404);
    query('UPDATE organizations SET status=? WHERE id=?',[$status,$d['id']]);audit('admin.organization',$d['id']);return true;
}
