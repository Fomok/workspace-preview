const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');const c=vm.createContext({});const root=path.resolve(__dirname,'../web');
for(const file of ['src/emit.js','data/baseline.js','src/compatibility.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),c);
const db=vm.runInContext('JSON.parse(JSON.stringify(SEED))',c);
db.rigs[0].id='amprig_test_new';db.rigs[0].new=true;db.removed=[{kind:'rigs',id:'amprig_bandolier'}];db.pouches.push({...db.pouches[0],id:'amppouch_test_new',new:true});
process.stdout.write(c.ZB.compatibilityFiles(db)[0].text);
