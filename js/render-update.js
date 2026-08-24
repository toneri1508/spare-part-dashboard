/* ===== render-update.js (tu dong tach tu main.js, khong doi logic) ===== */
import { safeSet } from './data.js';
import { stopScan, toggleCamera } from './scanner.js';
import { S, importState, updState, uiState } from './state.js';
import { escapeHtml, statusOf, toast, totalQty, uid, whName } from './utils.js';

export function renderUpdate(c){
  c.innerHTML = `
    <div class="subtabs" id="updSubtabs">
      <button data-v="quick" class="${uiState.updSubTab==='quick'?'on':''}">Nhập kho nhanh</button>
      <button data-v="import" class="${uiState.updSubTab==='import'?'on':''}">Nhập từ Excel</button>
    </div>
    <div id="updSubContent"></div>
  `;
  document.getElementById('updSubtabs').addEventListener('click',e=>{
    const b=e.target.closest('button'); if(!b) return;
    stopScan(); uiState.updSubTab=b.dataset.v; renderUpdate(c);
  });
  const sc = document.getElementById('updSubContent');
  if(uiState.updSubTab==='quick') renderUpdateQuick(sc); else renderImport(sc);
}

export function renderUpdateQuick(c){
  updState.whId = updState.whId || S.lastUsed.whId || S.meta.warehouses[0].id;
  updState.userId = S.currentUser.id;
  updState.type = 'nhap';

  c.innerHTML = `
  <div class="panel">
    <h2 class="section-title">1 · Quét hoặc nhập mã spare part</h2>
    <div class="scan-box">
      <input id="scanInput" placeholder="Quét QR hoặc gõ mã, VD: SP-BM-001" value="${updState.code}" autocomplete="off"/>
      <button class="btn" id="camBtn">📷 Bật camera quét</button>
    </div>
    <div id="cameraWrap"><video id="camVideo" playsinline muted></video><canvas id="camCanvas" style="display:none;"></canvas>
      <div class="hint">Đưa mã QR trên tem kho vào khung hình.</div></div>
    <div id="matchArea"></div>
    <div id="nhapSuggest"></div>
  </div>

  <div class="panel">
    <h2 class="section-title">2 · Chi tiết nhập kho</h2>
    <div class="row2">
      <div class="field">
        <label class="field-label">Kho nhập vào</label>
        <select id="whSel">${S.meta.warehouses.map(w=>`<option value="${w.id}" ${w.id===updState.whId?'selected':''}>${w.name}</option>`).join('')}</select>
      </div>
      <div class="field">
        <label class="field-label">Người thực hiện</label>
        <div class="readonly-field">${escapeHtml(S.currentUser.name)}</div>
      </div>
    </div>
    <div class="row2">
      <div class="field">
        <label class="field-label">Số lượng</label>
        <div class="qty-input-wrap">
          <button id="qtyMinus" type="button">−</button>
          <input id="qtyInput" type="number" min="1" value="${updState.qty}"/>
          <button id="qtyPlus" type="button">+</button>
        </div>
      </div>
      <div class="field"><label class="field-label">Ghi chú (không bắt buộc)</label><input id="noteInput" placeholder="VD: nhập hàng về đợt mới"/></div>
    </div>
    <button class="btn btn-primary btn-block" id="confirmBtn" style="padding:12px;font-size:14.5px;">Xác nhận nhập kho</button>
    <div class="hint" style="text-align:center;margin-top:8px;">Kho sẽ được ghi nhớ cho lần nhập tiếp theo. Cần xuất kho? Vào tab <b>Tổng quan</b>.</div>
  </div>`;

  document.getElementById('scanInput').addEventListener('input',e=>{applyScanCode(e.target.value); renderNhapSuggestions(e.target.value);});
  document.getElementById('camBtn').addEventListener('click',toggleCamera);
  document.getElementById('whSel').addEventListener('change',e=>updState.whId=e.target.value);
  document.getElementById('qtyInput').addEventListener('input',e=>updState.qty=Math.max(1,parseInt(e.target.value)||1));
  document.getElementById('qtyMinus').addEventListener('click',()=>{updState.qty=Math.max(1,updState.qty-1);document.getElementById('qtyInput').value=updState.qty;});
  document.getElementById('qtyPlus').addEventListener('click',()=>{updState.qty=updState.qty+1;document.getElementById('qtyInput').value=updState.qty;});
  document.getElementById('confirmBtn').addEventListener('click',confirmUpdate);

  applyScanCode(updState.code, true);
}

