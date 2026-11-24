// The production data source is PHP/MySQL. No local identity, fixtures or offline writes.
import { dateLabel, localDate } from './time.js?v=ca0db7923c';
import { money } from './format.js?v=4b3c14e4ea';
export { dateLabel, money };
export const state={events:[],bookings:[],users:[],organizations:[],saved:[],activity:[],activityDates:[],currentUserId:null,profile:{name:'Guest',email:''}};
let csrfToken='';
export async function request(action,body) {
  let response;
  try { response=await fetch(`api/index.php?action=${encodeURIComponent(action)}`,{method:body===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',headers:body===undefined?{}:{'Content-Type':'application/json','X-CSRF-Token':csrfToken},body:body===undefined?undefined:JSON.stringify(body)}); }
  catch { throw Error('The response could not be verified. Check the Apache connection and retry safely.'); }
  let payload;try{payload=await response.json();}catch{throw Error('The PHP service is unavailable. Open the Apache project URL; a static preview cannot process accounts or bookings.');}
  if(!response.ok||!payload.ok)throw Error(payload.error||'The request failed. Nothing was confirmed.');
  if(payload.csrf)csrfToken=payload.csrf;return payload.result;
}
export async function loadServerState(){const next=await request('bootstrap');for(const [key,value] of Object.entries(next)){if(Array.isArray(value)&&Array.isArray(state[key])){const old=new Map(state[key].filter(v=>v&&typeof v==='object').map(v=>[v.id,v]));state[key]=value.map(v=>{if(v&&typeof v==='object'&&old.has(v.id)){Object.assign(old.get(v.id),v);return old.get(v.id);}return v;});}else state[key]=value;}return state;}
async function mutate(action,body){const result=await request(action,body);try{await loadServerState();}catch{throw Error('The operation was saved, but updated data could not be loaded. Reload to verify its status.');}return result;}
export const currentUser=()=>state.users.find(u=>u.id===state.currentUserId&&u.active);
export function requireRole(roles){const u=currentUser();if(!u)throw Error('Please sign in to continue.');if(roles.includes('Admin')&&!roles.includes('Organizer')&&!roles.includes('User')&&u.role!=='Admin')throw Error('Administrator access required.');return u;}
export const getEvent=id=>state.events.find(e=>e.id===id);
export const canManage=e=>!!e&&!!currentUser()&&(currentUser().role==='Admin'||e.ownerId===currentUser().id);
export const managementEvents=()=>state.events.filter(canManage);
export const available=t=>Math.max(0,t.capacity-t.sold);
export const quantity=b=>Object.values(b.items).reduce((a,n)=>a+n,0);
export const bookingTotal=b=>b.total??Object.entries(b.items).reduce((sum,[id,n])=>sum+n*b.prices[id],0);
export const isUpcoming=e=>!!e&&new Date(e.startsAt)>new Date();
export const isPublished=e=>!!e&&e.status==='Published'&&isUpcoming(e);
export const isBookable=e=>isPublished(e)&&e.tickets.some(t=>available(t)>0);
export const compareEvents=(a,b)=>new Date(a.startsAt)-new Date(b.startsAt);
export const daysUntil=e=>Math.max(0,Math.ceil((new Date(e.startsAt)-new Date())/86400000));
export const visibleBookings=()=>state.bookings.filter(b=>b.ownerId===currentUser()?.id);
export const canViewBooking=b=>!!b&&(b.ownerId===currentUser()?.id||canManage(getEvent(b.eventId)));
export const canCancelBooking=b=>canViewBooking(b)&&b.status==='Confirmed'&&isUpcoming(getEvent(b.eventId));
export const attendees=id=>{if(!canManage(getEvent(id)))return [];return state.bookings.filter(b=>b.eventId===id&&b.status==='Confirmed').map(b=>({name:b.name,email:b.email,reference:b.id,tickets:quantity(b)}));};
export function requireExport(id){requireRole(['Organizer','Admin']);if(id&&!canManage(getEvent(id)))throw Error('You cannot export attendees for this event.');}
export function stats(events=state.events.filter(e=>e.status==='Published')){const ids=new Set(events.map(e=>e.id)),capacity=events.reduce((s,e)=>s+e.tickets.reduce((n,t)=>n+t.capacity,0),0),sold=events.reduce((s,e)=>s+e.tickets.reduce((n,t)=>n+t.sold,0),0);return{events:events.length,capacity,sold,left:capacity-sold,value:state.bookings.filter(b=>ids.has(b.eventId)&&b.status==='Confirmed').reduce((s,b)=>s+bookingTotal(b),0)};}
export const submissionIdentifier=()=>crypto.randomUUID();
export const makeBooking=async(eventId,items,details,submissionId)=>{const id=await mutate('reserve',{eventId,items,details,submissionId});return state.bookings.find(b=>b.id===id);};
export const cancelBooking=id=>mutate('cancel',{id});
export const toggleSaved=id=>mutate('saved',{id});
export const updateProfile=details=>mutate('profile',details);
export const loginAccount=async(email,password)=>{await mutate('login',{email,password});return currentUser();};
export const registerAccount=details=>request('register',details);
export const logoutAccount=()=>mutate('logout',{});
export const saveEvent=async(id,fields)=>{const saved=await mutate('event',{id,fields});return getEvent(saved);};
export const changeEventStatus=(id,status)=>mutate('event-status',{id,status});
export const changeRole=(id,role)=>mutate('admin-user',{id,role});
export const setUserStatus=(id,status)=>mutate('admin-user',{id,status});
export const saveOrganization=details=>mutate('organization',details);
export const setOrganizationStatus=(id,status)=>mutate('admin-organization',{id,status});
