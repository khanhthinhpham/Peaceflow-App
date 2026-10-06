// Dùng chung cho MỌI route trả trang preview chia sẻ MXH (bài viết, bài test tâm lý...).
// SPA Vue không server-render, nên bot quét link (Facebook/Threads/Zalo/Telegram...) chỉ
// đọc được <meta og:*> TĨNH trong index.html — không bao giờ thấy tiêu đề/ảnh RIÊNG của từng
// trang vì bot không chạy JavaScript. Các route "/.../share" dùng util này là link mà nút
// Chia sẻ trỏ tới thay vì link SPA thẳng: bot quét được trả HTML có og tag đúng; người dùng
// thật bấm vào thì chuyển thẳng (302) sang đúng trang trên app, không nhận ra có bước này.

export function escapeHtmlAttr(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export const CRAWLER_UA_REGEX = /bot|crawl|spider|facebookexternalhit|facebot|whatsapp|telegram|threads|slackbot|discordbot|linkedinbot|pinterest|embedly|quora|vkshare|w3c_validator|redditbot|applebot|skypeuripreview/i;

export function isCrawlerRequest(req) {
  return CRAWLER_UA_REGEX.test(req.headers['user-agent'] || '');
}

// KHÔNG dùng <meta http-equiv="refresh"> trong HTML trả về: Facebook theo dõi nó như 1 bước
// chuyển hướng, rồi tự đi fetch tiếp targetUrl — thứ 404 với client không chạy JS như bot
// (GitHub Pages không SPA-fallback cho crawler) — kết quả là nó VỨT BỎ og tag đúng vừa đọc
// được ở đây, lấy fallback từ trang 404 kia thay vào. Hàm này CHỈ gọi cho nhánh bot (người
// dùng thật đã bị 302 redirect từ trước ở route gọi hàm này), nên không cần refresh gì cả.
export function renderShareHtml({ title, description, image, targetUrl, type = 'website' }) {
  const t = escapeHtmlAttr(title);
  return `<!doctype html>
<html lang="vi"><head>
<meta charset="utf-8">
<title>${t}</title>
<meta property="og:type" content="${type}">
<meta property="og:url" content="${escapeHtmlAttr(targetUrl)}">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${escapeHtmlAttr(description)}">
<meta property="og:image" content="${escapeHtmlAttr(image)}">
<meta name="twitter:card" content="summary_large_image">
</head><body><a href="${escapeHtmlAttr(targetUrl)}">${t}</a></body></html>`;
}
