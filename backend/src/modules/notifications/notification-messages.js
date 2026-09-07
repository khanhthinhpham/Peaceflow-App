// Ghép câu thông báo theo locale, dựa vào `code` (sub-type ổn định, KHÔNG đổi giữa các
// ngôn ngữ) + `params` (dữ liệu thô: tên người, số tiền, trạng thái...) — thay cho việc
// ghép câu tiếng Việt sẵn rồi lưu chết vào `message` như trước đây (xem migration 0058).
//
// Chỉ áp dụng cho thông báo gửi tới NGƯỜI DÙNG THƯỜNG/CHUYÊN GIA (khách hàng của app).
// Thông báo gửi cho ADMIN vẫn giữ nguyên tiếng Việt (đội vận hành nội bộ, xem
// expert.routes.js — các lời gọi notify(admin.id, ...) không đi qua module này).

const BOOKING_STATUS_LABEL = {
    vi: { confirmed: 'đã nhận lịch', completed: 'đã hoàn thành', cancelled: 'đã huỷ' },
    en: { confirmed: 'accepted', completed: 'completed', cancelled: 'cancelled' }
};

const BUILDERS = {
    booking_payment_received_awaiting_expert: {
        vi: () => 'Đã nhận thanh toán — đang chờ chuyên gia nhận lịch.',
        en: () => 'Payment received — waiting for the expert to accept.'
    },
    booking_payment_confirmed_awaiting_expert: {
        vi: () => 'Đã xác nhận thanh toán — đang chờ chuyên gia nhận lịch.',
        en: () => 'Payment confirmed — waiting for the expert to accept.'
    },
    booking_new_paid_awaiting_response: {
        vi: () => 'Có lịch đã thanh toán — mời bạn nhận hoặc từ chối.',
        en: () => 'A paid booking is waiting — please accept or decline.'
    },
    booking_client_deposited: {
        vi: ({ clientName }) => `${clientName} đã đặt & thanh toán một lịch hẹn — đang chờ xác nhận.`,
        en: ({ clientName }) => `${clientName} booked and paid for a session — awaiting your confirmation.`
    },
    booking_cancelled_by_client: {
        vi: () => 'Một lịch hẹn đã bị thân chủ huỷ.',
        en: () => 'A client has cancelled a session.'
    },
    booking_status_changed: {
        vi: ({ expertName, status }) => `Chuyên gia ${expertName} ${BOOKING_STATUS_LABEL.vi[status] || status} lịch hẹn của bạn.`,
        en: ({ expertName, status }) => `Expert ${expertName} ${BOOKING_STATUS_LABEL.en[status] || status} your session.`
    },
    booking_payment_failed_cancelled: {
        vi: () => 'Chưa nhận được thanh toán cho lịch hẹn — đơn đã bị huỷ. Vui lòng đặt lại.',
        en: () => 'Payment was not received for this booking — it has been cancelled. Please book again.'
    },
    booking_payment_wallet_awaiting_expert: {
        vi: () => 'Đã thanh toán bằng ví — đang chờ chuyên gia nhận lịch.',
        en: () => 'Paid via wallet — waiting for the expert to accept.'
    },
    payout_paid: {
        vi: ({ amount }) => `Bạn đã được chi trả ${Number(amount).toLocaleString('vi-VN')}đ.`,
        en: ({ amount }) => `You have been paid ${Number(amount).toLocaleString('en-US')}đ.`
    },
    comment_own_post: {
        vi: ({ actorName }) => `${actorName} đã bình luận bài viết của bạn.`,
        en: ({ actorName }) => `${actorName} commented on your post.`
    },
    comment_participant_post: {
        vi: ({ actorName }) => `${actorName} cũng đã bình luận trong bài viết bạn tham gia.`,
        en: ({ actorName }) => `${actorName} also commented on a post you're following.`
    },
    reaction_post: {
        vi: ({ actorName, emoji }) => `${actorName} đã thả ${emoji} vào bài viết của bạn.`,
        en: ({ actorName, emoji }) => `${actorName} reacted ${emoji} to your post.`
    },
    expert_approved: {
        vi: () => 'Hồ sơ chuyên gia của bạn đã được duyệt! Bạn có thể vào khu chuyên gia ngay.',
        en: () => 'Your expert application has been approved! You can access the expert area now.'
    },
    expert_rejected: {
        vi: () => 'Hồ sơ chuyên gia của bạn chưa được duyệt. Bạn có thể cập nhật và gửi lại.',
        en: () => 'Your expert application was not approved this time. You can update and resubmit it.'
    }
};

// Trả về câu đã ghép theo locale, hoặc null nếu không nhận ra `code` (gọi nơi dùng hàm này
// nên fallback về `message` thô đã lưu sẵn trong trường hợp đó — thông báo cũ trước
// migration 0058, hoặc code lạ chưa được khai báo ở trên).
export function buildNotificationMessage(code, params, locale = 'vi') {
    const builder = BUILDERS[code];
    if (!builder) return null;
    const fn = locale === 'en' ? builder.en : builder.vi;
    try {
        return fn(params || {});
    } catch {
        return null;
    }
}
