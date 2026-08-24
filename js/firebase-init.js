/* ================= FIREBASE CONFIG =================
   1. Vào https://console.firebase.google.com -> tạo dự án mới.
   2. Trong dự án, vào "Build" > "Firestore Database" > "Create database"
      (chọn chế độ Production hoặc Test tuỳ nhu cầu).
   3. Vào Project settings (icon bánh răng) > tab "General" > mục
      "Your apps" > bấm icon </> (Web) để tạo 1 Web App.
   4. Firebase sẽ cho bạn 1 đoạn cấu hình dạng firebaseConfig = {...}
      -> copy và dán đè vào object bên dưới.

   LƯU Ý QUAN TRỌNG: đây là script cổ điển (không phải module), chạy TRƯỚC
   các <script type="module"> khác. Vì module JS không đọc được biến const/let
   của 1 script cổ điển khác, nên ở đây phải gán rõ ràng vào window.db và
   window.FB_COLLECTION để js/data.js (module) đọc lại được.
====================================================== */
const firebaseConfig = {
  apiKey: "AIzaSyDa8nngf0HhSOtthRaPEUZ11SD6WjzyeJw",
  authDomain: "spare-part-dashboard.firebaseapp.com",
  projectId: "spare-part-dashboard",
  storageBucket: "spare-part-dashboard.firebasestorage.app",
  messagingSenderId: "670177227120",
  appId: "1:670177227120:web:80acdcc5fd02cbe620dfb5"
};

firebase.initializeApp(firebaseConfig);
window.db = firebase.firestore();
/* Tên collection lưu dữ liệu trên Firestore — có thể đổi tuỳ ý */
window.FB_COLLECTION = 'sparePartDashboard';
