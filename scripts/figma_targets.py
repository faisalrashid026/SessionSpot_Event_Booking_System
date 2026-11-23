"""Derive comparison targets from inspected Figma metadata; no synthetic measurements."""
from pathlib import Path
import xml.etree.ElementTree as ET,json
root=Path(__file__).resolve().parents[1];canvas=ET.parse(root/'qa/figma/page-metadata.xml').getroot()
frames=list(canvas);targets={}
selectors={
'index':{'.topbar':'2:4','.discover-nav':'2:3','.feature':'2:72','.event-card:nth-child(1)':'2:124','.event-card:nth-child(2)':'2:147','.event-card:nth-child(3)':'2:171','.booking-preview':'2:196','.organizer-cta':'2:232','.bottom-banner':'2:43'},
'register':{'.auth-marketing':'2:438','.segmented':'2:477','[name=name]':'2:482','[name=email]':'2:485','[name=password]':'2:488','[name=terms]':'2:491','button[type=submit]':'2:493'},
'login':{'.auth-marketing':'2:499','[name=email]':'2:538','[name=password]':'2:541','[name=remember]':'2:543','button[type=submit]':'2:546','[data-sso]':'2:550'},
'reserve':{'.stepper':'2:558','#reservation-form .stack>.card:nth-child(1)':'2:564','#reservation-form .stack>.card:nth-child(2)':'2:585','.policy':'2:598','.ticket-summary':'2:601'},
'dashboard':{'.metric:nth-child(1)':'2:628','.metric:nth-child(2)':'2:632','.chart-card':'2:644','.up-next':'2:678','.manage-card':'2:687'},
'my-bookings':{'.booking-success':'2:740','[data-booking-tab=Upcoming]':'2:744','[data-booking-tab=Past]':'2:746','[data-booking-tab=Cancelled]':'2:748','#booking-search':'2:750','.booking-card:nth-child(1)':'2:752','.booking-card:nth-child(2)':'2:764','.booking-details':'2:778','.bookings-banner':'2:803'}
}
selectors['reserve'].update({'.ticket-row:nth-child(1) .quantity':'2:571','.ticket-row:nth-child(2) .quantity':'2:577','.ticket-row:nth-child(3) .quantity':'2:583'})
chart=next(n for n in canvas.iter() if n.get('id')=='2:644')
for i,n in enumerate(c for c in chart if c.get('name')=='Daily registrations'):
 selectors['dashboard'][f'.chart-column:nth-child({i+2}) .bar']=n.get('id')
for page,selection in selectors.items():
 frame=next(f for f in frames if f.get('id') == {'index':'2:2','register':'2:238','login':'2:240','reserve':'2:242','dashboard':'2:307','my-bookings':'2:372'}[page]);parents={c:p for p in frame.iter() for c in p}
 rows=[]
 for selector,id in selection.items():
  n=next(n for n in frame.iter() if n.get('id')==id);x=float(n.get('x'));y=float(n.get('y'));parent=parents[n]
  while parent is not frame:
   x+=float(parent.get('x','0'));y+=float(parent.get('y','0'));parent=parents[parent]
  rows.append({'selector':selector,'nodeId':id,'name':n.get('name'),'x':x,'y':y,'w':float(n.get('width')),'h':float(n.get('height'))})
 targets[page]=rows
(root/'qa/figma/layout-targets.json').write_text(json.dumps(targets,indent=2))
print('Derived',sum(map(len,targets.values())),'component bounds from actual Figma nodes.')
