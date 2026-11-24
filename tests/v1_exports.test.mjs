import test from 'node:test';
import assert from 'node:assert/strict';
import { bookingText } from '../js/exports.js';
const event={title:'Community workshop',date:'2027-12-15',time:'9:00 AM – 12:00 PM',location:'Community Hall',tickets:[{id:'general',name:'New name',price:99}]};
const booking={id:'SS-123',name:'Instructor',status:'Confirmed',items:{general:2},prices:{general:12.5},ticketNames:{general:'General admission'}};
test('real confirmation uses booked prices and venue-payment wording',()=>{const value=bookingText(booking,event);assert.match(value,/General admission × 2: \$25.00/);assert.match(value,/Payment due at venue in CAD/);assert.doesNotMatch(value,/DEMO|paid|\$198/);});
test('real free confirmation never implies payment is due',()=>{const value=bookingText({...booking,prices:{general:0}},event);assert.match(value,/Free reservation. No payment required/);assert.match(value,/Total: \$0.00/);assert.doesNotMatch(value,/Payment due/);});
test('real cancelled confirmation preserves history without a payment obligation',()=>{const value=bookingText({...booking,status:'Cancelled'},event);assert.match(value,/Historical value only; no payment due/);assert.match(value,/Total: \$25.00/);assert.match(value,/Status: Cancelled/);});
