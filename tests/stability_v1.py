"""Follow-up real-server checks; run after backend_api.py. No existing database reset."""
from pathlib import Path
import json,urllib.request,urllib.error,http.cookiejar,subprocess,secrets,concurrent.futures
from runtime_env import ROOT, BASE, PHP, REPORT
ctx=json.loads((ROOT/'.local/test-context.json').read_text());BASE=ctx['base'];checks=[]
def check(name,value):
    checks.append({'name':name,'passed':bool(value)})
    if not value:raise AssertionError(name)
class Client:
    def __init__(self,email=None,password=None):
        self.jar=http.cookiejar.CookieJar();self.http=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar));self.token='';self.call('bootstrap')
        if email:self.good('login',{'email':email,'password':password})
    def call(self,action,body=None):
        req=urllib.request.Request(BASE+'/api/index.php?action='+action,data=None if body is None else json.dumps(body).encode(),headers={'Content-Type':'application/json','X-CSRF-Token':self.token})
        try:r=self.http.open(req);status=r.status
        except urllib.error.HTTPError as e:r=e;status=e.code
        data=json.load(r);self.token=data.get('csrf',self.token);return status,data
    def good(self,action,body=None):
        status,data=self.call(action,body);assert status==200,(action,status,data.get('error'));return data['result']
    def state(self):return self.good('bootstrap')
try:
    org=Client(ctx['organizationEmail'],ctx['password']);attendee=Client(ctx['attendeeEmail'],ctx['password']);admin=Client(ctx['adminEmail'],ctx['password'])
    check('Session cookie is HttpOnly and SameSite Lax',any('HttpOnly' in c._rest and c._rest.get('SameSite')=='Lax' for c in org.jar))
    organization=org.state()['organizations'][0];org.good('organization',{**organization,'description':'Updated organization\nSecond paragraph','verified':True})
    updated=org.state()['organizations'][0];check('Organization editing persists without granting verification',not updated['verified'] and '\n' in updated['description'])
    check('Another user cannot edit organization profile',attendee.call('organization',{**updated,'name':'Unauthorized change'})[0]==403)
    event=next(e for e in org.state()['events'] if e['id']==ctx['eventId']);details={'name':'Instructor Attendee','email':ctx['attendeeEmail']}
    check('Malformed event input is a validation error',org.call('event',{'id':event['id'],'fields':'invalid'})[0]==422)
    check('SVG poster rejected without modifying event',org.call('event',{'id':event['id'],'fields':{**event,'posterImage':'data:image/svg+xml;base64,PHN2Zz4='}})[0]==422)
    payload={'eventId':event['id'],'items':{'free':1},'details':details,'submissionId':secrets.token_hex(16)}
    with concurrent.futures.ThreadPoolExecutor(2) as pool:results=list(pool.map(lambda _:attendee.call('reserve',payload),range(2)))
    check('Concurrent identical submissions return one stable reference',all(s==200 for s,d in results) and results[0][1]['result']==results[1][1]['result'])
    reference=results[0][1]['result'];book=next(b for b in attendee.state()['bookings'] if b['id']==reference)
    check('Free booking is recorded as Free with server total zero',book['paymentStatus']=='Free' and book['total']==0)
    check('Concurrent replay allocates inventory once',next(t for e in org.state()['events'] if e['id']==event['id'] for t in e['tickets'] if t['id']=='free')['sold']==1)
    attendee.good('cancel',{'id':reference})
    admin.good('event-status',{'id':ctx['personalEventId'],'status':'Archived'})
    personal=next(e for e in admin.state()['events'] if e['id']==ctx['personalEventId']);check('Event cancellation releases all allocations and cancels confirmed bookings',all(t['sold']==0 for t in personal['tickets']) and all(b['status']=='Cancelled' for b in admin.state()['bookings'] if b['eventId']==personal['id']))
    admin.good('event-status',{'id':personal['id'],'status':'Restore'});check('Restoring event does not revive cancelled bookings',all(b['status']=='Cancelled' for b in admin.state()['bookings'] if b['eventId']==personal['id']))
    credential_email='credential-'+secrets.token_hex(8)+'@example.com';previous='Previous-'+secrets.token_hex(10)+'1';owner=Client()
    owner.good('register',{'name':'Credential Test','email':credential_email,'password':previous,'confirm':previous,'terms':True,'accountType':'individual'})
    owner.good('login',{'email':credential_email,'password':previous});new='Changed-'+secrets.token_hex(10)+'3'
    check('Wrong current password cannot change credential',owner.call('password',{'current':'WrongPassword123','password':new,'confirm':new})[0]==403)
    owner.good('password',{'current':previous,'password':new,'confirm':new})
    owner.good('logout',{});check('Previous password no longer signs in',owner.call('login',{'email':credential_email,'password':previous})[0]==401)
    owner.good('login',{'email':credential_email,'password':new});check('Changed credential works from login',owner.state()['currentUserId'] is not None)
    for path in ['server/config.local.php','.local/test-context.json','.git/config','%2egit/config','storage/posters/','schema.sql']:
        try:r=urllib.request.urlopen(BASE+'/'+path);status=r.status;r.close()
        except urllib.error.HTTPError as e:status=e.code;e.close()
        check('Private path denied: '+path,status in (403,404))
    before={e['id'] for e in admin.state()['events']}
    subprocess.run(['/Applications/XAMPP/xamppfiles/bin/mysqladmin','--no-defaults','--socket='+str(ROOT/'.local/mysql.sock'),'-u','root','shutdown'],check=True,capture_output=True)
    try:
        status,data=admin.call('bootstrap');check('Database outage returns genuine 503 without a local fallback',status==503 and not data['ok'])
    finally:subprocess.run(['python3',str(ROOT/'scripts/start_local.py')],check=True,capture_output=True)
    check('Database restart preserves events and authenticated account data',before=={e['id'] for e in admin.state()['events']} and bool(admin.state()['users']))
finally:
    result={'checks':checks,'passed':sum(c['passed'] for c in checks),'failed':sum(not c['passed'] for c in checks),'note':'All operations use the dedicated SessionSpot database; no prior data reset.'}
    (REPORT/'stability-results.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'passed':result['passed'],'failed':result['failed']}))
