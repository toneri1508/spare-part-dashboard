/* ===== auth.js (tu dong tach tu main.js, khong doi logic) ===== */
import { render } from './app.js';
import { safeSet, startLiveSync } from './data.js';
import { ADMIN_ID, S } from './state.js';

export function getSavedUser(){
  try{ const raw=localStorage.getItem('sp_currentUser'); return raw?JSON.parse(raw):null; }
  catch(e){ return null; }
}

export function saveCurrentUser(u){
  try{ localStorage.setItem('sp_currentUser', JSON.stringify(u)); }catch(e){}
}

export function logout(){
  try{ localStorage.removeItem('sp_currentUser'); }catch(e){}
  S.currentUser = null;
  boot();
}

export function renderLogin(){
  const app=document.getElementById('app');
  app.innerHTML = `
    <div class="login-wrap">
      <div class="panel login-box">
        <div class="login-title">Spare-Part Management</div>
        <div class="login-sub">Nhập ID nhân viên để tiếp tục — ID sẽ được ghi nhớ trên thiết bị này, không cần nhập lại.</div>
        <div class="field"><label class="field-label">ID nhân viên</label><input id="loginId" placeholder="Hãy nhập ID" autocomplete="off"/></div>
        <div class="field" id="loginNameField" style="display:none;"><label class="field-label">Tên hiển thị (thiết lập lần đầu)</label><input id="loginName" placeholder="VD: Nguyễn Văn A"/></div>
        <button class="btn btn-primary btn-block" id="loginBtn" style="padding:11px;">Vào</button>
        <div class="hint" id="loginMsg" style="margin-top:8px;text-align:center;"></div>
      </div>
    </div>`;
  const idInp=document.getElementById('loginId');
  const nameField=document.getElementById('loginNameField');
  const nameInp=document.getElementById('loginName');
  const msg=document.getElementById('loginMsg');
  let pendingAdminSetup=false;

  async function doLogin(){
    const id=idInp.value.trim();
    if(!id){ msg.textContent='Vui lòng nhập ID.'; return; }
    let user = S.meta.users.find(u=>u.id===id);

    if(!user && id===ADMIN_ID){
      if(!pendingAdminSetup){
        pendingAdminSetup=true;
        nameField.style.display='';
        msg.textContent='Đây là ID quản trị viên — nhập tên của bạn để hoàn tất thiết lập lần đầu.';
        nameInp.focus();
        return;
      }
      const name=nameInp.value.trim();
      if(!name){ msg.textContent='Vui lòng nhập tên.'; return; }
      user={id:ADMIN_ID,name,role:'admin'};
      S.meta.users.push(user);
      await safeSet('sp_meta',S.meta);
    }

    if(!user){
      msg.textContent='ID chưa được cấp quyền. Liên hệ quản trị viên để được thêm vào hệ thống.';
      return;
    }
    S.currentUser={id:user.id,name:user.name,role:user.role||'user'};
    saveCurrentUser(S.currentUser);
    S.activeTab='overview';
    render();
    startLiveSync();
  }

  document.getElementById('loginBtn').addEventListener('click',doLogin);
  [idInp,nameInp].forEach(el=>el.addEventListener('keydown',e=>{ if(e.key==='Enter') doLogin(); }));
}

/* ================= INIT ================= */

export function boot(){
  if(!S.currentUser){ renderLogin(); }
  else { render(); startLiveSync(); }
}
