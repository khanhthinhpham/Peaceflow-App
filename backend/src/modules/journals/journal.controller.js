import * as journalService from './journal.service.js';

/**
 * GET /api/v1/journal
 */
export async function getEntries(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const data = await journalService.getEntries(req.user.id, limit);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/journal/:id
 */
export async function getEntryById(req, res, next) {
  try {
    const data = await journalService.getEntryById(req.user.id, req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
}

/**
 * POST /api/v1/journal
 */
export async function createEntry(req, res, next) {
  try {
    const data = await journalService.createEntry(req.user.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
}

/**
 * PUT /api/v1/journal/:id
 */
export async function updateEntry(req, res, next) {
  try {
    const data = await journalService.updateEntry(req.user.id, req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
}

/**
 * DELETE /api/v1/journal/:id
 */
export async function deleteEntry(req, res, next) {
  try {
    await journalService.deleteEntry(req.user.id, req.params.id);
    res.json({ success: true, message: 'Đã xóa nhật ký' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
}