export function applyScanCode(code, silent){
  updState.code = code;
  if(!silent) document.getElementById('scanInput').value = code;
  const area=document.getElementById('matchArea'); if(!area) return;
  if(!code){ area.innerHTML=''; updState.matched=null; return; }
  const item = S.items.find(i=>i.code.toLowerCase()===code.trim().toLowerCase());
  updState.matched = item||null;
  if(item){
    area.innerHTML = `<div class="match-hit"><span><b>${item.code}</b> — ${item.name} · tồn hiện tại: <b>${totalQty(item)} ${item.unit}</b></span><span class="badge badge-green">Đã khớp</span></div>`;
    const sg=document.getElementById('nhapSuggest'); if(sg) sg.innerHTML='';
  } else {
    area.innerHTML = `<div class="match-miss"><span>Không tìm thấy mã "<b>${escapeHtml(code)}</b>" trong danh sách.</span><button class="btn btn-sm btn-amber" id="newItemBtn">+ Tạo vật tư mới</button></div>`;
    const btn=document.getElementById('newItemBtn');
    if(btn) btn.addEventListener('click',()=>openNewItemInline(code));
  }
}

export function renderNhapSuggestions(term){
  const box=document.getElementById('nhapSuggest'); if(!box) return;
  const q=term.trim().toLowerCase();
  if(!q){ box.innerHTML=''; return; }
  const matches=S.items.filter(i=>
    i.code.toLowerCase().includes(q) || i.name.toLowerCase().includes(q) || (i.group||'').toLowerCase().includes(q)
  ).slice(0,6);
  if(matches.length===1 && matches[0].code.toLowerCase()===q){ box.innerHTML=''; return; }
  if(!matches.length){ box.innerHTML=''; return; }
  box.innerHTML = matches.map(i=>{
    const st=statusOf(i);
    const badge = st==='green'?'badge-green':st==='amber'?'badge-amber':'badge-red';
    return `<div class="xuat-suggest-item" data-id="${i.id}">
      <div class="xsi-main"><div class="xsi-name">${i.name}</div><div class="xsi-meta">${i.code} · ${i.group||'Chưa phân nhóm'}</div></div>
      <span class="badge ${badge}">${totalQty(i)} ${i.unit}</span>
    </div>`;
  }).join('');
  box.querySelectorAll('.xuat-suggest-item').forEach(el=>{
    el.addEventListener('click',()=>{
      const item=S.items.find(x=>x.id===el.dataset.id);
      if(item){
        document.getElementById('scanInput').value=item.code;
        box.innerHTML='';
        applyScanCode(item.code, true);
      }
    });
  });
}

export function openNewItemInline(code){
  const area=document.getElementById('matchArea');
  area.innerHTML = `<div class="panel" style="margin-top:10px;background:#FBFCFC;">
    <div class="row2">
      <div class="field"><label class="field-label">Mã</label><input id="niCode" value="${escapeHtml(code)}"/></div>
      <div class="field"><label class="field-label">Tên vật tư</label><input id="niName" placeholder="Tên spare part"/></div>
    </div>
    <div class="row3">
      <div class="field"><label class="field-label">Nhóm</label><input id="niGroup" placeholder="VD: Bo mạch"/></div>
      <div class="field"><label class="field-label">Đơn vị</label><input id="niUnit" placeholder="cái / bộ / sợi"/></div>
      <div class="field"><label class="field-label">Tồn tối thiểu</label><input id="niMin" type="number" value="5"/></div>
    </div>
    <div class="field"><label class="field-label">Detail (không bắt buộc)</label><input id="niDetail" placeholder="Ghi chú thêm về vật tư…"/></div>
    <button class="btn btn-primary btn-block" id="niSave">Lưu vật tư mới</button>
  </div>`;
  document.getElementById('niSave').addEventListener('click',async ()=>{
    const nCode=document.getElementById('niCode').value.trim().toUpperCase();
    const nName=document.getElementById('niName').value.trim();
    if(!nCode||!nName){toast('Cần nhập mã và tên'); return;}
    if(S.items.some(i=>i.code.toLowerCase()===nCode.toLowerCase())){toast('Mã đã tồn tại'); return;}
    const item={id:uid('it'),code:nCode,name:nName,group:document.getElementById('niGroup').value.trim()||'Khác',
      unit:document.getElementById('niUnit').value.trim()||'cái',
      min:parseInt(document.getElementById('niMin').value)||0,
      detail:document.getElementById('niDetail').value.trim()||'', stocks:{}};
    S.items.push(item); await safeSet('sp_items',S.items);
    toast('Đã tạo vật tư mới: '+nCode);
    applyScanCode(nCode);
  });
}

