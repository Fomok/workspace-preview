/* Build a listing update independently of the legacy Share items selection. */
(function(root){
 const clone=x=>JSON.parse(JSON.stringify(x));
 function candidates(listing,pack,local){
  const used=new Set(),rows=[];
  for(const entry of pack.items){
   const matches=local.filter(x=>x.kind===entry.kind&&x.item.communitySource?.id===listing.id&&x.item.communitySource.originalId===entry.item.id);
   const match=matches[0];if(match)used.add(match.item);
   rows.push({key:'published/'+entry.kind+'/'+entry.item.id,published:entry,local:match?{kind:match.kind,item:match.item}:null,selected:true,useLocal:false});
  }
  for(const entry of local)if(!used.has(entry.item))rows.push({key:'local/'+entry.kind+'/'+(entry.item.addonItemId||entry.item.id),published:null,local:{kind:entry.kind,item:entry.item},selected:false,useLocal:true});
  return rows;
 }
 function build(pack,rows,families){
  const chosen=rows.filter(x=>x.selected);if(!chosen.length)throw Error('Keep at least one item in this add-on.');if(chosen.length>20)throw Error('An add-on can contain at most 20 items.');
  const mapping=new Map();for(const row of chosen)if(row.useLocal&&row.local&&row.published)mapping.set(row.local.item.id,row.published.item.id);
  const result={...clone(pack),families:clone(pack.families||{}),items:[]},ids=new Set();
  for(const row of chosen){const local=row.useLocal&&row.local,entry=clone(local||row.published);if(row.published)entry.item.id=row.published.item.id;
   if(ids.has(entry.item.id))throw Error('Two selected items use the same ID. Remove one before saving.');ids.add(entry.item.id);
   if(local){if(entry.item.craft?.parts)entry.item.craft.parts=entry.item.craft.parts.map(([id,n])=>[mapping.get(id)||id,n]);for(const key of ['parts','yield'])if(entry.item[key])entry.item[key]=entry.item[key].map(id=>mapping.get(id)||id);
    const rule=entry.item.takes;if(rule&&families?.[rule]){let next=rule,n=2;while(result.families[next]&&JSON.stringify(result.families[next])!==JSON.stringify(families[rule]))next=rule+'_'+n++;result.families[next]=clone(families[rule]);entry.item.takes=next;}
   }
   result.items.push(entry);
  }
  return result;
 }
 root.CommunityUpdateSelection={candidates,build};
})(globalThis);
