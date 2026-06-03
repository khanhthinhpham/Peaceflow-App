# AI Personalization Roadmap — PeaceFlow

## Tổng quan
Peaceflow hiện dùng hệ thống rule-based hoàn toàn. Người dùng có dữ liệu phong phú (mood, journal, tasks, assessments, risk snapshots) nhưng chưa được khai thác. Tích hợp AI để biến dữ liệu thành trải nghiệm cá nhân hóa thật sự cho từng người.

---

## Kiến trúc kỹ thuật

### RAG Pipeline (cho Task Recommendation)
```
DB (tasks catalog) → Embedding → Vector Store (pgvector/Supabase)
                                        ↓
User context (mood, journal, risk) → Embed → Similarity Search → Top-K tasks
                                                                        ↓
                                                               Claude reasoning
                                                                        ↓
                                                          Ranked + rationale
```

### Kỹ thuật RAG nâng cao
| Kỹ thuật | Mô tả | Khi dùng |
|---|---|---|
| **Hybrid Search** | Vector + BM25 → RRF merge | Phase 1, hiệu quả nhất |
| **Re-ranking** | Cross-encoder re-rank top-K | Khi cần precision cao |
| **HyDE** | Claude tạo "bài tập lý tưởng" → embed → search | Khi query abstract |
| **Contextual Chunking** | Embed nhiều representation của task | Catalog lớn |
| **Personalized Embedding** | Task vector + user history | Phase 3 |
| **Feedback Loop** | Click/skip → fine-tune embeddings | Production scale |

### Fallback Pattern
Mọi AI call đều try/catch → fallback về rule-based. App không break nếu Claude unavailable.

### Prompt Caching
- System prompt + task catalog: cache ephemeral → tiết kiệm ~80% token
- User profile: cache riêng mỗi user

---

## 20 Use Cases AI

### 🔴 CORE — Làm trước (Phase 1)

---

#### 1. Dashboard Insight
**Hiện tại:** Template cứng — *"Tâm trạng 7 ngày đang tăng 1 điểm"* — giống nhau cho mọi người.

**Với AI:** Claude đọc mood trend, journal sentiment, task history, risk level → viết nhận xét cá nhân hóa.

**Kịch bản — Linh, deadline dồn dập:**
> "Mình nhận thấy mood của bạn tụt vào thứ 2-3 hàng tuần trong 3 tuần liền nhưng phục hồi cuối tuần — đây là dấu hiệu áp lực công việc theo chu kỳ chứ không phải vấn đề kéo dài. Bài thiền thứ 6 tuần trước có vẻ hiệu quả — mood tăng 2 điểm ngay hôm sau."

**Tech:** Thay `buildInsight()` trong `report.routes.js` bằng Claude call. Cùng format `{title, body, tags}` — không đổi frontend.

---

#### 2. Mood Chat thật sự
**Hiện tại:** Mocked hoàn toàn — hardcoded flows, static responses.

**Với AI:** Claude có context mood, journal, risk level → đối thoại thật sự.

**Kịch bản:**
> User: "tôi rất mệt"
> *(Không AI)*: "Hãy thử bài thở 4-4-4 nhé!"
> *(Có AI)*: "Mệt kiểu nào vậy bạn — mệt thể chất hay mệt trong đầu? Mình thấy streak của bạn bị phá hôm qua, chuyện gì xảy ra?"

**Tech:** Endpoint `POST /ai/chat` với streaming. Safety: detect crisis keywords → inject hotline trước khi reply.

---

#### 3. Task Recommendation (RAG)
**Hiện tại:** Rule-based scoring — 2 user cùng stress nhận cùng danh sách task.

**Với AI:** RAG tìm task phù hợp ngữ nghĩa + Claude re-rank theo context cụ thể từng người.

**Kịch bản — 2 user cùng stress 8/10:**
> *User A (hay cô đơn, tránh vận động)*: "🫂 Ôm bản thân — Hôm nay bạn cần kết nối với chính mình hơn là giải tỏa năng lượng."
> *User B (deadline, đã thở nhiều lần)*: "⏱ Pomodoro cảm xúc — Bạn đã làm thở 4 lần tuần này rồi, thử cái này theo hướng khác."

**Tech:** pgvector (Supabase sẵn có) + Hybrid Search + Claude reasoning.

---

#### 4. Journal Sentiment + Theme Analysis
**Hiện tại:** `sentiment_score` luôn NULL — risk engine dùng default 30.

**Với AI:** Mỗi khi save journal → Claude phân tích → điền `sentiment_score` + extract `tags` → risk engine chính xác hơn.

**Kịch bản:**
> User viết: *"Hôm nay lại cãi với bạn cùng phòng. Mọi người cứ nghĩ tôi lạnh lùng..."*
> AI: sentiment_score = -0.6, tags = ["mối quan hệ", "giao tiếp", "hiểu lầm"]
> Hệ thống: trigger "social_isolation" tăng → tuần sau gợi ý task phù hợp hơn

