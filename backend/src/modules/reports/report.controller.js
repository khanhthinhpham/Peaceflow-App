import * as reportService from './report.service.js';

function getPeriod(req) {
    return req.query.period || 'week';
}

export async function getSummary(req, res, next) {
    try {
        const data = await reportService.getSummary(req.user.id, getPeriod(req));
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function getMoodTrend(req, res, next) {
    try {
        const data = await reportService.getMoodTrend(req.user.id, getPeriod(req));
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function getTaskBreakdown(req, res, next) {
    try {
        const data = await reportService.getTaskBreakdown(req.user.id, getPeriod(req));
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function getAssessmentHistory(req, res, next) {
    try {
        const data = await reportService.getAssessmentHistory(req.user.id);
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function getRadar(req, res, next) {
    try {
        const data = await reportService.getRadar(req.user.id, getPeriod(req));
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function getInsights(req, res, next) {
    try {
        const data = await reportService.getInsights(req.user.id, getPeriod(req));
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function exportJson(req, res, next) {
    try {
        const data = await reportService.exportJson(req.user.id, getPeriod(req));
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
}
