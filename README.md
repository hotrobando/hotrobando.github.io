# 🗺️ Hỗ Trợ Bản Đồ — VN2000 / Lat-Lng

Trang web tĩnh cho phép nhập tọa độ thửa đất (hệ VN2000 trên sổ đỏ hoặc Lat/Lng
chuẩn WGS84) và vẽ ranh giới lên bản đồ. Có công cụ tự vẽ polygon / rectangle /
đường đo, đặt tên, lưu trong trình duyệt (localStorage) và chia sẻ qua link.

Chạy hoàn toàn phía client, không cần server, deploy thẳng lên **GitHub Pages**
(https://hotrobando.github.io/).

## Tính năng

- **Tìm địa chỉ**: ô tìm kiếm trong sidebar, dùng Nominatim (OpenStreetMap) —
  miễn phí, không cần API key. Ưu tiên kết quả ở Việt Nam, bấm kết quả để bay
  tới và đặt ghim (màu tím). Chỉ gọi khi bấm Tìm / Enter để tôn trọng giới hạn
  của Nominatim.

- **Nhập VN2000**: dán nhiều điểm `X Y` như trên sổ đỏ, chọn tỉnh (tự điền kinh
  tuyến trục) và múi chiếu (3° / 6°), tự chuyển sang Lat/Lng và vẽ.
- **Hướng dẫn VN2000**: nút `?` mở bảng giải thích kinh tuyến trục / múi chiếu
  là gì và cách chọn đúng (vì sổ đỏ thường không ghi).
- **Nhập Lat/Lng (WGS84)**: dán nhiều điểm `Lat Lng`.
- **Tự vẽ + đo đạc**: công cụ Polygon, Rectangle và Đường đo (Line) ở thanh
  nổi đầu bản đồ. Khi bắt đầu vẽ có dải hướng dẫn hiện ra:
  - **Đường / Vùng**: bấm từng điểm, **bấm đúp (double-click)** vào điểm cuối để
    kết thúc và lưu. Phím **Esc** để hủy.
  - **Hình chữ nhật**: bấm một góc rồi bấm góc đối diện.
- **Số đo dạng tooltip**: rê chuột lên một đường/thửa để xem tooltip số đo, thay
  vì in chi chít lên bản đồ:
  - **Đường**: tổng chiều dài + độ dài **từng đoạn**.
  - **Vùng/Hình chữ nhật**: **diện tích** (m² / ha / km²), chu vi + độ dài
    **từng cạnh**.
  - Trên bản đồ chỉ hiển thị tên thửa (gọn), với màu nổi bật và viền trắng để dễ
    nhìn trên cả nền Đơn giản lẫn Vệ tinh.
- **Vị trí hiện tại**: nút định vị, ghim vị trí người dùng kèm vòng tròn độ
  chính xác (dùng Geolocation của trình duyệt, cần HTTPS).
- **Điều khiển kiểu Google Maps**: cụm nút nổi ở góc phải-dưới gồm nút **lớp bản
  đồ** (icon layers, mở menu chọn Đơn giản / Vệ tinh có ô màu xem trước), nút
  **định vị**, và cụm **zoom +/−**. Lựa chọn nền được ghi nhớ.
- **Chia sẻ qua link**:
  - Nút "Chia sẻ" tạo link chứa **toàn bộ** thửa.
  - Bấm 🔗 ở từng dòng để chia sẻ **riêng một thửa**.
  - Dữ liệu mã hóa trong param `?d=` (base64url). Người nhận mở link sẽ được hỏi,
    và chỉ những thửa **chưa có** trên máy họ mới được thêm vào (so khớp theo
    tên + hình dạng, tránh trùng lặp).
- **Panel thu gọn + ghim**: bảng điều khiển bên trái mở/đóng được, mặc định
  đóng để ưu tiên bản đồ. Nút 📌 **ghim** để giữ panel luôn mở khi nhập liệu
  (nhớ trong localStorage); bỏ ghim thì panel **tự thu lại** khi rời chuột (trừ
  lúc đang gõ trong ô nhập). Giao diện responsive cho mobile, tông **sáng** xanh.
- **Quản lý**: đặt tên, đổi tên, xóa, phóng tới từng thửa.
- **Lưu trữ**: tự lưu vào `localStorage`, còn nguyên khi mở lại.
- **Xuất GeoJSON**.
- **SEO**: có đủ title/description/keywords, Open Graph, Twitter Card và dữ liệu
  có cấu trúc (JSON-LD) để Google lập chỉ mục tốt.

## Thư viện (qua CDN, miễn phí)

- [OpenLayers 9](https://openlayers.org/) — bản đồ + vẽ + reprojection.
- [proj4js](https://proj4js.org/) — chuyển hệ tọa độ VN2000 → WGS84.
- Bản đồ nền: OpenStreetMap (Đơn giản) và Esri World Imagery (Vệ tinh) — đều
  miễn phí, HTTPS, không cần API key.

> Ghi chú: "Leaflet" là một thư viện bản đồ khác (giống OpenLayers), không phải
> một kiểu bản đồ. Kiểu hiển thị phụ thuộc vào *tile nền* chứ không phải thư
> viện, nên dự án vẫn dùng OpenLayers và chỉ đổi nguồn tile nền.

## Chạy thử cục bộ

Mở `index.html` trực tiếp bằng trình duyệt là được. Hoặc chạy một server tĩnh:

```bash
python -m http.server 8000
# rồi mở http://localhost:8000
```

## Deploy lên GitHub Pages

1. Tạo repo trên GitHub rồi push toàn bộ thư mục này lên nhánh `main`.
2. Vào **Settings → Pages**.
3. Mục **Build and deployment → Source** chọn **Deploy from a branch**.
4. Chọn branch `main`, thư mục `/ (root)`, bấm **Save**.
5. Đợi ~1 phút, trang sẽ có tại `https://<tên-user>.github.io/<tên-repo>/`.

File `.nojekyll` đã có sẵn để GitHub Pages phục vụ tệp tĩnh trực tiếp.

### Ghi chú SEO

Các thẻ `canonical`, `og:url`, `og:image` trong `index.html` đã trỏ tới
`https://hotrobando.github.io/` (repo dạng user/organization pages, chạy ở gốc
domain). Nếu bạn đặt trang trong một repo con (ví dụ `/mymap/`), nhớ thêm đường
dẫn đó vào các URL này. Nên thêm ảnh `preview.png` (1200×630) đặt ở gốc để link
chia sẻ trên Facebook/Zalo có hình xem trước.

## ⚠️ Lưu ý về độ chính xác VN2000

- Tọa độ trên sổ đỏ theo quy ước **X = tung độ (Bắc/northing)**, **Y = hoành độ
  (Đông/easting)** — nhập đúng thứ tự `X Y` mỗi dòng.
- **Kinh tuyến trục khác nhau theo từng tỉnh.** Chọn sai tỉnh/kinh tuyến trục sẽ
  làm thửa lệch vị trí. Danh sách kinh tuyến trục theo tỉnh (múi 3°) đã nạp sẵn,
  dựa trên quy định địa phương VN2000; nếu tỉnh của bạn dùng giá trị khác, chọn
  "— Tùy chỉnh —" và nhập tay.
- Phép chuyển dùng tham số 7 (towgs84) VN2000→WGS84. Sai số cỡ mét là bình
  thường; nếu cần độ chính xác trắc địa cao hãy đối chiếu phần mềm chuyên dụng.

## Cấu trúc

```
index.html            — giao diện
style.css             — giao diện
app.js                — toàn bộ logic (bản đồ, chuyển tọa độ, vẽ, lưu trữ)
favicon.svg           — icon vector (ghim bản đồ)
favicon-32.png        — favicon PNG
apple-touch-icon.png  — icon khi "Thêm vào màn hình chính" trên iOS (180×180)
icon-192/512.png      — icon PWA
manifest.webmanifest  — khai báo PWA (tên, màu, icon)
```

> Icon là hình ghim bản đồ gradient xanh lá trên nền xanh rêu. Nếu muốn đổi,
> sửa `favicon.svg` rồi render lại các PNG (dùng `sharp` hoặc công cụ bất kỳ)
> với các kích thước 32/180/192/512.
