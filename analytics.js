/*
 * Thống kê cho hotrobando.github.io
 * - GA4 (G-2SKDSJB363) nạp trực tiếp bằng gtag.js -> KHÔNG tạo thêm tag GA4 trong GTM (sẽ bị đếm 2 lần).
 * - GTM (GTM-KXK5K2DL) vẫn được nạp để xác minh Search Console / dùng về sau.
 */
(function () {
    var GA_ID = 'G-2SKDSJB363';
    var GTM_ID = 'GTM-KXK5K2DL';

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;

    // Không đo khi chạy localhost hoặc mở file trực tiếp
    if (/^(localhost|127\.0\.0\.1|)$/.test(location.hostname)) return;

    function loadScript(src) {
        var s = document.createElement('script');
        s.async = true;
        s.src = src;
        document.head.appendChild(s);
    }

    // GA4 (tự gửi page_view; click link ra ngoài do Enhanced Measurement đo)
    loadScript('https://www.googletagmanager.com/gtag/js?id=' + GA_ID);
    gtag('js', new Date());
    gtag('config', GA_ID);

    // GTM
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    loadScript('https://www.googletagmanager.com/gtm.js?id=' + GTM_ID);

    // Đo nút bấm. Chỉ lấy nhãn từ aria-label/title/id, KHÔNG lấy chữ hiển thị
    // (có thể chứa tên thửa đất người dùng đặt).
    document.addEventListener('click', function (e) {
        var el = e.target.closest && e.target.closest('button');
        if (!el) return;
        var label = (el.getAttribute('aria-label') || el.title || el.id || '').trim().slice(0, 40);
        if (label) gtag('event', 'button_click', { action_label: label });
    });
})();
