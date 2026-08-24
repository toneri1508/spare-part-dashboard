/* ===== app.js (tu dong tach tu main.js, khong doi logic) ===== */
import { boot, getSavedUser, logout, renderLogin } from './auth.js';
import { loadAll } from './data.js';
import { renderHistory } from './render-history.js';
import { renderInventory } from './render-inventory.js';
import { renderManage } from './render-manage.js';
import { renderOverview } from './render-overview.js';
import { renderUpdate } from './render-update.js';
import { stopScan, stopXuatScan } from './scanner.js';
import { S } from './state.js';
import { escapeHtml } from './utils.js';

export function render(){
  if(!S.currentUser){ renderLogin(); return; }
  const app=document.getElementById('app');
  const isAdmin = S.currentUser.role==='admin';
  const mainWhCount = S.meta.warehouses.filter(w=>w.type==='main').length;
  const subWhCount = S.meta.warehouses.filter(w=>w.type==='sub').length;
  app.innerHTML = `
    <div class="hdr"><div class="hdr-inner">
      <div class="hdr-left">
        ${isAdmin?`<button class="gear-btn ${S.activeTab==='manage'?'active':''}" id="gearBtn" title="Quản lý hệ thống">⚙</button>`:''}
        <div>
          <h1>Spare-Part Management · Maint Line VD3</h1>
          <div class="sub">${mainWhCount} kho chính · ${subWhCount} kho phụ · ${S.meta.users.length} người dùng</div>
        </div>
      </div>
      <div class="hdr-right">
        <div class="hdr-user"><b>${escapeHtml(S.currentUser.name)}</b>${isAdmin?' · Quản trị':''}<button class="link-btn" id="logoutBtn">Đổi tài khoản</button></div>
        <div class="hdr-tag">DỮ LIỆU DÙNG CHUNG</div>
      </div>
    </div></div>
    <div class="tabs" id="tabs"></div>
    <div id="tabContent"></div>
  `;
  const tabs=[['overview','Tổng quan'],['inventory','Vật tư'],['update','Nhập kho'],['history','Lịch sử']];
  document.getElementById('tabs').innerHTML = tabs.map(([id,label])=>
    `<button class="tab-btn ${S.activeTab===id?'active':''}" data-tab="${id}">${label}</button>`
  ).join('');
  document.querySelectorAll('.tab-btn').forEach(b=>b.addEventListener('click',()=>{
    stopScan(); stopXuatScan(); S.activeTab=b.dataset.tab; render();
  }));
  if(isAdmin){
    document.getElementById('gearBtn').addEventListener('click',()=>{
      stopScan(); stopXuatScan(); S.activeTab='manage'; render();
    });
  }
  document.getElementById('logoutBtn').addEventListener('click',()=>{
    if(confirm('Đăng xuất khỏi thiết bị này?')) logout();
  });
  const c=document.getElementById('tabContent');
  if(S.activeTab==='overview') renderOverview(c);
  else if(S.activeTab==='inventory') renderInventory(c);
  else if(S.activeTab==='update') renderUpdate(c);
  else if(S.activeTab==='history') renderHistory(c);
  else if(S.activeTab==='manage'){ if(isAdmin) renderManage(c); else { S.activeTab='overview'; renderOverview(c); } }
}

/* ================= INIT (entry point cua toan bo app) ================= */
(async function init(){
  await loadAll();
  S.currentUser = getSavedUser();
  boot();
})();
