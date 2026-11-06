import { db } from '../../config/db.js';
import { encryptText, decryptText } from '../../common/services/crypto.service.js';

// Lịch sử trò chuyện PeaceCat — mã hoá trước khi ghi, chỉ lưu khi khách đã đồng ý xử lý
// Dữ liệu sức khỏe (Điều 7.1). Xem migration 0095_ai_chat_history.sql.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TITLE_MAX = 80;

export async function canStoreChat(userId) {
  const r = await db.query(`select coalesce(consent_sensitive_data, false) as ok from users where id = $1`, [userId]);
  return !!r.rows[0]?.ok;
}

function safeDecrypt(blob) {
  try { return decryptText(blob); } catch (_e) { return null; }
}

// Ghi 1 lượt (tin của khách + câu trả lời). Trả về id cuộc trò chuyện, hoặc null nếu không lưu.
export async function appendChatTurn({ userId, sessionId, userText, botText, meta }) {
  if (!(await canStoreChat(userId))) return null;
  const client = await db.connect();
  try {
    await client.query('begin');
    let sid = null;
    if (sessionId && UUID_RE.test(sessionId)) {
      const own = await client.query(`select id from ai_chat_sessions where id = $1 and user_id = $2`, [sessionId, userId]);
      sid = own.rows[0]?.id || null;
    }
    if (!sid) {
      const title = String(userText).replace(/\s+/g, ' ').trim().slice(0, TITLE_MAX);
      const created = await client.query(
        `insert into ai_chat_sessions (user_id, title) values ($1, $2) returning id`,
        [userId, encryptText(title)]
      );
      sid = created.rows[0].id;
    }
    await client.query(
      `insert into ai_chat_messages (session_id, role, content, meta) values ($1, 'user', $2, null), ($1, 'bot', $3, $4::jsonb)`,
      [sid, encryptText(userText), encryptText(botText), meta ? JSON.stringify(meta) : null]
    );
    await client.query(
      `update ai_chat_sessions set message_count = message_count + 2, updated_at = now() where id = $1`,
      [sid]
    );
    await client.query('commit');
    return sid;
  } catch (e) {
    await client.query('rollback').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

export async function listChatSessions(userId) {
  const r = await db.query(
    `select id, title, message_count, created_at, updated_at
     from ai_chat_sessions where user_id = $1 and message_count > 0
     order by updated_at desc limit 50`,
    [userId]
  );
  return r.rows.map((row) => ({
    id: row.id,
    title: safeDecrypt(row.title) || '',
    message_count: row.message_count,
    created_at: row.created_at,
    updated_at: row.updated_at
  }));
}

export async function getChatSession(userId, sessionId) {
  if (!UUID_RE.test(String(sessionId || ''))) return null;
  const s = await db.query(`select id, created_at, updated_at from ai_chat_sessions where id = $1 and user_id = $2`, [sessionId, userId]);
  if (!s.rows[0]) return null;
  const m = await db.query(
    `select role, content, meta, created_at from ai_chat_messages where session_id = $1 order by id asc limit 400`,
    [sessionId]
  );
  return {
    ...s.rows[0],
    messages: m.rows.map((row) => ({ role: row.role, text: safeDecrypt(row.content) || '', meta: row.meta || null, created_at: row.created_at }))
  };
}

export async function deleteChatSession(userId, sessionId) {
  if (!UUID_RE.test(String(sessionId || ''))) return 0;
  const r = await db.query(`delete from ai_chat_sessions where id = $1 and user_id = $2`, [sessionId, userId]);
  return r.rowCount;
}

export async function deleteAllChatSessions(userId) {
  const r = await db.query(`delete from ai_chat_sessions where user_id = $1`, [userId]);
  return r.rowCount;
}
