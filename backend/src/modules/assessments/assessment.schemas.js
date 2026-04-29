export function validateAssessmentSubmit(body) {
    const errors = [];

    if (!body || typeof body !== 'object') {
        errors.push('Body không hợp lệ');
        return { valid: false, errors };
    }

    if (!body.answers || typeof body.answers !== 'object') {
        errors.push('Thiếu answers');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}