export async function confirmUpdate(){
  if(!updState.matched){ toast('Chưa khớp được mã spare part'); return; }
  const item=updState.matched, whId=updState.whId, qty=updState.qty;
  if(!qty || qty<1){ toast('Số lượng không hợp lệ'); return; }
  item.stocks = item.stocks || {};
  const current = item.stocks[whId]||0;
  item.stocks[whId] = current+qty;

  const txEntry={id:uid('tx'),ts:Date.now(),userId:S.currentUser.id,itemId:item.id,type:'nhap',
    qty:qty, whId:whId, lineId:null,
    note:(document.getElementById('noteInput')||{}).value||''};
  S.tx.unshift(txEntry);
  if(S.tx.length>1000) S.tx = S.tx.slice(0,1000);

  await Promise.all([safeSet('sp_items',S.items), safeSet('sp_tx',S.tx)]);
  S.lastUsed.whId=whId;
  toast('✅ Đã nhập '+qty+' '+item.unit+' · '+item.code+' · '+whName(whId)+' · bởi '+S.currentUser.name);

  updState.code=''; updState.qty=1; updState.matched=null;
  renderUpdate(document.getElementById('tabContent'));
}

/* ================= IMPORT FROM EXCEL ================= */

export function renderImport(c){
  c.innerHTML = `
  <div class="panel">
    <h2 class="section-title">Nhập hàng loạt từ file Excel</h2>
    <p class="muted" style="font-size:13px;margin-top:-4px;">Dùng khi hàng về nhiều — điền vào file mẫu rồi tải lên đây để cập nhật tồn kho và tạo vật tư mới cùng lúc.</p>
    <button class="btn btn-amber" id="dlTemplate">⬇ Tải file mẫu (.xlsx)</button>
    <div class="import-drop" style="margin-top:14px;">
      <div style="font-family:var(--display);text-transform:uppercase;font-size:13px;letter-spacing:0.3px;">Chọn file đã điền để import</div>
      <div class="hint">Chấp nhận .xlsx, .xls, .csv — theo đúng cột trong file mẫu</div>
      <input type="file" id="importFile" accept=".xlsx,.xls,.csv"/>
    </div>
    <div id="importResult"></div>
  </div>`;
  document.getElementById('dlTemplate').addEventListener('click',downloadTemplate);
  document.getElementById('importFile').addEventListener('change',handleImportFile);
}

