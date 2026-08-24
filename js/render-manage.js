/* ===== render-manage.js (tu dong tach tu main.js, khong doi logic) ===== */
import { safeSet } from './data.js';
import { closeModal } from './item-card.js';
import { renderInventory } from './render-inventory.js';
import { renderOverview } from './render-overview.js';
import { S } from './state.js';
import { escapeHtml, lineName, subWhForLine, toast, uid } from './utils.js';

export function renderManage(c){
  c.innerHTML = `
    <div class="panel">
      <h2 class="section-title">Người dùng <span class="count">${S.meta.users.length}</span></h2>
      <ul class="mlist" id="userList"></ul>
      <div class="add-row">
        <input id="newUserId" placeholder="ID nhân viên…" style="max-width:130px;"/>
        <input id="newUserName" placeholder="Tên thành viên mới…"/>
        <button class="btn btn-amber" id="addUserBtn">+ Thêm</button>
      </div>
      <div class="hint">Mỗi thành viên đăng nhập bằng ID riêng (không cần mật khẩu) — ID này dùng để ghi nhận ai đã cập nhật kho.</div>
    </div>
    <div class="panel">
      <h2 class="section-title">Kho <span class="count">${S.meta.warehouses.length}</span></h2>
      <ul class="mlist" id="whList"></ul>
      <div class="add-row" style="flex-wrap:wrap;">
        <input id="newWhName" placeholder="Tên kho mới…" style="flex:1;min-width:140px;"/>
        <select id="newWhType" style="max-width:150px;"><option value="main">Kho chính</option><option value="sub">Kho phụ</option></select>
        <select id="newWhLine" style="max-width:170px;display:none;">${S.meta.lines.map(l=>`<option value="${l.id}">${l.name}</option>`).join('')}</select>
        <button class="btn btn-amber" id="addWhBtn">+ Thêm kho</button>
      </div>
      <div class="hint">Kho phụ cần gắn với 1 dây chuyền sản xuất.</div>
    </div>
    <div class="panel">
      <h2 class="section-title">Dây chuyền <span class="count">${S.meta.lines.length}</span></h2>
      <ul class="mlist" id="lineList"></ul>
    </div>
    <div class="panel">
      <h2 class="section-title">Vật tư <span class="count">${S.items.length}</span></h2>
      <ul class="mlist" id="itemList"></ul>
      <div class="hint">Sửa thông tin vật tư (tên, nhóm, tồn kho…) bằng icon ✏️ trong tab Vật tư. Ở đây chỉ dùng để xoá vật tư không còn sử dụng.</div>
    </div>
  `;
  drawUserList(); drawWhList(); drawLineList(); drawItemList();

  document.getElementById('addUserBtn').addEventListener('click',async ()=>{
    const idInp=document.getElementById('newUserId'); const nameInp=document.getElementById('newUserName');
    const id=idInp.value.trim(); const name=nameInp.value.trim();
    if(!id||!name){toast('Nhập đủ ID và tên thành viên'); return;}
    if(S.meta.users.some(u=>u.id===id)){toast('ID này đã tồn tại'); return;}
    S.meta.users.push({id,name,role:'user'});
    await safeSet('sp_meta',S.meta); idInp.value=''; nameInp.value=''; renderManage(c); toast('Đã thêm '+name);
  });

  const whTypeSel=document.getElementById('newWhType');
  const whLineSel=document.getElementById('newWhLine');
  whTypeSel.addEventListener('change',()=>{ whLineSel.style.display = whTypeSel.value==='sub' ? '' : 'none'; });
  document.getElementById('addWhBtn').addEventListener('click',async ()=>{
    const nameInp=document.getElementById('newWhName');
    const name=nameInp.value.trim();
    if(!name){toast('Nhập tên kho'); return;}
    const type=whTypeSel.value;
    const wh={id:uid('wh'),name,type};
    if(type==='sub'){ wh.lineId=whLineSel.value; }
    S.meta.warehouses.push(wh);
    await safeSet('sp_meta',S.meta); nameInp.value=''; renderManage(c); toast('Đã thêm kho '+name);
  });
}

