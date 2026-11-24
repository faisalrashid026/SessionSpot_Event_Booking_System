"""Real HTTP/PHP/MariaDB acceptance tests. Creates isolated, randomly named test records.
No existing records are deleted. Secrets/context stay in ignored .local, never in reports.
"""
from pathlib import Path
import urllib.request, urllib.error, http.cookiejar, json, secrets, subprocess, concurrent.futures, base64, struct, zlib, os
from runtime_env import ROOT, BASE, PHP, REPORT
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
checks=[]
def check(name, condition):
    checks.append({'name':name,'passed':bool(condition)})
    if not condition: raise AssertionError(name)
class Client:
    def __init__(self):
        self.jar=http.cookiejar.CookieJar();self.http=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar));self.token='';self.state()
    def call(self,action,data=None,token=True,origin=None):
        headers={'Content-Type':'application/json'}
        if token:headers['X-CSRF-Token']=self.token
        if origin:headers['Origin']=origin
        req=urllib.request.Request(BASE+'/api/index.php?action='+action,data=None if data is None else json.dumps(data).encode(),headers=headers)
        try:r=self.http.open(req);status=r.status
        except urllib.error.HTTPError as e:r=e;status=e.code
        payload=json.load(r)
        if payload.get('csrf'):self.token=payload['csrf']
        return status,payload
    def good(self,action,data=None):
        status,payload=self.call(action,data)
        if status!=200 or not payload.get('ok'):raise AssertionError(f'{action}: {status}, {payload.get("error")}')
        return payload['result']
    def state(self):return self.good('bootstrap')
def cli(command,data):
    p=subprocess.run([PHP,str(ROOT/'scripts/manage.php'),command,'--json-stdin'],input=json.dumps(data),capture_output=True,text=True)
    if p.returncode:raise AssertionError('Private CLI provisioning failed: '+p.stderr)
    return p.stdout.strip()
def poster():
    def chunk(t,b):return struct.pack('>I',len(b))+t+b+struct.pack('>I',zlib.crc32(t+b)&0xffffffff)
    b=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',2,2,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(b'\0\x80\x50\xc0'*0+b'\0'+b'\x80\x50\xc0'*2+b'\0'+b'\x80\x50\xc0'*2))+chunk(b'IEND',b'')
    return 'data:image/png;base64,'+base64.b64encode(b).decode()
