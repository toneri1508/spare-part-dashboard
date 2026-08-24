/* ===== render-history.js (tu dong tach tu main.js, khong doi logic) ===== */
import { safeSet } from './data.js';
import { S } from './state.js';
import { fmtTime, lineName, toast, userName, whName } from './utils.js';

export function renderHistory(c){
  const isAdmin = S.currentUser && S.currentUser.role==='admin';
  c.innerHTML = `
  <div class="panel">
    <div class="filter-bar">
      <input id="hSearch" placeholder="Tìm theo mã/tên vật tư…"/>
      <select id="hUser"><option value="">Tất cả người dùng</option>${S.meta.users.map(u=>`<option value="${u.id}">${u.name}</option>`).join('')}</select>
      <select id="hWh"><option value="">Tất cả kho</option>${S.meta.warehouses.map(w=>`<option value="${w.id}">${w.name}</option>`).join('')}</select>
      <select id="hType"><option value="">Nhập &amp; Xuất</option><option value="nhap">Chỉ nhập</option><option value="xuat">Chỉ xuất</option></select>
    </div>
    <div id="hList"></div>
    ${isAdmin?'<div class="hint">Xoá ở đây chỉ ẩn khỏi màn hình hiển thị — dữ liệu gốc trên Firebase vẫn được giữ nguyên.</div>':''}
  </div>`;
  const draw=()=>{
    const q=document.getElementById('hSearch').value.trim().toLowerCase();
    const u=document.getElementById('hUser').value, w=document.getElementById('hWh').value, ty=document.getElementById('hType').value;
    let list=S.tx.filter(t=>{
      if(S.txHidden.includes(t.id)) return false;
      const item=S.items.find(i=>i.id===t.itemId);
      if(q && item && !(item.code.toLowerCase().includes(q)||item.name.toLowerCase().includes(q))) return false;
      if(u && t.userId!==u) return false;
      if(w && t.whId!==w) return false;
      if(ty && t.type!==ty) return false;
      return true;
    });
    const rowCls = 'hist-row'+(isAdmin?' with-del':'');
    const rows = list.map(t=>{
      const item=S.items.find(i=>i.id===t.itemId);
      const typeBadge = t.type==='xuat' ? `<span class="badge badge-red">Xuất</span>` : `<span class="badge badge-green">Nhập</span>`;
      return `<div class="${rowCls}">
        <span class="t-time" data-lbl="Thời gian">${fmtTime(t.ts)}</span>
        <span data-lbl="Người">${userName(t.userId,t.rawUser)}</span>
        <span data-lbl="Loại">${typeBadge}</span>
        <span class="t-item" data-lbl="Vật tư">${item?item.code+' — '+item.name:'(đã xoá)'}</span>
        <span data-lbl="SL"><b>${t.qty}</b></span>
        <span data-lbl="Kho/Line">${whName(t.whId)}${t.lineId?' → '+lineName(t.lineId):''}</span>
        ${isAdmin?`<span data-lbl="" style="text-align:right;"><button class="btn btn-sm btn-danger" data-hide-tx="${t.id}">Xoá</button></span>`:''}
      </div>`;
    }).join('');
    const head = isAdmin
      ? `<div class="hist-row head with-del"><span>Thời gian</span><span>Người</span><span>Loại</span><span>Vật tư</span><span>SL</span><span>Kho/Line</span><span></span></div>`
      : `<div class="hist-row head"><span>Thời gian</span><span>Người</span><span>Loại</span><span>Vật tư</span><span>SL</span><span>Kho/Line</span></div>`;
    document.getElementById('hList').innerHTML = list.length ?
      head+rows
      : `<div class="empty"><div class="big">Chưa có giao dịch</div>Lịch sử cập nhật sẽ hiện tại đây.</div>`;
    if(isAdmin){
      document.querySelectorAll('[data-hide-tx]').forEach(btn=>{
        btn.addEventListener('click',async ()=>{
          if(!confirm('Ẩn giao dịch này khỏi màn hình lịch sử? Dữ liệu gốc trên Firebase vẫn được giữ nguyên.')) return;
          S.txHidden.push(btn.dataset.hideTx);
          await safeSet('sp_tx_hidden',S.txHidden);
          draw();
          toast('Đã ẩn khỏi lịch sử hiển thị');
        });
      });
    }
  };
  ['hSearch','hUser','hWh','hType'].forEach(id=>{
    document.getElementById(id).addEventListener('input',draw);
    document.getElementById(id).addEventListener('change',draw);
  });
  draw();
}