export function drawUserList(){
  document.getElementById('userList').innerHTML = S.meta.users.map(u=>`
    <li>
      <span class="muted" style="font-family:var(--mono);font-size:11px;min-width:82px;">${escapeHtml(u.id)}</span>
      <input data-id="${u.id}" data-kind="user" value="${u.name}"/>
      ${u.role==='admin'?'<span class="badge badge-steel" style="flex:none;">Quản trị</span>':''}
      <button class="btn btn-sm btn-danger" data-del="user" data-id="${u.id}">Xoá</button>
    </li>`).join('');
  bindMlist('userList');
}

export function drawWhList(){
  document.getElementById('whList').innerHTML = S.meta.warehouses.map(w=>`
    <li><span style="min-width:70px;"><span class="badge ${w.type==='main'?'badge-steel':'badge-amber'}">${w.type==='main'?'Chính':'Phụ'}</span></span>
    <input data-id="${w.id}" data-kind="wh" value="${w.name}"/>
    ${w.type==='sub'?`<span class="muted" style="font-size:11px;white-space:nowrap;">${lineName(w.lineId)}</span>`:''}</li>`).join('');
  bindMlist('whList');
}

export function drawLineList(){
  document.getElementById('lineList').innerHTML = S.meta.lines.map(l=>`
    <li><input data-id="${l.id}" data-kind="line" value="${l.name}"/>
    <span class="muted" style="font-size:11.5px;">${subWhForLine(l.id)?subWhForLine(l.id).name:''}</span></li>`).join('');
  bindMlist('lineList');
}

export function drawItemList(){
  document.getElementById('itemList').innerHTML = S.items.map(i=>`
    <li>
      <input class="t-item" data-id="${i.id}" data-kind="itemcode" value="${escapeHtml(i.code)}"
        style="font-family:var(--mono);font-size:12px;min-width:90px;max-width:120px;text-transform:uppercase;"/>
      <span style="flex:1;font-size:13px;">${escapeHtml(i.name)}</span>
      <button class="btn btn-sm btn-danger" data-del="item" data-id="${i.id}">Xoá</button>
    </li>`).join('');
  bindMlist('itemList');
}

export function openItemEditModal(itemId){
  const item=S.items.find(i=>i.id===itemId); if(!item) return;
  item.stocks = item.stocks || {};
  const html = `<h3>Sửa vật tư</h3>
    <div class="muted" style="font-size:12.5px;margin-bottom:10px;">${item.code}</div>
    <div class="row2">
      <div class="field"><label class="field-label">Tên vật tư</label><input id="eiName" value="${escapeHtml(item.name)}"/></div>
      <div class="field"><label class="field-label">Nhóm</label><input id="eiGroup" value="${escapeHtml(item.group||'')}"/></div>
    </div>
    <div class="row2">
      <div class="field"><label class="field-label">Đơn vị</label><input id="eiUnit" value="${escapeHtml(item.unit||'')}"/></div>
      <div class="field"><label class="field-label">Tồn tối thiểu</label><input id="eiMin" type="number" min="0" value="${item.min}"/></div>
    </div>
    <div class="field"><label class="field-label">Detail (không bắt buộc)</label><input id="eiDetail" value="${escapeHtml(item.detail||'')}" placeholder="Ghi chú thêm về vật tư…"/></div>
    <label class="field-label" style="display:block;margin:10px 0 6px;">Số lượng tồn theo từng kho</label>
    ${S.meta.warehouses.map(w=>`
      <div class="field"><label class="field-label">${w.name}</label>
        <input data-wh="${w.id}" type="number" min="0" value="${item.stocks[w.id]||0}"/>
      </div>`).join('')}
    <button class="btn btn-primary btn-block" id="eiSaveBtn" style="margin-top:6px;">Lưu thay đổi</button>
    <div class="hint" style="text-align:center;margin-top:6px;">Nếu số lượng tồn kho thay đổi, hệ thống sẽ tự ghi lại thành giao dịch nhập/xuất trong Lịch sử.</div>`;
  document.getElementById('modalContent').innerHTML = html;
  document.getElementById('modalContent').classList.remove('wide');
  document.getElementById('modalBg').classList.add('on');
  document.getElementById('eiSaveBtn').addEventListener('click', async ()=>{
    const name=document.getElementById('eiName').value.trim();
    if(!name){ toast('Tên vật tư không được để trống'); return; }
    item.name=name;
    item.group=document.getElementById('eiGroup').value.trim()||'Khác';
    item.unit=document.getElementById('eiUnit').value.trim()||'cái';
    item.min=Math.max(0,parseInt(document.getElementById('eiMin').value)||0);
    item.detail=document.getElementById('eiDetail').value.trim()||'';

    const stockChanges=[];
    document.querySelectorAll('#modalContent [data-wh]').forEach(inp=>{
      const whId=inp.dataset.wh;
      const oldQty=item.stocks[whId]||0;
      const newQty=Math.max(0,parseInt(inp.value)||0);
      if(newQty!==oldQty) stockChanges.push({whId, diff:newQty-oldQty});
      item.stocks[whId]=newQty;
    });
    stockChanges.forEach(ch=>{
      S.tx.unshift({
        id:uid('tx'), ts:Date.now(), userId:S.currentUser.id, itemId:item.id,
        type: ch.diff>0 ? 'nhap' : 'xuat',
        qty: Math.abs(ch.diff), whId: ch.whId, lineId:null,
        note:'Chỉnh sửa tồn kho qua tab Vật tư'
      });
    });
    if(S.tx.length>1000) S.tx = S.tx.slice(0,1000);

    await Promise.all([safeSet('sp_items',S.items), safeSet('sp_tx',S.tx)]);
    closeModal();
    toast(stockChanges.length ? 'Đã lưu thay đổi vật tư và ghi nhận '+stockChanges.length+' giao dịch' : 'Đã lưu thay đổi vật tư');
    const tc=document.getElementById('tabContent');
    if(S.activeTab==='inventory') renderInventory(tc);
    else if(S.activeTab==='overview') renderOverview(tc);
    else if(S.activeTab==='manage') renderManage(tc);
  });
}

