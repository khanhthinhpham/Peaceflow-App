        (() => {
            let submitting = false;

            function getApiBaseUrl() {
                return window.location.hostname === 'peaceflow.vn'
                    ? 'https://api.peaceflow.vn/api/v1'
                    : 'http://localhost:4000/api/v1';
            }

            function getAuthHeaders() {
                const accessToken = localStorage.getItem('access_token');
                if (!accessToken) {
                    alert('Vui lòng đăng nhập để lưu dữ liệu tâm trạng.');
                    window.location.href = 'login.html';
                    throw new Error('Missing access token');
                }

                return {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                };
            }

            async function refreshAccessToken() {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) {
                    throw new Error('Missing refresh token');
                }

                const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        refresh_token: refreshToken
                    })
                });

                const result = await response.json().catch(() => ({ success: false, message: 'Refresh failed' }));
                if (!response.ok) {
                    throw new Error(result.message || 'Refresh failed');
                }

                const data = result.data || result;
                const nextAccessToken = data.session?.access_token || data.access_token;
                const nextRefreshToken = data.session?.refresh_token || data.refresh_token;
                const user = data.user;

                if (!nextAccessToken || !nextRefreshToken) {
                    throw new Error('Invalid refresh response');
                }

                localStorage.setItem('access_token', nextAccessToken);
                localStorage.setItem('refresh_token', nextRefreshToken);
                if (user) {
                    localStorage.setItem('user', JSON.stringify(user));
                }

                return nextAccessToken;
            }

            async function fetchWithAuthRetry(url, options = {}, allowRetry = true) {
                let headers = options.headers || {};
                try {
                    headers = {
                        ...headers,
                        ...getAuthHeaders()
                    };
                } catch (error) {
                    throw error;
                }

                const response = await fetch(url, {
                    ...options,
                    headers
                });

                if (response.status === 401 && allowRetry) {
                    try {
                        const nextToken = await refreshAccessToken();
                        const retriedResponse = await fetch(url, {
                            ...options,
                            headers: {
                                ...options.headers,
                                'Content-Type': headers['Content-Type'] || 'application/json',
                                'Authorization': `Bearer ${nextToken}`
                            }
                        });
                        return retriedResponse;
                    } catch (error) {
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('refresh_token');
                        localStorage.removeItem('user');
                        window.location.href = 'login.html';
                        throw error;
                    }
                }

                return response;
            }

            function escapeHtml(value) {
                return String(value ?? '')
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
            }

            function normalizeTrigger(rawTag) {
                const normalized = String(rawTag || '')
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .toLowerCase();

                if (normalized.includes('cong viec')) return 'work';
                if (normalized.includes('gia dinh')) return 'family';
                if (normalized.includes('tinh cam')) return 'relationship';
                if (normalized.includes('tai chinh')) return 'finance';
                if (normalized.includes('suc khoe')) return 'health';
                if (normalized.includes('co don')) return 'lonely';
                if (normalized.includes('mat ngu')) return 'sleep_loss';
                if (normalized.includes('mang xa hoi')) return 'social_media';
                if (normalized.includes('hoc tap')) return 'study';
                if (normalized.includes('khong ro')) return 'unknown';

                return normalized.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
            }

            function deriveMoodPayload() {
                const triggers = Array.from(checkinData.tags).map(normalizeTrigger);
                const anxietyScore = checkinData.score <= 2 ? 9 : checkinData.score <= 4 ? 7 : checkinData.score <= 6 ? 5 : 3;
                const stressScore = triggers.some((tag) => ['work', 'finance', 'study'].includes(tag))
                    ? Math.min(10, anxietyScore + 1)
                    : anxietyScore;
                const energyScore = Math.max(1, Math.min(10, checkinData.score + (checkinData.score >= 7 ? 1 : 0)));
                const sleepScore = triggers.includes('sleep_loss') ? 3 : null;

                return {
                    mood_score: checkinData.score,
                    anxiety_score: anxietyScore,
                    stress_score: stressScore,
                    energy_score: energyScore,
                    sleep_quality_score: sleepScore,
                    dominant_emotion: checkinData.moodLabel || null,
                    triggers,
                    notes: Array.from(checkinData.tags).join(', ') || null
                };
            }

            function getStatusBadge() {
                return document.querySelector('#qs-4 .badge-pill[style*="background:var(--sky-light)"]');
            }

            function setStatusBadge(text) {
                const badge = getStatusBadge();
                if (badge) badge.innerText = text;
            }

            function getTaskEmoji(category) {
                const mapping = {
                    breathing: '💨',
                    meditation: '🧘',
                    journal: '✍️',
                    emergency: '🚨',
                    sleep: '😴',
                    reflection: '🙏'
                };

                return mapping[String(category || '').toLowerCase()] || '✨';
            }

            async function loadRemoteProgress() {
                try {
                    const user = JSON.parse(localStorage.getItem('user') || 'null');
                    if (user) {
                        const name = user.display_name || user.full_name || 'Người dùng';
                        document.querySelectorAll('.user-name').forEach((el) => {
                            el.innerText = name;
                        });
                    }

                    const response = await fetchWithAuthRetry(`${getApiBaseUrl()}/progress`, {
                        method: 'GET'
                    });

                    if (!response.ok) throw new Error('Progress API failed');

                    const result = await response.json();
                    const progress = result.data || result;
                    const xp = progress?.xp ?? 0;
                    const level = progress?.level ?? progress?.current_level ?? 1;

                    document.querySelectorAll('.user-level').forEach((el) => {
                        el.innerText = `⭐ ${xp} XP · Level ${level}`;
                    });

                    const topXp = document.querySelector('.mobile-topbar span[style*="background:var(--peach-light)"]');
                    if (topXp) topXp.innerText = `⭐ ${xp} XP`;
                } catch (error) {
                    console.error('Could not load progress from API:', error);
                }
            }

            async function fetchRecommendedTasks() {
                try {
                    const response = await fetchWithAuthRetry(`${getApiBaseUrl()}/tasks/recommended`, {
                        method: 'GET'
                    });

                    if (!response.ok) throw new Error('Recommended tasks API failed');

                    const result = await response.json();
                    return result.data || result || [];
                } catch (error) {
                    console.error('Could not fetch recommended tasks:', error);
                    return [];
                }
            }

            function renderTaskSuggestions(tasks) {
                const container = document.getElementById('suggestedTasks');
                if (!container) return;

                if (!tasks || !tasks.length) {
                    container.innerHTML = `
                        <div style="font-size:0.85rem;color:var(--text-secondary);">
                            Hệ thống chưa có gợi ý mới. Bạn có thể mở danh sách nhiệm vụ để chọn bài phù hợp.
                        </div>
                    `;
                    return;
                }

                container.innerHTML = tasks.slice(0, 3).map((task) => `
                    <div class="rt-item" onclick="location.href='task-detail.html?id=${task.id}'">
                        <div class="rt-icon">${getTaskEmoji(task.category)}</div>
                        <div class="rt-info">
                            <div class="rt-name">${escapeHtml(task.title)}</div>
                            <div class="rt-meta">${escapeHtml(task.category || 'general')} • ${task.duration_minutes || 0} phút</div>
                        </div>
                        <div class="rt-xp">+${task.xp_reward || 0} XP</div>
                    </div>
                `).join('');
            }

            window.loadData = loadRemoteProgress;

            window.selectMood = function selectMoodOverride(btn, score, label) {
                document.querySelectorAll('.mood-btn').forEach((button) => button.classList.remove('selected'));
                btn.classList.add('selected');

                checkinData.score = score;
                checkinData.moodLabel = label;
                checkinData.mood = btn.querySelector('.mood-emoji').innerText;

                document.getElementById('mascotMoodEmoji').innerText = checkinData.mood;
                document.getElementById('mascotMoodText').innerText = `Bạn đang cảm thấy "${label}". Bạn có thể cho mình biết cường độ cảm xúc này thế nào không?`;
                document.getElementById('intensitySlider').value = score;
                window.updateSlider(score);

                setTimeout(() => {
                    window.goCheckinStep(2);
                }, 400);
            };

            window.updateSlider = function updateSliderOverride(val) {
                checkinData.score = parseInt(val, 10);
                document.getElementById('sliderVal').innerText = val;

                let label = 'Trung bình';
                if (val <= 3) label = 'Rất căng. Cần chăm sóc!';
                else if (val <= 4) label = 'Hơi mệt / Căng nhẹ';
                else if (val <= 6) label = 'Bình thường / Ổn định';
                else if (val <= 8) label = 'Khá tốt / Thoải mái';
                else label = 'Rất tuyệt vời';

                document.getElementById('sliderValLabel').innerText = label;

                const tree = document.getElementById('sliderTree');
                if (val >= 7) tree.innerText = '🌸';
                else if (val >= 4) tree.innerText = '🌿';
                else tree.innerText = '🍂';
            };

            window.toggleTag = function toggleTagOverride(el) {
                el.classList.toggle('selected');
                const tagText = el.innerText.trim();
                if (el.classList.contains('selected')) {
                    checkinData.tags.add(tagText);
                } else {
                    checkinData.tags.delete(tagText);
                }
            };

            window.submitCheckin = async function submitCheckinOverride() {
                if (submitting) return;
                submitting = true;

                document.getElementById('resultEmoji').innerText = checkinData.mood || '🌿';
                document.getElementById('resultMoodBadge').innerText = `${checkinData.mood || ''} ${checkinData.moodLabel || 'Bình thường'}`.trim();
                document.getElementById('resultScoreBadge').innerText = `Mức ${checkinData.score}/10`;
                document.getElementById('resultTitle').innerText = 'Đang lưu tâm trạng...';
                document.getElementById('resultMsg').innerText = 'PeaceFlow đang ghi dữ liệu vào hệ thống và tạo gợi ý phù hợp.';
                setStatusBadge('Đang lưu vào DB');

                try {
                    const response = await fetchWithAuthRetry(`${getApiBaseUrl()}/moods`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(deriveMoodPayload())
                    });

                    if (!response.ok) {
                        const message = await response.text();
                        throw new Error(message || 'Mood API failed');
                    }

                    const suggestedTasks = await fetchRecommendedTasks();
                    renderTaskSuggestions(suggestedTasks);
                    await loadRemoteProgress();

                    document.getElementById('resultTitle').innerText = 'Đã lưu tâm trạng!';
                    document.getElementById('resultMsg').innerText = 'Dữ liệu check-in đã được lưu vào DB và gợi ý đã được cập nhật.';
                    setStatusBadge('Đã lưu vào DB');
                    window.goCheckinStep(4);
                } catch (error) {
                    console.error('Could not save mood to API:', error);
                    document.getElementById('resultTitle').innerText = 'Chưa lưu được tâm trạng';
                    document.getElementById('resultMsg').innerText = 'Bạn có thể thử lại sau vài giây.';
                    setStatusBadge('Lưu thất bại');
                    alert('Không lưu được tâm trạng lên server. Vui lòng thử lại.');
                } finally {
                    submitting = false;
                }
            };

            window.resetCheckin = function resetCheckinOverride() {
                checkinData = { score: 5, mood: null, moodLabel: null, tags: new Set() };
                document.querySelectorAll('.mood-btn').forEach((button) => button.classList.remove('selected'));
                document.querySelectorAll('.tag-btn').forEach((button) => button.classList.remove('selected'));
                document.getElementById('suggestedTasks').innerHTML = '';
                document.getElementById('intensitySlider').value = 5;
                window.updateSlider(5);
                setStatusBadge('Đang chờ lưu');
                window.goCheckinStep(1);
            };

            window.onload = async () => {
                window.updateSlider(5);
                setStatusBadge('Đang chờ lưu');
                await loadRemoteProgress();
            };
        })();
