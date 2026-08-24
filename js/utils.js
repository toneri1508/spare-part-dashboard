/* ===== utils.js (tu dong tach tu main.js, khong doi logic) ===== */
import { S } from './state.js';

export function uid(p){return p+'_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);}

export function whName(id){const w=S.meta.warehouses.find(x=>x.id===id);return w?w.name:id;}

export function lineName(id){const l=S.meta.lines.find(x=>x.id===id);return l?l.name:'—';}

export function userName(id,raw){const u=S.meta.users.find(x=>x.id===id);if(u)return u.name;return raw?raw+' (chưa khớp)':'—';}

export function lastTx(itemId){return S.tx.find(t=>t.itemId===itemId)||null;}

export function itemTxHistory(itemId,limit){return S.tx.filter(t=>t.itemId===itemId).slice(0,limit||5);}

export function timeAgo(ts){
  const diff = Date.now()-ts;
  const min=Math.floor(diff/60000);
  if(min<1) return 'vừa xong';
  if(min<60) return min+' phút trước';
  const hr=Math.floor(min/60);
  if(hr<24) return hr+' giờ trước';
  const day=Math.floor(hr/24);
  if(day<7) return day+' ngày trước';
  return fmtTime(ts);
}

export function totalQty(item){return Object.values(item.stocks||{}).reduce((a,b)=>a+(b||0),0);}

export function statusOf(item){
  const t=totalQty(item);
  if(t<=0) return 'red';
  if(t<=item.min) return 'amber';
  return 'green';
}

export function statusLabel(s){return s==='red'?'Hết hàng':s==='amber'?'Sắp hết':'Đủ hàng';}

export function fmtTime(ts){
  const d=new Date(ts);
  return d.toLocaleDateString('vi-VN')+' '+d.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});
}

export function toast(msg){
  const t=document.getElementById('toast');
  document.getElementById('toastMsg').textContent=msg;
  t.classList.add('show');
  clearTimeout(window._toastTO);
  window._toastTO=setTimeout(()=>t.classList.remove('show'),2600);
}

export function subWhForLine(lineId){return S.meta.warehouses.find(w=>w.type==='sub'&&w.lineId===lineId);}

/* ================= RENDER ROOT ================= */

export function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