export function bindMlist(containerId){
  const el=document.getElementById(containerId);
  el.querySelectorAll('input[data-kind]').forEach(inp=>{
    inp.addEventListener('change',async ()=>{
      const {id,kind}=inp.dataset;
      if(kind==='user'){ const u=S.meta.users.find(x=>x.id===id); u.name=inp.value.trim()||u.name; await safeSet('sp_meta',S.meta); }
      if(kind==='wh'){ const w=S.meta.warehouses.find(x=>x.id===id); w.name=inp.value.trim()||w.name; await safeSet('sp_meta',S.meta); }
      if(kind==='line'){ const l=S.meta.lines.find(x=>x.id===id); l.name=inp.value.trim()||l.name; await safeSet('sp_meta',S.meta); }
      if(kind==='itemname'){ const it=S.items.find(x=>x.id===id); it.name=inp.value.trim()||it.name; await safeSet('sp_items',S.items); }
      if(kind==='itemmin'){ const it=S.items.find(x=>x.id===id); it.min=parseInt(inp.value)||0; await safeSet('sp_items',S.items); }
      if(kind==='itemcode'){
        const it=S.items.find(x=>x.id===id);
        const newCode=inp.value.trim().toUpperCase();
        if(!newCode){ toast('Mã không được để trống'); inp.value=it.code; return; }
        if(S.items.some(x=>x.id!==id && x.code.toLowerCase()===newCode.toLowerCase())){
          toast('Mã "'+newCode+'" đã tồn tại ở vật tư khác'); inp.value=it.code; return;
        }
        it.code=newCode; inp.value=newCode; await safeSet('sp_items',S.items);
      }
      toast('Đã lưu thay đổi');
    });
  });
  el.querySelectorAll('[data-del]').forEach(btn=>{
    btn.addEventListener('click',async ()=>{
      const {del,id}=btn.dataset;
      if(!confirm('Xoá mục này?')) return;
      if(del==='user'){
        if(S.meta.users.length<=1){toast('Cần giữ ít nhất 1 người dùng'); return;}
        if(S.currentUser && id===S.currentUser.id){toast('Không thể tự xoá tài khoản đang đăng nhập'); return;}
        S.meta.users=S.meta.users.filter(x=>x.id!==id); await safeSet('sp_meta',S.meta);
      }
      if(del==='item'){ S.items=S.items.filter(x=>x.id!==id); await safeSet('sp_items',S.items); }
      renderManage(document.getElementById('tabContent'));
      toast('Đã xoá');
    });
  });
}
