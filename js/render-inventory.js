/* ===== render-inventory.js (tu dong tach tu main.js, khong doi logic) ===== */
import { tagActionHandler, tagCardHTML } from './item-card.js';
import { S } from './state.js';
import { statusOf } from './utils.js';

export function renderInventory(c){
  const groups=[...new Set(S.items.map(i=>i.group).filter(Boolean))];
  c.innerHTML = `
    <div class="panel">
      <div class="filter-bar">
        <input id="invSearch" placeholder="Tìm theo mã hoặc tên spare part…" />
        <select id="invWh"><option value="">Tất cả kho</option>${S.meta.warehouses.map(w=>`<option value="${w.id}">${w.name}</option>`).join('')}</select>
        <select id="invGrp"><option value="">Tất cả nhóm</option>${groups.map(g=>`<option value="${g}">${g}</option>`).join('')}</select>
        <select id="invStatus"><option value="">Mọi trạng thái</option><option value="green">Đủ hàng</option><option value="amber">Sắp hết</option><option value="red">Hết hàng</option></select>
      </div>
      <div id="invGrid"></div>
    </div>`;
  const doFilter=()=>{
    const q=document.getElementById('invSearch').value.trim().toLowerCase();
    const wh=document.getElementById('invWh').value;
    const grp=document.getElementById('invGrp').value;
    const stF=document.getElementById('invStatus').value;
    let list=S.items.filter(i=>{
      if(q && !(i.code.toLowerCase().includes(q)||i.name.toLowerCase().includes(q))) return false;
      if(wh && !((i.stocks && i.stocks[wh]) > 0)) return false;
      if(grp && i.group!==grp) return false;
      if(stF && statusOf(i)!==stF) return false;
      return true;
    });
    const grid=document.getElementById('invGrid');
    grid.innerHTML = list.length ? `<div class="tag-grid" style="margin-top:14px;">${list.map(i=>tagCardHTML(i,true)).join('')}</div>`
      : `<div class="empty" style="margin-top:14px;"><div class="big">Không tìm thấy</div>Thử từ khoá hoặc bộ lọc khác.</div>`;
  };
  ['invSearch','invWh','invGrp','invStatus'].forEach(id=>{
    document.getElementById(id).addEventListener('input',doFilter);
    document.getElementById(id).addEventListener('change',doFilter);
  });
  doFilter();
  c.addEventListener('click',tagActionHandler);
}
