import codecs

def append_to_file(filename, extra_content):
    with codecs.open(filename, 'a', 'utf-8') as file:
        file.write(extra_content)
    print(f'Appended to {filename}')

append_to_file('settings.html', '''-info">
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
</html>''')

append_to_file('profile.html', '''size:1.2rem;">🐱</span>
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
</html>''')

append_to_file('journal.html', ''' 156,
                sentiment: 'negative', sentimentLabel: 'Tiêu cực',
                tags: ['#côngviệc', '#áp_lực'],
                preview: 'Deadline đang đến gần và mình cảm thấy mọi thứ quá tải. Không biết bắt đầu từ đâu...',
                content: 'Deadline đang đến gần và mình cảm thấy mọi thứ quá tải.\\n\\nHôm nay sếp lại giao thêm việc. Sếp không biết là mình đã làm việc đến 10 giờ tối cả tuần nay rồi. Ngày mai mình sẽ nói chuyện với chị ấy.',
                aiAnalysis: 'Áp lực công việc đang gây căng thẳng.'
            }
        ];
        function toggleSidebar() { document.getElementById('sidebar').classList.add('open'); document.getElementById('sidebarOverlay').classList.add('open'); }
        function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebarOverlay').classList.remove('open'); }
        function showEmergency() { document.getElementById('emergencyOverlay').classList.add('show'); }
        function closeEmergency() { document.getElementById('emergencyOverlay').classList.remove('show'); }
    </script>
</body>
</html>''')