export async function downloadTemplate(){
  const whNames = S.meta.warehouses.map(w=>w.name);
  const userNames = S.meta.users.map(u=>u.name);
  const exWh1 = whNames[0] || 'Kho chính 1';
  const exWh2 = whNames[1] || whNames[0] || 'Kho chính 2';
  const exUser = userNames[0] || '';

  const wb = new ExcelJS.Workbook();

  // Sheet ẩn chứa danh sách kho/người dùng — làm nguồn cho dropdown, luôn khớp với hệ thống hiện tại
  const wsList = wb.addWorksheet('_DanhSach');
  whNames.forEach((n,i)=>{ wsList.getCell('A'+(i+1)).value = n; });
  userNames.forEach((n,i)=>{ wsList.getCell('B'+(i+1)).value = n; });
  wsList.state = 'veryHidden';

  const ws1 = wb.addWorksheet('Nhap kho');
  ws1.columns = [
    {header:'Mã spare part', key:'code', width:16},
    {header:'Tên vật tư', key:'name', width:26},
    {header:'Nhóm', key:'group', width:14},
    {header:'Đơn vị', key:'unit', width:10},
    {header:'Tồn tối thiểu', key:'min', width:12},
    {header:'Kho nhập', key:'wh', width:22},
    {header:'Số lượng nhập', key:'qty', width:14},
    {header:'Người nhập', key:'user', width:16},
    {header:'Ghi chú', key:'note', width:24},
    {header:'Detail', key:'detail', width:28},
  ];
  ws1.getRow(1).font = {bold:true};
  ws1.addRow({code:'SP-BM-050', name:'Bo mạch cảm biến ánh sáng', group:'Bo mạch', unit:'cái', min:10, wh:exWh1, qty:25, user:exUser, note:'Nhập hàng về đợt mới', detail:'Cảm biến quang loại NPN, 12-24VDC'});
  ws1.addRow({code:'SP-CK-060', name:'Ốc vít M4x10', group:'Cơ khí', unit:'gói', min:20, wh:exWh2, qty:100, user:'', note:'', detail:''});

  const LAST_ROW = 500;
  if(whNames.length){
    for(let r=2; r<=LAST_ROW; r++){
      ws1.getCell('F'+r).dataValidation = {
        type:'list', allowBlank:true, showErrorMessage:true,
        formulae:[`_DanhSach!$A$1:$A$${whNames.length}`],
        errorStyle:'error', errorTitle:'Tên kho không hợp lệ',
        error:'Vui lòng chọn đúng tên kho có trong danh sách sổ xuống.'
      };
    }
  }
  if(userNames.length){
    for(let r=2; r<=LAST_ROW; r++){
      ws1.getCell('H'+r).dataValidation = {
        type:'list', allowBlank:true, showErrorMessage:false,
        formulae:[`_DanhSach!$B$1:$B$${userNames.length}`]
      };
    }
  }

  const ws2 = wb.addWorksheet('Huong dan');
  ws2.getColumn(1).width = 74;
  [
    'Hướng dẫn điền file',
    '- Mã spare part: bắt buộc. Nếu mã đã có trong hệ thống, các cột khác chỉ cần điền khi muốn cập nhật lại.',
    '- Tên vật tư: bắt buộc nếu là mã mới.',
    '- Kho nhập: bấm vào ô sẽ hiện danh sách sổ xuống — chọn đúng tên kho đang có trong hệ thống (xem tab Vật tư/Quản lý), tránh gõ tay để không bị sai chính tả.',
    '- Số lượng nhập: để trống nếu chỉ muốn tạo/sửa thông tin vật tư mà chưa nhập kho.',
    '- Người nhập: bấm vào ô để chọn tên trong danh sách sổ xuống — đảm bảo hệ thống ghi nhận đúng người.',
    '- Có thể xoá 2 dòng ví dụ trước khi điền dữ liệu thật.',
    '- Detail: ghi chú/mô tả chi tiết thêm về vật tư (không bắt buộc), ví dụ thông số kỹ thuật.',
    '- Danh sách kho/người dùng trong ô sổ xuống được lấy đúng theo dữ liệu hiện tại của hệ thống tại thời điểm tải file này.'
  ].forEach(line=>ws2.addRow([line]));

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {type:'application/octet-stream'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'mau-nhap-kho-spare-part.xlsx';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function mapImportRow(raw){
  const out={code:'',name:'',group:'',unit:'',min:'',wh:'',qty:'',user:'',note:'',detail:''};
  Object.keys(raw).forEach(h=>{
    const H=h.toLowerCase(); const v=raw[h];
    if(H.includes('mã')) out.code=String(v).trim().toUpperCase();
    else if(H.includes('tên')) out.name=String(v).trim();
    else if(H.includes('nhóm')) out.group=String(v).trim();
    else if(H.includes('đơn vị')) out.unit=String(v).trim();
    else if(H.includes('tối thiểu')) out.min=v;
    else if(H.includes('kho')) out.wh=String(v).trim();
    else if(H.includes('số lượng')) out.qty=v;
    else if(H.includes('người')) out.user=String(v).trim();
    else if(H.includes('detail')) out.detail=String(v).trim();
    else if(H.includes('ghi chú')) out.note=String(v).trim();
  });
  return out;
}

export function validateImportRow(row){
  const existing = S.items.find(i=>i.code.toLowerCase()===row.code.toLowerCase());
  if(!row.code) return {status:'err', reason:'Thiếu mã spare part'};
  if(!existing && !row.name) return {status:'err', reason:'Mã mới nhưng thiếu tên vật tư'};
  const hasQty = row.qty!=='' && row.qty!==null && !isNaN(row.qty) && Number(row.qty)>0;
  let wh=null;
  if(hasQty || row.wh){
    wh = S.meta.warehouses.find(w=>w.name.toLowerCase()===String(row.wh).toLowerCase());
    if(!wh) return {status:'err', reason:'Không tìm thấy kho "'+row.wh+'"'};
  }
  if(hasQty && !wh) return {status:'err', reason:'Có số lượng nhưng thiếu kho hợp lệ'};
  if(row.user){
    const u=S.meta.users.find(u=>u.name.toLowerCase()===row.user.toLowerCase());
    if(!u) return {status:'warn', reason:'Người "'+row.user+'" chưa có trong danh sách — vẫn ghi nhận theo tên'};
  }
  return {status:'ok', reason: existing? 'Cập nhật vật tư có sẵn' : 'Tạo vật tư mới'};
}

export async function handleImportFile(e){
  const file=e.target.files[0]; if(!file) return;
  importState.fileName=file.name;
  try{
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf,{type:'array'});
    const sheetName = wb.SheetNames.find(n=>n.toLowerCase().includes('nhap')) || wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const raw = XLSX.utils.sheet_to_json(sheet,{defval:''});
    importState.rows = raw.map(r=>{
      const mapped=mapImportRow(r);
      const v=validateImportRow(mapped);
      return {...mapped, _status:v.status, _reason:v.reason};
    }).filter(r=>r.code || r.name);
  }catch(err){
    toast('Không đọc được file — kiểm tra định dạng .xlsx');
    return;
  }
  renderImportPreview();
}

export function renderImportPreview(){
  const box=document.getElementById('importResult');
  const rows=importState.rows;
  if(!rows.length){ box.innerHTML = `<div class="empty"><div class="big">Không có dòng dữ liệu</div>Kiểm tra lại file, có thể thiếu cột "Mã spare part".</div>`; return; }
  const ok=rows.filter(r=>r._status==='ok').length, warn=rows.filter(r=>r._status==='warn').length, err=rows.filter(r=>r._status==='err').length;
  box.innerHTML = `
    <div class="import-summary">
      <span class="chip chip-ok">${ok+warn} dòng sẽ được nhập</span>
      ${warn?`<span class="chip chip-warn">${warn} dòng có cảnh báo</span>`:''}
      ${err?`<span class="chip chip-err">${err} dòng lỗi — sẽ bỏ qua</span>`:''}
    </div>
    <div class="import-table-wrap"><table class="import-table">
      <thead><tr><th>Mã</th><th>Tên</th><th>Kho</th><th>SL</th><th>Người</th><th>Trạng thái</th></tr></thead>
      <tbody>
        ${rows.map(r=>`<tr class="${r._status==='err'?'row-err':r._status==='warn'?'row-warn':''}">
          <td>${escapeHtml(r.code)}</td><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.wh)}</td>
          <td>${escapeHtml(String(r.qty))}</td><td>${escapeHtml(r.user)}</td>
          <td class="rstatus ${r._status}">${r._reason}</td>
        </tr>`).join('')}
      </tbody>
    </table></div>
    <button class="btn btn-primary btn-block" id="confirmImportBtn" style="margin-top:12px;padding:12px;" ${ok+warn===0?'disabled':''}>
      Xác nhận nhập ${ok+warn} dòng hợp lệ
    </button>`;
  const btn=document.getElementById('confirmImportBtn');
  if(btn) btn.addEventListener('click',commitImport);
}

