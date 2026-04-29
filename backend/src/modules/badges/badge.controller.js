import * as badgeService from './badge.service.js';

export async function getAllBadges(req, res, next) {
    try {
        const data = await badgeService.getAllBadges();
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function getMyBadges(req, res, next) {
    try {
        const userId = req.user.id;
        const data = await badgeService.getMyBadges(userId);
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function evaluateMyBadges(req, res, next) {
    try {
        const userId = req.user.id;
        const data = await badgeService.evaluateBadges(userId);
        res.json({
            success: true,
            message: data.newlyEarned.length
                ? 'Đã cập nhật huy hiệu mới'
                : 'Không có huy hiệu mới',
            data
        });
    } catch (err) {
        next(err);
    }
}
