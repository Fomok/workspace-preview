(function(root){
'use strict';
const state={game:'gamma',sota:false,hd:false,devices:false,looting:false},done=new Set();
const n=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
function steps(s){return [
 ['mod','Install Squared Away through MO2. Replace the old installation and disable old copies or hotfixes.'],
 ['engine','Install the matching custom engine in the Anomaly folder: bin/ for executables and PDB files, db/mods/ for the DB0. Back up the existing engine files first.'],
 ['mags','For the baseline rigs and stock pouches, install Mags Reloaded Fork by Priler UPDATE 6.'],
 ...(s.game==='anomaly'?[['anomaly','Use Anomaly 1.5.3. GAMMA-specific crafting and trader content needs its separate dependencies; vanilla Anomaly does not supply them.']]:[]),
 ['sota',s.sota?'Select the SOTA UI patch in the FOMOD. SOTA UI and its usual requirements must already be installed.':'Leave the SOTA UI patch unchecked. Use the default UI option.'],
 ...(s.hd?[['hd',s.sota?'Use only the SOTA-patched HD Inventory Icons Framework.':'Use only the non-SOTA HD Inventory Icons Framework.']]:[]),
 ...(s.devices?[['devices','Select Wearable Devices support in the FOMOD, with the separate Wearable Devices pack installed.']]:[]),
 ...(s.looting?[['looting','Select Tarkov-like corpse looting only with Looting Takes Time Redux by Priler. Turn OFF its “Pre-sort items on grid” setting.']]:[]),
 ['order','MO2 left pane, higher to lower: required mods and chosen UI mods → Squared Away with its selected patches → your optional ZoneBench export. Enable only one ZoneBench export.'],
 ['newgame','Start a new game when upgrading from the previous public release to Squared Away 2.0. Test custom add-ons on a separate save.']
 ];}
function render(parent){const box=n('details');box.className='installation-checklist';box.appendChild(n('summary','Build your installation checklist'));const body=n('div');box.appendChild(body);body.appendChild(n('p','hint'));body.lastChild.textContent='Choose your setup. This checklist guides installation; it does not detect installed mods.';
 const label=n('label','Your game '),select=n('select');select.setAttribute('aria-label','Installation game');for(const [value,text] of [['gamma','GAMMA'],['anomaly','Anomaly 1.5.3']]){const o=n('option',text);o.value=value;select.appendChild(o);}select.value=state.game;label.appendChild(select);body.appendChild(label);
 const options=n('div');options.className='checklist-options';body.appendChild(options);for(const [key,text] of [['sota','SOTA UI'],['hd','HD Inventory Icons Framework'],['devices','Wearable Devices'],['looting','Looting Takes Time Redux']]){const l=n('label'),input=n('input');input.type='checkbox';input.checked=state[key];input.onchange=()=>{state[key]=input.checked;paint();};l.append(input,document.createTextNode(text));options.appendChild(l);}
 const list=n('div');body.appendChild(list);select.onchange=()=>{state.game=select.value;paint();};function paint(){list.replaceChildren();for(const [id,text] of steps(state)){const key=id+':'+text,l=n('label'),input=n('input');l.className='checklist-step';input.type='checkbox';input.checked=done.has(key);input.onchange=()=>input.checked?done.add(key):done.delete(key);l.append(input,n('span',text));list.appendChild(l);}}
 paint();const link=n('a','Download the baseline magazine mod');link.href='https://discord.com/channels/912320241713958912/1322655858240262304/1524208180135989459';link.target='_blank';link.rel='noopener noreferrer';link.className='tool';body.appendChild(link);body.appendChild(n('p','hint'));body.lastChild.textContent='Use the paired mod and engine links in Downloads. Checklist ticks last for this page session.';parent.appendChild(box);}
root.InstallationGuide={steps,render};
})(globalThis);
