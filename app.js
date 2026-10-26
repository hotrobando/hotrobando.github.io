/* =========================================================================
 * Bản đồ thửa đất - VN2000 / Lat-Lng
 * OpenLayers 9 + proj4
 * ========================================================================= */

(function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   * 1. HỆ TỌA ĐỘ VN2000
   *
   * VN2000 dùng phép chiếu Transverse Mercator trên ellipsoid WGS84.
   * - Múi 3°: hệ số tỷ lệ k0 = 0.9999
   * - Múi 6°: hệ số tỷ lệ k0 = 0.9996
   * - False easting = 500000, false northing = 0
   * - Kinh tuyến trục (lon_0) thay đổi theo từng tỉnh.
   *
   * Ta đăng ký động một projection "VN2000" mỗi khi người dùng đổi
   * kinh tuyến trục / múi, rồi reproject sang EPSG:4326 (lon/lat).
   * ------------------------------------------------------------------ */

  // Kinh tuyến trục múi 3° phổ biến theo tỉnh (Thông tư 973/2001/TT-TCĐC).
  // value = kinh tuyến trục (độ). Nguồn: quy định KTT địa phương VN2000.
  var PROVINCES = [
    { name: '— Tùy chỉnh —', lon: null },
    { name: 'Hà Nội', lon: 105 },
    { name: 'TP. Hồ Chí Minh', lon: 105.75 },
    { name: 'Hải Phòng', lon: 105.75 },
    { name: 'Đà Nẵng', lon: 107.75 },
    { name: 'Cần Thơ', lon: 105 },
    { name: 'An Giang', lon: 104.75 },
    { name: 'Bà Rịa - Vũng Tàu', lon: 107.75 },
    { name: 'Bắc Giang', lon: 107 },
    { name: 'Bắc Kạn', lon: 106.5 },
    { name: 'Bạc Liêu', lon: 105 },
    { name: 'Bắc Ninh', lon: 105.5 },
    { name: 'Bến Tre', lon: 105.75 },
    { name: 'Bình Dương', lon: 105.75 },
    { name: 'Bình Định', lon: 108.25 },
    { name: 'Bình Phước', lon: 106.25 },
    { name: 'Bình Thuận', lon: 108.5 },
    { name: 'Cà Mau', lon: 104.5 },
    { name: 'Cao Bằng', lon: 105.75 },
    { name: 'Đắk Lắk', lon: 108.5 },
    { name: 'Đắk Nông', lon: 108.5 },
    { name: 'Điện Biên', lon: 103 },
    { name: 'Đồng Nai', lon: 107.75 },
    { name: 'Đồng Tháp', lon: 105 },
    { name: 'Gia Lai', lon: 108.5 },
    { name: 'Hà Giang', lon: 105.5 },
    { name: 'Hà Nam', lon: 105 },
    { name: 'Hà Tĩnh', lon: 105.5 },
    { name: 'Hải Dương', lon: 105.5 },
    { name: 'Hậu Giang', lon: 105 },
    { name: 'Hòa Bình', lon: 106 },
    { name: 'Hưng Yên', lon: 105.5 },
    { name: 'Khánh Hòa', lon: 108.25 },
    { name: 'Kiên Giang', lon: 104.5 },
    { name: 'Kon Tum', lon: 107.5 },
    { name: 'Lai Châu', lon: 103 },
    { name: 'Lâm Đồng', lon: 107.75 },
    { name: 'Lạng Sơn', lon: 107.25 },
    { name: 'Lào Cai', lon: 104.75 },
    { name: 'Long An', lon: 105.75 },
    { name: 'Nam Định', lon: 105.5 },
    { name: 'Nghệ An', lon: 104.75 },
    { name: 'Ninh Bình', lon: 105 },
    { name: 'Ninh Thuận', lon: 108.25 },
    { name: 'Phú Thọ', lon: 104.75 },
    { name: 'Phú Yên', lon: 108.5 },
    { name: 'Quảng Bình', lon: 106 },
    { name: 'Quảng Nam', lon: 107.75 },
    { name: 'Quảng Ngãi', lon: 108 },
    { name: 'Quảng Ninh', lon: 107.75 },
    { name: 'Quảng Trị', lon: 106.25 },
    { name: 'Sóc Trăng', lon: 105.5 },
    { name: 'Sơn La', lon: 104 },
    { name: 'Tây Ninh', lon: 105.5 },
    { name: 'Thái Bình', lon: 105.5 },
    { name: 'Thái Nguyên', lon: 106.5 },
    { name: 'Thanh Hóa', lon: 105 },
    { name: 'Thừa Thiên Huế', lon: 107 },
    { name: 'Tiền Giang', lon: 105.75 },
    { name: 'Trà Vinh', lon: 105.5 },
    { name: 'Tuyên Quang', lon: 106 },
    { name: 'Vĩnh Long', lon: 105.5 },
    { name: 'Vĩnh Phúc', lon: 105 },
    { name: 'Yên Bái', lon: 104.75 }
  ];

  var VN2000_CODE = 'VN2000-LOCAL';

  // Đăng ký / cập nhật projection VN2000 theo KTT + múi hiện tại.
  function registerVN2000(lon0, zoneDeg) {
    var k0 = zoneDeg === 6 ? 0.9996 : 0.9999;
    var def = '+proj=tmerc +lat_0=0 +lon_0=' + lon0 +
      ' +k=' + k0 +
      ' +x_0=500000 +y_0=0 +ellps=WGS84' +
      ' +towgs84=-191.90441429,-39.30318279,-111.45032835,' +
      '0.00928836,-0.01975479,0.00427372,0.252906278' +
      ' +units=m +no_defs';
    proj4.defs(VN2000_CODE, def);
    if (window.ol && ol.proj && ol.proj.proj4) {
      ol.proj.proj4.register(proj4);
    }
  }

  /* ------------------------------------------------------------------ *
   * 2. KHỞI TẠO BẢN ĐỒ
   * ------------------------------------------------------------------ */

  var vectorSource = new ol.source.Vector();

  var vectorLayer = new ol.layer.Vector({
    source: vectorSource,
    style: styleFunction
  });

  /* ---- Các lớp bản đồ nền (basemap) ----
   * Đều miễn phí, HTTPS, KHÔNG cần API key:
   *  - simple    : OpenStreetMap gốc (đơn giản, thông dụng).
   *  - satellite : ảnh vệ tinh Esri World Imagery (free, chỉ cần attribution).
   */
  var ESRI_ATTR =
    'Ảnh: © <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics';

  var baseLayers = {
    simple: new ol.layer.Tile({
      visible: true,
      source: new ol.source.OSM({
        url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      })
    }),
    satellite: new ol.layer.Tile({
      visible: false,
      source: new ol.source.XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attributions: ESRI_ATTR,
        maxZoom: 19,
        crossOrigin: 'anonymous'
      })
    })
  };

  var map = new ol.Map({
    target: 'map',
    // Bỏ nút zoom mặc định (góc trái-trên); ta tự đặt cụm điều khiển
    // kiểu Google Maps ở góc phải-dưới. Giữ attribution.
    controls: ol.control.defaults.defaults({ zoom: false }),
    layers: [baseLayers.simple, baseLayers.satellite, vectorLayer],
    view: new ol.View({
      center: ol.proj.fromLonLat([105.85, 21.02]), // Hà Nội
      zoom: 13
    })
  });

  // Chọn nền bản đồ, nhớ lựa chọn trong localStorage.
  var BASEMAP_KEY = 'mymap.basemap.v1';
  function setBasemap(key) {
    if (!baseLayers[key]) key = 'simple';
    Object.keys(baseLayers).forEach(function (k) {
      baseLayers[k].setVisible(k === key);
    });
    localStorage.setItem(BASEMAP_KEY, key);
    // đánh dấu lựa chọn đang chọn trong menu layers
    var opts = document.querySelectorAll('#layers-menu .layer-opt');
    for (var i = 0; i < opts.length; i++) {
      opts[i].classList.toggle('active', opts[i].getAttribute('data-basemap') === key);
    }
  }
  var savedBasemap = localStorage.getItem(BASEMAP_KEY) || 'simple';

  /* ---- Cụm điều khiển góc phải-dưới (layers / định vị / zoom) ---- */
  var layersBtn = document.getElementById('layers-btn');
  var layersMenu = document.getElementById('layers-menu');
  if (layersBtn && layersMenu) {
    layersBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = layersMenu.hidden;
      layersMenu.hidden = !open;
      layersBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      layersBtn.classList.toggle('active', open);
    });
    layersMenu.querySelectorAll('.layer-opt').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setBasemap(btn.getAttribute('data-basemap'));
        layersMenu.hidden = true;
        layersBtn.setAttribute('aria-expanded', 'false');
        layersBtn.classList.remove('active');
      });
    });
    // bấm ra ngoài -> đóng menu
    document.addEventListener('click', function (e) {
      if (!layersMenu.hidden && !document.getElementById('layers-wrap').contains(e.target)) {
        layersMenu.hidden = true;
        layersBtn.setAttribute('aria-expanded', 'false');
        layersBtn.classList.remove('active');
      }
    });
  }
  setBasemap(savedBasemap);

  // Zoom +/- với hiệu ứng mượt.
  function zoomBy(delta) {
    var view = map.getView();
    var z = view.getZoom();
    view.animate({ zoom: Math.round(z) + delta, duration: 200 });
  }
  var zi = document.getElementById('zoom-in');
  var zo = document.getElementById('zoom-out');
  if (zi) zi.addEventListener('click', function () { zoomBy(1); });
  if (zo) zo.addEventListener('click', function () { zoomBy(-1); });

  /* ---- Định dạng số đo ---- */
  function formatLength(m) {
    return m >= 1000 ? (m / 1000).toFixed(2) + ' km' : m.toFixed(1) + ' m';
  }
  function formatArea(m2) {
    if (m2 >= 1e6) return (m2 / 1e6).toFixed(2) + ' km²';
    if (m2 >= 10000) return (m2 / 10000).toFixed(2) + ' ha';
    return m2.toFixed(1) + ' m²';
  }

  // Màu tương phản cao, ít trùng với tile nền (OSM/vệ tinh):
  var LINE_COLOR = '#e11d74';    // hồng sen đậm cho đường đo
  var POLY_COLOR = '#1d4ed8';    // xanh dương đậm cho vùng/hình
  var CASING = 'rgba(255,255,255,0.9)'; // viền trắng tách khỏi nền

  // Đo độ dài của một đoạn [a,b] (tọa độ 3857) theo mét trên mặt cầu.
  function segmentLength(a3857, b3857) {
    return ol.sphere.getLength(new ol.geom.LineString([a3857, b3857]));
  }

  // Nhãn tên gọn (không in số đo lên bản đồ để tránh rối; số đo nằm ở tooltip).
  function nameLabel(name, coord3857, color) {
    return new ol.style.Style({
      geometry: new ol.geom.Point(coord3857),
      text: new ol.style.Text({
        text: name,
        font: 'bold 12px "Segoe UI", sans-serif',
        fill: new ol.style.Fill({ color: color }),
        stroke: new ol.style.Stroke({ color: '#ffffff', width: 3 }),
        overflow: true
      })
    });
  }

  function styleFunction(feature) {
    var geom = feature.getGeometry();
    var type = geom ? geom.getType() : '';
    var name = feature.get('name') || '';
    var styles = [];

    if (type === 'LineString') {
      // casing trắng rộng + nét màu nổi phía trên
      styles.push(new ol.style.Style({
        stroke: new ol.style.Stroke({ color: CASING, width: 6 })
      }));
      styles.push(new ol.style.Style({
        stroke: new ol.style.Stroke({ color: LINE_COLOR, width: 3 })
      }));
      if (name) {
        var cs = geom.getCoordinates();
        styles.push(nameLabel(name, cs[Math.floor(cs.length / 2)], LINE_COLOR));
      }
      return styles;
    }

    if (type === 'Polygon') {
      styles.push(new ol.style.Style({
        stroke: new ol.style.Stroke({ color: CASING, width: 5 })
      }));
      styles.push(new ol.style.Style({
        stroke: new ol.style.Stroke({ color: POLY_COLOR, width: 2.5 }),
        fill: new ol.style.Fill({ color: 'rgba(29, 78, 216, 0.16)' })
      }));
      if (name) {
        var c = geom.getInteriorPoint().getCoordinates();
        styles.push(nameLabel(name, [c[0], c[1]], POLY_COLOR));
      }
      return styles;
    }

    // Loại khác (ví dụ Point)
    return new ol.style.Style({
      stroke: new ol.style.Stroke({ color: POLY_COLOR, width: 2.5 }),
      fill: new ol.style.Fill({ color: 'rgba(29, 78, 216, 0.16)' }),
      text: name ? new ol.style.Text({
        text: name,
        font: '13px "Segoe UI", sans-serif',
        fill: new ol.style.Fill({ color: POLY_COLOR }),
        stroke: new ol.style.Stroke({ color: '#ffffff', width: 3 })
      }) : undefined
    });
  }

  // Dựng nội dung HTML cho tooltip số đo của một feature.
  // Lấy dãy đỉnh "nối tiếp" của một geometry để chia đoạn:
  //  - LineString: chính các đỉnh.
  //  - Polygon   : vòng ngoài (đã đóng).
  function segmentVertices(geom) {
    var type = geom.getType();
    if (type === 'LineString') return geom.getCoordinates();
    if (type === 'Polygon') return geom.getLinearRing(0).getCoordinates();
    return null;
  }

  // Khoảng cách (bình phương) từ điểm p tới đoạn [a,b], trong đơn vị chiếu.
  function distToSegmentSq(p, a, b) {
    var dx = b[0] - a[0], dy = b[1] - a[1];
    var len2 = dx * dx + dy * dy;
    var t = len2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    var cx = a[0] + t * dx, cy = a[1] + t * dy;
    var ex = p[0] - cx, ey = p[1] - cy;
    return ex * ex + ey * ey;
  }

  // Chỉ số đoạn/cạnh gần điểm 'coord' (tọa độ bản đồ) nhất; -1 nếu không có.
  function nearestSegmentIndex(geom, coord) {
    var verts = segmentVertices(geom);
    if (!verts || verts.length < 2) return -1;
    var best = -1, bestD = Infinity;
    for (var i = 0; i < verts.length - 1; i++) {
      var d = distToSegmentSq(coord, verts[i], verts[i + 1]);
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }

  // activeIdx: chỉ số đoạn/cạnh đang được trỏ -> in đậm trong danh sách.
  function measureTooltipHTML(feature, activeIdx) {
    var geom = feature.getGeometry();
    var type = geom ? geom.getType() : '';
    var name = feature.get('name') || '';
    if (activeIdx == null) activeIdx = -1;
    var html = '';
    if (name) html += '<div class="mt-name">' + escapeHtml(name) + '</div>';

    if (type === 'LineString') {
      var coords = geom.getCoordinates();
      var total = ol.sphere.getLength(geom);
      html += '<div class="mt-head">Tổng chiều dài: <b>' + formatLength(total) + '</b></div>';
      html += '<div class="mt-sub">' + (coords.length - 1) + ' đoạn:</div><ul class="mt-list">';
      for (var i = 0; i < coords.length - 1; i++) {
        var cls = i === activeIdx ? ' class="mt-active"' : '';
        html += '<li' + cls + '>Đoạn ' + (i + 1) + ': ' + formatLength(segmentLength(coords[i], coords[i + 1])) + '</li>';
      }
      html += '</ul>';
      return html;
    }

    if (type === 'Polygon') {
      var ring = geom.getLinearRing(0).getCoordinates();
      var area = ol.sphere.getArea(geom);
      var perimeter = ol.sphere.getLength(geom);
      html += '<div class="mt-head">Diện tích: <b>' + formatArea(area) + '</b></div>';
      html += '<div class="mt-head">Chu vi: <b>' + formatLength(perimeter) + '</b></div>';
      html += '<div class="mt-sub">' + (ring.length - 1) + ' cạnh:</div><ul class="mt-list">';
      for (var j = 0; j < ring.length - 1; j++) {
        var cls2 = j === activeIdx ? ' class="mt-active"' : '';
        html += '<li' + cls2 + '>Cạnh ' + (j + 1) + ': ' + formatLength(segmentLength(ring[j], ring[j + 1])) + '</li>';
      }
      html += '</ul>';
      return html;
    }
    return html || '(không có số đo)';
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---- Tooltip số đo + tô đậm đoạn đang trỏ ---- */
  var measureTooltipEl = document.getElementById('measure-tooltip');
  var hoveredId = null;   // feature đang hiển thị tooltip
  var hoveredSeg = -1;    // đoạn/cạnh đang trỏ

  // Layer tô đậm đoạn đang trỏ (vẽ đè lên feature).
  var highlightFeature = new ol.Feature();
  var highlightLayer = new ol.layer.Vector({
    source: new ol.source.Vector({ features: [highlightFeature] }),
    style: new ol.style.Style({
      stroke: new ol.style.Stroke({ color: '#ffd400', width: 7, lineCap: 'round' })
    }),
    zIndex: 5
  });
  map.addLayer(highlightLayer);

  function clearHover() {
    measureTooltipEl.hidden = true;
    hoveredId = null;
    hoveredSeg = -1;
    highlightFeature.setGeometry(undefined);
    map.getTargetElement().style.cursor = '';
  }

  map.on('pointermove', function (evt) {
    if (evt.dragging || drawInteraction) { // đang kéo bản đồ hoặc đang vẽ -> ẩn
      clearHover();
      return;
    }
    var hit = null;
    map.forEachFeatureAtPixel(evt.pixel, function (f, layer) {
      if (layer === vectorLayer && !hit) hit = f;
    }, { hitTolerance: 4 });

    if (!hit) { clearHover(); return; }

    var geom = hit.getGeometry();
    var id = hit.getId() || '_';
    var segIdx = nearestSegmentIndex(geom, evt.coordinate);

    // Chỉ dựng lại HTML khi đổi feature hoặc đổi đoạn (tránh vẽ lại liên tục).
    if (id !== hoveredId || segIdx !== hoveredSeg) {
      measureTooltipEl.innerHTML = measureTooltipHTML(hit, segIdx);
      hoveredId = id;
      hoveredSeg = segIdx;

      // cập nhật đoạn tô đậm trên bản đồ
      var verts = segmentVertices(geom);
      if (verts && segIdx >= 0 && segIdx < verts.length - 1) {
        highlightFeature.setGeometry(new ol.geom.LineString([verts[segIdx], verts[segIdx + 1]]));
      } else {
        highlightFeature.setGeometry(undefined);
      }
    }

    measureTooltipEl.style.left = evt.pixel[0] + 'px';
    measureTooltipEl.style.top = evt.pixel[1] + 'px';
    measureTooltipEl.hidden = false;
    map.getTargetElement().style.cursor = 'pointer';
  });

  // rời khỏi bản đồ -> ẩn tooltip + bỏ tô đậm
  map.getViewport().addEventListener('mouseout', clearHover);

  /* ------------------------------------------------------------------ *
   * 3. TIỆN ÍCH
   * ------------------------------------------------------------------ */

  var toastEl = document.getElementById('toast');
  var toastTimer = null;
  function toast(msg, isError) {
    toastEl.textContent = msg;
    toastEl.className = 'show' + (isError ? ' error' : '');
    clearTimeout(toastTimer);
    // thông điệp dài (vd hướng dẫn cấp quyền) hiển thị lâu hơn
    var dur = Math.min(9000, Math.max(2800, msg.length * 70));
    toastTimer = setTimeout(function () { toastEl.className = ''; }, dur);
  }

  // Tách text nhiều dòng thành mảng cặp số [a, b].
  // Chấp nhận ngăn cách bằng space, tab, phẩy, chấm phẩy.
  function parsePairs(text) {
    var pairs = [];
    var lines = text.split(/\r?\n/);
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;
      var parts = line.split(/[\s,;]+/).filter(Boolean);
      if (parts.length < 2) {
        throw new Error('Dòng ' + (i + 1) + ' không đủ 2 giá trị: "' + line + '"');
      }
      var a = parseFloat(parts[0]);
      var b = parseFloat(parts[1]);
      if (isNaN(a) || isNaN(b)) {
        throw new Error('Dòng ' + (i + 1) + ' chứa giá trị không hợp lệ: "' + line + '"');
      }
      pairs.push([a, b]);
    }
    return pairs;
  }

  // Thêm feature polygon (ring = mảng [lon,lat]) vào bản đồ.
  // autoSave = lưu luôn vào localStorage.
  function addPolygonFromLonLat(ring, name, opts) {
    opts = opts || {};
    if (ring.length < 3) {
      throw new Error('Cần ít nhất 3 điểm để tạo vùng.');
    }
    // Đóng vòng nếu chưa đóng.
    var first = ring[0], last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      ring = ring.concat([first]);
    }
    var coords3857 = ring.map(function (c) {
      return ol.proj.fromLonLat(c);
    });
    var feature = new ol.Feature({
      geometry: new ol.geom.Polygon([coords3857]),
      name: name || 'Thửa không tên'
    });
    feature.setId(opts.id || genId());
    vectorSource.addFeature(feature);

    if (opts.zoom !== false) {
      map.getView().fit(feature.getGeometry().getExtent(), {
        padding: [60, 60, 60, 60],
        maxZoom: 19,
        duration: 400
      });
    }
    if (opts.save !== false) {
      saveFeature(feature);
    }
    return feature;
  }

  function genId() {
    return 'f_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  }

  /* ------------------------------------------------------------------ *
   * 4. LƯU TRỮ localStorage
   * ------------------------------------------------------------------ */

  var STORAGE_KEY = 'mymap.features.v1';
  var geojsonFormat = new ol.format.GeoJSON();

  function loadFromStorage() {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      var fc = JSON.parse(raw);
      var features = geojsonFormat.readFeatures(fc, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      });
      vectorSource.addFeatures(features);
    } catch (e) {
      console.error('Không đọc được dữ liệu đã lưu:', e);
    }
    renderSavedList();
  }

  function persistAll() {
    var fc = geojsonFormat.writeFeaturesObject(vectorSource.getFeatures(), {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fc));
    renderSavedList();
  }

  function saveFeature() {
    // Mọi feature trên source đều được lưu. Gọi persist toàn bộ cho đơn giản
    // và nhất quán (tránh lệch giữa bản đồ và localStorage).
    persistAll();
  }

  function renderSavedList() {
    var list = document.getElementById('saved-list');
    var countEl = document.getElementById('saved-count');
    var features = vectorSource.getFeatures();
    countEl.textContent = features.length;
    list.innerHTML = '';

    features.forEach(function (f) {
      var li = document.createElement('li');

      var nameSpan = document.createElement('span');
      nameSpan.className = 'name';
      nameSpan.textContent = f.get('name') || 'Thửa không tên';
      nameSpan.title = 'Click để phóng tới thửa này';
      nameSpan.onclick = function () {
        map.getView().fit(f.getGeometry().getExtent(), {
          padding: [60, 60, 60, 60], maxZoom: 19, duration: 400
        });
      };

      var renameBtn = document.createElement('button');
      renameBtn.className = 'mini ghost';
      renameBtn.textContent = '✎';
      renameBtn.title = 'Đổi tên';
      renameBtn.onclick = function () {
        var newName = prompt('Tên mới:', f.get('name') || '');
        if (newName !== null && newName.trim()) {
          f.set('name', newName.trim());
          persistAll();
        }
      };

      var shareBtn = document.createElement('button');
      shareBtn.className = 'mini ghost';
      shareBtn.textContent = '🔗';
      shareBtn.title = 'Chia sẻ riêng thửa này';
      shareBtn.onclick = function () {
        shareFeatures([f], '"' + (f.get('name') || 'thửa') + '"');
      };

      var delBtn = document.createElement('button');
      delBtn.className = 'mini danger';
      delBtn.textContent = '✕';
      delBtn.title = 'Xóa';
      delBtn.onclick = function () {
        vectorSource.removeFeature(f);
        persistAll();
      };

      li.appendChild(nameSpan);
      li.appendChild(shareBtn);
      li.appendChild(renameBtn);
      li.appendChild(delBtn);
      list.appendChild(li);
    });
  }

  /* ------------------------------------------------------------------ *
   * 5. NHẬP VN2000
   * ------------------------------------------------------------------ */

  var provinceSelect = document.getElementById('vn2000-province');
  var meridianInput = document.getElementById('vn2000-meridian');
  var zoneSelect = document.getElementById('vn2000-zone');

  PROVINCES.forEach(function (p, idx) {
    var opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = p.name + (p.lon !== null ? ' (' + p.lon + '°)' : '');
    provinceSelect.appendChild(opt);
  });
  provinceSelect.value = '1'; // Hà Nội mặc định

  provinceSelect.addEventListener('change', function () {
    var p = PROVINCES[parseInt(provinceSelect.value, 10)];
    if (p && p.lon !== null) {
      meridianInput.value = p.lon;
    }
  });
  // đồng bộ giá trị khởi tạo
  meridianInput.value = PROVINCES[1].lon;

  document.getElementById('vn2000-draw').addEventListener('click', function () {
    var text = document.getElementById('vn2000-input').value;
    var name = document.getElementById('vn2000-name').value.trim();
    var lon0 = parseFloat(meridianInput.value);
    var zone = parseInt(zoneSelect.value, 10);

    if (isNaN(lon0)) {
      toast('Kinh tuyến trục không hợp lệ.', true);
      return;
    }
    try {
      var pairs = parsePairs(text);           // [[X, Y], ...]  X=North, Y=East
      if (pairs.length < 3) {
        toast('Cần ít nhất 3 điểm.', true);
        return;
      }
      registerVN2000(lon0, zone);

      // Sổ đỏ: X = northing, Y = easting. proj4 cần [easting, northing] = [Y, X].
      var lonlatRing = pairs.map(function (xy) {
        var easting = xy[1];
        var northing = xy[0];
        var lonlat = proj4(VN2000_CODE, 'EPSG:4326', [easting, northing]);
        return lonlat; // [lon, lat]
      });

      addPolygonFromLonLat(lonlatRing, name || ('Thửa VN2000 ' + new Date().toLocaleTimeString()));
      toast('Đã vẽ thửa từ tọa độ VN2000.');
      document.getElementById('vn2000-name').value = '';
    } catch (e) {
      toast(e.message, true);
    }
  });

  /* ------------------------------------------------------------------ *
   * 6. NHẬP LAT/LNG
   * ------------------------------------------------------------------ */

  document.getElementById('latlng-draw').addEventListener('click', function () {
    var text = document.getElementById('latlng-input').value;
    var name = document.getElementById('latlng-name').value.trim();
    try {
      var pairs = parsePairs(text); // [[lat, lng], ...]
      if (pairs.length < 3) {
        toast('Cần ít nhất 3 điểm.', true);
        return;
      }
      // chuyển [lat, lng] -> [lon, lat]
      var ring = pairs.map(function (p) { return [p[1], p[0]]; });
      addPolygonFromLonLat(ring, name || ('Thửa LatLng ' + new Date().toLocaleTimeString()));
      toast('Đã vẽ thửa từ Lat/Lng.');
      document.getElementById('latlng-name').value = '';
    } catch (e) {
      toast(e.message, true);
    }
  });

  /* ------------------------------------------------------------------ *
   * 7. VẼ TAY (Draw interaction)
   * ------------------------------------------------------------------ */

  var drawInteraction = null;
  var activeDrawType = null;
  var drawHint = document.getElementById('draw-hint');
  var drawButtons = {
    polygon: document.getElementById('draw-polygon'),
    rectangle: document.getElementById('draw-rectangle'),
    line: document.getElementById('draw-line')
  };

  function showDrawHint(type) {
    if (!drawHint) return;
    var msg;
    if (type === 'line') {
      msg = '✏️ Đang vẽ ĐƯỜNG: bấm từng điểm. ' +
            'Bấm đúp (double-click) vào điểm cuối để KẾT THÚC và lưu. Esc để hủy.';
    } else if (type === 'polygon') {
      msg = '✏️ Đang vẽ VÙNG: bấm từng đỉnh. ' +
            'Bấm đúp (double-click) để KẾT THÚC và lưu. Esc để hủy.';
    } else {
      msg = '✏️ Đang vẽ HÌNH CHỮ NHẬT: bấm 1 góc rồi bấm góc đối diện để KẾT THÚC. Esc để hủy.';
    }
    drawHint.textContent = msg;
    drawHint.hidden = false;
  }
  function hideDrawHint() {
    if (drawHint) drawHint.hidden = true;
  }

  function stopDrawing() {
    if (drawInteraction) {
      map.removeInteraction(drawInteraction);
      drawInteraction = null;
    }
    activeDrawType = null;
    drawButtons.polygon.classList.remove('active');
    drawButtons.rectangle.classList.remove('active');
    drawButtons.line.classList.remove('active');
    hideDrawHint();
  }

  function startDrawing(type) {
    stopDrawing();
    activeDrawType = type;

    var options = { source: vectorSource };
    if (type === 'rectangle') {
      options.type = 'Circle';
      options.geometryFunction = ol.interaction.Draw.createBox();
      drawButtons.rectangle.classList.add('active');
    } else if (type === 'line') {
      options.type = 'LineString';
      drawButtons.line.classList.add('active');
    } else {
      options.type = 'Polygon';
      drawButtons.polygon.classList.add('active');
    }

    showDrawHint(type);
    drawInteraction = new ol.interaction.Draw(options);
    map.addInteraction(drawInteraction);

    drawInteraction.on('drawend', function (evt) {
      var feature = evt.feature;
      var prefix = type === 'rectangle' ? 'Hình chữ nhật '
        : type === 'line' ? 'Đường đo '
        : 'Polygon ';
      var defaultName = prefix + new Date().toLocaleTimeString();
      var promptMsg = type === 'line'
        ? 'Đặt tên cho đường vừa vẽ:'
        : 'Đặt tên cho vùng vừa vẽ:';
      var name = prompt(promptMsg, defaultName);
      feature.set('name', (name && name.trim()) || defaultName);
      feature.setId(genId());
      // feature đã được thêm vào source bởi Draw; lưu lại.
      setTimeout(function () {
        persistAll();
        toast('Đã lưu.');
      }, 0);
      stopDrawing();
    });
  }

  function makeDrawToggle(type, btn) {
    btn.addEventListener('click', function () {
      if (drawInteraction && btn.classList.contains('active')) {
        stopDrawing();
      } else {
        startDrawing(type);
      }
    });
  }
  makeDrawToggle('polygon', drawButtons.polygon);
  makeDrawToggle('rectangle', drawButtons.rectangle);
  makeDrawToggle('line', drawButtons.line);

  document.getElementById('draw-cancel').addEventListener('click', stopDrawing);

  // Nút bung/thu nhóm công cụ vẽ (chủ yếu cho mobile, nơi nhóm bị ẩn).
  var toolbarEl = document.getElementById('draw-toolbar');
  var toolsToggleBtn = document.getElementById('draw-tools-toggle');
  if (toolsToggleBtn && toolbarEl) {
    toolsToggleBtn.addEventListener('click', function () {
      var open = toolbarEl.classList.toggle('tools-open');
      toolsToggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      toolsToggleBtn.classList.toggle('active', open);
      if (!open) stopDrawing(); // thu nhóm lại thì dừng vẽ nếu đang vẽ
    });
  }

  /* ------------------------------------------------------------------ *
   * 8. XUẤT / XÓA
   * ------------------------------------------------------------------ */

  document.getElementById('export-geojson').addEventListener('click', function () {
    var features = vectorSource.getFeatures();
    if (!features.length) {
      toast('Chưa có thửa nào để xuất.', true);
      return;
    }
    var fc = geojsonFormat.writeFeaturesObject(features, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    });
    var blob = new Blob([JSON.stringify(fc, null, 2)], { type: 'application/geo+json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'thua-dat.geojson';
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('clear-all').addEventListener('click', function () {
    if (!vectorSource.getFeatures().length) return;
    if (confirm('Xóa toàn bộ thửa đã lưu?')) {
      vectorSource.clear();
      localStorage.removeItem(STORAGE_KEY);
      renderSavedList();
      toast('Đã xóa toàn bộ.');
    }
  });

  /* ------------------------------------------------------------------ *
   * 8a. CHIA SẺ QUA ĐƯỜNG LINK
   *
   * "Chia sẻ": gói các thửa hiện có thành GeoJSON, nén thành chuỗi base64url
   * (an toàn UTF-8 cho tên tiếng Việt) rồi gắn vào URL ở param ?d=...
   * Người nhận mở link: trang đọc param, hỏi xác nhận rồi nhập các thửa vào
   * localStorage của họ, sau đó dọn param khỏi thanh địa chỉ.
   * ------------------------------------------------------------------ */

  var SHARE_PARAM = 'd';

  // base64url <-> chuỗi UTF-8
  function utf8ToB64url(str) {
    var b64 = btoa(unescape(encodeURIComponent(str)));
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64urlToUtf8(b64url) {
    var b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    return decodeURIComponent(escape(atob(b64)));
  }

  // Làm tròn mọi số trong mảng tọa độ GeoJSON (đệ quy), giữ kiểu number.
  function roundCoords(obj, decimals) {
    var f = Math.pow(10, decimals);
    function walk(node) {
      if (Array.isArray(node)) {
        for (var i = 0; i < node.length; i++) {
          if (typeof node[i] === 'number') {
            node[i] = Math.round(node[i] * f) / f;
          } else {
            walk(node[i]);
          }
        }
      } else if (node && typeof node === 'object') {
        if (node.geometry) walk(node.geometry);
        if (node.coordinates) walk(node.coordinates);
        if (node.features) walk(node.features);
      }
    }
    walk(obj);
  }

  // Mã hóa một danh sách feature thành chuỗi base64url (dùng chung cho
  // "chia sẻ tất cả" và "chia sẻ từng thửa").
  function buildShareStringFor(features) {
    if (!features || !features.length) return null;
    var fc = geojsonFormat.writeFeaturesObject(features, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    });
    // Làm tròn tọa độ 7 chữ số (~1cm) để chuỗi gọn mà vẫn giữ số (không
    // dùng tùy chọn decimals của OL vì một số bản xuất ra chuỗi thay vì số).
    roundCoords(fc, 7);
    return utf8ToB64url(JSON.stringify(fc));
  }

  // Tạo link chia sẻ cho danh sách feature và copy vào clipboard.
  function shareFeatures(features, labelForToast) {
    var data = buildShareStringFor(features);
    if (!data) {
      toast('Không có thửa để chia sẻ.', true);
      return;
    }
    var url = location.origin + location.pathname + '?' + SHARE_PARAM + '=' + data;
    if (url.length > 8000) {
      toast('Dữ liệu quá lớn để chia sẻ bằng link. Hãy xuất GeoJSON.', true);
      return;
    }
    var okMsg = 'Đã sao chép link chia sẻ' + (labelForToast ? ' ' + labelForToast : '') + '.';
    function fallbackCopy() { window.prompt('Sao chép đường link chia sẻ:', url); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(
        function () { toast(okMsg); },
        fallbackCopy
      );
    } else {
      fallbackCopy();
    }
  }

  // Nút "Chia sẻ" trong panel: chia sẻ toàn bộ thửa.
  document.getElementById('share-link').addEventListener('click', function () {
    var all = vectorSource.getFeatures();
    if (!all.length) {
      toast('Chưa có thửa nào để chia sẻ.', true);
      return;
    }
    shareFeatures(all, '(' + all.length + ' thửa)');
  });

  // "Chữ ký" của một thửa = tên + loại hình + tọa độ (làm tròn) ở hệ lon/lat.
  // Dùng để nhận biết hai thửa là "trùng nhau" khi nhập từ link chia sẻ.
  function featureSignature(feature) {
    var geojson = geojsonFormat.writeFeatureObject(feature, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    });
    roundCoords(geojson, 7);
    var g = geojson.geometry || {};
    var name = (feature.get('name') || '').trim();
    return name + '|' + (g.type || '') + '|' + JSON.stringify(g.coordinates || []);
  }

  // Nhập các thửa từ param chia sẻ (gọi khi khởi động).
  // Chỉ APPEND những thửa chưa có sẵn (so khớp bằng chữ ký).
  function importFromShareParam() {
    var params = new URLSearchParams(location.search);
    var data = params.get(SHARE_PARAM);
    if (!data) return;

    var cleanUrl = location.origin + location.pathname + location.hash;
    try {
      var json = b64urlToUtf8(data);
      var fc = JSON.parse(json);
      var incoming = geojsonFormat.readFeatures(fc, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      });
      if (!incoming.length) throw new Error('rỗng');

      // Tập chữ ký các thửa đang có để loại trùng.
      var existing = {};
      vectorSource.getFeatures().forEach(function (f) {
        existing[featureSignature(f)] = true;
      });

      var toAdd = [];
      var duplicates = 0;
      incoming.forEach(function (f) {
        var sig = featureSignature(f);
        if (existing[sig]) {
          duplicates++;
        } else {
          existing[sig] = true; // tránh trùng trong chính link
          toAdd.push(f);
        }
      });

      if (!toAdd.length) {
        toast('Các thửa trong link đã có sẵn trên máy bạn.');
        return;
      }

      var msg = 'Đường link này chứa ' + incoming.length + ' thửa'
        + (duplicates ? ' (' + duplicates + ' đã có sẵn)' : '')
        + '. Thêm ' + toAdd.length + ' thửa mới vào máy của bạn?';
      if (confirm(msg)) {
        toAdd.forEach(function (f) {
          if (!f.getId()) f.setId(genId());
        });
        vectorSource.addFeatures(toAdd);
        persistAll();
        // phóng tới các thửa vừa thêm
        var ext = ol.extent.createEmpty();
        toAdd.forEach(function (f) {
          ol.extent.extend(ext, f.getGeometry().getExtent());
        });
        map.getView().fit(ext, { padding: [60, 60, 60, 60], maxZoom: 19, duration: 500 });
        toast('Đã thêm ' + toAdd.length + ' thửa được chia sẻ.');
      }
    } catch (e) {
      toast('Link chia sẻ không hợp lệ hoặc bị hỏng.', true);
    } finally {
      // Dọn param khỏi thanh địa chỉ dù nhận hay không.
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }

  /* ------------------------------------------------------------------ *
   * 8b. VỊ TRÍ HIỆN TẠI (Geolocation + ghim)
   *
   * Lưu ý: Geolocation của trình duyệt chỉ hoạt động trên ngữ cảnh an toàn
   * (HTTPS hoặc localhost). GitHub Pages dùng HTTPS nên chạy tốt.
   * Ghim vị trí nằm ở layer riêng, KHÔNG lưu vào localStorage.
   * ------------------------------------------------------------------ */

  var locateBtn = document.getElementById('locate-btn');

  // Layer riêng cho ghim vị trí người dùng (không trộn với các thửa đã lưu).
  var positionFeature = new ol.Feature();
  positionFeature.setStyle(new ol.style.Style({
    image: new ol.style.Circle({
      radius: 7,
      fill: new ol.style.Fill({ color: '#1fbf75' }),
      stroke: new ol.style.Stroke({ color: '#ffffff', width: 2.5 })
    })
  }));
  var accuracyFeature = new ol.Feature();
  accuracyFeature.setStyle(new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(31, 191, 117, 0.12)' }),
    stroke: new ol.style.Stroke({ color: 'rgba(31, 191, 117, 0.4)', width: 1 })
  }));
  var positionLayer = new ol.layer.Vector({
    source: new ol.source.Vector({ features: [accuracyFeature, positionFeature] }),
    zIndex: 10
  });
  map.addLayer(positionLayer);

  locateBtn.addEventListener('click', function () {
    if (!navigator.geolocation) {
      toast('Trình duyệt không hỗ trợ định vị.', true);
      return;
    }
    // Safari/iOS chỉ cho định vị trên ngữ cảnh an toàn (HTTPS hoặc localhost).
    // Nếu mở qua http:// hoặc IP, trình duyệt từ chối ngay mà không hỏi.
    if (typeof isSecureContext !== 'undefined' && !isSecureContext) {
      toast('Định vị cần HTTPS. Hãy mở trang qua https:// (ví dụ bản trên GitHub Pages), không dùng http.', true);
      return;
    }
    locateBtn.classList.add('loading');
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        locateBtn.classList.remove('loading');
        var lon = pos.coords.longitude;
        var lat = pos.coords.latitude;
        var acc = pos.coords.accuracy || 0; // mét
        var center = ol.proj.fromLonLat([lon, lat]);

        positionFeature.setGeometry(new ol.geom.Point(center));
        if (acc > 0) {
          // vòng tròn thể hiện độ chính xác (bán kính = accuracy mét),
          // vẽ trên mặt cầu rồi chiếu sang hệ hiển thị.
          var circle = ol.geom.Polygon.circular([lon, lat], acc, 64);
          circle.transform('EPSG:4326', 'EPSG:3857');
          accuracyFeature.setGeometry(circle);
        } else {
          accuracyFeature.setGeometry(undefined);
        }

        map.getView().animate({ center: center, zoom: 17, duration: 500 });
        toast('Đã về vị trí hiện tại (±' + Math.round(acc) + ' m).');
      },
      function (err) {
        locateBtn.classList.remove('loading');
        var isApple = /iP(hone|ad|od)|Safari/.test(navigator.userAgent) &&
                      !/Chrome|CriOS|Android/.test(navigator.userAgent);
        var msg = 'Không lấy được vị trí.';
        if (err.code === err.PERMISSION_DENIED) {
          // Safari thường báo "denied" ngay cả khi chưa hỏi, do quyền bị tắt.
          msg = isApple
            ? 'Vị trí bị chặn. Trên iPhone: bật Cài đặt → Quyền riêng tư → Dịch vụ định vị → Safari, và Cài đặt → Safari → Vị trí = Hỏi/Cho phép, rồi thử lại.'
            : 'Quyền vị trí bị từ chối. Hãy cho phép trong phần quyền của trang (biểu tượng khóa trên thanh địa chỉ) rồi thử lại.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Vị trí không khả dụng. Kiểm tra GPS/định vị của thiết bị.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Lấy vị trí quá lâu. Thử lại ở nơi thoáng hơn.';
        }
        toast(msg, true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });

  /* ------------------------------------------------------------------ *
   * 8c. MODAL HƯỚNG DẪN VN2000
   * ------------------------------------------------------------------ */

  var helpModal = document.getElementById('help-modal');
  function openHelp(e) { if (e) e.preventDefault(); helpModal.hidden = false; }
  function closeHelp() { helpModal.hidden = true; }

  document.getElementById('vn2000-help').addEventListener('click', openHelp);
  document.getElementById('vn2000-help-link').addEventListener('click', openHelp);
  document.getElementById('help-close').addEventListener('click', closeHelp);
  helpModal.addEventListener('click', function (e) {
    if (e.target === helpModal) closeHelp(); // bấm nền ngoài để đóng
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!helpModal.hidden) { closeHelp(); return; }
    if (drawInteraction) { stopDrawing(); toast('Đã hủy vẽ.'); }
  });

  /* ------------------------------------------------------------------ *
   * 9. ĐÓNG / MỞ PANEL TRÁI
   *
   * Desktop (>768px): trượt panel ra/vào bằng class .sidebar-collapsed.
   * Mobile  (<=768px): panel là lớp phủ, bật bằng class .sidebar-open,
   *                    nền mờ (backdrop) bấm để đóng.
   * ------------------------------------------------------------------ */

  var appEl = document.getElementById('app');
  var mobileMQ = window.matchMedia('(max-width: 768px)');

  var sidebarEl = document.getElementById('sidebar');
  var pinBtn = document.getElementById('sidebar-pin');
  var PIN_KEY = 'mymap.sidebarPinned.v1';
  var isPinned = localStorage.getItem(PIN_KEY) === '1';

  function refreshMapSize() {
    setTimeout(function () { map.updateSize(); }, 320);
  }

  function toggleSidebar() {
    if (mobileMQ.matches) {
      appEl.classList.toggle('sidebar-open');
    } else {
      appEl.classList.toggle('sidebar-collapsed');
    }
    refreshMapSize();
  }

  function closeSidebarMobile() {
    appEl.classList.remove('sidebar-open');
    refreshMapSize();
  }

  // Auto-hide: khi KHÔNG ghim và đang ở desktop, rời chuột khỏi panel -> thu lại.
  // Không thu nếu người dùng đang nhập liệu trong panel (ô đang được focus),
  // tránh mất panel giữa chừng khi đang gõ mà lỡ đưa chuột ra ngoài.
  function autoHideOnLeave() {
    if (isPinned || mobileMQ.matches) return;
    var active = document.activeElement;
    if (active && sidebarEl.contains(active) &&
        /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName)) {
      return;
    }
    if (!appEl.classList.contains('sidebar-collapsed')) {
      appEl.classList.add('sidebar-collapsed');
      refreshMapSize();
    }
  }
  sidebarEl.addEventListener('mouseleave', autoHideOnLeave);

  // Áp dụng trạng thái ghim lên giao diện.
  function applyPinState() {
    if (pinBtn) pinBtn.setAttribute('aria-pressed', isPinned ? 'true' : 'false');
    if (isPinned) {
      appEl.classList.add('sidebar-pinned');
      if (!mobileMQ.matches) appEl.classList.remove('sidebar-collapsed'); // mở sẵn
    } else {
      appEl.classList.remove('sidebar-pinned');
    }
    refreshMapSize();
  }

  if (pinBtn) {
    pinBtn.addEventListener('click', function () {
      isPinned = !isPinned;
      localStorage.setItem(PIN_KEY, isPinned ? '1' : '0');
      applyPinState();
      if (!isPinned && !mobileMQ.matches) {
        // vừa tắt ghim -> thu panel lại (quay về auto-hide)
        appEl.classList.add('sidebar-collapsed');
        refreshMapSize();
      }
      toast(isPinned ? 'Đã ghim bảng điều khiển.' : 'Đã bỏ ghim — bảng sẽ tự thu lại.');
    });
  }

  document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar);
  document.getElementById('sidebar-backdrop').addEventListener('click', closeSidebarMobile);

  // Khi chuyển giữa mobile/desktop, dọn trạng thái overlay của mobile để
  // không bị kẹt. Trên desktop: nếu ghim thì mở, nếu không thì mặc định đóng.
  mobileMQ.addEventListener('change', function () {
    appEl.classList.remove('sidebar-open');
    if (!mobileMQ.matches) {
      if (isPinned) appEl.classList.remove('sidebar-collapsed');
      else appEl.classList.add('sidebar-collapsed');
    }
    setTimeout(function () { map.updateSize(); }, 50);
  });

  // Khởi tạo: nếu đã ghim (desktop) thì mở sẵn, ngược lại đóng để ưu tiên bản đồ.
  applyPinState();
  setTimeout(function () { map.updateSize(); }, 100);

  /* ------------------------------------------------------------------ *
   * 10. KHỞI ĐỘNG
   * ------------------------------------------------------------------ */

  registerVN2000(parseFloat(meridianInput.value), parseInt(zoneSelect.value, 10));
  loadFromStorage();
  importFromShareParam(); // nếu mở từ link chia sẻ, hỏi để nhập thêm

  // Năm bản quyền ở footer luôn cập nhật.
  var yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
