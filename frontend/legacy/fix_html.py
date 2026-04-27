import os
import codecs

fixes = {
    'settings.html': ('''                            <div class="device-card">
                                <div class="dc-icon">📱</div>
                                <div class="dc''', '''                            <div class="device-card">
                                <div class="dc-icon">📱</div>
                                <div class="dc-info">
                                    <div class="dc-name">Thiết bị hiện tại</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>
    <script>
        function toggleSidebar() { document.getElementById('sidebar').classList.add('open'); document.getElementById('sidebarOverlay').classList.add('open'); }
        function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebarOverlay').classList.remove('open'); }
        function switchSection(sectionId, el) {
            document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
            document.querySelectorAll('.sn-item').forEach(i => i.classList.remove('active'));
            document.getElementById('section-' + sectionId).classList.add('active');
            el.classList.add('active');
        }
        function saveAllSettings() { document.getElementById('toast').classList.add('show'); setTimeout(() => document.getElementById('toast').classList.remove('show'), 3000); }
        function saveSection() { saveAllSettings(); }
        function showEmergency() { document.getElementById('emergencyOverlay').classList.add('show'); }
        function closeEmergency() { document.getElementById('emergencyOverlay').classList.remove('show'); }
    </script>
</body>
</html>'''),
    'achievements.html': ('''    const LEVELS =''', '''    const LEVELS = [
        {level: 1, max_xp: 100},
        {level: 2, max_xp: 300},
        {level: 3, max_xp: 600},
        {level: 4, max_xp: 1000},
        {level: 5, max_xp: 1500}
    ];
    function getLevel(xp) {
        return LEVELS.find(l => xp < l.max_xp) || LEVELS[LEVELS.length - 1];
    }
    function toggleSidebar() { document.getElementById('sidebar').classList.add('open'); document.getElementById('sidebarOverlay').classList.add('open'); }
    function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebarOverlay').classList.remove('open'); }
    function showEmergency() { document.getElementById('emergencyOverlay').classList.add('show'); }
    function closeEmergency() { document.getElementById('emergencyOverlay').classList.remove('show'); }
    </script>
</body>
</html>'''),
    'profile.html': ('''                    <div style="display:flex;gap:8px;align-items:flex-start;">
                        <span style="font-''', '''                    <div style="display:flex;gap:8px;align-items:flex-start;">
                        <span style="font-size:1.2rem;">🐱</span>
                        <div style="font-size:0.75rem;color:var(--text-secondary);">Hãy luôn yêu thương bản thân mỗi ngày nhé!</div>
                    </div>
                </div>
            </div>
        </div>
    </main>
    <script>
        function toggleSidebar() { document.getElementById('sidebar').classList.add('open'); document.getElementById('sidebarOverlay').classList.add('open'); }
        function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebarOverlay').classList.remove('open'); }
        function showEmergency() { document.getElementById('emergencyOverlay').classList.add('show'); }
        function closeEmergency() { document.getElementById('emergencyOverlay').classList.remove('show'); }
        function confirmAction(action, icon, title, text) { alert(title); }
    </script>
</body>
</html>'''),
    'community.html': ('''Kỹ thuật này kéo não trở về hi''', '''Kỹ thuật này kéo não trở về hiện tại, dừng lại vòng luẩn quẩn của suy nghĩ. Mình hy vọng giúp ích được cho ai đó đang cần! 💚',
            reactions:{heart:82,hug:15,strong:40,star:56},
            myReactions:{heart:false,hug:false,strong:false,star:true},
            comments:[],
            showComments:false, collapsed:false
        }
    ];
    function toggleSidebar() { document.getElementById('sidebar').classList.add('open'); document.getElementById('sidebarOverlay').classList.add('open'); }
    function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebarOverlay').classList.remove('open'); }
    function showEmergency() { document.getElementById('emergencyOverlay').classList.add('show'); }
    function closeEmergency() { document.getElementById('emergencyOverlay').classList.remove('show'); }
    </script>
</body>
</html>'''),
    'journal.html': ('''                id: 2, title: 'Áp lực deadline', mood: '😟', moodClass: 'mood-anxious',
                date: 'Hôm qua, 22:15', wordCount:''', '''                id: 2, title: 'Áp lực deadline', mood: '😟', moodClass: 'mood-anxious',
                date: 'Hôm qua, 22:15', wordCount: 156,
                sentiment: 'negative', sentimentLabel: 'Tiêu cực',
                tags: ['#côngviệc', '#áp_lực'],
                preview: 'Deadline đang đến gần và mình cảm thấy mọi thứ quá tải. Không biết bắt đầu từ đâu...',
                content: 'Deadline đang đến gần và mình cảm thấy mọi thứ quá tải. Không biết bắt đầu từ đâu...\\n\\nHôm nay sếp lại giao thêm việc. Sếp không biết là mình đã làm việc đến 10 giờ tối cả tuần nay rồi. Ngày mai mình sẽ nói chuyện với chị ấy.',
                aiAnalysis: 'Áp lực công việc đang gây căng thẳng đáng kể. Tốt nhất là thiết lập ranh giới và chia sẻ trạng thái của mình.'
            }
        ];
        function toggleSidebar() { document.getElementById('sidebar').classList.add('open'); document.getElementById('sidebarOverlay').classList.add('open'); }
        function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebarOverlay').classList.remove('open'); }
        function showEmergency() { document.getElementById('emergencyOverlay').classList.add('show'); }
        function closeEmergency() { document.getElementById('emergencyOverlay').classList.remove('show'); }
    </script>
</body>
</html>'''),
    'expert-booking.html': ('''                            <button class="promo-btn" onclick="applyPromo()''', '''                            <button class="promo-btn" onclick="applyPromo()">Sử dụng</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>
    <script>
        function toggleSidebar() { document.getElementById('sidebar').classList.add('open'); document.getElementById('sidebarOverlay').classList.add('open'); }
        function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebarOverlay').classList.remove('open'); }
        function showEmergency() { document.getElementById('emergencyOverlay').classList.add('show'); }
        function closeEmergency() { document.getElementById('emergencyOverlay').classList.remove('show'); }
        function applyPromo() { alert('Mã khuyến mãi không hợp lệ'); }
        function selectPayment(el) { document.querySelectorAll('.pay-method').forEach(m => m.style.borderColor = 'var(--kraft-light)'); el.style.borderColor = 'var(--mint-dark)'; }
        function nextStep(step) { alert('Chuyển sang bước: '+step); }
    </script>
</body>
</html>'''),
    'mood-chat.html': ('''        keywords.slice(-10).forEach(kw => {''', '''        keywords.slice(-10).forEach(kw => { console.log(kw); });
        function toggleSidebar() { document.getElementById('sidebar').classList.add('open'); document.getElementById('sidebarOverlay').classList.add('open'); }
        function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebarOverlay').classList.remove('open'); }
        function showEmergency() { document.getElementById('emergencyOverlay').classList.add('show'); }
        function closeEmergency() { document.getElementById('emergencyOverlay').classList.remove('show'); }
    </script>
</body>
</html>''')
}

import codecs
for f, (target, replacement) in fixes.items():
    with codecs.open(f, 'r', 'utf-8') as file:
        content = file.read()
    if target in content:
        content = content.replace(target, replacement)
        with codecs.open(f, 'w', 'utf-8') as file:
            file.write(content)
        print(f'Fixed {f}')
    else:
        print(f'Target not found in {f}')
