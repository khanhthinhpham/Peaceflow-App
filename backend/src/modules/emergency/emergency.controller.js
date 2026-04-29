import * as emergencyService from './emergency.service.js';

export async function getEmergencyResources(req, res, next) {
    try {
        const risk = await emergencyService.getLatestRiskSnapshot(req.user.id);
        const recommendations = emergencyService.buildEmergencyRecommendation(risk);

        res.json({
            success: true,
            data: {
                resources: emergencyService.DEFAULT_RESOURCES,
                risk,
                recommendations
            }
        });
    } catch (err) {
        next(err);
    }
}

export async function logEmergency(req, res, next) {
    try {
        const { event_type, payload } = req.body;

        if (!event_type) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu event_type'
            });
        }

        const allowed = [
            'hotline_view',
            'breathing_tool',
            'panic_mode',
            'trusted_contact',
            'expert_request',
            'crisis_flag'
        ];

        if (!allowed.includes(event_type)) {
            return res.status(400).json({
                success: false,
                message: 'event_type không hợp lệ'
            });
        }

        const data = await emergencyService.logEmergencyEvent(
            req.user?.id || null,
            event_type,
            payload || {}
        );

        res.status(201).json({
            success: true,
            message: 'Đã ghi nhận sự kiện khẩn cấp',
            data
        });
    } catch (err) {
        next(err);
    }
}

export async function getEmergencyRecommendations(req, res, next) {
    try {
        const risk = await emergencyService.getLatestRiskSnapshot(req.user.id);
        const data = emergencyService.buildEmergencyRecommendation(risk);

        res.json({
            success: true,
            data
        });
    } catch (err) {
        next(err);
    }
}

export async function escalateEmergency(req, res, next) {
    try {
        const data = await emergencyService.escalateEmergency(req.user.id, req.body || {});
        res.status(201).json({
            success: true,
            message: 'Đã kích hoạt escalation khẩn cấp',
            data
        });
    } catch (err) {
        next(err);
    }
}
