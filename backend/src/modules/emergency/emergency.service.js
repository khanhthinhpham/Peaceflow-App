import { db } from '../../config/db.js';

export const DEFAULT_RESOURCES = {
    hotlines: [
        {
            name: 'Hotline cấp cứu 115',
            phone: '115',
            type: 'emergency'
        },
        {
            name: 'Tổng đài bảo vệ trẻ em',
            phone: '111',
            type: 'support'
        }
    ],
    grounding_tools: [
        {
            code: 'breathing_478',
            title: 'Thở 4-7-8',
            description: 'Hít vào 4 giây, giữ 7 giây, thở ra 8 giây'
        },
        {
            code: 'grounding_54321',
            title: 'Kỹ thuật 5-4-3-2-1',
            description: 'Quan sát 5 điều nhìn thấy, 4 điều chạm được, 3 điều nghe được...'
        }
    ],
    safety_tips: [
        'Di chuyển đến nơi có người đáng tin cậy ở gần.',
        'Tạm rời khỏi vật dụng có thể gây nguy hiểm.',
        'Gọi cho người thân hoặc chuyên gia hỗ trợ ngay nếu bạn thấy mất kiểm soát.'
    ]
};

export async function logEmergencyEvent(userId, eventType, payload = {}) {
    const { rows } = await db.query(
        `insert into emergency_logs (user_id, event_type, payload)
     values ($1, $2, $3::jsonb)
     returning *`,
        [userId || null, eventType, JSON.stringify(payload || {})]
    );
    return rows[0];
}

export async function getLatestRiskSnapshot(userId) {
    const { rows } = await db.query(
        `select *
     from risk_snapshots
     where user_id = $1
     order by calculated_at desc
     limit 1`,
        [userId]
    );
    return rows[0] || null;
}

export function buildEmergencyRecommendation(risk) {
    const level = risk?.crisis_risk_level || 'low';

    if (level === 'critical') {
        return {
            level,
            message: 'Hệ thống ghi nhận mức nguy cơ rất cao. Hãy liên hệ hỗ trợ khẩn cấp ngay bây giờ.',
            actions: [
                'Gọi hotline khẩn cấp',
                'Liên hệ người tin cậy',
                'Kích hoạt panic mode',
                'Đến cơ sở y tế gần nhất nếu bạn thấy không an toàn'
            ]
        };
    }

    if (level === 'high') {
        return {
            level,
            message: 'Bạn đang ở mức nguy cơ cao. Nên ưu tiên hỗ trợ trực tiếp và công cụ ổn định cảm xúc ngay.',
            actions: [
                'Thực hiện bài thở 4-7-8',
                'Gọi người thân đáng tin cậy',
                'Đặt lịch chuyên gia sớm nhất',
                'Tránh ở một mình nếu cảm thấy mất kiểm soát'
            ]
        };
    }

    if (level === 'moderate') {
        return {
            level,
            message: 'Bạn đang có dấu hiệu quá tải. Hãy giảm kích thích và làm một hoạt động grounding ngắn.',
            actions: [
                'Bài grounding 5-4-3-2-1',
                'Viết nhanh điều đang làm bạn căng thẳng',
                'Nghỉ khỏi tác nhân gây áp lực 10-15 phút'
            ]
        };
    }

    return {
        level,
        message: 'Hiện chưa ghi nhận nguy cơ cao, nhưng bạn vẫn có thể dùng các công cụ hỗ trợ khi cần.',
        actions: [
            'Theo dõi cảm xúc',
            'Thực hiện bài thở ngắn',
            'Viết journal nếu có điều khó nói'
        ]
    };
}

export async function escalateEmergency(userId, payload = {}) {
    const risk = await getLatestRiskSnapshot(userId);

    const log = await logEmergencyEvent(userId, 'crisis_flag', {
        reason: payload.reason || 'manual_escalation',
        source: payload.source || 'user_request',
        note: payload.note || null,
        risk_level: risk?.crisis_risk_level || null
    });

    return {
        escalation_logged: true,
        log,
        current_risk: risk,
        next_steps: buildEmergencyRecommendation(risk)
    };
}