**Tech:** Fire-and-forget sau `POST /journal` — không block response user.

---

#### 5. Assessment Interpretation
**Hiện tại:** Chỉ hiện điểm + severity label.

**Với AI:** Giải thích kết quả bằng ngôn ngữ bình dân, cá nhân hóa theo profile.

**Kịch bản — PHQ-9 điểm 12:**
> *(Không AI)*: "Mức độ: Trầm cảm vừa"
> *(Có AI)*: "Điểm 12 cho thấy bạn đang trải qua một số triệu chứng — điều này rất phổ biến trong giai đoạn nhiều áp lực. 3 câu bạn trả lời cao nhất là mệt mỏi, khó tập trung, mất hứng thú — liên quan đến kiệt sức hơn là trầm cảm lâm sàng. Bạn không cần lo quá, nhưng nên theo dõi và thử bài phục hồi năng lượng trước."

---

### 🟡 GROWTH — Phase 2

---

#### 6. Crisis Detection (Proactive)
**Hiện tại:** Cảnh báo chỉ khi stress_index vượt ngưỡng tại thời điểm đó.

**Với AI:** Phát hiện pattern suy giảm sớm TRƯỚC khi vượt ngưỡng.

**Kịch bản — mood vẫn 6/10 (không trigger rule):**
> AI nhận ra: nhật ký 5 ngày liên tiếp có "không muốn", "mệt", "vô nghĩa" + sleep 7→4 + không làm bài tập nào
> → Notification: "Mình nhận thấy bạn có vẻ không được ổn mấy ngày nay. Check-in 1 phút thôi nhé?"

---

#### 7. Weekly AI Report
**Hiện tại:** Biểu đồ số liệu, không có narrative.

**Với AI:** Claude viết tổng kết tuần như một người bạn đồng hành.

**Kịch bản:**
> "Tuần này có 2 pha rõ: đầu tuần stress cao (8-9/10) liên quan deadline, cuối tuần phục hồi tốt. Thú vị là bạn hoàn thành nhiều bài tập hơn vào đúng ngày stress nhất — đây là dấu hiệu bạn đang xây được thói quen tốt dưới áp lực. Tuần này thử thêm 1 bài thiền sáng để giảm đà tăng stress đầu tuần."

---

#### 8. Expert Matching
**Hiện tại:** Hiển thị theo rating.

**Với AI:** Match theo profile tâm lý thực tế của user.

**Kịch bản — GAD7 cao, nhật ký hay nhắc "sợ bị phán xét":**
> "ThS. Lan Anh chuyên về lo âu xã hội có thể phù hợp nhất với bạn. Pattern của bạn cho thấy lo âu liên quan đến tương tác người — đây đúng chuyên môn của cô ấy."

---

#### 9. Trigger Mapping
**Hiện tại:** Trigger là keyword match đơn giản.

**Với AI:** Build map nhân quả cá nhân.

**Kịch bản:**
> "Với bạn cụ thể: Họp nhiều → stress tăng → ngủ kém → mood giảm hôm sau → hay cáu → lại stress. Vòng lặp này xuất hiện 4 lần tháng vừa rồi. Điểm bẻ gãy hiệu quả nhất với bạn là bài thở SAU khi họp xong."

---

#### 10. Smart Reminders
**Hiện tại:** Cùng giờ, cùng message mọi ngày.

**Với AI:** Nhắc đúng lúc, đúng context.

**Kịch bản:**
> Thứ 3 3h chiều: *"Bạn hay stress nhất vào giờ này — check-in 30 giây nhé?"*
> Tối thứ 6: *"Cuối tuần rồi, mood bạn thường tốt hơn — ghi lại để giữ năng lượng cho tuần sau."*

---

#### 11. Journal Writing Prompts
**Hiện tại:** Placeholder cứng.

**Với AI:** Câu hỏi gợi ý theo mood hiện tại.

**Kịch bản — mood 4/10, trigger: "work":**
> "💡 Hôm nay thử viết: *Điều gì ở công việc đang khiến bạn mệt nhất — là công việc thật sự, hay là cách mọi người xung quanh hành xử?*"

---

#### 12. Community Moderation
**Hiện tại:** User report → admin review thủ công.

**Với AI:** Realtime detection.

**Kịch bản:**
> User đăng: *"Tôi không muốn sống nữa"*
> AI → ẩn bài ngay + popup riêng tư: "Mình đọc bài bạn vừa viết. Bạn có thể nói chuyện với mình không? Hoặc gọi 0931773637 ngay bây giờ."

---

### 🟢 ADVANCED — Phase 3

---

#### 13. Custom Task Generation
**Với AI:** Tạo bài tập chưa có trong catalog phù hợp tình huống cụ thể.

**Kịch bản:**
> User: *"Tôi hay lo trước khi họp với sếp"*
> AI tạo bài mới: "Kỹ thuật Tái khung 3 phút: viết điều tệ nhất có thể xảy ra, rồi xác suất thật sự của nó..."

