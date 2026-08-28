// Lớp gửi mail đa nguồn: thử Resend trước, hết quota/lỗi thì tự chuyển sang Brevo.
//
// Vì sao cần: gói Resend miễn phí chỉ 100 mail/ngày. Ngày 28/08/2026 app có ~1.100 lượt
// đăng ký trong vài giờ (bình thường chỉ ~40/ngày), Resend từ chối khoảng 860 mail và
// hơn 500 người không xác nhận được email — nhưng lỗi lúc đó bị nuốt nên không ai biết
// trong suốt 4 tiếng. Có nguồn dự phòng + ghi log rõ ràng để không lặp lại.
//
// Brevo cho 300 mail/ngày miễn phí, cộng Resend là 400/ngày.
import { Resend } from 'resend';
import { env } from '../../config/env.js';

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

// EMAIL_FROM ở dạng "PeaceFlow <no-reply@peaceflow.vn>". Resend nhận nguyên chuỗi này,
// còn Brevo đòi tách riêng tên và địa chỉ.
function parseFrom(from) {
    const raw = String(from || '').trim();
    const m = raw.match(/^(.*?)\s*<([^>]+)>$/);
    if (m) return { name: m[1].replace(/^"|"$/g, '').trim() || 'PeaceFlow', email: m[2].trim() };
    return { name: 'PeaceFlow', email: raw };
}

function toRecipientList(to) {
    return (Array.isArray(to) ? to : [to]).map((x) => String(x || '').trim()).filter(Boolean);
}

async function sendViaResend({ from, to, subject, html, attachments }) {
    if (!resend) throw new Error('RESEND_API_KEY chưa cấu hình');
    const { data, error } = await resend.emails.send({
        from,
        to: toRecipientList(to),
        subject,
        html,
        ...(attachments && attachments.length ? { attachments } : {})
    });
    // SDK của Resend KHÔNG throw khi API trả lỗi (vd hết quota) — nó trả về { error }.
    // Không kiểm tra chỗ này thì lỗi hết quota sẽ bị coi là gửi thành công.
    if (error) {
        const err = new Error(error.message || 'Resend trả về lỗi');
        err.providerName = error.name;
        err.statusCode = error.statusCode;
        throw err;
    }
    return { id: data?.id };
}

async function sendViaBrevo({ from, to, subject, html, attachments }) {
    if (!env.brevoApiKey) throw new Error('BREVO_API_KEY chưa cấu hình');
    // Brevo chỉ cho gửi từ địa chỉ/domain đã xác thực trong tài khoản của nó. Khi domain
    // peaceflow.vn chưa xác thực xong ở Brevo, đặt BREVO_FROM = một sender đã xác thực để
    // nguồn dự phòng dùng được ngay. Xác thực domain xong thì bỏ biến này đi, Brevo sẽ
    // dùng chung EMAIL_FROM với Resend.
    const sender = parseFrom(env.brevoFrom || from);

    const body = {
        sender,
        to: toRecipientList(to).map((email) => ({ email })),
        subject,
        htmlContent: html
    };
    if (attachments && attachments.length) {
        // Brevo nhận file dạng base64 với khoá "content", khác Resend nhận Buffer.
        body.attachment = attachments.map((a) => ({
            name: a.filename,
            content: Buffer.isBuffer(a.content) ? a.content.toString('base64') : String(a.content || '')
        }));
    }

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'api-key': env.brevoApiKey,
            'content-type': 'application/json',
            accept: 'application/json'
        },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const text = await res.text();
        const err = new Error(`Brevo ${res.status}: ${text.slice(0, 300)}`);
        err.statusCode = res.status;
        throw err;
    }
    const data = await res.json().catch(() => ({}));
    return { id: data?.messageId };
}

// Lỗi do địa chỉ người nhận không hợp lệ thì đổi nhà cung cấp cũng vô ích — gửi lại chỉ
// tốn thêm quota của nguồn dự phòng. Chỉ chuyển nguồn với lỗi thuộc phía nhà cung cấp.
function isRecipientProblem(error) {
    const msg = String(error?.message || '').toLowerCase();
    if (error?.statusCode === 422) return true;
    return /invalid.*(email|recipient|address)|not a valid email/.test(msg);
}

const PROVIDERS = [
    { name: 'resend', send: sendViaResend, enabled: () => Boolean(env.resendApiKey) },
    { name: 'brevo', send: sendViaBrevo, enabled: () => Boolean(env.brevoApiKey) }
];

/**
 * Gửi 1 email, tự chuyển nguồn khi nguồn trước lỗi.
 * Ném lỗi nếu TẤT CẢ nguồn đều thất bại — bên gọi phải tự quyết có nuốt lỗi hay không.
 */
export async function sendMail({ from, to, subject, html, attachments }) {
    const active = PROVIDERS.filter((p) => p.enabled());
    if (!active.length) {
        throw new Error('Chưa cấu hình nhà cung cấp email nào (RESEND_API_KEY / BREVO_API_KEY).');
    }

    const failures = [];
    for (const provider of active) {
        try {
            const result = await provider.send({ from, to, subject, html, attachments });
            if (failures.length) {
                console.warn(
                    `[MAIL] gui thanh cong qua "${provider.name}" sau khi cac nguon truoc that bai: ${failures.join(' | ')}`
                );
            }
            return { provider: provider.name, id: result?.id };
        } catch (error) {
            failures.push(`${provider.name}: ${error.message}`);
            if (isRecipientProblem(error)) {
                // Địa chỉ sai thì dừng luôn, không thử nguồn khác.
                break;
            }
        }
    }

    const err = new Error(`Tat ca nguon email deu that bai -> ${failures.join(' | ')}`);
    err.failures = failures;
    throw err;
}

export function getConfiguredMailProviders() {
    return PROVIDERS.filter((p) => p.enabled()).map((p) => p.name);
}
