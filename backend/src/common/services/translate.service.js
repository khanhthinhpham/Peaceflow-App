// Dịch nội dung tự do (bio/specialties chuyên gia tự viết) sang tiếng Anh bằng MyMemory
// Translation API (https://mymemory.translated.net) — dịch vụ MIỄN PHÍ, không cần đăng ký/API
// key. Giới hạn: mỗi lượt gọi tối đa ~500 byte văn bản nguồn, nên bio dài phải chia nhỏ theo
// câu rồi ghép lại. Chất lượng dịch không bằng LLM (Gemini/Claude) nhưng đủ dùng làm bản nháp
// tiếng Anh — chuyên gia luôn có thể tự sửa lại trong trang "Hồ sơ chuyên gia".
const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';
const MAX_CHUNK_BYTES = 480; // chừa lề dưới giới hạn thật (~500 byte) của MyMemory
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
  // MyMemory không cần API key -> luôn sẵn sàng.
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

async function translateChunk(text) {
  const url = `${MYMEMORY_URL}?q=${encodeURIComponent(text)}&langpair=vi|en`;
  const response = await fetchWithTimeout(url, TRANSLATE_TIMEOUT_MS);
  if (!response.ok) {
    throw new Error(`MyMemory ${response.status}`);
  }
  const data = await response.json();
  if (data?.responseStatus && Number(data.responseStatus) !== 200) {
    throw new Error(`MyMemory responseStatus ${data.responseStatus}: ${data.responseDetails || ''}`);
  }
  const translated = data?.responseData?.translatedText;
  if (!translated) {
    throw new Error('MyMemory không trả về bản dịch');
  }
  return translated;
}

export async function translateToEnglish(text) {
  const trimmed = (text || '').trim();
  if (!trimmed) return '';

  const chunks = splitIntoChunks(trimmed);
  const translatedChunks = [];
  for (const chunk of chunks) {
    // Gọi tuần tự (không Promise.all) để tránh bị MyMemory rate-limit khi văn bản dài.
    translatedChunks.push(await translateChunk(chunk));
  }
  return translatedChunks.join(' ').replace(/\s+/g, ' ').trim();
}

// Danh sách chuyên môn — dịch từng phần tử riêng (ngắn, không lo vượt giới hạn byte, và tránh
// rủi ro MyMemory dịch lẫn dấu phân cách khi ghép chung một chuỗi).
export async function translateListToEnglish(items) {
  const arr = Array.isArray(items) ? items.map((s) => (s || '').trim()).filter(Boolean) : [];
  if (!arr.length) return [];
  const out = [];
  for (const item of arr) {
    out.push(await translateToEnglish(item));
  }
  return out;
}
