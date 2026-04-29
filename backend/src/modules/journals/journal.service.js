import * as journalRepository from './journal.repository.js';

/**
 * Tạo journal entry
 */
export async function createEntry(userId, data) {
  if (!data.content || data.content.trim().length === 0) {
    throw Object.assign(new Error('Nội dung nhật ký không được để trống'), { status: 400 });
  }
  return journalRepository.create(userId, data);
}

/**
 * Lấy danh sách entries
 */
export async function getEntries(userId, limit = 50) {
  return journalRepository.findByUser(userId, limit);
}

/**
 * Lấy entry theo ID
 */
export async function getEntryById(userId, id) {
  const entry = await journalRepository.findById(userId, id);
  if (!entry) {
    throw Object.assign(new Error('Không tìm thấy nhật ký'), { status: 404 });
  }
  return entry;
}

/**
 * Cập nhật entry
 */
export async function updateEntry(userId, id, data) {
  const updated = await journalRepository.update(userId, id, data);
  if (!updated) {
    throw Object.assign(new Error('Không tìm thấy nhật ký để cập nhật'), { status: 404 });
  }
  return updated;
}

/**
 * Xóa entry (soft delete)
 */
export async function deleteEntry(userId, id) {
  const deleted = await journalRepository.softDelete(userId, id);
  if (!deleted) {
    throw Object.assign(new Error('Không tìm thấy nhật ký để xóa'), { status: 404 });
  }
  return true;
}
