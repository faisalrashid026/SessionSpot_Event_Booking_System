"""Buildless HTML checks. This is not a complete HTML conformance validator."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
from collections import Counter
root=Path(__file__).resolve().parents[1]
class Scan(HTMLParser):
 def __init__(self):super().__init__();self.refs=[];self.ids=[];self.h1=0;self.main=0;self.forms=[];self.lang=None;self.skip=False;self.main_focus=False;self.current_form=None;self.sensitive_forms=[];self.guard=False
 def handle_starttag(self,t,attrs):
  a=dict(attrs)
  if t=='html':self.lang=a.get('lang')
  if t=='h1':self.h1+=1
  if t=='main':
   self.main+=1
   self.main_focus=a.get('id')=='main' and a.get('tabindex')=='-1'
  if t=='a' and a.get('href')=='#main' and 'skip' in a.get('class','').split():self.skip=True
  if t=='form':self.forms.append(a);self.current_form=a
  if t=='script' and a.get('src','').startswith('js/form-guard.js'):self.guard=True
  if t=='input' and (a.get('type')=='password' or a.get('name') in ('email','current','confirm')):
   assert self.current_form is not None,'Sensitive input outside a form'
   self.sensitive_forms.append(self.current_form)
   if a.get('type')=='password':assert a.get('maxlength')=='72','Missing password ceiling'
  assert not any(k in a for k in ('formmethod','formaction','onsubmit')),('Submission override',t)
  if a.get('id'):self.ids.append(a['id'])
  for k in ('href','src','action'):
   if a.get(k):self.refs.append((k,a[k]))
 def handle_endtag(self,t):
  if t=='form':self.current_form=None
pages=sorted(root.glob('*.html'));assert len(pages)==15
refs=0
for p in pages:
 s=Scan();s.feed(p.read_text());assert s.main==1,(p.name,'main');assert s.lang=='en';assert s.skip and s.main_focus,(p.name,'focusable skip-link destination');assert not [i for i,n in Counter(s.ids).items() if n>1],p.name
 for k,v in s.refs:
  u=urlsplit(v)
  assert not u.path.endswith('.php'),(p.name,v)
  if u.scheme or u.netloc:continue
  if u.path:assert (p.parent/unquote(u.path)).exists(),(p.name,v)
  elif u.fragment:assert u.fragment in s.ids,(p.name,v)
  refs+=1
 assert s.guard,(p.name,'independent initialization guard')
 for f in s.forms:
  if 'data-demo-form' in f:assert f.get('method')=='dialog',(p.name,'non-navigating demo form')
 for f in s.sensitive_forms:
  assert f.get('method')=='dialog' and 'data-demo-form' in f,(p.name,'sensitive GET/POST fallback')
 assert 'design-reference/' not in p.read_text(),p.name
print(f'PASS: 15 HTML pages; one main and en language per page; focusable skip-link destinations; unique static IDs; {refs} local references resolve; native non-navigating sensitive forms and independent guards; no PHP targets or screenshot UI embeds.')
