// Dịch nội dung tự do (bio/specialties chuyên gia, bài viết Góc chia sẻ...) sang tiếng Anh
// bằng endpoint web KHÔNG CHÍNH THỨC của Google Translate (translate.googleapis.com) — không
// cần đăng ký/API key, không có hạn mức ký tự/ngày cố định như MyMemory (dịch vụ dùng trước
// đây, giới hạn ~5.000 từ/ngày với lượt gọi ẩn danh — không đủ để dịch hàng loạt bài viết).
// Đây không phải API chính thức của Google nên gọi tuần tự + có độ trễ giữa các lượt để
// tránh bị chặn tạm thời khi dịch số lượng lớn. Chất lượng dịch không bằng LLM nhưng đủ dùng
// làm bản nháp tiếng Anh — luôn có thể tự sửa lại trong trang quản trị.
const GOOGLE_TRANSLATE_URL = 'https://translate.googleapis.com/translate_a/single';
const MAX_CHUNK_BYTES = 1800; // chừa lề dưới giới hạn thực tế (~2000-5000 byte) của endpoint
const TRANSLATE_TIMEOUT_MS = 12000;

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export function isTranslateConfigured() {
  // Endpoint Google Translate không chính thức không cần API key -> luôn sẵn sàng.
  return true;
}

function byteLength(str) {
  return new TextEncoder().encode(str).length;
}

// Chia văn bản thành các đoạn <= MAX_CHUNK_BYTES, ưu tiên cắt ở ranh giới câu (theo dấu
// ./!/?/;) để không cắt ngang câu, làm giảm chất lượng dịch.
function splitIntoChunks(text) {
  const sentences = text.split(/(?<=[.!?;])\s+/).filter(Boolean);
  const chunks = [];
  let current = '';
  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (byteLength(candidate) <= MAX_CHUNK_BYTES) {
      current = candidate;
    } else {
      if (current) chunks.push(current);
      // Câu tự nó đã vượt giới hạn (hiếm) -> cắt cứng theo ký tự.
      if (byteLength(sentence) > MAX_CHUNK_BYTES) {
        let piece = '';
        for (const ch of sentence) {
          const next = piece + ch;
          if (byteLength(next) > MAX_CHUNK_BYTES) {
            chunks.push(piece);
            piece = ch;
          } else {
            piece = next;
          }
        }
        current = piece;
      } else {
        current = sentence;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Giãn cách tối thiểu giữa 2 lượt gọi liên tiếp (bất kể gọi từ đâu trong file) — nội dung
// bài viết dài tách thành hàng chục dòng/đoạn, gọi dồn dập rất dễ bị chặn tạm thời vì đây
// không phải API chính thức, không có quota riêng để "xin".
const MIN_GAP_MS = 120;
let lastCallAt = 0;
async function throttle() {
  const wait = lastCallAt + MIN_GAP_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastCallAt = Date.now();
}

async function translateChunk(text) {
  await throttle();
  const params = new URLSearchParams({ client: 'gtx', sl: 'vi', tl: 'en', dt: 't', q: text });
  const url = `${GOOGLE_TRANSLATE_URL}?${params.toString()}`;
  const response = await fetchWithTimeout(url, TRANSLATE_TIMEOUT_MS);
  if (!response.ok) {
    throw new Error(`Google Translate ${response.status}`);
  }
  const data = await response.json();
  // Dạng trả về: [[["đoạn dịch 1","đoạn gốc 1",...], ["đoạn dịch 2",...], ...], null, "vi"]
  // — endpoint tự tách câu nên phải ghép lại tất cả đoạn dịch trong mảng đầu tiên.
  const segments = Array.isArray(data?.[0]) ? data[0] : [];
  const translated = segments.map((seg) => seg?.[0] || '').join('');
  if (!translated) {
    throw new Error('Google Translate không trả về bản dịch');
  }
  return translated;
}

async function translateLine(line) {
  if (!line.trim()) return '';
  const chunks = splitIntoChunks(line);
  const translatedChunks = [];
  for (const chunk of chunks) {
    // Gọi tuần tự (không Promise.all) — throttle() ở translateChunk đã lo giãn cách.
    translatedChunks.push(await translateChunk(chunk));
  }
  return translatedChunks.join(' ').replace(/[ \t]+/g, ' ').trim();
}

export async function translateToEnglish(text) {
  const trimmed = (text || '').trim();
  if (!trimmed) return '';

  // Giữ nguyên cấu trúc đoạn văn (\n\n) và xuống dòng đơn (\n) — dịch riêng từng dòng rồi
  // ghép lại đúng chỗ, thay vì gộp hết thành 1 dòng như trước (mất định dạng khi hiển thị
  // lại — xem renderedContent ở ArticleDetailView.vue tách đoạn theo \n\n).
  const paragraphs = trimmed.split(/\n{2,}/);
  const translatedParagraphs = [];
  for (const paragraph of paragraphs) {
    const lines = paragraph.split('\n');
    const translatedLines = [];
    for (const line of lines) {
      translatedLines.push(await translateLine(line));
    }
    translatedParagraphs.push(translatedLines.join('\n'));
  }
  return translatedParagraphs.join('\n\n');
}

// Danh sách chuyên môn — dịch từng phần tử riêng (ngắn, không lo vượt giới hạn byte, và tránh
// rủi ro dịch lẫn dấu phân cách khi ghép chung một chuỗi).
export async function translateListToEnglish(items) {
  const arr = Array.isArray(items) ? items.map((s) => (s || '').trim()).filter(Boolean) : [];
  if (!arr.length) return [];
  const out = [];
  for (const item of arr) {
    out.push(await translateToEnglish(item));
  }
  return out;
}
