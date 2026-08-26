import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import SignupView from '../views/SignupView.vue';
import AppLayout from '../layouts/AppLayout.vue';
import DashboardView from '../views/DashboardView.vue';
import MoodCheckinView from '../views/MoodCheckinView.vue';
import MoodAssessmentView from '../views/MoodAssessmentView.vue';
import RavenTestView from '../views/RavenTestView.vue';
import TasksView from '../views/TasksView.vue';
import TaskDetailView from '../views/TaskDetailView.vue';
import JournalView from '../views/JournalView.vue';
import ExpertsView from '../views/ExpertsView.vue';
import CommunityView from '../views/CommunityView.vue';
import ReportView from '../views/ReportView.vue';
import AchievementsView from '../views/AchievementsView.vue';
import ProfileView from '../views/ProfileView.vue';
import SettingsView from '../views/SettingsView.vue';
import MoodChatView from '../views/MoodChatView.vue';
import ForgotPasswordView from '../views/ForgotPasswordView.vue';
import ResetPasswordView from '../views/ResetPasswordView.vue';
import VerifyEmailView from '../views/VerifyEmailView.vue';
import OnboardingView from '../views/OnboardingView.vue';
import TaskBreathingView from '../views/TaskBreathingView.vue';
import TaskMeditationView from '../views/TaskMeditationView.vue';
import EmergencyView from '../views/EmergencyView.vue';
import IndexView from '../views/IndexView.vue';
import AdminLayout from '../layouts/AdminLayout.vue';
import AdminDashboardView from '../views/admin/AdminDashboardView.vue';
import AdminExpertsView from '../views/admin/AdminExpertsView.vue';
import AdminBookingsView from '../views/admin/AdminBookingsView.vue';
import AdminPaymentsView from '../views/admin/AdminPaymentsView.vue';
import AdminUsersView from '../views/admin/AdminUsersView.vue';
import AdminCommunityView from '../views/admin/AdminCommunityView.vue';
import AdminAssessmentResultsView from '../views/admin/AdminAssessmentResultsView.vue';
import ExpertLayout from '../layouts/ExpertLayout.vue';
import ApplyExpertView from '../views/ApplyExpertView.vue';
import ExpertDashboardView from '../views/expert/ExpertDashboardView.vue';
import ExpertClientAssessmentsView from '../views/expert/ExpertClientAssessmentsView.vue';
import ExpertApplicationView from '../views/expert/ExpertApplicationView.vue';
import ExpertReviewStatusView from '../views/expert/ExpertReviewStatusView.vue';
import ExpertPaymentsView from '../views/expert/ExpertPaymentsView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'index', component: IndexView },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/signup', name: 'signup', component: SignupView },
    { path: '/forgot-password', name: 'forgot-password', component: ForgotPasswordView },
    { path: '/reset-password', name: 'reset-password', component: ResetPasswordView },
    { path: '/verify-email', name: 'verify-email', component: VerifyEmailView },
    { path: '/onboarding', name: 'onboarding', component: OnboardingView },
    // Màn nộp hồ sơ chuyên gia — đứng ngoài shell/sidebar của khu expert, giống bản cũ.
    { path: '/expert-apply', name: 'expert-apply', component: ApplyExpertView },
    // Trang gốc không có sidebar dùng chung — giữ đứng ngoài AppLayout như bản cũ.
    { path: '/raven-test', name: 'raven-test', component: RavenTestView },
    {
      path: '/',
      component: AppLayout,
      children: [
        { path: 'dashboard', name: 'dashboard', component: DashboardView, meta: { navKey: 'dashboard' } },
        { path: 'mood-checkin', name: 'mood-checkin', component: MoodCheckinView, meta: { navKey: 'mood' } },
        { path: 'mood-assessment', name: 'mood-assessment', component: MoodAssessmentView, meta: { navKey: 'tests' } },
        { path: 'tasks', name: 'tasks', component: TasksView, meta: { navKey: 'tasks' } },
        { path: 'task-detail', name: 'task-detail', component: TaskDetailView, meta: { navKey: 'tasks' } },
        { path: 'journal', name: 'journal', component: JournalView, meta: { navKey: 'journal' } },
        { path: 'experts', name: 'experts', component: ExpertsView, meta: { navKey: 'experts' } },
        { path: 'community', name: 'community', component: CommunityView, meta: { navKey: 'community' } },
        { path: 'report', name: 'report', component: ReportView, meta: { navKey: 'report' } },
        { path: 'achievements', name: 'achievements', component: AchievementsView, meta: { navKey: 'achievements' } },
        { path: 'profile', name: 'profile', component: ProfileView, meta: { navKey: 'profile' } },
        { path: 'settings', name: 'settings', component: SettingsView, meta: { navKey: 'settings' } },
        { path: 'mood-chat', name: 'mood-chat', component: MoodChatView, meta: { navKey: 'mood' } },
        { path: 'task-breathing', name: 'task-breathing', component: TaskBreathingView, meta: { navKey: 'tasks' } },
        { path: 'task-meditation', name: 'task-meditation', component: TaskMeditationView, meta: { navKey: 'tasks' } },
        { path: 'emergency', name: 'emergency', component: EmergencyView, meta: { navKey: 'emergency' } }
      ]
    },
    // Khu quản trị (admin) — shell/sidebar riêng, không dùng chung AppLayout.
    {
      path: '/admin',
      component: AdminLayout,
      children: [
        { path: '', redirect: '/admin/dashboard' },
        { path: 'dashboard', name: 'admin-dashboard', component: AdminDashboardView, meta: { navKey: 'dashboard' } },
        { path: 'experts', name: 'admin-experts', component: AdminExpertsView, meta: { navKey: 'experts' } },
        { path: 'bookings', name: 'admin-bookings', component: AdminBookingsView, meta: { navKey: 'bookings' } },
        { path: 'payments', name: 'admin-payments', component: AdminPaymentsView, meta: { navKey: 'payments' } },
        { path: 'users', name: 'admin-users', component: AdminUsersView, meta: { navKey: 'users' } },
        { path: 'community', name: 'admin-community', component: AdminCommunityView, meta: { navKey: 'community' } },
        { path: 'assessment-results', name: 'admin-assessment-results', component: AdminAssessmentResultsView, meta: { navKey: 'assessment-results' } }
      ]
    },
    // Khu chuyên gia — shell/sidebar riêng (CSS grid), không dùng chung AppLayout.
    {
      path: '/expert',
      component: ExpertLayout,
      children: [
        { path: '', redirect: '/expert/dashboard' },
        { path: 'dashboard', name: 'expert-dashboard', component: ExpertDashboardView, meta: { navKey: 'dashboard' } },
        { path: 'client-assessments', name: 'expert-client-assessments', component: ExpertClientAssessmentsView, meta: { navKey: 'client-assessments' } },
        { path: 'payments', name: 'expert-payments', component: ExpertPaymentsView, meta: { navKey: 'payments' } },
        { path: 'application', name: 'expert-application', component: ExpertApplicationView, meta: { navKey: 'application' } },
        { path: 'review-status', name: 'expert-review-status', component: ExpertReviewStatusView, meta: { navKey: 'review-status' } }
      ]
    }
  ]
});

export default router;
