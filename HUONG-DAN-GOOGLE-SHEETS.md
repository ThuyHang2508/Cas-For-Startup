# Kết nối CRM với Google Sheets

## 1. Tạo Google Sheet

Tạo một Google Sheet trống, ví dụ: `CRM CAS for Startup`.

## 2. Thêm Apps Script

Trong Google Sheet, chọn **Tiện ích mở rộng → Apps Script**.

Xoá nội dung mặc định trong trình soạn thảo, sau đó sao chép toàn bộ nội dung file `google-apps-script.gs` của dự án vào và bấm **Lưu**.

## 3. Triển khai Web App

1. Chọn **Triển khai → Lần triển khai mới**.
2. Chọn loại **Ứng dụng web**.
3. **Thực thi với tư cách:** Tôi.
4. **Ai có quyền truy cập:** Bất kỳ ai.
5. Chọn **Triển khai** và cấp quyền khi Google yêu cầu.
6. Sao chép URL có dạng `https://script.google.com/macros/s/.../exec`.

## 4. Kết nối URL với CRM

Mở file `sheets-config.js` và dán URL vào:

```js
window.CAS_SHEETS_URL = 'https://script.google.com/macros/s/URL_CUA_BAN/exec';
```

Lưu file rồi tải lại `sheets-config.js` lên hosting cùng các file của website.

## 5. Kiểm tra

1. Mở website CRM.
2. Dòng trạng thái phải hiện `Đã kết nối Google Sheets`.
3. Thêm hoặc sửa một khách hàng.
4. Mở Google Sheet và kiểm tra tab `Customers`.
5. Mở website bằng một trình duyệt hoặc thiết bị khác để xác nhận dữ liệu dùng chung.

## Lưu ý

- Không đổi tên hoặc xoá hàng tiêu đề trong tab `Customers`.
- Khi sửa mã Apps Script, cần tạo **phiên bản triển khai mới** để thay đổi có hiệu lực.
- Chỉ chia sẻ URL CRM cho người được phép xem hoặc chỉnh sửa dữ liệu.

