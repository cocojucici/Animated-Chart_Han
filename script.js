import { race } from './vendor/racing-bars.js';
import { filterRows, completeFrames, dateLabel } from './data-model.js';
import { loadTerminalRows, terminalTotals, terminalColorMap, markTerminalMissing } from './terminal-d3.js';
const $ = id => document.getElementById(id);
const fmt = new Intl.NumberFormat('en-US');
const names = ['T1','T2','T3','T4','T5','T6','T7','T8','TBIT','TBIT West Gates','Imperial Terminal','Miscellaneous Terminal'];
const colorMap = terminalColorMap(names,['#12695f','#4d8e85','#8baea2','#b7b877','#dda15e','#bc7652','#6b879f','#8c91ae','#315675','#81985b','#ba9a89','#a6b7b0']);
let rows=[], racer, chartData=[], dates=[], busy=false, totalAnimation;
const leaderAssignment = document.body.dataset.assignment === '2';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
function annotate(){
 if(!racer)return;
 const frame=chartData.filter(d=>d.date===racer.getDate());
 markTerminalMissing('#race',frame);
 const max=Math.max(...frame.map(d=>d.value));
 // RacingBars retains terminal identity in its bound SVG data.
 globalThis.d3.select('#race').selectAll('rect').classed('leader-bar',d=>document.body.dataset.assignment !== '1' && !!d && frame.some(v=>v.name===d.name && v.value===max && max>0));
 if (leaderAssignment) {
  const leaderNames = new Set(frame.filter(d=>d.value===max && max>0).map(d=>d.name));
  globalThis.d3.select('#race').selectAll('text.label')
   .filter(d=>d && leaderNames.has(d.name))
   .text(d=>d.name);
 }
}
new MutationObserver(records=>{
 if(records.some(record=>[...record.addedNodes].some(node=>node.nodeType===1))) annotate();
}).observe($('race'),{childList:true,subtree:true});
function showTotal(target,animate){
 if (!$('total')) return;
 cancelAnimationFrame(totalAnimation);
 const start=Number($('total').dataset.value||0),begin=performance.now();
 function tick(now){const t=animate?Math.min(1,(now-begin)/450):1;const value=Math.round(start+(target-start)*(1-Math.pow(1-t,3)));$('total').textContent=fmt.format(value);$('total').dataset.value=value;if(t<1)totalAnimation=requestAnimationFrame(tick);}
 tick(begin);
}
function sync(){
 if(!racer)return;
 const date=racer.getDate(),index=dates.indexOf(date);
 const frame=chartData.filter(d=>d.date===date).sort((a,b)=>b.value-a.value||a.name.localeCompare(b.name));
 $('current').textContent=dateLabel(date);$('scrub').value=Math.max(0,index);
 $('frameCount').textContent=`${index+1} / ${dates.length} MONTHS`;
 $('play').textContent=racer.isRunning()?'Ⅱ Pause':index===dates.length-1&&dates.length>1?'↺ Replay':'▶ Play';
 showTotal(frame.reduce((sum,d)=>sum+d.value,0),racer.isRunning()&&!reduced);
 const leaders=frame.filter(d=>d.value===frame[0]?.value&&d.value>0);
 $('leader').textContent=leaders.length?leaders.map(d=>d.name).join(' & '):'No positive values reported';
 if ($('leaderValue')) $('leaderValue').textContent=leaders.length?`${fmt.format(leaders[0].value)} movements`:'';

 $('race').setAttribute('aria-label',`${dateLabel(date)} terminal passenger ranking; monthly leader: ${$('leader').textContent}.`);
 annotate();
}
async function build(){
 if(busy)return;
 const selection=Object.fromEntries(['start','end','movement','market'].map(id=>[id,$(id).value]));
 $('error').hidden=true;
 if(selection.start>selection.end){$('error').textContent='The start month must be on or before the end month. Please adjust the date range.';$('error').hidden=false;return;}
 const totals=terminalTotals(filterRows(rows,selection));
 if(!totals.length){$('error').textContent='No data matches this selection. Choose another date range or filter.';$('error').hidden=false;return;}
 busy=true;
 const controls=[...document.querySelectorAll('button,select,input')];controls.forEach(el=>el.disabled=true);
 try{
  racer?.destroy();racer=null;chartData=completeFrames(totals,names);
  racer=await race(chartData,'#race',{
   dataShape:'long',autorun:false,topN:12,tickDuration:(reduced?100:1200)/Number($('speed').value),colorMap,
   labelsPosition:'outside',labelsWidth:178,marginLeft:12,marginRight:84,marginTop:30,marginBottom:45,
   minWidth:620,minHeight:460,dateCounter:'',valueDecimals:0,valueLocale:'en-US',
   makeCumulative:false,fixedScale:false,controlButtons:'none',overlays:'none',mouseControls:false,keyboardControls:false
  });
  dates=racer.getAllDates();$('scrub').max=dates.length-1;
  $('rangeStart').textContent=dateLabel(dates[0]);$('rangeEnd').textContent=dateLabel(dates.at(-1));
  $('context').textContent=`Monthly passenger movements · ${{All:'Arrivals + departures',Arrival:'Arrivals',Departure:'Departures'}[selection.movement]} · ${{All:'Domestic + international',Domestic:'Domestic',International:'International'}[selection.market]}`;
  ['dateChange','play','pause','lastDate'].forEach(event=>racer.on(event,sync));
  $('pending').hidden=true;sync();
 }catch(error){console.error(error);$('error').hidden=false;$('error').textContent='The chart could not load. Serve this project over HTTP, then reload the page.';}
 finally{busy=false;controls.forEach(el=>el.disabled=false);$('play').disabled=!racer||dates.length<2;$('scrub').disabled=!racer||dates.length<2;$('reset').disabled=!racer;}
}
$('filters').addEventListener('submit',e=>{e.preventDefault();build();});
['start','end','movement','market'].forEach(id=>$(id).addEventListener('change',()=>{racer?.pause();$('pending').hidden=false;}));
$('play').addEventListener('click',()=>{if(racer.getDate()===dates.at(-1))racer.skipBack();racer.toggle();});
$('reset').addEventListener('click',()=>{racer.pause();racer.skipBack();sync();});
$('scrub').addEventListener('input',()=>{racer.pause();racer.setDate(dates[Number($('scrub').value)]);sync();});
$('speed').addEventListener('change',async()=>{if(racer&&!busy)await racer.changeOptions({tickDuration:(reduced?100:1200)/Number($('speed').value)});});
document.addEventListener('visibilitychange',()=>{if(document.hidden)racer?.pause();});
async function init(){
 try{
  rows=await loadTerminalRows('./Los_Angeles_International_Airport_-_Passenger_Traffic_By_Terminal_20261102.csv');
  const months=[...new Set(rows.map(d=>d.date.slice(0,7)))].sort();
  for(const id of ['start','end'])$(id).replaceChildren(...months.map(m=>new Option(dateLabel(`${m}-01`),m)));
  $('start').value=leaderAssignment?'2019-01':months[0];$('end').value=leaderAssignment?'2019-12':months.at(-1);
  if (leaderAssignment) $('market').value='Domestic';
  await build();
 }catch(error){console.error(error);$('error').textContent='Unable to load the CSV. Run python3 -m http.server 8000, then open http://localhost:8000.';$('error').hidden=false;}
}
init();
