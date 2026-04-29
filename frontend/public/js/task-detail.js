import { apiClient } from './api-client.js';

let currentPhase = 1;
let timerInterval = null;
let totalSeconds = 300;
let remainingSeconds = 300;
let isPaused = false;
let isCompleted = false;
let stepsCompleted = new Set();
let currentTask = null;

export async function initTask() {
    const urlParams = new URLSearchParams(window.location.search);
    let id = urlParams.get('id');

    if (!id) {
        location.href = 'tasks.html';
        return;
    }

    try {
        const allTasks = await apiClient.get('/tasks') || [];
        currentTask = allTasks.find(t => t.id === id || t.code === id);

        if (!currentTask) {
            alert('Không tìm thấy nhiệm vụ');
            location.href = 'tasks.html';
            return;
        }

        // Update UI
        document.getElementById('taskIcon').innerText = currentTask.metadata?.icon || '🌱';
        document.getElementById('taskIcon').className = `th-icon ${currentTask.category || 'easy'}`;
        document.getElementById('taskTitle').innerText = currentTask.title;
        document.getElementById('breadcrumbTitle').innerText = currentTask.title;
        document.getElementById('taskDesc').innerText = currentTask.description;
        if (currentTask.metadata?.quote) document.getElementById('taskQuote').innerText = currentTask.metadata.quote;

        const duration = currentTask.duration_minutes || 5;
        const xp = currentTask.xp_reward || 10;

        let tagsHtml = `<span class="badge-pill badge-mint">${currentTask.metadata?.catLabel || 'Nhiệm vụ'}</span>`;
        tagsHtml += `<span class="badge-pill badge-mint">⏱ ${duration}m</span>`;
        tagsHtml += `<span class="badge-pill badge-peach">⭐ ${xp} XP</span>`;

        (currentTask.tags || []).forEach(t => {
            tagsHtml += `<span class="badge-pill" style="background:var(--sky-light);color:#4a90aa;border:1.5px solid var(--sky);margin-left:4px;">${t}</span>`;
        });

        document.getElementById('taskMeta').innerHTML = tagsHtml;
        document.getElementById('taskHero').className = `paper-card task-hero cat-${currentTask.difficulty || 'easy'}`;

        // Timer
        totalSeconds = duration * 60;
        remainingSeconds = totalSeconds;
        updateTimerDisplay();

        // Preparation
        const prepContainer = document.getElementById('prepContainer');
        if (currentTask.metadata?.preparation && currentTask.metadata.preparation.length > 0) {
            document.getElementById('prepList').innerHTML = currentTask.metadata.preparation.map(p => `<li>${p}</li>`).join('');
            prepContainer.style.display = 'block';
        } else {
            prepContainer.style.display = 'none';
        }

        // Steps
        const stepList = document.getElementById('stepList');
        if (currentTask.steps && currentTask.steps.length > 0) {
            stepList.innerHTML = currentTask.steps.map((s, i) => `
                <div class="step-item" onclick="toggleStep(this,${i})">
                    <div class="step-num">${i + 1}</div>
                    <div class="step-content"><div class="step-text">${s}</div></div>
                </div>
            `).join('');
        } else {
            stepList.innerHTML = '';
        }

        // Safety
        const safetyContainer = document.getElementById('safetyContainer');
        if (currentTask.safety_notes && currentTask.safety_notes.length > 0) {
            document.getElementById('safetyList').innerHTML = currentTask.safety_notes.map(s => `<li>${s}</li>`).join('');
            safetyContainer.style.display = 'block';
        } else {
            safetyContainer.style.display = 'none';
        }

        // Related
        const relatedTasksDiv = document.getElementById('relatedTasks');
        const related = allTasks.filter(t => t.category === currentTask.category && t.id !== currentTask.id).slice(0, 4);
        relatedTasksDiv.innerHTML = related.map(t => `
            <a href="task-detail.html?id=${t.id}" class="related-task">
                <div class="rt-icon">${t.metadata?.icon || '🌱'}</div>
                <div>
                    <div class="rt-name">${t.title}</div>
                    <div class="rt-meta">${t.category} · +${t.xp_reward} XP</div>
                </div>
            </a>
        `).join('');

    } catch (err) {
        console.error('Error loading task:', err);
    }
}

export function toggleStep(el, index) {
    el.classList.toggle('done');
    if (el.classList.contains('done')) {
        stepsCompleted.add(index);
    } else {
        stepsCompleted.delete(index);
    }

    if (currentTask.steps && stepsCompleted.size === currentTask.steps.length && totalSeconds === 0) {
        completeTask();
    }
}