export async function commitImport(){
  const rows = importState.rows.filter(r=>r._status!=='err');
  let newItems=0, updatedItems=0, stockMoves=0;
  rows.forEach(row=>{
    let item = S.items.find(i=>i.code.toLowerCase()===row.code.toLowerCase());
    if(!item){
      item = {id:uid('it'), code:row.code, name:row.name||row.code, group:row.group||'Khác',
        unit:row.unit||'cái', min:(row.min!==''&&!isNaN(row.min))?parseInt(row.min):0,
        detail:row.detail||'', stocks:{}};
      S.items.push(item); newItems++;
    } else {
      if(row.name) item.name=row.name;
      if(row.group) item.group=row.group;
      if(row.unit) item.unit=row.unit;
      if(row.min!=='' && !isNaN(row.min)) item.min=parseInt(row.min);
      if(row.detail) item.detail=row.detail;
      updatedItems++;
    }
    const hasQty = row.qty!=='' && !isNaN(row.qty) && Number(row.qty)>0;
    if(hasQty && row.wh){
      const wh = S.meta.warehouses.find(w=>w.name.toLowerCase()===row.wh.toLowerCase());
      if(wh){
        const q=parseInt(row.qty);
        item.stocks[wh.id]=(item.stocks[wh.id]||0)+q;
        const matchedUser = row.user ? S.meta.users.find(u=>u.name.toLowerCase()===row.user.toLowerCase()) : null;
        S.tx.unshift({id:uid('tx'), ts:Date.now(), userId: matchedUser?matchedUser.id:null,
          rawUser: matchedUser?null:(row.user||null), itemId:item.id, type:'nhap', qty:q,
          whId:wh.id, lineId:null, note:row.note||'', source:'import'});
        stockMoves++;
      }
    }
  });
  if(S.tx.length>1000) S.tx = S.tx.slice(0,1000);
  await Promise.all([safeSet('sp_items',S.items), safeSet('sp_tx',S.tx)]);
  toast('Đã import: '+newItems+' vật tư mới, '+updatedItems+' cập nhật, '+stockMoves+' lượt nhập kho');
  importState.rows=[]; importState.fileName='';
  renderImport(document.getElementById('updSubContent'));
}

/* --- camera QR scan --- */
