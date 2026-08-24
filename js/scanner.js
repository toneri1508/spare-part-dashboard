/* ===== scanner.js (tu dong tach tu main.js, khong doi logic) ===== */
import { openXuatModal } from './render-overview.js';
import { applyScanCode } from './render-update.js';
import { S } from './state.js';
import { toast } from './utils.js';

export let xuatCamStream=null, xuatCamRAF=null;

export async function toggleXuatCamera(){
  if(xuatCamStream){ stopXuatScan(); return; }
  if(!window.jsQR){ toast('Thư viện quét QR chưa tải xong — thử tải lại trang (Ctrl+Shift+R).'); return; }
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){ toast('Trình duyệt này không hỗ trợ camera.'); return; }
  try{
    const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}}});
    xuatCamStream=stream;
    const video=document.getElementById('xuatCamVideo');
    video.srcObject=stream; await video.play();
    const wrap=document.getElementById('xuatCameraWrap'); if(wrap) wrap.classList.add('on');
    const btn=document.getElementById('xuatCamBtn'); if(btn) btn.textContent='⏹ Tắt camera';
    scanXuatLoop();
  }catch(err){ toast('Không truy cập được camera: '+(err&&err.message?err.message:'không rõ lỗi')); }
}

export function scanXuatLoop(){
  const video=document.getElementById('xuatCamVideo'), canvas=document.getElementById('xuatCamCanvas');
  if(!video||!canvas){ return; }
  if(video.readyState!==video.HAVE_ENOUGH_DATA){ xuatCamRAF=requestAnimationFrame(scanXuatLoop); return; }
  canvas.width=video.videoWidth; canvas.height=video.videoHeight;
  const ctx=canvas.getContext('2d');
  ctx.drawImage(video,0,0,canvas.width,canvas.height);
  const imgData=ctx.getImageData(0,0,canvas.width,canvas.height);
  const code=window.jsQR(imgData.data,imgData.width,imgData.height);
  if(code && code.data){
    const found=S.items.find(i=>i.code.toLowerCase()===code.data.trim().toLowerCase());
    stopXuatScan();
    if(found) openXuatModal(found); else toast('Không tìm thấy mã "'+code.data+'"');
    return;
  }
  xuatCamRAF=requestAnimationFrame(scanXuatLoop);
}

export function stopXuatScan(){
  if(xuatCamRAF) cancelAnimationFrame(xuatCamRAF);
  xuatCamRAF=null;
  if(xuatCamStream){ xuatCamStream.getTracks().forEach(t=>t.stop()); xuatCamStream=null; }
  const wrap=document.getElementById('xuatCameraWrap'); if(wrap) wrap.classList.remove('on');
  const btn=document.getElementById('xuatCamBtn'); if(btn) btn.textContent='📷 Quét QR';
}

/* ================= INVENTORY ================= */

export async function toggleCamera(){
  const wrap=document.getElementById('cameraWrap');
  if(S.scanStream){ stopScan(); return; }
  if(!window.jsQR){ toast('Thư viện quét QR chưa tải xong — thử tải lại trang (Ctrl+Shift+R).'); return; }
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){ toast('Trình duyệt này không hỗ trợ camera.'); return; }
  try{
    const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}}});
    S.scanStream=stream;
    const video=document.getElementById('camVideo');
    video.srcObject=stream; await video.play();
    wrap.classList.add('on');
    document.getElementById('camBtn').textContent='⏹ Tắt camera';
    scanLoop();
  }catch(err){
    toast('Không truy cập được camera: '+(err&&err.message?err.message:'không rõ lỗi'));
  }
}

export function scanLoop(){
  const video=document.getElementById('camVideo'), canvas=document.getElementById('camCanvas');
  if(!video||!canvas){return;}
  if(video.readyState===video.HAVE_ENOUGH_DATA && window.jsQR){
    canvas.width=video.videoWidth; canvas.height=video.videoHeight;
    const ctx=canvas.getContext('2d');
    ctx.drawImage(video,0,0,canvas.width,canvas.height);
    const imgData=ctx.getImageData(0,0,canvas.width,canvas.height);
    const code=window.jsQR(imgData.data,imgData.width,imgData.height);
    if(code && code.data){
      applyScanCode(code.data.trim());
      toast('Đã quét: '+code.data.trim());
      stopScan();
      return;
    }
  }
  S.scanRAF=requestAnimationFrame(scanLoop);
}

export function stopScan(){
  if(S.scanRAF) cancelAnimationFrame(S.scanRAF);
  if(S.scanStream){ S.scanStream.getTracks().forEach(t=>t.stop()); S.scanStream=null; }
  const wrap=document.getElementById('cameraWrap'); if(wrap) wrap.classList.remove('on');
  const btn=document.getElementById('camBtn'); if(btn) btn.textContent='📷 Bật camera quét';
}
