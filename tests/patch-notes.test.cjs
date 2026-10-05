const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../web/src/patch-notes.js'),'utf8');
function load(store={},code=source){const context=vm.createContext({localStorage:store,addEventListener(){}});vm.runInContext(code,context);return context.PatchNotes;}
test('notes remain new until opened, stay read after reload, and re-arm for a new revision',()=>{
 const values=new Map();const store={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
 const first=load(store);assert.equal(first.unread(),true);assert.equal(load(store).unread(),true);
 first.markRead();assert.equal(first.unread(),false);assert.equal(load(store).unread(),false);
 const next=load(store,source.replace(first.entries[0].id,'squared-away-next-update-v1'));assert.equal(next.unread(),true);next.markRead();assert.equal(next.unread(),false);
});
test('blocked browser storage does not prevent opening notes or clearing the current badge',()=>{
 const notes=load({getItem(){throw Error('denied');},setItem(){throw Error('denied');}});assert.equal(notes.unread(),true);notes.markRead();assert.equal(notes.unread(),false);
});

test('localization hotfix retains the original public 2.0 notes',()=>{
 assert(source.includes("id:'squared-away-2-0-1-localization'"));
 assert(source.includes("id:'squared-away-2-0-published'"));
 assert(source.indexOf("id:'squared-away-2-0-1-localization'")<source.indexOf("id:'squared-away-2-0-published'"));
 assert(source.includes('Your inventory, rebuilt.'));
});

test('2.0.2 preserves both previous updates',()=>{assert(source.indexOf("id:'squared-away-2-0-2-looting'")<source.indexOf("id:'squared-away-2-0-1-localization'"));assert(source.includes('Update both the mod and engine'));});
