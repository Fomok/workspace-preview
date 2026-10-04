const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../web/src/patch-notes.js'),'utf8');
function load(store={},code=source){const context=vm.createContext({localStorage:store,addEventListener(){}});vm.runInContext(code,context);return context.PatchNotes;}
test('notes remain new until opened, stay read after reload, and re-arm for a new revision',()=>{
 const values=new Map();const store={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
 const first=load(store);assert.equal(first.unread(),true);assert.equal(load(store).unread(),true);
 first.markRead();assert.equal(first.unread(),false);assert.equal(load(store).unread(),false);
 const next=load(store,source.replace('squared-away-2-0-published','squared-away-next-update-v1'));assert.equal(next.unread(),true);next.markRead();assert.equal(next.unread(),false);
});
test('blocked browser storage does not prevent opening notes or clearing the current badge',()=>{
 const notes=load({getItem(){throw Error('denied');},setItem(){throw Error('denied');}});assert.equal(notes.unread(),true);notes.markRead();assert.equal(notes.unread(),false);
});
