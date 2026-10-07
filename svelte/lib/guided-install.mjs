export function addonFilename(name,version){const clean=(value,fallback)=>String(value||fallback).replace(/[<>:"/\\|?*\x00-\x1f]/g,'').replace(/\s+/g,' ').trim().replace(/[. ]+$/,'')||fallback;return `Squared Away ${clean(name,'Add-on')} ${clean(version,'1.0')}.zip`;}
export function checklistReady(answers){return ['game','sota','bodycam','devices','looting'].every(k=>typeof answers[k]==='boolean');}
export function checklistSetup(answers){return {...answers,game:answers.game?'gamma':'anomaly'};}
export function advanceChecklist(current,index,checked,total){if(index>current||index<0)return current;return checked?Math.min(total,current+1):index;}
