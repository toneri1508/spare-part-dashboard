/* ===== item-card.js (tu dong tach tu main.js, khong doi logic) ===== */
import { openItemEditModal } from './render-manage.js';
import { S } from './state.js';
import { escapeHtml, fmtTime, itemTxHistory, lastTx, lineName, statusLabel, statusOf, timeAgo, totalQty, userName, whName } from './utils.js';

export function tagCardHTML(item, editable){
  const st=statusOf(item), t=totalQty(item);
  const badge = st==='green'?'badge-green':st==='amber'?'badge-amber':'badge-red';
  const nonZero = Object.entries(item.stocks||{}).filter(([,q])=>q>0);
  const whRows = nonZero.map(([wid,q])=>`<div><span>${whName(wid)}</span><b>${q}</b></div>`).join('')
    || '<div><span>Không có tồn ở kho nào</span></div>';
  return `<div class="tag st-${st}">
    ${editable?`<button class="edit-btn" data-action="editItem" data-id="${item.id}" title="Sửa vật tư">✏️</button><button class="qr-btn" data-action="qr" data-id="${item.id}" title="Xem QR">▦</button>`:''}
    <div class="punch"></div>
    <div class="code">${item.code}</div>
    <div class="name">${item.name}</div>
    <div class="grp">${item.group||'Chưa phân nhóm'} · min ${item.min} ${item.unit}</div>
    <div class="tear"></div>
    <div class="qty-row"><span class="qty">${t}</span><span class="qty-unit">${item.unit}</span></div>
    <span class="badge ${badge}" style="margin-top:6px;">${statusLabel(st)}</span>
    <details class="wh-details">
      <summary>Xem theo kho${nonZero.length?' ('+nonZero.length+')':''}</summary>
      <div class="wh-list">${whRows}</div>
      ${item.detail?`<div class="item-detail-text">${escapeHtml(item.detail)}</div>`:''}
    </details>
    ${lastActRowHTML(item)}
  </div>`;
}

export function lastActRowHTML(item){
  const t=lastTx(item.id);
  if(!t){
    return `<div class="last-act"><span class="la-text">Chưa có giao dịch</span></div>`;
  }
  const verb = t.type==='xuat'?'đã xuất kho':'đã nhập kho';
  return `<div class="last-act clickable" data-action="lastact" data-id="${item.id}">
    <span class="la-dot ${t.type}"></span>
    <span class="la-text">${userName(t.userId,t.rawUser)} ${verb} · ${timeAgo(t.ts)}</span>
    <span class="chev">›</span>
  </div>`;
}

export function tagActionHandler(e){
  const btn=e.target.closest('[data-action]'); if(!btn) return;
  const id=btn.dataset.id, item=S.items.find(i=>i.id===id); if(!item) return;
  if(btn.dataset.action==='lastact') showTxDetailModal(item);
  if(btn.dataset.action==='editItem') openItemEditModal(item.id);
  if(btn.dataset.action==='qr') showQrModal(item);
}

export function showTxDetailModal(item){
  const hist = itemTxHistory(item.id,6);
  const t = hist[0];
  if(!t) return;
  const typeText = t.type==='xuat'?'Xuất kho':'Nhập kho';
  document.getElementById('modalContent').innerHTML = `
    <h3>${typeText} gần nhất</h3>
    <div class="muted" style="font-size:12.5px;margin-bottom:8px;">${item.code} — ${item.name}</div>
    <div class="detail-row"><span>Ngày giờ</span><b>${fmtTime(t.ts)}</b></div>
    <div class="detail-row"><span>Người thực hiện</span><b>${userName(t.userId,t.rawUser)}</b></div>
    <div class="detail-row"><span>Số lượng</span><b>${t.qty} ${item.unit}</b></div>
    <div class="detail-row"><span>Kho</span><b>${whName(t.whId)}</b></div>
    ${t.lineId?`<div class="detail-row"><span>Dây chuyền nhận</span><b>${lineName(t.lineId)}</b></div>`:''}
    <div class="detail-row"><span>Lý do / Ghi chú</span><b style="text-align:right;max-width:220px;">${t.note?escapeHtml(t.note):'Không có'}</b></div>
    ${hist.length>1?`<div class="mini-hist"><h2 class="section-title" style="font-size:12px;">Giao dịch gần đây</h2>
      ${hist.map(h=>`<div class="mh-item">
        <div class="mh-top"><span>${fmtTime(h.ts)} · ${userName(h.userId,h.rawUser)}</span><span>${h.type==='xuat'?'Xuất':'Nhập'} ${h.qty} ${item.unit}</span></div>
        <div class="mh-note">${h.note?escapeHtml(h.note):''}</div>
      </div>`).join('')}
    </div>`:''}
    <button class="btn btn-primary btn-block" style="margin-top:14px;" onclick="closeModal()">Đóng</button>
  `;
  document.getElementById('modalContent').classList.add('wide');
  document.getElementById('modalBg').classList.add('on');
}

export function showQrModal(item){
  const bg=document.getElementById('modalBg');
  const qrUrl='https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=10&data='+encodeURIComponent(item.code);
  document.getElementById('modalContent').innerHTML = `
    <h3>Tem kho</h3>
    <div class="muted" style="font-size:12.5px;">${item.name}</div>
    <img src="${qrUrl}" width="220" height="220" alt="QR ${item.code}"/>
    <div class="code">${item.code}</div>
    <div class="hint">Dán/in tem này lên vị trí lưu kho. Nhấn Ctrl+P để in nếu cần.</div>
    <button class="btn btn-primary btn-block" style="margin-top:14px;" onclick="closeModal()">Đóng</button>
  `;
  document.getElementById('modalContent').classList.remove('wide');
  bg.classList.add('on');
}

export function closeModal(){document.getElementById('modalBg').classList.remove('on');}
window.closeModal = closeModal; // can thiet vi duoc goi qua onclick="closeModal()" trong chuoi HTML
document.getElementById('modalBg').addEventListener('click',e=>{if(e.target.id==='modalBg')closeModal();});