export function switchPhase(n) {
    if (n === 2 && currentPhase === 1) {
        startTask();
        return;
    }

    document.querySelectorAll('.phase-item').forEach((el, i) => {
        el.className = 'phase-item';
        if (i + 1 === n) el.classList.add('active');
        else if (i + 1 < n) el.classList.add('done');
    });

    document.querySelectorAll('.phase-panel').forEach(el => el.classList.remove('active'));
    document.getElementById('phase-' + n).classList.add('active');

    currentPhase = n;

    if (n === 3) {
        clearInterval(timerInterval);
        document.getElementById('xpEarned').innerText = `+${currentTask.xp_reward || 10} XP`;
    }
}

export function startTask() {
    switchPhase(2);
    if (totalSeconds > 0) {
        startTimer();
    } else {
        document.getElementById('timerPhaseLabel').innerText = `🧘 Đang thực hiện — ${currentTask.title}`;
        document.getElementById('timerPhaseText').innerText = "Thực hiện theo các bước ở phần chuẩn bị. Nhấn Hoàn thành khi xong.";
        document.querySelector('.timer-ring-wrap').style.display = 'none';
    }
}

export function startTimer() {
    isPaused = false;
    clearInterval(timerInterval);
    document.getElementById('timerPhaseLabel').innerText = `🧘 Đang thực hiện — ${currentTask.title}`;
    document.getElementById('timerPhaseText').innerText = "Bắt đầu tập trung...";
    document.querySelector('.timer-ring-wrap').style.display = 'block';

    timerInterval = setInterval(() => {
        if (!isPaused) {
            remainingSeconds--;
            updateTimerDisplay();
            if (remainingSeconds <= 0) {
                clearInterval(timerInterval);
                completeTask();
            }
        }
    }, 1000);
}

export function pauseTimer() {
    isPaused = !isPaused;
    document.getElementById('pauseBtn').innerText = isPaused ? "▶ Tiếp tục" : "⏸ Tạm dừng";
    document.getElementById('timerPhaseText').innerText = isPaused ? "Đã tạm dừng" : "Tiếp tục...";
}

export function resetTimer() {
    isPaused = true;
    remainingSeconds = totalSeconds;
    updateTimerDisplay();
    document.getElementById('pauseBtn').innerText = "▶ Tiếp tục";
    document.getElementById('timerPhaseText').innerText = "Sẵn sàng...";
}

function updateTimerDisplay() {
    const m = Math.floor(remainingSeconds / 60);
    const s = remainingSeconds % 60;
    document.getElementById('timerDisplay').innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
    const ring = document.getElementById('timerRing');
    if (ring) {
        const dashoffset = 440 - (440 * (remainingSeconds / totalSeconds));
        ring.style.strokeDashoffset = dashoffset;
    }
}

export async function completeTask() {
    if (isCompleted) return;
    isCompleted = true;
    clearInterval(timerInterval);

    try {
        await apiClient.post(`/tasks/${currentTask.id}/complete`, {
            self_rating_before: 5,
            self_rating_after: 8,
            notes: 'Completed via PeaceFlow app'
        });
        
        // Local feedback
        const savedStats = localStorage.getItem('PeaceFlow_user_stats');
        if (savedStats) {
            const stats = JSON.parse(savedStats);
            stats.xp += (currentTask.xp_reward || 10);
            localStorage.setItem('PeaceFlow_user_stats', JSON.stringify(stats));
        }
    } catch (e) {
        console.error('Error logging completion:', e);
    }

    switchPhase(3);
    fireConfetti();
}

function fireConfetti() {
    const colors = ['#A8D5BA', '#FFD93D', '#FF8B8B', '#A8D8EA', '#C3AED6'];
    const container = document.getElementById('confettiContainer');
    if (!container) return;
    for (let i = 0; i < 100; i++) {
        const conf = document.createElement('div');
        conf.className = 'confetti-piece';
        conf.style.left = Math.random() * 100 + 'vw';
        conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        conf.style.width = (Math.random() * 8 + 5) + 'px';
        conf.style.height = (Math.random() * 12 + 8) + 'px';
        conf.style.animationDuration = (Math.random() * 3 + 2) + 's';
        conf.style.animationDelay = (Math.random() * 0.5) + 's';
        container.appendChild(conf);
    }
    setTimeout(() => container.innerHTML = '', 5000);
}

window.addEventListener('DOMContentLoaded', () => {
    initTask();
    
    // Bind globals for legacy onclicks
    window.toggleStep = toggleStep;
    window.switchPhase = switchPhase;
    window.pauseTimer = pauseTimer;
    window.resetTimer = resetTimer;
    window.completeTask = completeTask;
    window.toggleSidebar = () => {
        document.getElementById('sidebar').classList.toggle('open');
        document.getElementById('sidebarOverlay').classList.toggle('open');
    };
    window.closeSidebar = () => {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.remove('open');
    };
    window.showEmergency = () => document.getElementById('emergencyOverlay').classList.add('show');
    window.closeEmergency = () => document.getElementById('emergencyOverlay').classList.remove('show');
});
