/* ===== state.js (tu dong tach tu main.js, khong doi logic) ===== */
export const S = {
  meta:null, items:[], tx:[], activeTab:'overview',
  lastUsed:{whId:null, userId:null},
  scanStream:null, scanRAF:null,
  ready:false,
  currentUser:null,
  txHidden:[]
};

export const ADMIN_ID = '26508846';

/* ================= AUTH (lưu trên thiết bị, không cần mật khẩu) ================= */

export let updState = {code:'', type:'xuat', whId:null, lineId:null, userId:null, qty:1, matched:null};

export let importState = {rows:[], fileName:''};

/* uiState.updSubTab: bien string khong the export truc tiep qua module boundary
   (khong the gan lai binding tu module khac), nen bọc trong object de mutate property */
export const uiState = { updSubTab: 'quick' };