tag=secrets.token_hex(5);password='Test-'+secrets.token_hex(12)+'1';email=lambda kind:f'v1-{kind}-{tag}@example.com'
def registration(kind,organization=False):return {'name':'Instructor '+kind.title(),'email':email(kind),'password':password,'confirm':password,'terms':True,'accountType':'organization' if organization else 'individual','role':'Admin','organization':{'name':'Instructor Organization '+tag,'category':'University / Educational institution','website':'https://example.com','description':'Acceptance-test organization.'}}
def fields(capacity=8):return {'title':'Acceptance Workshop '+tag,'description':'An instructor acceptance workshop backed by real database records.','category':'Education','location':'Campus Hall, 123 Main Street','venue':'Campus Hall','date':(datetime.now(ZoneInfo('America/Vancouver')).date()+timedelta(days=30)).isoformat(),'time':'10:00 AM – 12:00 PM','status':'Draft','tickets':[{'id':'general','name':'General admission','price':12.50,'capacity':capacity,'description':'Workshop access'},{'id':'free','name':'Free student ticket','price':0,'capacity':4,'description':'Student access'}]}
try:
    owner=Client();r=owner.good('register',registration('owner'));owner_id=r['id']
    check('Individual registration is persistent and never accepts a public Admin role',r['email']==email('owner'))
    check('Duplicate email rejected',owner.call('register',registration('owner'))[0]==409)
    code="require $argv[1].'/server/bootstrap.php'; $u=row('SELECT password_hash FROM users WHERE email=?',[$argv[2]]); echo json_encode(password_get_info($u['password_hash'])['algoName']!=='unknown');"
    check('Database stores a password hash rather than plaintext',json.loads(subprocess.check_output([PHP,'-r',code,str(ROOT),email('owner')],text=True)))
    check('Incorrect password rejected',owner.call('login',{'email':email('owner'),'password':'WrongPassword123'})[0]==401)
    owner.good('login',{'email':email('owner'),'password':password});check('Actual password login creates a regular user session',owner.state()['users'][0]['role']=='User')
    owner.good('profile',{'name':'Updated Instructor Owner','email':email('owner')});check('Profile update persists in the database',owner.state()['profile']['name']=='Updated Instructor Owner')
    check('Invalid profile email is rejected',owner.call('profile',{'name':'Updated Instructor Owner','email':'invalid'})[0]==422)
    owner.good('logout',{});check('Logout clears authenticated identity',owner.state()['currentUserId'] is None)
    owner=Client();owner.good('login',{'email':email('owner'),'password':password});check('New browser session can sign in to persistent account',owner.state()['currentUserId']==owner_id)
    org=Client();org.good('register',registration('organization',True));org.good('login',{'email':email('organization'),'password':password});os_=org.state();orgid=os_['organizations'][0]['id']
    check('Organization registration links one owner and remains unverified',os_['organizations'][0]['ownerId']==os_['currentUserId'] and not os_['organizations'][0]['verified'])
    f=fields();f.update(organizationId=orgid,posterImage=poster());event=org.good('event',{'id':None,'fields':f})
    check('Draft event persists and is private',next(e for e in org.state()['events'] if e['id']==event)['status']=='Draft' and all(e['id']!=event for e in owner.state()['events']))
    fbad={**f,'tickets':[{**f['tickets'][0],'capacity':0},f['tickets'][1]]};check('Invalid capacity rejected',org.call('event',{'id':event,'fields':fbad})[0]==422)
    org.good('event-status',{'id':event,'status':'Published'});check('Published event is visible to another user',any(e['id']==event for e in owner.state()['events']))
    e=next(e for e in owner.state()['events'] if e['id']==event)
    with urllib.request.urlopen(BASE+'/'+e['posterImage']) as image:check('Poster is served as a decoded image through PHP',image.headers.get_content_type()=='image/png' and image.read().startswith(b'\x89PNG'))
    check('Unauthorized event edit rejected',owner.call('event',{'id':event,'fields':f})[0]==403)
    check('Foreign organization ownership rejected',owner.call('event',{'id':None,'fields':f})[0]==403)
    check('CSRF token required',owner.call('event',{'id':None,'fields':fields()},token=False)[0]==403)
    check('Cross-site Origin rejected',owner.call('event',{'id':None,'fields':fields()},origin='https://foreign.example')[0]==403)
    attendee=Client();attendee.good('register',registration('attendee'));attendee.good('login',{'email':email('attendee'),'password':password})
    details={'name':'Instructor Attendee','email':email('attendee')};key=secrets.token_hex(16);payload={'eventId':event,'items':{'general':2,'free':1},'details':details,'submissionId':key,'total':0,'price':0}
    reference=attendee.good('reserve',payload);booking=next(b for b in attendee.state()['bookings'] if b['id']==reference)
    check('Server calculates mixed paid/free total and creates reference',reference.startswith('SS-') and booking['total']==25 and booking['paymentStatus']=='DueAtVenue')
    check('Idempotent replay returns same booking without extra allocation',attendee.good('reserve',payload)==reference and len([b for b in attendee.state()['bookings'] if b['id']==reference])==1)
    check('Changed payload under same key is rejected',attendee.call('reserve',{**payload,'items':{'general':1}})[0]==409)
    check('Organizer sees real attendee record',any(b['id']==reference for b in org.state()['bookings']))
    check('Unrelated user cannot read or cancel booking',all(b['id']!=reference for b in owner.state()['bookings']) and owner.call('cancel',{'id':reference})[0]==403)
    check('Invalid quantities rejected',attendee.call('reserve',{**payload,'submissionId':secrets.token_hex(16),'items':{'general':1.5}})[0]==422)
    check('Unknown ticket type rejected',attendee.call('reserve',{**payload,'submissionId':secrets.token_hex(16),'items':{'foreign':1}})[0]==422)
    check('Cancellation succeeds once',attendee.good('cancel',{'id':reference}) is True and attendee.good('cancel',{'id':reference}) is False)
    after=next(e for e in attendee.state()['events'] if e['id']==event)
    check('Mixed cancellation restores inventory exactly once',all(t['sold']==0 for t in after['tickets']))
    check('Cancelled history retains snapshots',next(b for b in attendee.state()['bookings'] if b['id']==reference)['status']=='Cancelled')
    personal=owner.good('event',{'id':None,'fields':fields(1)});owner.good('event-status',{'id':personal,'status':'Published'})
    check('Individual user can also create and publish events',any(e['id']==personal and e['ownerId']==owner_id for e in owner.state()['events']))
    race_payload=lambda name:{'eventId':personal,'items':{'general':1},'details':{'name':'Instructor '+name,'email':email(name)},'submissionId':secrets.token_hex(16)}
    with concurrent.futures.ThreadPoolExecutor(2) as pool:
        results=list(pool.map(lambda pair:pair[0].call('reserve',pair[1]),[(org,race_payload('organization')),(attendee,race_payload('attendee'))]))
    check('Concurrent final-ticket requests yield exactly one winner',sorted(status for status,payload in results)==[200,409])
    check('Final-ticket sold count never exceeds capacity',next(t for e in owner.state()['events'] if e['id']==personal for t in e['tickets'] if t['id']=='general')['sold']==1)
    check('Ordinary user cannot access admin mutation',owner.call('admin-user',{'id':owner_id,'role':'Admin'})[0]==403)
    admin_email=email('admin');cli('create-admin',{'name':'Acceptance Administrator','email':admin_email,'password':password});admin=Client();admin.good('login',{'email':admin_email,'password':password})
    check('Private CLI admin can view users, organizations, bookings and events',admin.state()['users'] and any(o['id']==orgid for o in admin.state()['organizations']) and any(b['id']==reference for b in admin.state()['bookings']))
    admin.good('admin-user',{'id':owner_id,'status':'Suspended'});check('Suspension invalidates an existing user session',owner.state()['currentUserId'] is None)
    admin.good('admin-user',{'id':owner_id,'status':'Active'});owner.good('login',{'email':email('owner'),'password':password})
    admin.good('admin-organization',{'id':orgid,'status':'Suspended'});check('Suspended organization stops public reservations',all(e['id']!=event for e in Client().state()['events']))
    admin.good('admin-organization',{'id':orgid,'status':'Active'})
    check('Unconfigured reset mail reports genuine limitation',owner.call('forgot',{'email':email('owner')})[0]==503)
    reset_link=cli('issue-reset',{'email':email('owner')});token=reset_link.split('#token=')[1];new_password='Recovered-'+secrets.token_hex(10)+'2'
    owner.good('reset',{'token':token,'password':new_password,'confirm':new_password});check('Recovery token is single-use',owner.call('reset',{'token':token,'password':new_password,'confirm':new_password})[0]==422)
    check('Password reset revokes prior sessions',owner.state()['currentUserId'] is None)
    owner=Client();owner.good('login',{'email':email('owner'),'password':new_password});check('Recovered credential signs in from fresh session',owner.state()['currentUserId']==owner_id)
    context={'tag':tag,'base':BASE,'password':password,'ownerPassword':new_password,'ownerEmail':email('owner'),'organizationEmail':email('organization'),'attendeeEmail':email('attendee'),'adminEmail':admin_email,'eventId':event,'personalEventId':personal,'reference':reference}
    path=ROOT/'.local/test-context.json';path.write_text(json.dumps(context));path.chmod(0o600)
finally:
    report={'runtime':'XAMPP Apache/PHP 8.2 + real isolated MariaDB/InnoDB','checks':checks,'passed':sum(c['passed'] for c in checks),'failed':sum(not c['passed'] for c in checks),'mailDelivery':'NOT TESTED: outbound delivery is not configured; failure path tested','existingData':'No database reset or prior record deletion.'}
    (REPORT/'backend-results.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({'passed':report['passed'],'failed':report['failed'],'report':str(REPORT/'backend-results.json')}))
