/* ===== data.js (tu dong tach tu main.js, khong doi logic) ===== */
import { renderHistory } from './render-history.js';
import { renderInventory } from './render-inventory.js';
import { renderManage } from './render-manage.js';
import { renderOverview } from './render-overview.js';
import { xuatCamStream } from './scanner.js';
import { S } from './state.js';
import { toast } from './utils.js';

/* db va FB_COLLECTION duoc gan vao window boi js/firebase-init.js (script co dien, chay truoc
   cac module). Module khong doc duoc bien const/let cua script co dien khac nen phai lay qua window. */
const db = window.db, FB_COLLECTION = window.FB_COLLECTION;

export function defaultMeta(){
  return {
    lines:[
      {id:'l1',name:'Dây chuyền 1'},{id:'l2',name:'Dây chuyền 2'},
      {id:'l3',name:'Dây chuyền 3'},{id:'l4',name:'Dây chuyền 4'}
    ],
    warehouses:[
      {id:'wm1',name:'Kho chính 1',type:'main'},
      {id:'wm2',name:'Kho chính 2',type:'main'},
      {id:'wm3',name:'Kho chính 3',type:'main'},
      {id:'ws1',name:'Kho phụ - Line 1',type:'sub',lineId:'l1'},
      {id:'ws2',name:'Kho phụ - Line 2',type:'sub',lineId:'l2'},
      {id:'ws3',name:'Kho phụ - Line 3',type:'sub',lineId:'l3'},
      {id:'ws4',name:'Kho phụ - Line 4',type:'sub',lineId:'l4'}
    ],
    users:Array.from({length:12},(_,i)=>({id:'u'+(i+1),name:'Nhân viên '+String(i+1).padStart(2,'0')}))
  };
}


/* ================= STORAGE (Firebase Firestore) ================= */

export async function safeGet(key){
  try{
    const snap = await db.collection(FB_COLLECTION).doc(key).get();
    if(!snap.exists) return null;
    const data = snap.data();
    return (data && Object.prototype.hasOwnProperty.call(data,'value')) ? data.value : null;
  }catch(e){ console.error('firestore get fail',key,e); return null; }
}

export async function safeSet(key,val){
  try{
    await db.collection(FB_COLLECTION).doc(key).set({ value: val, updatedAt: Date.now() });
    return true;
  }catch(e){ console.error('firestore set fail',key,e); toast('Lỗi lưu dữ liệu — thử lại'); return false; }
}

export async function loadAll(){
  const [meta,items,tx,txHidden] = await Promise.all([safeGet('sp_meta'),safeGet('sp_items'),safeGet('sp_tx'),safeGet('sp_tx_hidden')]);
  S.meta = meta || defaultMeta();
  S.items = items || [];
  S.tx = tx || [];
  S.txHidden = txHidden || [];
  if(!meta) await safeSet('sp_meta',S.meta);
  if(!items) await safeSet('sp_items',S.items);
  if(!tx) await safeSet('sp_tx',S.tx);
  if(!txHidden) await safeSet('sp_tx_hidden',S.txHidden);
  S.ready=true;
}

/* ================= LIVE SYNC (tự cập nhật khi người khác đổi dữ liệu, không reload trang) ================= */

export let liveSyncStarted=false;

export let liveRefreshTO=null;

export function startLiveSync(){
  if(liveSyncStarted) return;
  liveSyncStarted=true;
  watchDoc('sp_meta', v=>{ S.meta=v; });
  watchDoc('sp_items', v=>{ S.items=v; });
  watchDoc('sp_tx', v=>{ S.tx=v; });
  watchDoc('sp_tx_hidden', v=>{ S.txHidden=v; });
}

export function watchDoc(key, applyFn){
  db.collection(FB_COLLECTION).doc(key).onSnapshot(snap=>{
    if(!snap.exists) return;
    const data=snap.data();
    if(data && Object.prototype.hasOwnProperty.call(data,'value')){
      applyFn(data.value);
      scheduleLiveRefresh();
    }
  }, err=>{ console.error('watch fail', key, err); });
}

export function scheduleLiveRefresh(){
  clearTimeout(liveRefreshTO);
  liveRefreshTO=setTimeout(doLiveRefresh, 400);
}

export function doLiveRefresh(){
  if(!S.ready || !S.currentUser) return;
  const modalOpen = document.getElementById('modalBg') && document.getElementById('modalBg').classList.contains('on');
  if(modalOpen) return; // tránh ngắt ngang khi đang thao tác trong popup
  if(S.scanStream || xuatCamStream) return; // tránh phá luồng đang bật camera quét
  if(S.activeTab==='update') return; // tránh mất dữ liệu đang gõ dở ở tab Nhập kho
  const tc=document.getElementById('tabContent');
  if(!tc) return;
  if(S.activeTab==='overview') renderOverview(tc);
  else if(S.activeTab==='inventory') renderInventory(tc);
  else if(S.activeTab==='history') renderHistory(tc);
  else if(S.activeTab==='manage' && S.currentUser.role==='admin') renderManage(tc);
}
