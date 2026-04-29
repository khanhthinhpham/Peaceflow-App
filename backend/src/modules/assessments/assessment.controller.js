import * as assessmentService from './assessment.service.js';
import { validateAssessmentSubmit } from './assessment.schemas.js';

export async function getAllAssessments(req, res, next) {
    try {
        const data = await assessmentService.getAllAssessments();
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function getAssessmentByCode(req, res, next) {
    try {
        const data = await assessmentService.getAssessmentByCode(req.params.code);
        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài assessment'
            });
        }
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function submitAssessment(req, res, next) {
    try {
        const validation = validateAssessmentSubmit(req.body);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu gửi lên không hợp lệ',
                errors: validation.errors
            });
        }

        const assessment = await assessmentService.getAssessmentByCode(req.params.code);
        if (!assessment) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài assessment'
            });
        }

        const answers = req.body.answers;
        const result = assessmentService.calculateAssessmentResult(assessment, answers);
        const saved = await assessmentService.saveAssessmentResult(
            req.user.id,
            assessment.id,
            answers,
            result
        );

        res.status(201).json({
            success: true,
            message: 'Nộp bài assessment thành công',
            data: saved
        });
    } catch (err) {
        next(err);
    }
}

export async function getMyAssessmentResults(req, res, next) {
    try {
        const data = await assessmentService.getMyAssessmentResults(req.user.id);
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function getLatestAssessmentResults(req, res, next) {
    try {
        const data = await assessmentService.getLatestAssessmentResults(req.user.id);
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
}
