export const pocketShapes=['1x1','2x1','3x1','2x2'];
export function dimensions(shape){const [h,w]=shape.split('x').map(Number);return {w,h};}
export function fits(pins,shape,col,row,width,height,ignore=-1){const {w,h}=dimensions(shape);return Number.isInteger(col)&&Number.isInteger(row)&&col>=1&&row>=1&&col+w-1<=width&&row+h-1<=height&&!pins.some((p,i)=>{if(i===ignore)return false;const d=dimensions(p.kind);return col<p.col+d.w&&col+w>p.col&&row<p.row+d.h&&row+h>p.row;});}
export function movedPocket(pins,index,col,row,width,height){if(!pins[index]||!fits(pins,pins[index].kind,col,row,width,height,index))return null;return pins.map((p,i)=>i===index?{...p,col,row}:{...p});}
export function slotCounts(pins){return Object.fromEntries(pocketShapes.map(shape=>[shape,pins.filter(p=>p.kind===shape).length]));}
export function grantedPockets(grants){return ['2x1','2x2','3x1','1x1'].flatMap(kind=>Array.from({length:Math.max(0,Math.min(20,Math.floor(Number(grants?.[kind])||0)))},()=>({kind,...dimensions(kind)})));}
export function armourComponents(items){return items.filter(x=>x.category==='Outfit Parts'&&/^prt_o_(fabrics_[1-4]|support_1|retardant_([1-9]|1[0-9]|20)|ballistic_([1-9]|1[0-9]|20))$/.test(x.id));}