---

#### 14. Mood Prediction
**Với AI:** Dự báo mood dựa trên pattern.

**Kịch bản:**
> "Dựa trên 2 tháng qua, thứ 2 tuần tới có thể là ngày khó. Chuẩn bị trước không?"

---

#### 15. Recovery Narrative
**Với AI:** Câu chuyện tiến trình hồi phục cá nhân.

**Kịch bản — sau 30 ngày:**
> "Bạn đã đi được một đoạn dài. Tháng trước stress trung bình 7.2, tháng này 5.8. Không phải vì cuộc sống dễ hơn — deadline vẫn nhiều — mà vì bạn bắt đầu biết mình cần gì khi khó."

---

#### 16. Adaptive Difficulty
**Với AI:** Tự điều chỉnh độ khó task theo engagement thực tế.

**Kịch bản:**
> User liên tục bỏ qua bài 15 phút → AI tự chỉ gợi ý bài ≤5 phút cho đến khi engagement tăng trở lại.

---

#### 17. Achievement Insights
**Với AI:** Giải thích ý nghĩa huy hiệu theo hành trình cá nhân.

**Kịch bản:**
> "Bạn vừa mở khóa **Kiên Cường** — tuần mà bạn stress cao nhất (8.5/10 trung bình), bạn vẫn hoàn thành 7/7 ngày. Đó chính xác là ý nghĩa huy hiệu này."

---

#### 18. Sleep Coaching
**Với AI:** Insight kết nối sleep với các yếu tố khác.

**Kịch bản:**
> "Sleep score giảm đều 3 tuần, từ 7→4. Pattern bắt đầu đúng lúc bạn nhắc 'deadline tháng 12'. Bài Body Scan trước ngủ — bạn đã làm 2 lần, cả 2 lần sleep score hôm sau đều tăng."

---

#### 19. Personalized Onboarding
**Với AI:** Onboarding động, câu hỏi follow-up theo câu trả lời.

**Kịch bản:**
> User: "Tôi hay lo lắng về công việc"
> AI: "Lo lắng này ảnh hưởng đến giấc ngủ không? Hay thường chỉ xuất hiện trong giờ làm việc?"

---

#### 20. Emergency Response cá nhân hóa
**Với AI:** Lời động viên theo tên và pattern cụ thể, không phải text cứng.

**Kịch bản — Minh, 2h sáng, hay lo về học hành, streak 12 ngày:**
> "Minh ơi, 2 giờ sáng rồi mà bạn vẫn thức. Mình ở đây. Streak 12 ngày cho thấy bạn đã rất cố gắng — hôm nay chỉ là một đêm khó thôi."

---

## Thứ tự implement

| Phase | Tính năng | Lý do ưu tiên |
|---|---|---|
| **Phase 1** | Dashboard Insight | Impact cao, ít rủi ro, không đổi frontend |
| **Phase 1** | Journal Sentiment | Fire-and-forget, an toàn, cải thiện toàn hệ thống |
| **Phase 1** | Mood Chat → Claude | UI đã có sẵn, chỉ cần backend |
| **Phase 1** | Task RAG | Core value proposition |
| **Phase 1** | Assessment Interpretation | Dễ implement, high value |
| **Phase 2** | Crisis Detection | Safety critical |
| **Phase 2** | Weekly Report | Retention driver |
| **Phase 2** | Expert Matching | Revenue impact |
| **Phase 2** | Trigger Mapping | Deep personalization |
| **Phase 2** | Smart Reminders | Engagement driver |
| **Phase 3** | Custom Task Gen | Requires fine data |
| **Phase 3** | Mood Prediction | Requires 3+ months data |
| **Phase 3** | Recovery Narrative | Long-term users |

## Dữ liệu có sẵn để dùng ngay

| Data | Bảng DB | Dùng cho |
|---|---|---|
| Mood history 90 ngày | `mood_checkins` | Insight, prediction, pattern |
| Journal entries | `journal_entries` | Sentiment, prompts, chat context |
| Task history | `task_completions` | RAG personalization, effectiveness |
| Assessment results | `assessment_results` | Expert matching, interpretation |
| Risk snapshots | `risk_snapshots` | Crisis detection, coaching |
| User profile | `user_profiles` | Goals, triggers, weights |
| Badges | `user_badges` | Achievement insights |

## Stack kỹ thuật

- **AI Model:** `claude-haiku-4-5-20251001` (nhanh, rẻ) cho real-time features
- **AI Model:** `claude-sonnet-4-6` cho deep analysis (weekly report, crisis)
- **Vector DB:** pgvector (Supabase, đã có sẵn)
- **Embedding:** Voyage AI hoặc Claude Embeddings
- **Prompt Caching:** Anthropic ephemeral cache — tiết kiệm 80% token
- **Streaming:** Server-Sent Events cho mood chat
