# Tổng hợp bài test tâm lý — PeaceFlow

Tài liệu tổng hợp toàn bộ 28 bài test tâm lý đang dùng trong hệ thống: câu hỏi, các phương án trả lời kèm điểm, và công thức/ngưỡng xếp loại cho từng thang điểm.

## Mục lục

1. DASS-21 — Depression Anxiety Stress Scales
2. GAD-7 — Generalized Anxiety Disorder 7-item
3. HARS — Hamilton Anxiety Rating Scale
4. PHQ-9 — Patient Health Questionnaire-9
5. BDI — Thang Đánh Giá Trầm Cảm Beck (Beck Depression Inventory)
6. PSQI — Pittsburgh Sleep Quality Index (Theo quy trình Bộ Y tế)
7. PSS — Perceived Stress Scale — Thang đo stress cảm nhận
8. SDQ-25 — Bảng hỏi Điểm mạnh & Khó khăn (Tự đánh giá)
9. MMSE — Mini-Mental State Exam — Trạng thái tâm thần tối thiểu
10. ISI — Insomnia Severity Index — Mức độ mất ngủ
11. IAT — Internet Addiction Test — Mức độ nghiện Internet
12. AUDIT — Alcohol Use Disorders Identification Test — Mức độ sử dụng rượu bia
13. HDRS — Hamilton Depression Rating Scale
14. CDI — Children's Depression Inventory
15. GDS — Geriatric Depression Scale
16. EPDS — Edinburgh Postnatal Depression Scale
17. ZAI — Zung Self-Rating Anxiety Inventory (Trắc nghiệm Lo âu Zung)
18. HADS — Hospital Anxiety and Depression Scale (Trắc nghiệm Lo âu - Trầm cảm)
19. M-CHAT — Trắc nghiệm sàng lọc tự kỷ cho trẻ nhỏ 16-30 tháng (M-CHAT)
20. ASQ-3 (24 tháng) — Trắc nghiệm giai đoạn và lứa tuổi cho trẻ em — Phiếu 6, 24-35 tháng tuổi (ASQ-3, bản Có/Không theo Bộ Y tế)
21. CGI-S — Trắc nghiệm Ấn tượng lâm sàng chung - Mức độ nặng (Clinical Global Impression - Severity Scale)
22. BPRS — Trắc nghiệm Tâm thần rút gọn (Brief Psychiatric Rating Scale)
23. PANSS — Thang Hội chứng Dương tính và Âm tính (Positive and Negative Syndrome Scale)
24. AIMS — Trắc nghiệm vận động bất thường (Abnormal Involuntary Movement Scale)
25. HACHINSKI — Trắc nghiệm điểm thiếu máu cục bộ Hachinski (Hachinski Ischemic Score)
26. HIMMELBACH — Trắc nghiệm mức độ nghiện Himmelbach (Himmelbach Withdrawal Scale)
27. EPI — Trắc nghiệm Nhân cách Eysenck (Eysenck Personality Inventory)
28. Vanderbilt — Thang Đánh giá Rối loạn Tăng động Giảm chú ý Vanderbilt (dành cho cha mẹ)

---

## DASS-21 — Depression Anxiety Stress Scales

*Mã hệ thống: `dass21` · Số câu: 21 · Điểm tối đa: 42 · Mốc thời gian hỏi: 2 tuần qua*

### Câu hỏi & đáp án

**Thang trả lời chung cho tất cả câu:** 😊 Không xảy ra (0) · 😐 Đôi khi (1) · 😟 Thường xuyên (2) · 😰 Hầu hết lúc (3)

| # | Câu hỏi | Nhóm |
|---|---|---|
| 1 | Tôi thấy khó mà thoải mái được | Căng thẳng |
| 2 | Tôi cảm thấy khô miệng | Lo âu |
| 3 | Tôi không thể cảm nhận được bất kỳ cảm xúc tích cực nào | Trầm cảm |
| 4 | Tôi gặp khó khăn trong việc thở (thở gấp, khó thở dù không vận động) | Lo âu |
| 5 | Tôi thấy khó có thể bắt đầu làm bất cứ việc gì | Trầm cảm |
| 6 | Tôi có xu hướng phản ứng thái quá với các tình huống | Căng thẳng |
| 7 | Tôi cảm thấy run rẩy (ví dụ: tay run) | Lo âu |
| 8 | Tôi cảm thấy mình đang tiêu tốn nhiều năng lượng thần kinh | Căng thẳng |
| 9 | Tôi lo lắng về những tình huống có thể khiến tôi hoảng sợ hoặc bị coi là ngốc nghếch | Lo âu |
| 10 | Tôi cảm thấy không có gì để mong đợi | Trầm cảm |
| 11 | Tôi thấy bản thân trở nên kích động | Căng thẳng |
| 12 | Tôi thấy khó thư giãn | Căng thẳng |
| 13 | Tôi cảm thấy buồn bã và chán nản | Trầm cảm |
| 14 | Tôi không kiên nhẫn khi bị gián đoạn | Căng thẳng |
| 15 | Tôi cảm thấy gần như hoảng loạn | Lo âu |
| 16 | Tôi không thể hào hứng với bất cứ điều gì | Trầm cảm |
| 17 | Tôi cảm thấy mình không có giá trị như một con người | Trầm cảm |
| 18 | Tôi cảm thấy khá dễ bị kích thích | Căng thẳng |
| 19 | Tôi nhận thức được nhịp tim của mình dù không vận động thể chất | Lo âu |
| 20 | Tôi cảm thấy sợ hãi mà không có lý do chính đáng | Lo âu |
| 21 | Tôi cảm thấy cuộc sống vô nghĩa | Trầm cảm |

### Cách tính điểm

**Trầm cảm (`depression`):**
- Công thức: Tổng điểm câu {3, 5, 10, 13, 16, 17, 21} × 2
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–9 | Bình thường |
  | 10–13 | Nhẹ |
  | 14–20 | Vừa |
  | 21–27 | Nặng |
  | > 27 | Rất nặng |

**Lo âu (`anxiety`):**
- Công thức: Tổng điểm câu {2, 4, 7, 9, 15, 19, 20} × 2
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–7 | Bình thường |
  | 8–9 | Nhẹ |
  | 10–14 | Vừa |
  | 15–19 | Nặng |
  | > 19 | Rất nặng |

**Căng thẳng (`stress`):**
- Công thức: Tổng điểm câu {1, 6, 8, 11, 12, 14, 18} × 2
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–14 | Bình thường |
  | 15–18 | Nhẹ |
  | 19–25 | Vừa |
  | 26–33 | Nặng |
  | > 33 | Rất nặng |


---

## GAD-7 — Generalized Anxiety Disorder 7-item

*Mã hệ thống: `gad7` · Số câu: 7 · Điểm tối đa: 21 · Mốc thời gian hỏi: 2 tuần qua*

### Câu hỏi & đáp án

**Thang trả lời chung cho tất cả câu:** 🙂 Không bao giờ (0) · 😐 Vài ngày (1) · 😟 Hơn nửa số ngày (2) · 😰 Gần như mọi ngày (3)

| # | Câu hỏi | Nhóm |
|---|---|---|
| 1 | Cảm thấy lo lắng, bồn chồn hoặc căng thẳng | Lo âu |
| 2 | Không thể ngừng hoặc kiểm soát được sự lo lắng | Lo âu |
| 3 | Lo lắng quá mức về nhiều thứ khác nhau | Lo âu |
| 4 | Khó thư giãn | Lo âu |
| 5 | Bồn chồn đến mức khó ngồi yên | Lo âu |
| 6 | Dễ bực bội hoặc cáu kỉnh | Lo âu |
| 7 | Cảm thấy sợ hãi như thể có điều gì đó tồi tệ sắp xảy ra | Lo âu |

### Cách tính điểm

**Lo âu (`anxiety`):**
- Công thức: Tổng điểm câu {1, 2, 3, 4, 5, 6, 7}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–4 | Bình thường |
  | 5–9 | Nhẹ |
  | 10–14 | Vừa |
  | 15–21 | Nặng |
  | > 21 | Rất nặng |


---

## HARS — Hamilton Anxiety Rating Scale

*Mã hệ thống: `hars` · Số câu: 14 · Điểm tối đa: 56 · Mốc thời gian hỏi: Gần đây*

### Câu hỏi & đáp án

**Thang trả lời chung cho tất cả câu:** ✅ Không có (0) · 🟡 Nhẹ (1) · 🟠 Vừa phải (2) · 🔴 Nặng (3) · 🚨 Rất nặng (4)

| # | Câu hỏi | Nhóm |
|---|---|---|
| 1 | Tâm trạng lo âu (lo lắng, linh cảm xấu, sợ hãi thái quá) | Tâm lý |
| 2 | Căng thẳng (hay giật mình, dễ khóc, run rẩy, bồn chồn) | Tâm lý |
| 3 | Sợ hãi (sợ bóng tối, người lạ, ở một mình, đám đông) | Tâm lý |
| 4 | Mất ngủ (khó ngủ, ngủ không sâu, hay gặp ác mộng, mệt mỏi khi dậy) | Tâm lý |
| 5 | Nhận thức và suy nghĩ (khó tập trung, trí nhớ kém) | Tâm lý |
| 6 | Tâm trạng trầm cảm (mất hứng thú, không thấy vui, dậy sớm) | Tâm lý |
| 7 | Triệu chứng cơ bắp (đau nhức cơ, co giật, căng cứng) | Thể chất |
| 8 | Triệu chứng giác quan (ù tai, mờ mắt, nóng lạnh bất thường) | Thể chất |
| 9 | Triệu chứng tim mạch (tim đập nhanh, đau ngực, mạch đập mạnh) | Thể chất |
| 10 | Triệu chứng hô hấp (khó thở, ngột ngạt, nghẹn họng) | Thể chất |
| 11 | Triệu chứng tiêu hóa (khó nuốt, đau dạ dày, buồn nôn, tiêu chảy) | Thể chất |
| 12 | Hệ bài tiết/Sinh dục (đi tiểu nhiều, giảm ham muốn) | Thể chất |
| 13 | Triệu chứng thần kinh thực vật (khô miệng, đổ mồ hôi, đỏ mặt, tái nhợt) | Thể chất |
| 14 | Hành vi bồn chồn (thở dài, nuốt liên tục, run rẩy khi giao tiếp) | Tâm lý |

### Cách tính điểm

**Tâm lý (`psychic`):**
- Công thức: Tổng điểm câu {1, 2, 3, 4, 5, 6, 14}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | > -1 | Tâm lý |

**Thể chất (`somatic`):**
- Công thức: Tổng điểm câu {7, 8, 9, 10, 11, 12, 13}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | > -1 | Thể chất |

**Tổng điểm (`total`):**
- Công thức: Tổng điểm câu {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–17 | Bình thường / Nhẹ |
  | 18–24 | Vừa |
  | 25–30 | Nặng |
  | > 30 | Rất nặng |


---

## PHQ-9 — Patient Health Questionnaire-9

*Mã hệ thống: `phq9` · Số câu: 9 · Điểm tối đa: 27 · Mốc thời gian hỏi: 2 tuần qua*

### Câu hỏi & đáp án

**Thang trả lời chung cho tất cả câu:** 🙂 Không bao giờ (0) · 😐 Vài ngày (1) · 😟 Hơn nửa số ngày (2) · 😰 Gần như mọi ngày (3)

| # | Câu hỏi | Nhóm |
|---|---|---|
| 1 | Ít hứng thú hoặc niềm vui khi làm việc / sinh hoạt | Trầm cảm |
| 2 | Cảm thấy buồn bã, chán nản hoặc tuyệt vọng | Trầm cảm |
| 3 | Khó đi vào giấc ngủ, ngủ không sâu giấc, hoặc ngủ quá nhiều | Trầm cảm |
| 4 | Cảm thấy mệt mỏi hoặc ít năng lượng | Trầm cảm |
| 5 | Chán ăn hoặc ăn quá mức | Trầm cảm |
| 6 | Cảm thấy tồi tệ về bản thân - hoặc cảm thấy mình là kẻ thất bại, làm gia đình thất vọng | Trầm cảm |
| 7 | Khó tập trung vào mọi việc (ví dụ: đọc báo, công việc, xem tivi) | Trầm cảm |
| 8 | Di chuyển hoặc nói chuyện chậm chạp đến mức người khác cũng chú ý. Hoặc ngược lại - bồn chồn, đi lại liên tục | Trầm cảm |
| 9 | Có ý nghĩ thà chết đi cho xong hoặc muốn tự làm hại bản thân bằng một cách nào đó | Trầm cảm |

### Cách tính điểm

**Trầm cảm (`depression`):**
- Công thức: Tổng điểm câu {1, 2, 3, 4, 5, 6, 7, 8, 9}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–4 | Bình thường |
  | 5–9 | Nhẹ |
  | 10–14 | Vừa |
  | 15–19 | Nặng trung bình |
  | > 19 | Nghiêm trọng |


---

## BDI — Thang Đánh Giá Trầm Cảm Beck (Beck Depression Inventory)

*Mã hệ thống: `bdi` · Số câu: 21 · Điểm tối đa: 63 · Mốc thời gian hỏi: hiện tại*

### Câu hỏi & đáp án

**Câu 1 (Trầm cảm):** Cảm xúc buồn

- 🙂 Tôi không cảm thấy buồn. — 0 điểm
- 😐 Tôi cảm thấy buồn. — 1 điểm
- 😟 Tôi luôn cảm thấy buồn và không thể thoát khỏi cảm giác đó. — 2 điểm
- 😰 Tôi buồn và đau khổ đến mức không thể chịu đựng được. — 3 điểm

**Câu 2 (Trầm cảm):** Bi quan về tương lai

- 🙂 Tôi không đặc biệt bi quan về tương lai. — 0 điểm
- 😐 Tôi cảm thấy bi quan về tương lai. — 1 điểm
- 😟 Tôi cảm thấy mình không còn điều gì để mong đợi trong tương lai. — 2 điểm
- 😰 Tôi cảm thấy tương lai hoàn toàn vô vọng và mọi việc không thể cải thiện. — 3 điểm

**Câu 3 (Trầm cảm):** Cảm giác thất bại

- 🙂 Tôi không cảm thấy mình là người thất bại. — 0 điểm
- 😐 Tôi cảm thấy mình thất bại nhiều hơn một người bình thường. — 1 điểm
- 😟 Khi nhìn lại cuộc đời mình, tôi chỉ thấy rất nhiều thất bại. — 2 điểm
- 😰 Tôi cảm thấy mình hoàn toàn là một người thất bại. — 3 điểm

**Câu 4 (Trầm cảm):** Mất hứng thú và khả năng cảm nhận sự hài lòng

- 🙂 Tôi vẫn cảm thấy hài lòng với mọi việc như trước đây. — 0 điểm
- 😐 Tôi không còn thấy thích thú với mọi việc như trước đây. — 1 điểm
- 😟 Tôi không còn thực sự cảm thấy hài lòng với bất cứ điều gì nữa. — 2 điểm
- 😰 Tôi cảm thấy không hài lòng hoặc buồn chán với mọi thứ. — 3 điểm

**Câu 5 (Trầm cảm):** Cảm giác có lỗi

- 🙂 Tôi không cảm thấy đặc biệt có lỗi. — 0 điểm
- 😐 Tôi cảm thấy có lỗi trong một khoảng thời gian đáng kể. — 1 điểm
- 😟 Tôi cảm thấy khá có lỗi trong phần lớn thời gian. — 2 điểm
- 😰 Tôi luôn luôn cảm thấy có lỗi. — 3 điểm

**Câu 6 (Trầm cảm):** Cảm giác bị trừng phạt

- 🙂 Tôi không cảm thấy mình đang bị trừng phạt. — 0 điểm
- 😐 Tôi cảm thấy mình có thể bị trừng phạt. — 1 điểm
- 😟 Tôi nghĩ rằng mình sẽ bị trừng phạt. — 2 điểm
- 😰 Tôi cảm thấy mình đang bị trừng phạt. — 3 điểm

**Câu 7 (Trầm cảm):** Không hài lòng với bản thân

- 🙂 Tôi không cảm thấy thất vọng về bản thân. — 0 điểm
- 😐 Tôi thất vọng về bản thân. — 1 điểm
- 😟 Tôi cảm thấy ghê tởm và chán ghét bản thân. — 2 điểm
- 😰 Tôi ghét chính bản thân mình. — 3 điểm

**Câu 8 (Trầm cảm):** Tự phê phán bản thân

- 🙂 Tôi không cảm thấy mình kém hơn bất kỳ ai khác. — 0 điểm
- 😐 Tôi tự phê phán bản thân vì những điểm yếu hoặc sai lầm của mình. — 1 điểm
- 😟 Tôi luôn tự trách mình về những khuyết điểm của bản thân. — 2 điểm
- 😰 Tôi tự trách mình về mọi điều tồi tệ xảy ra. — 3 điểm

**Câu 9 (Trầm cảm):** Ý nghĩ về cái chết hoặc tự sát

- 🙂 Tôi không có bất kỳ ý nghĩ nào về việc tự sát. — 0 điểm
- 😐 Tôi có ý nghĩ tự sát, nhưng tôi sẽ không thực hiện điều đó. — 1 điểm
- 😟 Tôi muốn tự sát. — 2 điểm
- 😰 Tôi sẽ tự sát nếu có cơ hội. — 3 điểm

**Câu 10 (Trầm cảm):** Khóc

- 🙂 Tôi không khóc nhiều hơn bình thường. — 0 điểm
- 😐 Hiện nay tôi khóc nhiều hơn trước đây. — 1 điểm
- 😟 Hiện nay tôi gần như luôn khóc. — 2 điểm
- 😰 Trước đây tôi có thể khóc, nhưng hiện giờ tôi không thể khóc được dù rất muốn. — 3 điểm

**Câu 11 (Trầm cảm):** Dễ cáu gắt

- 🙂 Tôi không dễ bị mọi việc làm khó chịu hoặc cáu gắt hơn trước đây. — 0 điểm
- 😐 Hiện nay tôi dễ cáu gắt hơn bình thường một chút. — 1 điểm
- 😟 Tôi khá khó chịu hoặc cáu gắt trong phần lớn thời gian. — 2 điểm
- 😰 Tôi cảm thấy cáu gắt gần như mọi lúc. — 3 điểm

**Câu 12 (Trầm cảm):** Mất hứng thú với người khác

- 🙂 Tôi không mất hứng thú với những người khác. — 0 điểm
- 😐 Tôi ít quan tâm đến những người khác hơn trước đây. — 1 điểm
- 😟 Tôi đã mất phần lớn sự quan tâm đến những người khác. — 2 điểm
- 😰 Tôi hoàn toàn không còn hứng thú với những người khác. — 3 điểm

**Câu 13 (Trầm cảm):** Khó khăn trong việc ra quyết định

- 🙂 Tôi vẫn có thể đưa ra quyết định tốt như trước đây. — 0 điểm
- 😐 Tôi trì hoãn việc đưa ra quyết định nhiều hơn trước đây. — 1 điểm
- 😟 Tôi gặp khó khăn trong việc đưa ra quyết định nhiều hơn trước đây. — 2 điểm
- 😰 Tôi hoàn toàn không thể đưa ra quyết định nữa. — 3 điểm

**Câu 14 (Trầm cảm):** Thay đổi về ngoại hình

- 🙂 Tôi không cảm thấy mình trông xấu hơn trước đây. — 0 điểm
- 😐 Tôi lo lắng rằng mình đang trở nên già đi hoặc kém hấp dẫn. — 1 điểm
- 😟 Tôi cảm thấy ngoại hình của mình đã có những thay đổi lâu dài khiến tôi trở nên kém hấp dẫn. — 2 điểm
- 😰 Tôi tin rằng mình trông rất xấu. — 3 điểm

**Câu 15 (Trầm cảm):** Khả năng làm việc

- 🙂 Tôi vẫn có thể làm việc tốt như trước đây. — 0 điểm
- 😐 Tôi phải cố gắng thêm mới có thể bắt đầu làm một việc gì đó. — 1 điểm
- 😟 Tôi phải thúc ép bản thân rất nhiều mới có thể làm bất cứ việc gì. — 2 điểm
- 😰 Tôi hoàn toàn không thể làm việc được. — 3 điểm

**Câu 16 (Trầm cảm):** Giấc ngủ

- 🙂 Tôi có thể ngủ tốt như bình thường. — 0 điểm
- 😐 Tôi ngủ không ngon như trước đây. — 1 điểm
- 😟 Tôi thức dậy sớm hơn bình thường khoảng 1–2 giờ và khó ngủ lại. — 2 điểm
- 😰 Tôi thức dậy sớm hơn bình thường vài giờ và không thể ngủ lại. — 3 điểm

**Câu 17 (Trầm cảm):** Mệt mỏi

- 🙂 Tôi không cảm thấy mệt hơn bình thường. — 0 điểm
- 😐 Tôi dễ mệt hơn trước đây. — 1 điểm
- 😟 Tôi cảm thấy mệt ngay cả khi làm hầu hết các việc. — 2 điểm
- 😰 Tôi quá mệt để có thể làm bất cứ việc gì. — 3 điểm

**Câu 18 (Trầm cảm):** Cảm giác thèm ăn

- 🙂 Khẩu vị của tôi không thay đổi so với bình thường. — 0 điểm
- 😐 Tôi ăn không ngon miệng như trước đây. — 1 điểm
- 😟 Hiện nay khẩu vị của tôi giảm đi nhiều. — 2 điểm
- 😰 Tôi hoàn toàn không còn cảm giác thèm ăn. — 3 điểm

**Câu 19 (Trầm cảm):** Thay đổi cân nặng

- 🙂 Gần đây tôi không giảm cân đáng kể, nếu có thì cũng rất ít. — 0 điểm
- 😐 Tôi đã giảm hơn 5 pound (khoảng 2,3 kg). — 1 điểm
- 😟 Tôi đã giảm hơn 10 pound (khoảng 4,5 kg). — 2 điểm
- 😰 Tôi đã giảm hơn 15 pound (khoảng 6,8 kg). — 3 điểm

**Câu 20 (Trầm cảm):** Lo lắng về sức khỏe

- 🙂 Tôi không lo lắng về sức khỏe của mình nhiều hơn bình thường. — 0 điểm
- 😐 Tôi lo lắng về các vấn đề thể chất như đau nhức, đau đớn, khó chịu ở dạ dày hoặc táo bón. — 1 điểm
- 😟 Tôi rất lo lắng về các vấn đề thể chất và khó nghĩ đến những chuyện khác. — 2 điểm
- 😰 Tôi quá lo lắng về các vấn đề thể chất của mình đến mức không thể nghĩ đến bất cứ điều gì khác. — 3 điểm

**Câu 21 (Trầm cảm):** Hứng thú tình dục

- 🙂 Tôi không nhận thấy gần đây có bất kỳ thay đổi nào trong sự quan tâm của mình đối với tình dục. — 0 điểm
- 😐 Tôi ít hứng thú với tình dục hơn trước đây. — 1 điểm
- 😟 Tôi hầu như không còn hứng thú với tình dục. — 2 điểm
- 😰 Tôi hoàn toàn mất hứng thú với tình dục. — 3 điểm

### Cách tính điểm

**Trầm cảm (`depression`):**
- Công thức: Tổng điểm câu {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–13 | Không có trầm cảm |
  | 14–19 | Trầm cảm nhẹ |
  | 20–29 | Trầm cảm vừa |
  | ≥ 30 | Trầm cảm nặng |


---

## PSQI — Pittsburgh Sleep Quality Index (Theo quy trình Bộ Y tế)

*Mã hệ thống: `psqi` · Số câu: 17 · Điểm tối đa: 21 · Mốc thời gian hỏi: 1 tháng qua*

### Câu hỏi & đáp án

**Câu 1 (Giấc ngủ) — nhập giờ:** Trong tháng qua, bạn thường lên giường đi ngủ lúc mấy giờ?

**Câu 2 (Giấc ngủ) — nhập số phút:** Mỗi đêm bạn thường mất bao nhiêu phút mới chợp mắt được?

**Câu 3 (Giấc ngủ) — nhập giờ:** Trong tháng qua, bạn thường thức dậy buổi sáng lúc mấy giờ?

**Câu 4 (Giấc ngủ) — nhập số tiếng:** Mỗi đêm bạn thực sự ngủ được mấy tiếng đồng hồ? (không tính thời gian nằm trằn trọc)

**Câu 5 (Giấc ngủ) → Câu 12 (Giấc ngủ):** các câu con mục 5a-5i, dùng chung 1 thang trả lời:

- ✅ Không có trong tháng qua — 0 điểm
- 🟡 Ít hơn 1 lần/tuần — 1 điểm
- 🟠 1-2 lần/tuần — 2 điểm
- 🚨 3 lần/tuần trở lên — 3 điểm

| # | Câu hỏi |
|---|---|
| 5 | 5a. Không thể ngủ được trong vòng 30 phút |
| 6 | 5b. Tỉnh dậy lúc nửa đêm hoặc quá sớm vào buổi sáng |
| 7 | 5c. Phải thức dậy để sử dụng nhà vệ sinh |
| 8 | 5d. Khó thở |
| 9 | 5e. Ho hoặc ngáy to |
| 10 | 5f. Cảm thấy rất lạnh |
| 11 | 5g. Cảm thấy rất nóng |
| 12 | 5h. Có ác mộng |
| 13 | 5i. Thấy đau |
| 14 | 6. Bạn có thường phải sử dụng thuốc ngủ không (theo đơn hoặc tự mua)? |
| 15 | 7. Bạn có hay gặp khó khăn để giữ đầu óc tỉnh táo lúc ăn, lái xe hay làm việc không? |
| 16 | 8. Bạn có gặp khó khăn để duy trì hứng thú hoàn thành công việc không? |

**Câu 17 (Giấc ngủ):** 9. Nhìn chung, bạn đánh giá chất lượng giấc ngủ của mình như thế nào?

- 😀 Rất tốt — 0 điểm
- 🙂 Tương đối tốt — 1 điểm
- 😟 Tương đối kém — 2 điểm
- 😰 Rất kém — 3 điểm

### Cách tính điểm

Không dùng công thức "cộng dồn 1 danh sách câu" như các bài khác — PSQI tính qua **7 thành phần** riêng biệt rồi cộng lại thành tổng 0-21:

| Thành phần | Cách tính |
|---|---|
| 1. Chất lượng chủ quan | = điểm câu 17 (câu 9 gốc) |
| 2. Độ trễ giấc ngủ | = điểm quy đổi câu 2 (≤15'→0, 16-30'→1, 31-60'→2, >60'→3) **+** điểm câu 5a (câu #5), rồi quy đổi tổng (0-6) → 0 ⇒ 0đ · 1-2 ⇒ 1đ · 3-4 ⇒ 2đ · 5-6 ⇒ 3đ |
| 3. Thời lượng ngủ | = điểm quy đổi câu 4 (>7h→0, 6-7h→1, 5-6h→2, <5h→3) |
| 4. Hiệu suất giấc ngủ | = (giờ ngủ được ÷ giờ nằm trên giường [từ câu 1 & câu 3]) × 100% → >85%→0 · 75-84%→1 · 65-74%→2 · <65%→3 |
| 5. Rối loạn giấc ngủ | = tổng điểm câu #6-#13 (5b-5i) → 0⇒0đ · 1-9⇒1đ · 10-18⇒2đ · 19-27⇒3đ |
| 6. Dùng thuốc ngủ | = điểm câu #14 (câu 6 gốc) |
| 7. Rối loạn hoạt động ban ngày | = tổng điểm câu #15 + #16 (câu 7+8 gốc) → 0⇒0đ · 1-2⇒1đ · 3-4⇒2đ · 5-6⇒3đ |

**Tổng PSQI = Thành phần 1 + 2 + ... + 7 (0-21 điểm)**

- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–4 | Chất lượng giấc ngủ tốt |
  | ≥ 5 | Chất lượng giấc ngủ suy giảm |


---

## PSS — Perceived Stress Scale — Thang đo stress cảm nhận

*Mã hệ thống: `pss` · Số câu: 10 · Điểm tối đa: 40 · Mốc thời gian hỏi: 1 tháng qua*

### Câu hỏi & đáp án

**Câu 1 (Căng thẳng):** Bạn có thường xuyên buồn phiền vì điều gì đó bất ngờ xảy ra không?

- ❌ Không bao giờ — 0 điểm
- 🔹 Hầu như không bao giờ — 1 điểm
- 🔸 Thỉnh thoảng — 2 điểm
- 🔶 Khá thường xuyên — 3 điểm
- 🔴 Rất thường xuyên — 4 điểm

**Câu 2 (Căng thẳng):** Bạn có thường cảm thấy mình không thể kiểm soát được những việc quan trọng trong cuộc sống của mình không?

- ❌ Không bao giờ — 0 điểm
- 🔹 Hầu như không bao giờ — 1 điểm
- 🔸 Thỉnh thoảng — 2 điểm
- 🔶 Khá thường xuyên — 3 điểm
- 🔴 Rất thường xuyên — 4 điểm

**Câu 3 (Căng thẳng):** Bạn có thường xuyên cảm thấy lo lắng và căng thẳng không?

- ❌ Không bao giờ — 0 điểm
- 🔹 Hầu như không bao giờ — 1 điểm
- 🔸 Thỉnh thoảng — 2 điểm
- 🔶 Khá thường xuyên — 3 điểm
- 🔴 Rất thường xuyên — 4 điểm

**Câu 4 (Căng thẳng):** Bạn cảm thấy tự tin về khả năng xử lý các vấn đề cá nhân của mình như thế nào?

- ❌ Không bao giờ — 4 điểm
- 🔹 Hầu như không bao giờ — 3 điểm
- 🔸 Thỉnh thoảng — 2 điểm
- 🔶 Khá thường xuyên — 1 điểm
- 🔴 Rất thường xuyên — 0 điểm

**Câu 5 (Căng thẳng):** Bạn cảm thấy mọi việc diễn ra theo ý mình ở mức nào?

- ❌ Không bao giờ — 4 điểm
- 🔹 Hầu như không bao giờ — 3 điểm
- 🔸 Thỉnh thoảng — 2 điểm
- 🔶 Khá thường xuyên — 1 điểm
- 🔴 Rất thường xuyên — 0 điểm

**Câu 6 (Căng thẳng):** Bạn có thấy rằng mình không thể đương đầu với tất cả những việc phải làm không?

- ❌ Không bao giờ — 0 điểm
- 🔹 Hầu như không bao giờ — 1 điểm
- 🔸 Thỉnh thoảng — 2 điểm
- 🔶 Khá thường xuyên — 3 điểm
- 🔴 Rất thường xuyên — 4 điểm

**Câu 7 (Căng thẳng):** Bạn có thường xuyên kiểm soát được những cơn cáu gắt trong cuộc sống của bạn không?

- ❌ Không bao giờ — 4 điểm
- 🔹 Hầu như không bao giờ — 3 điểm
- 🔸 Thỉnh thoảng — 2 điểm
- 🔶 Khá thường xuyên — 1 điểm
- 🔴 Rất thường xuyên — 0 điểm

**Câu 8 (Căng thẳng):** Bao lâu rồi bạn cảm thấy rằng mình đang ở trên đỉnh của mọi thứ?

- ❌ Không bao giờ — 4 điểm
- 🔹 Hầu như không bao giờ — 3 điểm
- 🔸 Thỉnh thoảng — 2 điểm
- 🔶 Khá thường xuyên — 1 điểm
- 🔴 Rất thường xuyên — 0 điểm

**Câu 9 (Căng thẳng):** Bạn có thường tức giận vì những việc xảy ra ngoài tầm kiểm soát của mình không?

- ❌ Không bao giờ — 0 điểm
- 🔹 Hầu như không bao giờ — 1 điểm
- 🔸 Thỉnh thoảng — 2 điểm
- 🔶 Khá thường xuyên — 3 điểm
- 🔴 Rất thường xuyên — 4 điểm

**Câu 10 (Căng thẳng):** Bạn có thường cảm thấy khó khăn chồng chất đến mức không thể vượt qua được?

- ❌ Không bao giờ — 0 điểm
- 🔹 Hầu như không bao giờ — 1 điểm
- 🔸 Thỉnh thoảng — 2 điểm
- 🔶 Khá thường xuyên — 3 điểm
- 🔴 Rất thường xuyên — 4 điểm

### Cách tính điểm

**Căng thẳng (`stress`):**
- Công thức: Tổng điểm câu {1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–13 | Thấp |
  | 14–26 | Trung bình |
  | > 26 | Nghiêm trọng |


---

## SDQ-25 — Bảng hỏi Điểm mạnh & Khó khăn (Tự đánh giá)

*Mã hệ thống: `sdq25` · Số câu: 25 · Điểm tối đa: 40 · Mốc thời gian hỏi: 2 tuần qua*

### Câu hỏi & đáp án

**Câu 1 (Xã hội tích cực):** Em đối xử tốt với người khác, quan tâm đến cảm xúc của họ

- 🔲 Không đúng — 0 điểm
- ➖ Đúng một phần — 1 điểm
- ✔️ Chắc chắn đúng — 2 điểm

**Câu 2 (Tăng động):** Em hay bồn chồn, quá hiếu động, không thể ngồi yên một chỗ lâu

- 🔲 Không đúng — 0 điểm
- ➖ Đúng một phần — 1 điểm
- ✔️ Chắc chắn đúng — 2 điểm

**Câu 3 (Cảm xúc):** Em hay than phiền đau đầu, đau bụng hoặc cảm thấy ốm mệt

- 🔲 Không đúng — 0 điểm
- ➖ Đúng một phần — 1 điểm
- ✔️ Chắc chắn đúng — 2 điểm

**Câu 4 (Xã hội tích cực):** Em sẵn lòng chia sẻ với các bạn khác (đồ chơi, đồ ăn, bút...)

- 🔲 Không đúng — 0 điểm
- ➖ Đúng một phần — 1 điểm
- ✔️ Chắc chắn đúng — 2 điểm

**Câu 5 (Hành vi):** Em hay nổi cơn cáu giận hoặc tức giận

- 🔲 Không đúng — 0 điểm
- ➖ Đúng một phần — 1 điểm
- ✔️ Chắc chắn đúng — 2 điểm

**Câu 6 (Bạn bè):** Em khá đơn độc, thường thích chơi một mình

- 🔲 Không đúng — 0 điểm
- ➖ Đúng một phần — 1 điểm
- ✔️ Chắc chắn đúng — 2 điểm

**Câu 7 (Hành vi):** Nhìn chung em khá ngoan, thường làm theo lời người lớn chỉ bảo

- 🔲 Không đúng — 2 điểm
- ➖ Đúng một phần — 1 điểm
- ✔️ Chắc chắn đúng — 0 điểm

**Câu 8 (Cảm xúc):** Em có nhiều điều lo lắng, thường tỏ ra lo lắng

- 🔲 Không đúng — 0 điểm
- ➖ Đúng một phần — 1 điểm
- ✔️ Chắc chắn đúng — 2 điểm

**Câu 9 (Xã hội tích cực):** Em sẵn sàng giúp đỡ nếu có ai đó bị đau, buồn hoặc ốm

- 🔲 Không đúng — 0 điểm
- ➖ Đúng một phần — 1 điểm
- ✔️ Chắc chắn đúng — 2 điểm

**Câu 10 (Tăng động):** Em luôn bồn chồn, ngọ nguậy tay chân liên tục, khó ngồi yên

- 🔲 Không đúng — 0 điểm
- ➖ Đúng một phần — 1 điểm
- ✔️ Chắc chắn đúng — 2 điểm

**Câu 11 (Bạn bè):** Em có ít nhất một người bạn thân

- 🔲 Không đúng — 2 điểm
- ➖ Đúng một phần — 1 điểm
- ✔️ Chắc chắn đúng — 0 điểm

**Câu 12 (Hành vi):** Em thường đánh nhau với bạn khác hoặc bắt ép bạn làm theo ý mình

- 🔲 Không đúng — 0 điểm
- ➖ Đúng một phần — 1 điểm
- ✔️ Chắc chắn đúng — 2 điểm

**Câu 13 (Cảm xúc):** Em thường không vui, hay buồn bã hoặc dễ khóc

- 🔲 Không đúng — 0 điểm
- ➖ Đúng một phần — 1 điểm
- ✔️ Chắc chắn đúng — 2 điểm

**Câu 14 (Bạn bè):** Nhìn chung các bạn khác thích chơi cùng em

- 🔲 Không đúng — 2 điểm
- ➖ Đúng một phần — 1 điểm
- ✔️ Chắc chắn đúng — 0 điểm

**Câu 15 (Tăng động):** Em dễ bị sao nhãng, khó tập trung chú ý

- 🔲 Không đúng — 0 điểm
- ➖ Đúng một phần — 1 điểm
- ✔️ Chắc chắn đúng — 2 điểm

**Câu 16 (Cảm xúc):** Em hồi hộp, dễ mất tự tin trong những tình huống mới

- 🔲 Không đúng — 0 điểm
- ➖ Đúng một phần — 1 điểm
- ✔️ Chắc chắn đúng — 2 điểm

**Câu 17 (Xã hội tích cực):** Em tử tế, thân thiện với các em nhỏ tuổi hơn

- 🔲 Không đúng — 0 điểm
- ➖ Đúng một phần — 1 điểm
- ✔️ Chắc chắn đúng — 2 điểm

**Câu 18 (Hành vi):** Em thường bị nói là hay nói dối hoặc gian lận

- 🔲 Không đúng — 0 điểm
- ➖ Đúng một phần — 1 điểm
- ✔️ Chắc chắn đúng — 2 điểm

**Câu 19 (Bạn bè):** Em hay bị bạn khác trêu chọc hoặc bắt nạt

- 🔲 Không đúng — 0 điểm
- ➖ Đúng một phần — 1 điểm
- ✔️ Chắc chắn đúng — 2 điểm

**Câu 20 (Xã hội tích cực):** Em thường tự nguyện giúp đỡ người khác (bố mẹ, thầy cô, bạn bè...)

- 🔲 Không đúng — 0 điểm
- ➖ Đúng một phần — 1 điểm
- ✔️ Chắc chắn đúng — 2 điểm

**Câu 21 (Tăng động):** Em suy nghĩ kỹ hoặc cân nhắc trước khi làm một việc gì đó

- 🔲 Không đúng — 2 điểm
- ➖ Đúng một phần — 1 điểm
- ✔️ Chắc chắn đúng — 0 điểm

**Câu 22 (Hành vi):** Em hay lấy những thứ không phải của mình ở nhà, trường học hoặc nơi khác

- 🔲 Không đúng — 0 điểm
- ➖ Đúng một phần — 1 điểm
- ✔️ Chắc chắn đúng — 2 điểm

**Câu 23 (Bạn bè):** Em dễ hòa đồng với người lớn hơn là với các bạn cùng lứa

- 🔲 Không đúng — 2 điểm
- ➖ Đúng một phần — 1 điểm
- ✔️ Chắc chắn đúng — 0 điểm

**Câu 24 (Cảm xúc):** Em hay sợ hãi, dễ hoảng sợ

- 🔲 Không đúng — 0 điểm
- ➖ Đúng một phần — 1 điểm
- ✔️ Chắc chắn đúng — 2 điểm

**Câu 25 (Tăng động):** Em làm việc được giao đến nơi đến chốn, tập trung chú ý tốt

- 🔲 Không đúng — 2 điểm
- ➖ Đúng một phần — 1 điểm
- ✔️ Chắc chắn đúng — 0 điểm

### Cách tính điểm

**Cảm xúc (`emotional`):**
- Công thức: Tổng điểm câu {3, 8, 13, 16, 24}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–5 | Bình thường |
  | 6 | Ranh giới |
  | 7–10 | Bất thường |

**Hành vi (`conduct`):**
- Công thức: Tổng điểm câu {5, 7, 12, 18, 22}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–3 | Bình thường |
  | 4 | Ranh giới |
  | 5–10 | Bất thường |

**Tăng động (`hyperactivity`):**
- Công thức: Tổng điểm câu {2, 10, 15, 21, 25}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–5 | Bình thường |
  | 6 | Ranh giới |
  | 7–10 | Bất thường |

**Bạn bè (`peer`):**
- Công thức: Tổng điểm câu {6, 11, 14, 19, 23}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–3 | Bình thường |
  | 4–5 | Ranh giới |
  | 6–10 | Bất thường |

**Xã hội tích cực (`prosocial`)** *(điểm càng cao càng tốt — chiều ngược lại với 4 thang trên):*
- Công thức: Tổng điểm câu {1, 4, 9, 17, 20}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–4 | Cần hỗ trợ thêm kỹ năng xã hội |
  | 5 | Ranh giới |
  | 6–10 | Tốt |

**Tổng điểm (`total`):**
- Công thức: Tổng điểm câu {3, 8, 13, 16, 24, 5, 7, 12, 18, 22, 2, 10, 15, 21, 25, 6, 11, 14, 19, 23}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–15 | Bình thường |
  | 16–19 | Ranh giới |
  | > 19 | Bất thường |


---

## MMSE — Mini-Mental State Exam — Trạng thái tâm thần tối thiểu

*Mã hệ thống: `mmse` · Số câu: 19 · Điểm tối đa: 30 · Mốc thời gian hỏi: Hiện tại*

### Câu hỏi & đáp án

**Câu 1 (Định hướng):** Hôm nay là thứ mấy?

- ❌ Sai — 0 điểm
- ✅ Đúng — 1 điểm

**Câu 2 (Định hướng):** Hôm nay là ngày bao nhiêu?

- ❌ Sai — 0 điểm
- ✅ Đúng — 1 điểm

**Câu 3 (Định hướng):** Tháng này là tháng mấy?

- ❌ Sai — 0 điểm
- ✅ Đúng — 1 điểm

**Câu 4 (Định hướng):** Năm nay là năm nào?

- ❌ Sai — 0 điểm
- ✅ Đúng — 1 điểm

**Câu 5 (Định hướng):** Mùa này là mùa gì?

- ❌ Sai — 0 điểm
- ✅ Đúng — 1 điểm

**Câu 6 (Định hướng):** Chỗ này là chỗ nào? (tên nơi đang ở)

- ❌ Sai — 0 điểm
- ✅ Đúng — 1 điểm

**Câu 7 (Định hướng):** Khoa gì? Tầng mấy?

- ❌ Sai — 0 điểm
- ✅ Đúng — 1 điểm

**Câu 8 (Định hướng):** Tỉnh, thành phố nào?

- ❌ Sai — 0 điểm
- ✅ Đúng — 1 điểm

**Câu 9 (Định hướng):** Miền nào? (Bắc/Trung/Nam)

- ❌ Sai — 0 điểm
- ✅ Đúng — 1 điểm

**Câu 10 (Định hướng):** Nước nào?

- ❌ Sai — 0 điểm
- ✅ Đúng — 1 điểm

**Câu 11 (Ghi nhận):** Nói to, rõ 3 từ (con mèo, cây lúa, đồng xu), yêu cầu nhắc lại ngay — nhắc đúng mấy từ?

- 🔢 Đúng 0 từ — 0 điểm
- 🔢 Đúng 1 từ — 1 điểm
- 🔢 Đúng 2 từ — 2 điểm
- 🔢 Đúng 3 từ — 3 điểm

**Câu 12 (Chú ý & tính toán):** Làm phép trừ 7 liên tiếp từ 100 (100-93-86-79-72-65) — đúng mấy phép?

- 🔢 Đúng 0 phép — 0 điểm
- 🔢 Đúng 1 phép — 1 điểm
- 🔢 Đúng 2 phép — 2 điểm
- 🔢 Đúng 3 phép — 3 điểm
- 🔢 Đúng 4 phép — 4 điểm
- 🔢 Đúng 5 phép — 5 điểm

**Câu 13 (Nhớ lại):** Yêu cầu nhớ lại 3 từ đã ghi nhận ở trên (không cần đúng thứ tự) — nhớ đúng mấy từ?

- 🔢 Nhớ đúng 0 từ — 0 điểm
- 🔢 Nhớ đúng 1 từ — 1 điểm
- 🔢 Nhớ đúng 2 từ — 2 điểm
- 🔢 Nhớ đúng 3 từ — 3 điểm

**Câu 14 (Ngôn ngữ):** Đưa và yêu cầu gọi tên 2 đồ vật (đồng hồ, cây viết) — gọi đúng mấy đồ vật?

- 🔢 Đúng 0 đồ vật — 0 điểm
- 🔢 Đúng 1 đồ vật — 1 điểm
- 🔢 Đúng 2 đồ vật — 2 điểm

**Câu 15 (Ngôn ngữ):** Yêu cầu nhắc lại câu: "Không có nếu và hoặc nhưng mãi"

- ❌ Sai — 0 điểm
- ✅ Đúng — 1 điểm

**Câu 16 (Ngôn ngữ):** Yêu cầu thực hiện mệnh lệnh 3 bước: "Cầm tờ giấy bằng tay phải, gấp đôi lại, rồi đưa cho tôi" — đúng mấy bước?

- 🔢 Đúng 0 bước — 0 điểm
- 🔢 Đúng 1 bước — 1 điểm
- 🔢 Đúng 2 bước — 2 điểm
- 🔢 Đúng 3 bước — 3 điểm

**Câu 17 (Ngôn ngữ):** Yêu cầu đọc thầm và làm theo mệnh lệnh viết sẵn: "Hãy nhắm mắt lại"

- ❌ Sai — 0 điểm
- ✅ Đúng — 1 điểm

**Câu 18 (Ngôn ngữ):** Yêu cầu viết một câu tuỳ ý (có nghĩa, đủ chủ ngữ - vị ngữ)

- ❌ Sai — 0 điểm
- ✅ Đúng — 1 điểm

**Câu 19 (Thị giác không gian):** Yêu cầu vẽ lại 2 hình ngũ giác giao nhau

- ❌ Sai — 0 điểm
- ✅ Đúng — 1 điểm

### Cách tính điểm

**Tổng điểm (`total`):**
- Công thức: Tổng điểm câu {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–13 | Suy giảm nặng |
  | 14–19 | Suy giảm vừa |
  | 20–23 | Suy giảm nhẹ |
  | > 23 | Không suy giảm nhận thức |


---

## ISI — Insomnia Severity Index — Mức độ mất ngủ

*Mã hệ thống: `isi` · Số câu: 7 · Điểm tối đa: 28 · Mốc thời gian hỏi: 1 tháng qua*

### Câu hỏi & đáp án

**Câu 1 (Mất ngủ):** Khó vào giấc

- ✅ Không — 0 điểm
- 🟡 Nhẹ — 1 điểm
- 🟠 Vừa — 2 điểm
- 🔴 Nặng — 3 điểm
- 🚨 Rất nặng — 4 điểm

**Câu 2 (Mất ngủ):** Khó duy trì giấc

- ✅ Không — 0 điểm
- 🟡 Nhẹ — 1 điểm
- 🟠 Vừa — 2 điểm
- 🔴 Nặng — 3 điểm
- 🚨 Rất nặng — 4 điểm

**Câu 3 (Mất ngủ):** Tỉnh giấc quá sớm

- ✅ Không — 0 điểm
- 🟡 Nhẹ — 1 điểm
- 🟠 Vừa — 2 điểm
- 🔴 Nặng — 3 điểm
- 🚨 Rất nặng — 4 điểm

**Câu 4 (Mất ngủ):** Bạn hài lòng/không hài lòng với giấc ngủ hiện tại của mình ở mức độ nào?

- 😀 Rất hài lòng — 0 điểm
- 🙂 Hài lòng — 1 điểm
- 😐 Hài lòng vừa phải — 2 điểm
- 😟 Không hài lòng — 3 điểm
- 😣 Rất không hài lòng — 4 điểm

**Câu 5 (Mất ngủ):** Người khác nhận thấy vấn đề giấc ngủ ảnh hưởng đến chất lượng cuộc sống của bạn ở mức độ nào?

- ✅ Không dễ nhận thấy chút nào — 0 điểm
- 🟡 Dễ nhận thấy một chút — 1 điểm
- 🟠 Dễ nhận thấy vừa phải — 2 điểm
- 🔴 Rất dễ nhận thấy — 3 điểm
- 🚨 Cực kỳ dễ nhận thấy — 4 điểm

**Câu 6 (Mất ngủ):** Bạn cảm thấy lo lắng/căng thẳng với vấn đề giấc ngủ hiện tại ở mức độ nào?

- ✅ Không lo lắng chút nào — 0 điểm
- 🟡 Lo lắng một chút — 1 điểm
- 🟠 Lo lắng vừa phải — 2 điểm
- 🔴 Rất lo lắng — 3 điểm
- 🚨 Cực kỳ lo lắng — 4 điểm

**Câu 7 (Mất ngủ):** Vấn đề giấc ngủ đang ảnh hưởng đến hoạt động hằng ngày của bạn (mệt mỏi, giảm tập trung...) ở mức độ nào?

- ✅ Không ảnh hưởng chút nào — 0 điểm
- 🟡 Ảnh hưởng một chút — 1 điểm
- 🟠 Ảnh hưởng vừa phải — 2 điểm
- 🔴 Ảnh hưởng rất nhiều — 3 điểm
- 🚨 Ảnh hưởng cực kỳ nhiều — 4 điểm

### Cách tính điểm

**Mất ngủ (`total`):**
- Công thức: Tổng điểm câu {1, 2, 3, 4, 5, 6, 7}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–7 | Không có mất ngủ |
  | 8–14 | Mất ngủ nhẹ |
  | 15–21 | Mất ngủ trung bình |
  | > 21 | Mất ngủ nghiêm trọng |


---

## IAT — Internet Addiction Test — Mức độ nghiện Internet

*Mã hệ thống: `iat` · Số câu: 20 · Điểm tối đa: 100 · Mốc thời gian hỏi: 1 tháng qua*

### Câu hỏi & đáp án

**Thang trả lời chung cho tất cả câu:** ✅ Không bao giờ (0) · 🔹 Hiếm khi (1) · 🔸 Thỉnh thoảng (2) · 🟠 Thường xuyên (3) · 🔴 Rất thường xuyên (4) · 🚨 Luôn luôn (5)

| # | Câu hỏi | Nhóm |
|---|---|---|
| 1 | Bạn thường thấy rằng mình sử dụng internet nhiều hơn dự định | Internet |
| 2 | Bạn thường bỏ bê công việc gia đình để dành nhiều thời gian hơn sử dụng internet | Internet |
| 3 | Bạn thường thích thú với internet hơn là thân thiết với bạn bè | Internet |
| 4 | Bạn thường có các mối quan hệ mới với những người sử dụng internet khác | Internet |
| 5 | Những người xung quanh bạn thường xuyên phàn nàn về thời lượng bạn sử dụng internet | Internet |
| 6 | Điểm số hoặc công việc của bạn thường xuyên bị ảnh hưởng vì lượng thời gian bạn dành cho internet | Internet |
| 7 | Bạn thường kiểm tra email trước khi làm việc khác | Internet |
| 8 | Hiệu suất và năng suất công việc của bạn thường xuyên bị ảnh hưởng vì internet | Internet |
| 9 | Bạn thường đề phòng hoặc bí mật khi ai đó hỏi bạn đã làm những gì trên internet | Internet |
| 10 | Bạn thường loại bỏ những suy nghĩ buồn phiền trong cuộc sống bằng những suy nghĩ nhẹ nhàng về internet | Internet |
| 11 | Bạn thường mong chờ đến lúc được sử dụng internet lại | Internet |
| 12 | Bạn thường lo sợ rằng cuộc sống không có internet sẽ buồn chán, trống rỗng và không có niềm vui | Internet |
| 13 | Bạn thường cáu kỉnh, la hét hoặc tỏ ra khó chịu khi có ai đó làm phiền lúc bạn đang sử dụng internet | Internet |
| 14 | Bạn thường xuyên bị mất ngủ vì sử dụng internet | Internet |
| 15 | Bạn thường cảm thấy suy nghĩ nhiều về internet khi không online, hoặc tưởng tượng về việc đang sử dụng internet | Internet |
| 16 | Bạn thường tự nói "chỉ vài phút nữa thôi" khi đang sử dụng internet | Internet |
| 17 | Bạn thường cố gắng cắt giảm thời gian sử dụng internet và thất bại | Internet |
| 18 | Bạn thường cố giấu việc mình đã sử dụng internet bao lâu | Internet |
| 19 | Bạn thường chọn dành thời gian sử dụng internet nhiều hơn là đi chơi với người khác | Internet |
| 20 | Bạn thường cảm thấy chán nản, ủ rũ hoặc lo lắng khi không sử dụng internet, và cảm giác này biến mất khi dùng internet trở lại | Internet |

### Cách tính điểm

**Internet (`total`):**
- Công thức: Tổng điểm câu {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–30 | Sử dụng internet bình thường |
  | 31–49 | Phụ thuộc nhẹ vào internet |
  | 50–79 | Phụ thuộc vừa vào internet |
  | > 79 | Phụ thuộc nghiêm trọng vào internet |


---

## AUDIT — Alcohol Use Disorders Identification Test — Mức độ sử dụng rượu bia

*Mã hệ thống: `audit` · Số câu: 10 · Điểm tối đa: 36 · Mốc thời gian hỏi: 12 tháng qua*

### Câu hỏi & đáp án

**Câu 1 (Rượu bia):** Mức độ uống rượu/bia của bạn trong 12 tháng vừa qua?

- ✅ Chưa bao giờ — 0 điểm
- 🔹 Ít hơn 1 lần/tháng — 1 điểm
- 🔸 2-4 lần/tháng — 2 điểm
- 🟠 2-3 lần/tuần — 3 điểm
- 🔴 ≥4 lần/tuần — 4 điểm

**Câu 2 (Rượu bia):** Trong một ngày có uống rượu/bia, bạn thường uống bao nhiêu đơn vị? (1 đơn vị = 1 lon/chai bia, 1 cốc rượu vang 120ml, hay 1 chén rượu mạnh 30ml)

- ✅ 1-2 đơn vị — 0 điểm
- 🔹 3-4 đơn vị — 1 điểm
- 🔸 5-6 đơn vị — 2 điểm
- 🟠 7-9 đơn vị — 3 điểm
- 🔴 ≥10 đơn vị — 4 điểm

**Câu 3 (Rượu bia):** Tần suất uống từ 6 đơn vị rượu/bia trở lên trong 1 lần uống

- ✅ Không bao giờ — 0 điểm
- 🔹 Ít hơn 1 lần/tháng — 1 điểm
- 🔸 Hàng tháng — 2 điểm
- 🟠 Hàng tuần — 3 điểm
- 🔴 Hàng ngày hoặc gần như hàng ngày — 4 điểm

**Câu 4 (Rượu bia):** Tần suất bạn nhận thấy mình không thể tự dừng uống khi đã bắt đầu

- ✅ Không bao giờ — 0 điểm
- 🔹 Ít hơn 1 lần/tháng — 1 điểm
- 🔸 Hàng tháng — 2 điểm
- 🟠 Hàng tuần — 3 điểm
- 🔴 Hàng ngày hoặc gần như hàng ngày — 4 điểm

**Câu 5 (Rượu bia):** Tần suất bạn không làm được những việc đã dự định làm vì uống rượu/bia

- ✅ Không bao giờ — 0 điểm
- 🔹 Ít hơn 1 lần/tháng — 1 điểm
- 🔸 Hàng tháng — 2 điểm
- 🟠 Hàng tuần — 3 điểm
- 🔴 Hàng ngày hoặc gần như hàng ngày — 4 điểm

**Câu 6 (Rượu bia):** Tần suất buổi sáng ngay sau khi thức dậy bạn cần uống ngay một cốc rượu/bia trước khi nghĩ đến việc khác

- ✅ Không bao giờ — 0 điểm
- 🔹 Ít hơn 1 lần/tháng — 1 điểm
- 🔸 Hàng tháng — 2 điểm
- 🟠 Hàng tuần — 3 điểm
- 🔴 Hàng ngày hoặc gần như hàng ngày — 4 điểm

**Câu 7 (Rượu bia):** Tần suất bạn cảm thấy mắc lỗi hoặc áy náy/day dứt/lo lắng về việc uống rượu/bia của bản thân

- ✅ Không bao giờ — 0 điểm
- 🔹 Ít hơn 1 lần/tháng — 1 điểm
- 🔸 Hàng tháng — 2 điểm
- 🟠 Hàng tuần — 3 điểm
- 🔴 Hàng ngày hoặc gần như hàng ngày — 4 điểm

**Câu 8 (Rượu bia):** Tần suất bạn ở trong trạng thái sau khi uống rượu/bia không thể nhớ được chuyện gì đã xảy ra trước đó

- ✅ Không bao giờ — 0 điểm
- 🔹 Ít hơn 1 lần/tháng — 1 điểm
- 🔸 Hàng tháng — 2 điểm
- 🟠 Hàng tuần — 3 điểm
- 🔴 Hàng ngày hoặc gần như hàng ngày — 4 điểm

**Câu 9 (Rượu bia):** Từ trước đến nay, bạn đã bao giờ bị thương do uống rượu/bia chưa?

- ✅ Chưa bao giờ — 0 điểm
- 🟡 Có, nhưng không phải trong năm vừa qua — 1 điểm
- 🔴 Có, trong năm vừa qua — 2 điểm

**Câu 10 (Rượu bia):** Từ trước đến nay, có người thân/bạn bè/bác sĩ nào lo ngại về việc sử dụng rượu/bia của bạn và đề nghị bạn giảm uống không?

- ✅ Chưa bao giờ — 0 điểm
- 🟡 Có, nhưng không phải trong năm vừa qua — 1 điểm
- 🔴 Có, trong năm vừa qua — 2 điểm

### Cách tính điểm

**Rượu bia (`total`):**
- Công thức: Tổng điểm câu {1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–7 | Uống rượu bia hợp lý, nguy cơ thấp |
  | 8–15 | Uống rượu bia ở mức nguy cơ |
  | 16–19 | Uống rượu bia ở mức có hại |
  | > 19 | Nghiện hoặc lệ thuộc rượu bia |


---

## HDRS — Hamilton Depression Rating Scale

*Mã hệ thống: `hdrs` · Số câu: 17 · Điểm tối đa: 52 · Mốc thời gian hỏi: 1 tuần qua*

### Câu hỏi & đáp án

**Câu 1 (Trầm cảm):** Khí sắc trầm cảm

- ✅ Không có cảm giác khó chịu và dấu hiệu trầm cảm — 0 điểm
- 🟡 Có cảm giác buồn hoặc lo lắng nhất thời, chưa rõ nét — 1 điểm
- 🟠 Tỏ ra buồn, đau khổ, bi quan, thỉnh thoảng khóc, ý tưởng tự sát thoảng qua — 2 điểm
- 🔴 Có dấu hiệu cơ thể rõ, cảm giác tuyệt vọng, có ý tưởng tự sát — 3 điểm
- 🚨 Trầm cảm nặng, hoang tưởng liên quan đến cái chết, tự sát — 4 điểm

**Câu 2 (Trầm cảm):** Cảm giác tội lỗi

- ✅ Không có cảm giác tội lỗi — 0 điểm
- 🟡 Hối hận nhỏ về hành vi đã qua, tự buộc tội về chuyện lặt vặt — 1 điểm
- 🟠 Cảm giác tội lỗi, nghiền ngẫm, tự quở trách về sai lầm — 2 điểm
- 🔴 Tin bị bệnh là do bị trừng phạt; hoang tưởng bị buộc tội — 3 điểm
- 🚨 Có ảo thanh buộc tội/tố giác hoặc ảo thị đe dọa — 4 điểm

**Câu 3 (Trầm cảm):** Ý tưởng tự sát

- ✅ Không có — 0 điểm
- 🟡 Chán sống, ý tưởng tự sát thoáng qua — 1 điểm
- 🟠 Có ý tưởng tự sát, coi tự sát là một giải pháp tốt — 2 điểm
- 🔴 Có ý tưởng tự sát rõ rệt, đã có dự định tự sát — 3 điểm
- 🚨 Có kế hoạch và tích cực chuẩn bị hoặc đã có mưu toan tự sát nghiêm trọng — 4 điểm

**Câu 4 (Trầm cảm):** Mất ngủ đầu giấc (khó đi vào giấc ngủ)

- ✅ Không có vấn đề gì — 0 điểm
- 🟡 Có rối loạn nhẹ, không thường xuyên — 1 điểm
- 🔴 Có rối loạn rõ rệt — 2 điểm

**Câu 5 (Trầm cảm):** Mất ngủ giữa giấc (trằn trọc, hay thức dậy)

- ✅ Không có vấn đề gì — 0 điểm
- 🟡 Có rối loạn nhẹ, không thường xuyên — 1 điểm
- 🔴 Có rối loạn rõ rệt — 2 điểm

**Câu 6 (Trầm cảm):** Mất ngủ cuối giấc (tỉnh dậy quá sớm, không ngủ lại được)

- ✅ Không có vấn đề gì — 0 điểm
- 🟡 Có rối loạn nhẹ, không thường xuyên — 1 điểm
- 🔴 Có rối loạn rõ rệt — 2 điểm

**Câu 7 (Trầm cảm):** Công việc và hoạt động

- ✅ Hoạt động bình thường — 0 điểm
- 🟡 Kém nhiệt tình, dè dặt, thụ động, dễ chán nản — 1 điểm
- 🟠 Cảm thấy công việc là gánh nặng, lơ là chăm sóc bản thân — 2 điểm
- 🔴 Phải gắng sức trong mọi việc, hủy bỏ nhiều dự định, chăm sóc bản thân kém — 3 điểm
- 🚨 Không có khả năng làm việc, lú lẫn trong chăm sóc bản thân — 4 điểm

**Câu 8 (Trầm cảm):** Chậm chạp (tâm lý - vận động)

- ✅ Không phàn nàn về tập trung chú ý, hiệu suất bình thường — 0 điểm
- 🟡 Giảm thiểu tâm lý - vận động nhẹ, đôi lúc chậm chạp — 1 điểm
- 🟠 Giọng nói đều đều, trả lời chậm chạp, gần như ngồi im — 2 điểm
- 🔴 Cuộc phỏng vấn bị kéo dài, thường bỏ sót câu trả lời — 3 điểm
- 🚨 Không thể phỏng vấn được — 4 điểm

**Câu 9 (Trầm cảm):** Kích động

- ✅ Không có dấu hiệu kích động — 0 điểm
- 🟡 Đứng, ngồi không yên, tăng động khi phỏng vấn — 1 điểm
- 🟠 Tăng động rõ rệt, di chuyển chỗ ngồi, vặn tay hoặc quần áo — 2 điểm
- 🔴 Đứng bật dậy khi đang phỏng vấn — 3 điểm
- 🚨 Đi đi lại lại, rứt tóc/quần áo, nhặt đồ lặt vặt — 4 điểm

**Câu 10 (Trầm cảm):** Lo âu - triệu chứng tâm lý

- ✅ Không phàn nàn gì — 0 điểm
- 🟡 Chỉ kể ra khi được hỏi, khó chịu/căng thẳng ở mức độ nhẹ — 1 điểm
- 🟠 Dễ kích thích, căng thẳng, không an tâm, kéo dài — 2 điểm
- 🔴 Luôn có cảm giác "bàng hoàng", "kinh hãi" hoặc có cơn lo âu — 3 điểm
- 🚨 Liên tục sợ hãi, hoảng sợ do chờ đợi sự mất mát, bị bỏ rơi, tàn phế — 4 điểm

**Câu 11 (Trầm cảm):** Lo âu - triệu chứng cơ thể

- ✅ Không phàn nàn gì — 0 điểm
- 🟡 Triệu chứng nhẹ, ít gặp, không cản trở sinh hoạt — 1 điểm
- 🟠 Rối loạn cơ thể mức độ vừa, thường xuyên hơn — 2 điểm
- 🔴 Liên tục cảm thấy ốm do rối loạn giấc ngủ và công việc thường ngày — 3 điểm
- 🚨 Các triệu chứng gây bất lực — 4 điểm

**Câu 12 (Trầm cảm):** Triệu chứng cơ thể - dạ dày, ruột (ăn uống)

- ✅ Không phàn nàn gì — 0 điểm
- 🟡 Giảm ngon miệng, số lần đại tiện có thay đổi — 1 điểm
- 🔴 Mất ngon miệng, táo bón nặng — 2 điểm

**Câu 13 (Trầm cảm):** Triệu chứng cơ thể chung (nặng nề, đau, mỏi)

- ✅ Không có triệu chứng — 0 điểm
- 🟡 Triệu chứng ở mức độ nhẹ và vừa, không gây bất lực — 1 điểm
- 🔴 Triệu chứng ở mức độ nặng, cản trở hoạt động hoặc gây bất lực — 2 điểm

**Câu 14 (Trầm cảm):** Triệu chứng sinh dục (hoạt động tình dục, kinh nguyệt)

- ✅ Không có gì phàn nàn — 0 điểm
- 🟡 Giảm hứng thú, sự đáp ứng và tần số hoạt động tình dục giảm — 1 điểm
- 🔴 Hoàn toàn mất hứng thú, mất đáp ứng, thực sự chán ghét hoạt động tình dục — 2 điểm

**Câu 15 (Trầm cảm):** Nghi bệnh

- ✅ Không có gì phàn nàn — 0 điểm
- 🟡 Phàn nàn rối loạn ở mức độ nhẹ, quá lo lắng về sức khỏe cơ thể — 1 điểm
- 🟠 Bận tâm nhiều đến sức khỏe cơ thể, cho là mình có bệnh thực tổn — 2 điểm
- 🔴 Phàn nàn tập trung vào triệu chứng cơ thể, ám ảnh sợ bệnh nặng, tin chắc là mình bị bệnh thực tổn — 3 điểm
- 🚨 Hoang tưởng nội dung kỳ quái về cơ thể, lo âu, sợ hãi, tuyệt vọng rõ rệt — 4 điểm

**Câu 16 (Trầm cảm):** Sút cân

- ✅ Không có phàn nàn về sút cân — 0 điểm
- 🟡 Sút cân nhẹ hoặc có nghi ngờ sút cân — 1 điểm
- 🔴 Sút cân rõ rệt/trầm trọng (được đánh giá khách quan) — 2 điểm

**Câu 17 (Trầm cảm):** Nhận thức về bệnh (insight)

- ✅ Thừa nhận bị trầm cảm và "bệnh tâm thần" (suy sụp thần kinh) — 0 điểm
- 🟡 Thừa nhận có bệnh về trạng thái thần kinh nhưng đổ lỗi cho tình trạng cơ thể — 1 điểm
- 🔴 Cho là mình không có gì "trục trặc" về thần kinh (tâm thần), chỉ bị bệnh cơ thể — 2 điểm

### Cách tính điểm

**Trầm cảm (`depression`):**
- Công thức: Tổng điểm câu {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–7 | Không có trầm cảm |
  | 8–13 | Trầm cảm nhẹ |
  | 14–18 | Trầm cảm vừa |
  | 19–22 | Trầm cảm nặng |
  | > 22 | Trầm cảm rất nặng |


---

## CDI — Children's Depression Inventory

*Mã hệ thống: `cdi` · Số câu: 27 · Điểm tối đa: 54 · Mốc thời gian hỏi: 2 tuần qua*

### Câu hỏi & đáp án

**Câu 1 (Trầm cảm):** Tâm trạng buồn

- 🙂 Tôi ít khi buồn — 0 điểm
- 😐 Tôi buồn nhiều — 1 điểm
- 😢 Tôi luôn luôn buồn — 2 điểm

**Câu 2 (Trầm cảm):** Suy nghĩ về tương lai

- 😢 Chẳng có thứ gì thuận lợi cho tôi — 2 điểm
- 😐 Tôi không chắc có thứ gì sẽ thuận lợi cho mình — 1 điểm
- 🙂 Mọi thứ sẽ thuận lợi cho tôi — 0 điểm

**Câu 3 (Trầm cảm):** Cảm giác về việc mình làm

- 🙂 Tôi làm đúng hầu hết mọi thứ — 0 điểm
- 😐 Tôi làm sai nhiều thứ — 1 điểm
- 😢 Tôi làm sai tất cả mọi thứ — 2 điểm

**Câu 4 (Trầm cảm):** Niềm vui, hứng thú

- 🙂 Tôi có niềm vui ở nhiều điều — 0 điểm
- 😐 Tôi có niềm vui ở một số điều — 1 điểm
- 😢 Chẳng có gì là vui đối với tôi cả — 2 điểm

**Câu 5 (Trầm cảm):** Tự đánh giá bản thân là người "tồi tệ"

- 😢 Tôi luôn luôn tồi tệ — 2 điểm
- 😐 Đôi khi tôi tồi tệ — 1 điểm
- 🙂 Ít khi tôi tồi tệ — 0 điểm

**Câu 6 (Trầm cảm):** Lo lắng về điều xấu sẽ xảy ra

- 🙂 Tôi ít khi nghĩ về những điều xấu sẽ xảy ra với mình — 0 điểm
- 😐 Tôi lo rằng những điều xấu sẽ xảy ra với tôi — 1 điểm
- 😢 Tôi chắc chắn rằng những điều xấu sẽ xảy ra với tôi — 2 điểm

**Câu 7 (Trầm cảm):** Cảm giác về bản thân

- 😢 Tôi ghét bản thân mình — 2 điểm
- 😐 Tôi không thích bản thân mình — 1 điểm
- 🙂 Tôi thích bản thân mình — 0 điểm

**Câu 8 (Trầm cảm):** Tự đổ lỗi cho bản thân

- 😢 Tất cả những điều xấu là lỗi của tôi — 2 điểm
- 😐 Nhiều điều xấu là lỗi của tôi — 1 điểm
- 🙂 Nhiều điều xấu thường không phải là lỗi của tôi — 0 điểm

**Câu 9 (Trầm cảm):** Muốn khóc

- 😢 Tôi luôn luôn cảm thấy muốn khóc — 2 điểm
- 😐 Tôi thường cảm thấy muốn khóc — 1 điểm
- 🙂 Ít khi tôi cảm thấy muốn khóc — 0 điểm

**Câu 10 (Trầm cảm):** Dễ khó chịu

- 😢 Mọi thứ luôn luôn làm tôi khó chịu — 2 điểm
- 😐 Mọi thứ thường làm tôi khó chịu — 1 điểm
- 🙂 Mọi thứ ít khi làm tôi khó chịu — 0 điểm

**Câu 11 (Trầm cảm):** Tiếp xúc với mọi người

- 🙂 Tôi thích tiếp xúc với mọi người — 0 điểm
- 😐 Tôi thường không thích tiếp xúc với mọi người — 1 điểm
- 😢 Tôi chẳng muốn tiếp xúc với mọi người tí nào — 2 điểm

**Câu 12 (Trầm cảm):** Khả năng ra quyết định

- 😢 Tôi không thể quyết định về thứ gì — 2 điểm
- 😐 Tôi không dễ quyết định mọi thứ — 1 điểm
- 🙂 Tôi quyết định mọi thứ một cách dễ dàng — 0 điểm

**Câu 13 (Trầm cảm):** Cảm nhận về ngoại hình

- 🙂 Tôi trông bình thường — 0 điểm
- 😐 Có thứ gì đó xấu xí với ngoại hình của tôi — 1 điểm
- 😢 Tôi trông xấu xí — 2 điểm

**Câu 14 (Trầm cảm):** Làm bài tập về nhà

- 😢 Tôi luôn phải tự ép bản thân mình để làm bài tập về nhà — 2 điểm
- 😐 Tôi thường phải ép bản thân mình để làm bài tập về nhà — 1 điểm
- 🙂 Làm bài tập về nhà không phải là một vấn đề lớn — 0 điểm

**Câu 15 (Trầm cảm):** Giấc ngủ

- 😢 Tôi luôn khó ngủ — 2 điểm
- 😐 Tôi thường khó ngủ — 1 điểm
- 🙂 Tôi ngủ khá tốt — 0 điểm

**Câu 16 (Trầm cảm):** Mệt mỏi

- 🙂 Tôi ít khi mệt — 0 điểm
- 😐 Tôi thường xuyên mệt — 1 điểm
- 😢 Tôi luôn luôn mệt — 2 điểm

**Câu 17 (Trầm cảm):** Ăn uống

- 😢 Tôi luôn không muốn ăn — 2 điểm
- 😐 Tôi thường không muốn ăn — 1 điểm
- 🙂 Tôi ăn khá tốt — 0 điểm

**Câu 18 (Trầm cảm):** Lo lắng về đau đớn cơ thể

- 🙂 Tôi không lo lắng về những đau đớn — 0 điểm
- 😐 Tôi thường lo lắng về những đau đớn — 1 điểm
- 😢 Tôi luôn lo lắng về những đau đớn — 2 điểm

**Câu 19 (Trầm cảm):** Cảm giác cô đơn

- 🙂 Tôi không cảm thấy cô đơn — 0 điểm
- 😐 Tôi thường cảm thấy cô đơn — 1 điểm
- 😢 Tôi luôn cảm thấy cô đơn — 2 điểm

**Câu 20 (Trầm cảm):** Niềm vui ở trường

- 😢 Tôi không bao giờ có niềm vui ở trường — 2 điểm
- 😐 Tôi thỉnh thoảng có niềm vui ở trường — 1 điểm
- 🙂 Tôi luôn có niềm vui ở trường — 0 điểm

**Câu 21 (Trầm cảm):** Bạn bè

- 🙂 Tôi có khá nhiều bạn — 0 điểm
- 😐 Tôi có một số bạn nhưng tôi ước mình có nhiều hơn — 1 điểm
- 😢 Tôi không có bạn nào — 2 điểm

**Câu 22 (Trầm cảm):** Kết quả học tập

- 🙂 Việc học của tôi đang tốt — 0 điểm
- 😐 Việc học tập của tôi không tốt như trước đây — 1 điểm
- 😢 Tôi học rất kém những môn mà tôi từng học tốt — 2 điểm

**Câu 23 (Trầm cảm):** So sánh với bạn khác

- 😢 Tôi không bao giờ có thể tốt như những bạn khác — 2 điểm
- 😐 Tôi có thể tốt như những bạn khác nếu tôi muốn — 1 điểm
- 🙂 Tôi cũng tốt như những bạn khác — 0 điểm

**Câu 24 (Trầm cảm):** Cảm giác được yêu thương

- 😢 Không có ai thực sự yêu thương tôi — 2 điểm
- 😐 Tôi không chắc có ai yêu thương mình không — 1 điểm
- 🙂 Tôi chắc chắn là có ai đó yêu thương tôi — 0 điểm

**Câu 25 (Trầm cảm):** Vâng lời

- 🙂 Tôi thường làm những điều tôi được yêu cầu — 0 điểm
- 😐 Tôi thường không làm những điều mà tôi được yêu cầu — 1 điểm
- 😢 Tôi không bao giờ làm những điều tôi được yêu cầu — 2 điểm

**Câu 26 (Trầm cảm):** Đánh nhau

- 🙂 Tôi không bao giờ đánh nhau — 0 điểm
- 😐 Tôi thường đánh nhau — 1 điểm
- 😢 Tôi luôn luôn đánh nhau — 2 điểm

**Câu 27 (Trầm cảm):** Suy nghĩ về tự tử

- 🙂 Tôi không nghĩ về việc tự tử — 0 điểm
- 😐 Tôi nghĩ về việc tự tử — 1 điểm
- 😢 Tôi muốn tự tử — 2 điểm

### Cách tính điểm

**Trầm cảm (`depression`):**
- Công thức: Tổng điểm câu {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–12 | Không có trầm cảm |
  | 13–19 | Có dấu hiệu trầm cảm |
  | > 19 | Có trầm cảm |


---

## GDS — Geriatric Depression Scale

*Mã hệ thống: `gds` · Số câu: 30 · Điểm tối đa: 30 · Mốc thời gian hỏi: 1 tuần qua*

### Câu hỏi & đáp án

**Câu 1 (Trầm cảm):** Về cơ bản tôi hài lòng với cuộc sống của mình

- ✅ Đúng — 0 điểm
- ❌ Không đúng — 1 điểm

**Câu 2 (Trầm cảm):** Hiện tôi đã từ bỏ nhiều hoạt động và thú vui

- ✅ Đúng — 1 điểm
- ❌ Không đúng — 0 điểm

**Câu 3 (Trầm cảm):** Tôi cảm thấy cuộc sống của mình thật là trống rỗng

- ✅ Đúng — 1 điểm
- ❌ Không đúng — 0 điểm

**Câu 4 (Trầm cảm):** Tôi thường cảm thấy buồn chán

- ✅ Đúng — 1 điểm
- ❌ Không đúng — 0 điểm

**Câu 5 (Trầm cảm):** Tôi cảm thấy tương lai đầy triển vọng

- ✅ Đúng — 0 điểm
- ❌ Không đúng — 1 điểm

**Câu 6 (Trầm cảm):** Tôi thấy phiền muộn bởi có những ý nghĩ trong đầu không thể dứt ra được

- ✅ Đúng — 1 điểm
- ❌ Không đúng — 0 điểm

**Câu 7 (Trầm cảm):** Hầu hết thời gian tôi thấy thoải mái

- ✅ Đúng — 0 điểm
- ❌ Không đúng — 1 điểm

**Câu 8 (Trầm cảm):** Tôi sợ rằng có một điều tồi tệ sẽ xảy đến với mình

- ✅ Đúng — 1 điểm
- ❌ Không đúng — 0 điểm

**Câu 9 (Trầm cảm):** Phần lớn thời gian tôi cảm thấy hạnh phúc

- ✅ Đúng — 0 điểm
- ❌ Không đúng — 1 điểm

**Câu 10 (Trầm cảm):** Tôi thường cảm thấy không tự lo liệu được

- ✅ Đúng — 1 điểm
- ❌ Không đúng — 0 điểm

**Câu 11 (Trầm cảm):** Tôi thường cảm thấy bồn chồn, bất an

- ✅ Đúng — 1 điểm
- ❌ Không đúng — 0 điểm

**Câu 12 (Trầm cảm):** Tôi thích ở nhà hơn là đi ra ngoài và làm việc gì đó

- ✅ Đúng — 1 điểm
- ❌ Không đúng — 0 điểm

**Câu 13 (Trầm cảm):** Tôi thường thấy lo lắng về tương lai

- ✅ Đúng — 1 điểm
- ❌ Không đúng — 0 điểm

**Câu 14 (Trầm cảm):** Tôi cảm thấy mình có nhiều vấn đề về trí nhớ hơn hầu hết những người có cùng độ tuổi

- ✅ Đúng — 1 điểm
- ❌ Không đúng — 0 điểm

**Câu 15 (Trầm cảm):** Tôi nghĩ cuộc sống hiện tại thật là tuyệt vời

- ✅ Đúng — 0 điểm
- ❌ Không đúng — 1 điểm

**Câu 16 (Trầm cảm):** Tôi cảm thấy chán nản và thất vọng

- ✅ Đúng — 1 điểm
- ❌ Không đúng — 0 điểm

**Câu 17 (Trầm cảm):** Tôi cảm thấy khá vô dụng trong tình trạng hiện tại

- ✅ Đúng — 1 điểm
- ❌ Không đúng — 0 điểm

**Câu 18 (Trầm cảm):** Tôi lo nghĩ nhiều về quá khứ

- ✅ Đúng — 1 điểm
- ❌ Không đúng — 0 điểm

**Câu 19 (Trầm cảm):** Tôi nhận thấy cuộc sống rất thú vị

- ✅ Đúng — 0 điểm
- ❌ Không đúng — 1 điểm

**Câu 20 (Trầm cảm):** Tôi thấy khó để bắt đầu những kế hoạch mới

- ✅ Đúng — 1 điểm
- ❌ Không đúng — 0 điểm

**Câu 21 (Trầm cảm):** Tôi cảm thấy tràn đầy sinh lực

- ✅ Đúng — 0 điểm
- ❌ Không đúng — 1 điểm

**Câu 22 (Trầm cảm):** Tôi cảm thấy tình trạng của mình là tuyệt vọng

- ✅ Đúng — 1 điểm
- ❌ Không đúng — 0 điểm

**Câu 23 (Trầm cảm):** Tôi nghĩ hầu hết mọi người đều tốt hơn tôi

- ✅ Đúng — 1 điểm
- ❌ Không đúng — 0 điểm

**Câu 24 (Trầm cảm):** Tôi thường thấy bối rối cả với những việc nhỏ nhặt

- ✅ Đúng — 1 điểm
- ❌ Không đúng — 0 điểm

**Câu 25 (Trầm cảm):** Tôi thường cảm thấy muốn khóc

- ✅ Đúng — 1 điểm
- ❌ Không đúng — 0 điểm

**Câu 26 (Trầm cảm):** Tôi có vấn đề về tập trung chú ý

- ✅ Đúng — 1 điểm
- ❌ Không đúng — 0 điểm

**Câu 27 (Trầm cảm):** Khi thức dậy vào buổi sáng tôi thấy sảng khoái

- ✅ Đúng — 0 điểm
- ❌ Không đúng — 1 điểm

**Câu 28 (Trầm cảm):** Tôi không thích những chỗ hội họp đông người

- ✅ Đúng — 1 điểm
- ❌ Không đúng — 0 điểm

**Câu 29 (Trầm cảm):** Tôi dễ dàng đưa ra các quyết định

- ✅ Đúng — 0 điểm
- ❌ Không đúng — 1 điểm

**Câu 30 (Trầm cảm):** Trí óc tôi vẫn minh mẫn như trước kia

- ✅ Đúng — 0 điểm
- ❌ Không đúng — 1 điểm

### Cách tính điểm

**Trầm cảm (`depression`):**
- Công thức: Tổng điểm câu {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–9 | Không có trầm cảm |
  | 10–19 | Trầm cảm nhẹ |
  | > 19 | Trầm cảm nặng |


---

## EPDS — Edinburgh Postnatal Depression Scale

*Mã hệ thống: `epds` · Số câu: 10 · Điểm tối đa: 30 · Mốc thời gian hỏi: 1 tuần qua*

### Câu hỏi & đáp án

**Câu 1 (Trầm cảm sau sinh):** Tôi có thể cười và thấy khía cạnh hài hước của mọi chuyện

- 🙂 Vẫn như trước kia — 0 điểm
- 😐 Ít hơn trước kia — 1 điểm
- 😟 Hầu như không còn như trước kia — 2 điểm
- 😢 Không còn chút nào nữa — 3 điểm

**Câu 2 (Trầm cảm sau sinh):** Tôi luôn hào hứng mong chờ mọi điều đến với mình

- 🙂 Vẫn như trước kia — 0 điểm
- 😐 Ít hơn một chút so với trước đây — 1 điểm
- 😟 Ít hơn nhiều so với trước đây — 2 điểm
- 😢 Rất hiếm khi — 3 điểm

**Câu 3 (Trầm cảm sau sinh):** Khi mọi chuyện xấu đi tôi thường đổ lỗi cho bản thân

- 😢 Đúng, lúc nào cũng vậy — 3 điểm
- 😟 Đúng, vài lần như vậy — 2 điểm
- 😐 Hiếm khi như vậy — 1 điểm
- 🙂 Không bao giờ — 0 điểm

**Câu 4 (Trầm cảm sau sinh):** Tôi cảm thấy lo âu hoặc lo lắng mà không rõ nguyên nhân

- 🙂 Không có — 0 điểm
- 😐 Hiếm khi — 1 điểm
- 😟 Đúng, thỉnh thoảng — 2 điểm
- 😢 Đúng, rất thường xuyên — 3 điểm

**Câu 5 (Trầm cảm sau sinh):** Tôi cảm thấy hoảng hốt, sợ hãi một cách vô cớ

- 😢 Đúng, phần lớn thời gian — 3 điểm
- 😟 Có, một vài lần — 2 điểm
- 😐 Không, không nhiều — 1 điểm
- 🙂 Không có — 0 điểm

**Câu 6 (Trầm cảm sau sinh):** Mọi thứ đang đè nặng lên vai tôi

- 😢 Đúng, hầu hết thời gian tôi không thể làm được việc gì — 3 điểm
- 😟 Đúng, đôi lúc tôi không thể làm được mọi việc như trước đây — 2 điểm
- 😐 Không, đa phần tôi vẫn đảm đương tốt mọi việc như trước kia — 1 điểm
- 🙂 Không, tôi vẫn đảm đương tốt mọi việc như trước kia — 0 điểm

**Câu 7 (Trầm cảm sau sinh):** Tôi thường cảm thấy không vui và rất khó ngủ

- 😢 Đúng, hầu hết thời gian — 3 điểm
- 😟 Đúng, đôi lúc như thế — 2 điểm
- 😐 Ít khi như thế — 1 điểm
- 🙂 Không có — 0 điểm

**Câu 8 (Trầm cảm sau sinh):** Tôi cảm thấy buồn bã và bất hạnh

- 😢 Đúng, hầu hết là như thế — 3 điểm
- 😟 Đúng, đôi lúc như thế — 2 điểm
- 😐 Ít khi như thế — 1 điểm
- 🙂 Không có — 0 điểm

**Câu 9 (Trầm cảm sau sinh):** Tôi thấy buồn chán đến phát khóc

- 😢 Đúng, hầu hết thời gian — 3 điểm
- 😟 Đúng, rất thường xuyên — 2 điểm
- 😐 Chỉ tuỳ từng lúc — 1 điểm
- 🙂 Không bao giờ — 0 điểm

**Câu 10 (Trầm cảm sau sinh):** Ý nghĩ tự làm hại bản thân xuất hiện trong đầu tôi

- 😢 Đúng, khá thường xuyên — 3 điểm
- 😟 Thỉnh thoảng — 2 điểm
- 😐 Hiếm khi — 1 điểm
- 🙂 Không bao giờ — 0 điểm

### Cách tính điểm

**Trầm cảm sau sinh (`depression`):**
- Công thức: Tổng điểm câu {1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–9 | Không có trầm cảm |
  | 10–12 | Có nguy cơ trầm cảm |
  | > 12 | Có trầm cảm |


---

## ZAI — Zung Self-Rating Anxiety Inventory (Trắc nghiệm Lo âu Zung)

*Mã hệ thống: `zai` · Số câu: 20 · Điểm tối đa: 100 · Mốc thời gian hỏi: 1 tuần qua*

### Câu hỏi & đáp án

**Câu 1 (Lo âu):** Tôi cảm thấy nóng nảy và lo âu hơn thường lệ

- 😊 Không có — 1 điểm
- 😐 Đôi khi — 2 điểm
- 😟 Thường xuyên — 3 điểm
- 😰 Luôn luôn — 4 điểm

**Câu 2 (Lo âu):** Tôi cảm thấy sợ vô cớ

- 😊 Không có — 1 điểm
- 😐 Đôi khi — 2 điểm
- 😟 Thường xuyên — 3 điểm
- 😰 Luôn luôn — 4 điểm

**Câu 3 (Lo âu):** Tôi dễ bối rối và cảm thấy hoảng sợ

- 😊 Không có — 1 điểm
- 😐 Đôi khi — 2 điểm
- 😟 Thường xuyên — 3 điểm
- 😰 Luôn luôn — 4 điểm

**Câu 4 (Lo âu):** Tôi cảm thấy như bị ngã và vỡ ra từng mảnh

- 😊 Không có — 1 điểm
- 😐 Đôi khi — 2 điểm
- 😟 Thường xuyên — 3 điểm
- 😰 Luôn luôn — 4 điểm

**Câu 5 (Lo âu):** Tôi cảm thấy mọi thứ đều tốt và không có điều gì xấu sẽ xảy ra

- 😊 Không có — 4 điểm
- 😐 Đôi khi — 3 điểm
- 😟 Thường xuyên — 2 điểm
- 😰 Luôn luôn — 1 điểm

**Câu 6 (Lo âu):** Tay và chân tôi lắc lư, run lên

- 😊 Không có — 1 điểm
- 😐 Đôi khi — 2 điểm
- 😟 Thường xuyên — 3 điểm
- 😰 Luôn luôn — 4 điểm

**Câu 7 (Lo âu):** Tôi đang khó chịu vì đau đầu, đau cổ, đau lưng

- 😊 Không có — 1 điểm
- 😐 Đôi khi — 2 điểm
- 😟 Thường xuyên — 3 điểm
- 😰 Luôn luôn — 4 điểm

**Câu 8 (Lo âu):** Tôi cảm thấy yếu và dễ mệt mỏi

- 😊 Không có — 1 điểm
- 😐 Đôi khi — 2 điểm
- 😟 Thường xuyên — 3 điểm
- 😰 Luôn luôn — 4 điểm

**Câu 9 (Lo âu):** Tôi cảm thấy bình tĩnh và có thể ngồi yên một cách dễ dàng

- 😊 Không có — 4 điểm
- 😐 Đôi khi — 3 điểm
- 😟 Thường xuyên — 2 điểm
- 😰 Luôn luôn — 1 điểm

**Câu 10 (Lo âu):** Tôi cảm thấy tim mình đập nhanh

- 😊 Không có — 1 điểm
- 😐 Đôi khi — 2 điểm
- 😟 Thường xuyên — 3 điểm
- 😰 Luôn luôn — 4 điểm

**Câu 11 (Lo âu):** Tôi đang khó chịu vì cơn hoa mắt chóng mặt

- 😊 Không có — 1 điểm
- 😐 Đôi khi — 2 điểm
- 😟 Thường xuyên — 3 điểm
- 😰 Luôn luôn — 4 điểm

**Câu 12 (Lo âu):** Tôi bị ngất và có lúc cảm thấy gần như thế

- 😊 Không có — 1 điểm
- 😐 Đôi khi — 2 điểm
- 😟 Thường xuyên — 3 điểm
- 😰 Luôn luôn — 4 điểm

**Câu 13 (Lo âu):** Tôi có thể thở ra, hít vào một cách dễ dàng

- 😊 Không có — 4 điểm
- 😐 Đôi khi — 3 điểm
- 😟 Thường xuyên — 2 điểm
- 😰 Luôn luôn — 1 điểm

**Câu 14 (Lo âu):** Tôi cảm thấy tê buốt, như có kiến bò ở đầu ngón tay, ngón chân

- 😊 Không có — 1 điểm
- 😐 Đôi khi — 2 điểm
- 😟 Thường xuyên — 3 điểm
- 😰 Luôn luôn — 4 điểm

**Câu 15 (Lo âu):** Tôi đang khó chịu vì đau dạ dày và đầy bụng

- 😊 Không có — 1 điểm
- 😐 Đôi khi — 2 điểm
- 😟 Thường xuyên — 3 điểm
- 😰 Luôn luôn — 4 điểm

**Câu 16 (Lo âu):** Tôi luôn cần phải đi đái

- 😊 Không có — 1 điểm
- 😐 Đôi khi — 2 điểm
- 😟 Thường xuyên — 3 điểm
- 😰 Luôn luôn — 4 điểm

**Câu 17 (Lo âu):** Bàn tay tôi thường khô và ấm

- 😊 Không có — 4 điểm
- 😐 Đôi khi — 3 điểm
- 😟 Thường xuyên — 2 điểm
- 😰 Luôn luôn — 1 điểm

**Câu 18 (Lo âu):** Mặt tôi thường nóng và đỏ

- 😊 Không có — 1 điểm
- 😐 Đôi khi — 2 điểm
- 😟 Thường xuyên — 3 điểm
- 😰 Luôn luôn — 4 điểm

**Câu 19 (Lo âu):** Tôi ngủ dễ dàng và luôn có một giấc ngủ tốt

- 😊 Không có — 4 điểm
- 😐 Đôi khi — 3 điểm
- 😟 Thường xuyên — 2 điểm
- 😰 Luôn luôn — 1 điểm

**Câu 20 (Lo âu):** Tôi thường có ác mộng

- 😊 Không có — 1 điểm
- 😐 Đôi khi — 2 điểm
- 😟 Thường xuyên — 3 điểm
- 😰 Luôn luôn — 4 điểm

### Cách tính điểm

**Lo âu (`anxiety`):**
- Công thức: Tổng điểm câu {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20} × 1.25
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–44 | Không có lo âu bệnh lý |
  | 45–59 | Lo âu mức độ nhẹ đến trung bình |
  | 60–74 | Lo âu mức độ nặng |
  | > 74 | Lo âu mức độ rất nặng |


---

## HADS — Hospital Anxiety and Depression Scale (Trắc nghiệm Lo âu - Trầm cảm)

*Mã hệ thống: `hads` · Số câu: 14 · Điểm tối đa: 42 · Mốc thời gian hỏi: 1-2 tuần qua*

### Câu hỏi & đáp án

**Câu 1 (Lo âu):** Tôi cảm thấy căng thẳng hoặc bực dọc

- 🙂 Không bao giờ — 0 điểm
- 😐 Thỉnh thoảng — 1 điểm
- 😟 Thường xuyên — 2 điểm
- 😰 Phần lớn thời gian — 3 điểm

**Câu 2 (Trầm cảm):** Tôi hài lòng về mọi điều như trước kia

- 🙂 Vâng, hoàn toàn như vậy — 0 điểm
- 😐 Không hoàn toàn — 1 điểm
- 😟 Chỉ một ít — 2 điểm
- 😰 Hầu như không nữa — 3 điểm

**Câu 3 (Lo âu):** Tôi có một cảm giác sợ giống như điều khủng khiếp đang xảy ra

- 🙂 Không một ít nào — 0 điểm
- 😐 Hơi một chút, nhưng điều đó không làm tôi lo lắng — 1 điểm
- 😟 Vâng, nhưng điều đó không đến nỗi vậy — 2 điểm
- 😰 Vâng, rất rõ — 3 điểm

**Câu 4 (Trầm cảm):** Tôi cười dễ dàng và thấy khía cạnh tốt của mọi thứ

- 🙂 Cũng như trước đây — 0 điểm
- 😐 Không được như trước đây — 1 điểm
- 😟 Hoàn toàn ít hơn trước — 2 điểm
- 😰 Không còn gì cả — 3 điểm

**Câu 5 (Lo âu):** Tôi lo lắng

- 🙂 Rất tình cờ — 0 điểm
- 😐 Tình cờ — 1 điểm
- 😟 Khá thường xuyên — 2 điểm
- 😰 Rất thường xuyên — 3 điểm

**Câu 6 (Trầm cảm):** Tâm trạng tôi thoải mái

- 🙂 Phần lớn thời gian — 0 điểm
- 😐 Khá thường xuyên — 1 điểm
- 😟 Rất hiếm khi — 2 điểm
- 😰 Không bao giờ — 3 điểm

**Câu 7 (Lo âu):** Tôi có thể ngồi yên lặng, không làm gì hết và cảm giác thoải mái

- 🙂 Vâng, dù điều gì đó xảy ra — 0 điểm
- 😐 Vâng, nói chung là như vậy — 1 điểm
- 😟 Hiếm khi — 2 điểm
- 😰 Không bao giờ — 3 điểm

**Câu 8 (Trầm cảm):** Tôi có cảm giác hoạt động chậm lại

- 🙂 Không bao giờ — 0 điểm
- 😐 Đôi khi — 1 điểm
- 😟 Rất thường xuyên — 2 điểm
- 😰 Hầu như luôn luôn — 3 điểm

**Câu 9 (Lo âu):** Tôi cảm thấy những cảm giác sợ và dạ dày tắc lại

- 🙂 Không bao giờ — 0 điểm
- 😐 Đôi khi — 1 điểm
- 😟 Khá thường xuyên — 2 điểm
- 😰 Rất thường xuyên — 3 điểm

**Câu 10 (Trầm cảm):** Tôi không quan tâm nữa tới vẻ ngoài của tôi

- 🙂 Tôi để ý đến nó như trước kia — 0 điểm
- 😐 Có thể là tôi cũng không chú ý đến nó nữa — 1 điểm
- 😟 Tôi không biết ăn mặc, trang điểm cho phù hợp với hoàn cảnh nữa — 2 điểm
- 😰 Không còn gì cả — 3 điểm

**Câu 11 (Lo âu):** Tôi cảm thấy bất ổn, đứng ngồi không yên

- 🙂 Không một tí nào — 0 điểm
- 😐 Không hoàn toàn — 1 điểm
- 😟 Hơi một tí — 2 điểm
- 😰 Vâng, hoàn toàn đúng như vậy — 3 điểm

**Câu 12 (Trầm cảm):** Tôi mừng khi định làm một việc gì đó

- 🙂 Cũng như trước — 0 điểm
- 😐 Hơi kém hơn trước — 1 điểm
- 😟 Kém rõ rệt hơn trước — 2 điểm
- 😰 Hầu như không bao giờ — 3 điểm

**Câu 13 (Lo âu):** Tôi cảm thấy những cảm giác đột nhiên hoảng sợ

- 🙂 Không bao giờ — 0 điểm
- 😐 Thỉnh thoảng — 1 điểm
- 😟 Khá thường xuyên — 2 điểm
- 😰 Hoàn toàn rất thường xuyên — 3 điểm

**Câu 14 (Trầm cảm):** Tôi có thể hài lòng về một cuốn sách hoặc một buổi phát hay trên đài hoặc ti vi

- 🙂 Thường xuyên — 0 điểm
- 😐 Đôi khi — 1 điểm
- 😟 Hiếm khi — 2 điểm
- 😰 Rất hiếm khi — 3 điểm

### Cách tính điểm

**Lo âu (`anxiety`):**
- Công thức: Tổng điểm câu {1, 3, 5, 7, 9, 11, 13}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | > -1 | Lo âu |

**Trầm cảm (`depression`):**
- Công thức: Tổng điểm câu {2, 4, 6, 8, 10, 12, 14}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | > -1 | Trầm cảm |

**Tổng điểm (`total`):**
- Công thức: Tổng điểm câu {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–7 | Trạng thái ổn định |
  | 8–10 | Trạng thái ranh giới |
  | > 10 | Có trầm cảm - lo âu |


---

## M-CHAT — Trắc nghiệm sàng lọc tự kỷ cho trẻ nhỏ 16-30 tháng (M-CHAT)

*Mã hệ thống: `mchat` · Số câu: 20 · Điểm tối đa: 20 · Mốc thời gian hỏi: Biểu hiện thường thấy ở trẻ (bỏ qua nếu chỉ thấy 1-2 lần)*

### Câu hỏi & đáp án

**Câu 1 (Nguy cơ tự kỷ):** Nếu bạn chỉ vào một điểm trong phòng, con bạn có nhìn theo không? (Ví dụ: nếu bạn chỉ vào đồ chơi hay con vật, con bạn có nhìn vào đồ chơi đó hay con vật đó không?)

- ✅ Có — 0 điểm
- ❌ Không — 1 điểm

**Câu 2 (Nguy cơ tự kỷ):** Bạn có bao giờ tự hỏi liệu con bạn có bị điếc không?

- ✅ Có — 1 điểm
- ❌ Không — 0 điểm

**Câu 3 (Nguy cơ tự kỷ):** Con bạn có chơi trò tưởng tượng hoặc giả vờ không? (Ví dụ: giả vờ uống nước từ một cái cốc rỗng, giả vờ nói chuyện điện thoại hay giả vờ cho búp bê, thú bông ăn)

- ✅ Có — 0 điểm
- ❌ Không — 1 điểm

**Câu 4 (Nguy cơ tự kỷ):** Con bạn có thích leo trèo lên đồ vật không? (Ví dụ: trèo lên đồ đạc trong nhà, đồ chơi ngoài trời hoặc leo cầu thang)

- ✅ Có — 0 điểm
- ❌ Không — 1 điểm

**Câu 5 (Nguy cơ tự kỷ):** Con bạn có làm các cử động ngón tay một cách bất thường gần mắt của trẻ không? (Ví dụ: con bạn có vẫy/đưa qua đưa lại ngón tay gần mắt của trẻ)

- ✅ Có — 1 điểm
- ❌ Không — 0 điểm

**Câu 6 (Nguy cơ tự kỷ):** Con bạn có dùng ngón tay trỏ của trẻ để yêu cầu việc gì đó, hoặc để muốn được giúp đỡ không? (Ví dụ: chỉ vào bim bim hoặc đồ chơi ngoài tầm với)

- ✅ Có — 0 điểm
- ❌ Không — 1 điểm

**Câu 7 (Nguy cơ tự kỷ):** Con bạn có dùng một ngón tay để chỉ cho bạn thứ gì đó thú vị mà trẻ thích thú không? (Ví dụ: chỉ vào máy bay trên bầu trời hoặc một cái xe tải lớn trên đường)

- ✅ Có — 0 điểm
- ❌ Không — 1 điểm

**Câu 8 (Nguy cơ tự kỷ):** Con bạn có thích chơi với những đứa trẻ khác không? (Ví dụ: con bạn có quan sát những đứa trẻ khác, cười với những trẻ này hoặc tới chơi với chúng không?)

- ✅ Có — 0 điểm
- ❌ Không — 1 điểm

**Câu 9 (Nguy cơ tự kỷ):** Con bạn có khoe với bạn những đồ vật bằng cách cầm hoặc mang chúng đến cho bạn xem, không phải để được bạn giúp đỡ mà chỉ để chia sẻ với bạn không? (Ví dụ: khoe với bạn một bông hoa, thú bông hoặc một cái xe tải đồ chơi)

- ✅ Có — 0 điểm
- ❌ Không — 1 điểm

**Câu 10 (Nguy cơ tự kỷ):** Con bạn có đáp lại khi được gọi tên không? (Ví dụ: con bạn có ngước lên tìm người gọi, đáp chuyện hay bập bẹ, hoặc ngừng việc đang làm khi bạn gọi tên của trẻ?)

- ✅ Có — 0 điểm
- ❌ Không — 1 điểm

**Câu 11 (Nguy cơ tự kỷ):** Khi bạn cười với con bạn, con bạn có cười lại với bạn không?

- ✅ Có — 0 điểm
- ❌ Không — 1 điểm

**Câu 12 (Nguy cơ tự kỷ):** Con bạn có cảm thấy khó chịu bởi những tiếng ồn xung quanh? (Ví dụ: con bạn có hét lên hay la khóc khi nghe tiếng ồn của máy hút bụi hoặc tiếng nhạc to?)

- ✅ Có — 1 điểm
- ❌ Không — 0 điểm

**Câu 13 (Nguy cơ tự kỷ):** Con bạn có biết đi không?

- ✅ Có — 0 điểm
- ❌ Không — 1 điểm

**Câu 14 (Nguy cơ tự kỷ):** Con bạn có nhìn vào mắt bạn khi bạn đang nói chuyện với trẻ, chơi cùng trẻ hoặc mặc quần áo cho trẻ không?

- ✅ Có — 0 điểm
- ❌ Không — 1 điểm

**Câu 15 (Nguy cơ tự kỷ):** Con bạn có bắt chước những điều bạn làm không? (Ví dụ: vẫy tay bye bye, vỗ tay hoặc bắt chước tạo ra những âm thanh vui vẻ)

- ✅ Có — 0 điểm
- ❌ Không — 1 điểm

**Câu 16 (Nguy cơ tự kỷ):** Nếu bạn quay đầu để nhìn gì đó, con bạn có nhìn xung quanh để xem bạn đang nhìn cái gì không?

- ✅ Có — 0 điểm
- ❌ Không — 1 điểm

**Câu 17 (Nguy cơ tự kỷ):** Con bạn có gây sự chú ý để bạn phải nhìn vào trẻ không? (Ví dụ: con bạn có nhìn bạn để được bạn khen ngợi hoặc trẻ nói "nhìn" hay "nhìn con")

- ✅ Có — 0 điểm
- ❌ Không — 1 điểm

**Câu 18 (Nguy cơ tự kỷ):** Con bạn có hiểu bạn nói gì khi bạn yêu cầu con làm không? (Ví dụ: Nếu bạn không chỉ tay, con bạn có hiểu "để sách lên ghế", "đưa mẹ/bố cái chăn" không?)

- ✅ Có — 0 điểm
- ❌ Không — 1 điểm

**Câu 19 (Nguy cơ tự kỷ):** Nếu có điều gì mới lạ, con bạn có nhìn bạn để xem bạn cảm thấy thế nào về việc xảy ra không? (Ví dụ: nếu trẻ nghe thấy một âm thanh lạ hoặc thú vị, hay nhìn thấy một đồ chơi mới, con bạn có nhìn bạn không?)

- ✅ Có — 0 điểm
- ❌ Không — 1 điểm

**Câu 20 (Nguy cơ tự kỷ):** Con bạn có thích những hoạt động mang tính chất chuyển động không? (Ví dụ: được lắc lư hoặc nhún nhảy trên đầu gối của bạn)

- ✅ Có — 0 điểm
- ❌ Không — 1 điểm

### Cách tính điểm

**Nguy cơ tự kỷ (`risk`):**
- Công thức: Tổng điểm câu {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–2 | Nguy cơ tự kỷ thấp |
  | 3–7 | Có nguy cơ tự kỷ |
  | > 7 | Nguy cơ tự kỷ cao |


---

## ASQ-3 (24 tháng) — Trắc nghiệm giai đoạn và lứa tuổi cho trẻ em — Phiếu 6, 24-35 tháng tuổi (ASQ-3, bản Có/Không theo Bộ Y tế)

*Mã hệ thống: `asq3` · Số câu: 20 · Điểm tối đa: 20 · Mốc thời gian hỏi: Giai đoạn hiện tại của trẻ (24-35 tháng tuổi)*

### Câu hỏi & đáp án

**Câu 1 (Giao tiếp):** Trẻ có chỉ đúng vào đồ vật/con vật trong tranh khi được hỏi không? (VD, Con chó đâu? Cái cốc đâu?)

- ✅ Có — 0 điểm
- ❌ Không — 1 điểm

**Câu 2 (Giao tiếp):** Trẻ có nói được câu 2-3 từ đúng ngữ cảnh không? (VD, Mẹ về rồi)

- ✅ Có — 0 điểm
- ❌ Không — 1 điểm

**Câu 3 (Giao tiếp):** Trẻ có biết làm theo mệnh lệnh đơn giản không? (VD, Cất đồ chơi đi)

- ✅ Có — 0 điểm
- ❌ Không — 1 điểm

**Câu 4 (Vận động thô):** Trẻ có biết bước lên ít nhất 1-2 bậc cửa/cầu thang không?

- ✅ Có — 0 điểm
- ❌ Không — 1 điểm

**Câu 5 (Vận động thô):** Trẻ có biết chạy nhanh và dừng lại mà không bị ngã không?

- ✅ Có — 0 điểm
- ❌ Không — 1 điểm

**Câu 6 (Vận động thô):** Trẻ có thể giơ chân đá bóng khi bám tay không?

- ✅ Có — 0 điểm
- ❌ Không — 1 điểm

**Câu 7 (Vận động tinh):** Trẻ có biết dùng thìa xúc thức ăn đưa vào miệng không?

- ✅ Có — 0 điểm
- ❌ Không — 1 điểm

**Câu 8 (Vận động tinh):** Trẻ có biết xoay núm cửa, xoay nắp đồ chơi không?

- ✅ Có — 0 điểm
- ❌ Không — 1 điểm

**Câu 9 (Vận động tinh):** Trẻ có biết tự lật trang sách (mỗi lần tự lật một vài trang) không?

- ✅ Có — 0 điểm
- ❌ Không — 1 điểm

**Câu 10 (Bắt chước và học):** Trẻ có biết chơi tưởng tượng không? (VD, Giả vờ gọi điện thoại)

- ✅ Có — 0 điểm
- ❌ Không — 1 điểm

**Câu 11 (Bắt chước và học):** Trẻ có bắt chước vẽ đường thẳng theo bạn không?

- ✅ Có — 0 điểm
- ❌ Không — 1 điểm

**Câu 12 (Bắt chước và học):** Trẻ có biết cất đồ vật vào đúng chỗ không? (VD, Cất đồ chơi vào hộp)

- ✅ Có — 0 điểm
- ❌ Không — 1 điểm

**Câu 13 (Cá nhân - xã hội):** Trẻ có biết uống nước bằng cốc không?

- ✅ Có — 0 điểm
- ❌ Không — 1 điểm

**Câu 14 (Cá nhân - xã hội):** Trẻ có biết bắt chước hành động không? (VD: quét nhà, chải tóc…)

- ✅ Có — 0 điểm
- ❌ Không — 1 điểm

**Câu 15 (Cá nhân - xã hội):** Trẻ có biết chơi giả vờ với đồ chơi của mình không? (VD, Ru bé ngủ)

- ✅ Có — 0 điểm
- ❌ Không — 1 điểm

**Câu 16 (Dấu hiệu cảnh báo):** Trẻ có khi nào bị co giật/ngất xỉu không?

- ❌ Không — 0 điểm
- ✅ Có — 1 điểm

**Câu 17 (Dấu hiệu cảnh báo):** Trẻ có bất thường ở cổ, cột sống, thân mình, tay chân không?

- ❌ Không — 0 điểm
- ✅ Có — 1 điểm

**Câu 18 (Dấu hiệu cảnh báo):** Trẻ có bất thường ở tai, bệnh về tai hoặc nghe kém không?

- ❌ Không — 0 điểm
- ✅ Có — 1 điểm

**Câu 19 (Dấu hiệu cảnh báo):** Trẻ có bất thường ở mắt hoặc nhìn kém không?

- ❌ Không — 0 điểm
- ✅ Có — 1 điểm

**Câu 20 (Dấu hiệu cảnh báo):** Trẻ có các bất thường nào khác không? (VD: mặt, môi/hàm ếch…)

- ❌ Không — 0 điểm
- ✅ Có — 1 điểm

### Cách tính điểm

**Giao tiếp (`communication`):**
- Công thức: Tổng điểm câu {1, 2, 3}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–1 | Bình thường |
  | > 1 | Nghi ngờ chậm phát triển |

**Vận động thô (`grossmotor`):**
- Công thức: Tổng điểm câu {4, 5, 6}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–1 | Bình thường |
  | > 1 | Nghi ngờ chậm phát triển |

**Vận động tinh (`finemotor`):**
- Công thức: Tổng điểm câu {7, 8, 9}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–1 | Bình thường |
  | > 1 | Nghi ngờ chậm phát triển |

**Bắt chước và học (`imitation`):**
- Công thức: Tổng điểm câu {10, 11, 12}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–1 | Bình thường |
  | > 1 | Nghi ngờ chậm phát triển |

**Cá nhân - xã hội (`personalsocial`):**
- Công thức: Tổng điểm câu {13, 14, 15}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–1 | Bình thường |
  | > 1 | Nghi ngờ chậm phát triển |

**Dấu hiệu cảnh báo (`redflag`):**
- Công thức: Tổng điểm câu {16, 17, 18, 19, 20}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–0 | Bình thường |
  | > 0 | Có dấu hiệu bất thường — cần khám chuyên khoa |


---

## CGI-S — Trắc nghiệm Ấn tượng lâm sàng chung - Mức độ nặng (Clinical Global Impression - Severity Scale)

*Mã hệ thống: `cgis` · Số câu: 7 · Điểm tối đa: 49 · Mốc thời gian hỏi: 7 ngày qua*

### Câu hỏi & đáp án

**Thang trả lời chung cho tất cả câu:** ✅ 1 = Bình thường — không bị bệnh, các triệu chứng rối loạn tâm thần không xuất hiện trong 7 ngày qua (1) · 🔹 2 = Ranh giới — có dấu hiệu nghi ngờ bệnh lý tâm thần (2) · 🟡 3 = Mức độ nhẹ — triệu chứng nhẹ xuất hiện rõ ràng, buồn phiền, có thể khó khăn nhẹ về chức năng xã hội/nghề nghiệp (3) · 🟠 4 = Mức độ vừa — triệu chứng rõ rệt hơn, đáng chú ý nhưng chưa nặng, suy giảm chức năng xã hội/nghề nghiệp, có thể cần dùng thuốc (4) · 🔶 5 = Mức độ rõ rệt — làm suy yếu rõ rệt chức năng xã hội/nghề nghiệp hoặc gây khó chịu rõ rệt ở người bệnh (5) · 🔴 6 = Mức độ nặng — ảnh hưởng rõ rệt đến hành vi và chức năng, có thể cần sự hỗ trợ của người khác (6) · 🚨 7 = Mức độ trầm trọng — ảnh hưởng rất nghiêm trọng đến nhiều chức năng sống, có thể phải nhập viện (7)

| # | Câu hỏi | Nhóm |
|---|---|---|
| 1 | Báo cáo bằng lời nói của người bệnh về mức độ nghiêm trọng của triệu chứng trong khi phỏng vấn | Mức độ nặng |
| 2 | Báo cáo bằng lời nói của người bệnh về tình trạng chức năng của họ (vận động, sinh hoạt…) | Mức độ nặng |
| 3 | Các khía cạnh quan sát được về hành vi ở người bệnh (do bác sĩ/cán bộ thực hiện trắc nghiệm ghi nhận) | Mức độ nặng |
| 4 | Điểm đánh giá khách quan từ bảng hỏi (ví dụ: điểm trắc nghiệm HDRS/Hamilton) | Mức độ nặng |
| 5 | Điểm đánh giá chủ quan từ bảng hỏi (ví dụ: điểm thang BECK) | Mức độ nặng |
| 6 | Mức độ của tác dụng phụ mà người bệnh trải qua | Mức độ nặng |
| 7 | Nhận xét từ quan sát của người nhà, cán bộ y tế hoặc người chăm sóc trước đó về người bệnh | Mức độ nặng |

### Cách tính điểm

**Mức độ nặng (`severity`):**
- Công thức: Tổng điểm câu {1, 2, 3, 4, 5, 6, 7}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–13.3 | Bình thường |
  | 14.3–20.3 | Ranh giới |
  | 21.3–27.3 | Mức độ nhẹ |
  | 28.3–34.3 | Mức độ vừa |
  | 35.3–41.3 | Mức độ rõ rệt |
  | 42.3–48.3 | Mức độ nặng |
  | > 48.3 | Mức độ trầm trọng |


---

## BPRS — Trắc nghiệm Tâm thần rút gọn (Brief Psychiatric Rating Scale)

*Mã hệ thống: `bprs` · Số câu: 24 · Điểm tối đa: 168 · Mốc thời gian hỏi: Thời điểm phỏng vấn*

### Câu hỏi & đáp án

**Thang trả lời chung cho tất cả câu:** ✅ 1 = Không có (1) · 🔹 2 = Tối thiểu (2) · 🟡 3 = Nhẹ (3) · 🟠 4 = Trung bình (4) · 🔶 5 = Trung bình nặng (5) · 🔴 6 = Nặng (6) · 🚨 7 = Rất nặng (7)

| # | Câu hỏi | Nhóm |
|---|---|---|
| 1 | Lo lắng về cơ thể (bận tâm về sức khỏe thể chất hiện tại, có căn cứ thực tế hay không) | Tự báo cáo |
| 2 | Lo âu (lo lắng, căng thẳng, sợ hãi, hoảng sợ) | Tự báo cáo |
| 3 | Trầm cảm (buồn bã, mất hứng thú, mất lòng tự trọng, cảm giác vô vọng) | Tự báo cáo |
| 4 | Tự sát (bày tỏ mong muốn, ý định hoặc hành vi tự làm hại/tự sát) | Tự báo cáo |
| 5 | Cảm giác tội lỗi (quan tâm hoặc hối hận về hành vi trong quá khứ) | Tự báo cáo |
| 6 | Thù địch (khinh bỉ, hiếu chiến, đe dọa, tranh luận, cơn giận dữ, phá hủy tài sản) | Tự báo cáo |
| 7 | Khí sắc hưng phấn (cảm giác hạnh phúc, vui tươi, sảng khoái, lạc quan không tương xứng với tình huống) | Tự báo cáo |
| 8 | Tự cao (tự phóng đại niềm tin về khả năng đặc biệt, quyền lực, sự giàu có, nổi tiếng) | Tự báo cáo |
| 9 | Sự nghi ngờ (tin rằng người khác đã/đang hành động hiểm độc hoặc phân biệt đối xử với mình) | Tự báo cáo |
| 10 | Ảo giác (cảm nhận tri giác khi không có kích thích bên ngoài tương ứng) | Tự báo cáo |
| 11 | Nội dung tư duy kỳ lạ (nội dung tư duy bất thường, kỳ cục hoặc kỳ quái; hoang tưởng) | Tự báo cáo |
| 12 | Hành vi kỳ dị (hành vi kỳ lạ, bất thường hoặc có tính chất phạm pháp do loạn thần) | Tự báo cáo |
| 13 | Không tự chăm sóc bản thân (vệ sinh, diện mạo, hành vi ăn uống dưới mức bình thường) | Tự báo cáo |
| 14 | Mất phương hướng (không hiểu tình huống, nhầm lẫn về người, địa điểm, thời gian) | Tự báo cáo |
| 15 | Rối loạn nhận thức (lời nói bị nhầm lẫn, ngắt kết nối, mơ hồ, xa rời chủ đề) | Quan sát |
| 16 | Cảm xúc cùn mòn (hạn chế biểu cảm cảm xúc ở nét mặt, giọng nói, cử chỉ) | Quan sát |
| 17 | Cảm xúc thu mình (thiếu khả năng liên kết cảm xúc trong tình huống phỏng vấn) | Quan sát |
| 18 | Giảm vận động (cử động, lời nói chậm lại, giảm mức năng lượng) | Quan sát |
| 19 | Tình trạng căng thẳng (biểu hiện thể chất/vận động của sự căng thẳng, nóng nảy, kích động) | Quan sát |
| 20 | Không hợp tác (phản kháng, thiếu sẵn sàng hợp tác với cuộc phỏng vấn) | Quan sát |
| 21 | Kích động (mức độ cảm xúc cao hoặc tăng phản ứng cảm xúc với người phỏng vấn/chủ đề thảo luận) | Quan sát |
| 22 | Đãng trí (chuỗi lời nói và hành động bị gián đoạn bởi các kích thích không liên quan đến phỏng vấn) | Quan sát |
| 23 | Tăng hoạt động, vận động (tăng mức năng lượng, hoạt động thường xuyên hơn, nói nhanh) | Quan sát |
| 24 | Dáng vẻ cầu kỳ và điệu bộ (hành vi, vận động có vẻ điệu bộ, tư thế bất thường hoặc không phù hợp) | Quan sát |

### Cách tính điểm

**Tự báo cáo (`selfReport`):**
- Công thức: Tổng điểm câu {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | > -1 | Nhóm tự báo cáo (thang điểm thô 14–98; tài liệu nguồn không quy định ngưỡng phân loại riêng cho nhóm này) |

**Quan sát (`observed`):**
- Công thức: Tổng điểm câu {15, 16, 17, 18, 19, 20, 21, 22, 23, 24}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | > -1 | Nhóm quan sát hành vi (thang điểm thô 10–70; tài liệu nguồn không quy định ngưỡng phân loại riêng cho nhóm này) |

**Tổng điểm (`total`):**
- Công thức: Tổng điểm câu {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–45.6 | Bình thường |
  | 46.6–69.6 | Ranh giới |
  | 70.6–93.6 | Mức độ nhẹ |
  | 94.6–117.6 | Mức độ vừa |
  | 118.6–141.6 | Mức độ rõ rệt |
  | 142.6–165.6 | Mức độ nặng |
  | > 165.6 | Mức độ trầm trọng |


---

## PANSS — Thang Hội chứng Dương tính và Âm tính (Positive and Negative Syndrome Scale)

*Mã hệ thống: `panss` · Số câu: 30 · Điểm tối đa: 210 · Mốc thời gian hỏi: Thời điểm phỏng vấn*

### Câu hỏi & đáp án

**Thang trả lời chung cho tất cả câu:** ✅ 1 = Không có (1) · 🔹 2 = Tối thiểu (2) · 🟡 3 = Nhẹ (3) · 🟠 4 = Trung bình (4) · 🔶 5 = Trung bình nặng (5) · 🔴 6 = Nặng (6) · 🚨 7 = Cực nặng (7)

| # | Câu hỏi | Nhóm |
|---|---|---|
| 1 | P1. Hoang tưởng (tin tưởng không có cơ sở, không có thực, khác thường của riêng bệnh nhân) | Dương tính |
| 2 | P2. Sự tan rã các ý niệm (gián đoạn tiến trình tư duy hướng tới mục đích: lai nhai, vòng vo, liên tưởng lỏng lẻo, không logic) | Dương tính |
| 3 | P3. Hành vi ảo giác (ngôn ngữ/hành vi cho thấy tri giác không do kích thích bên ngoài khởi động) | Dương tính |
| 4 | P4. Kích động (gia tăng hoạt động, đáp ứng cao độ với kích thích, cảm xúc rất không ổn định) | Dương tính |
| 5 | P5. Ý tưởng tự cao (cường điệu quan điểm về bản thân, tin tưởng phi lý về khả năng siêu việt, giàu có, quyền lực, danh tiếng) | Dương tính |
| 6 | P6. Đa nghi/ý tưởng bị ám hại (ý nghĩ bị hại không có thực hoặc phóng đại: thận trọng, ngờ vực, tăng cảnh giác) | Dương tính |
| 7 | P7. Sự thù ghét (biểu hiện ngôn ngữ và phi ngôn ngữ của sự giận dữ: châm chọc, gây hấn thụ động, chửi bới, hành hung) | Dương tính |
| 8 | N1. Cảm xúc cùn mòn (giảm đáp ứng cảm xúc: giảm biểu hiện nét mặt, thay đổi cảm xúc và cử chỉ giao tiếp) | Âm tính |
| 9 | N2. Thu rút cảm xúc (mất hứng thú hoặc biểu lộ tình cảm trong các sự kiện của cuộc sống) | Âm tính |
| 10 | N3. Quan hệ kém (mất sự đồng cảm, cởi mở, gần gũi hoặc hứng thú trong giao tiếp với người khác) | Âm tính |
| 11 | N4. Thu rút xã hội, thụ động/vô cảm (giảm hứng thú và sáng kiến trong quan hệ xã hội do thụ động, vô cảm, mất ý chí) | Âm tính |
| 12 | N5. Tư duy trừu tượng khó khăn (khó khăn trong việc phân loại, tổng quát hóa và tư duy vượt quá mức cụ thể) | Âm tính |
| 13 | N6. Mất tính tự phát và trôi chảy của lời nói (giảm sự trôi chảy trong giao tiếp bằng lời, kèm vô cảm, mất ý chí hoặc thiếu sót nhận thức) | Âm tính |
| 14 | N7. Tư duy định hình (giảm sự lưu loát, tự phát và mềm dẻo của tư duy: nội dung cứng ngắc, lặp đi lặp lại, nghèo nàn) | Âm tính |
| 15 | G1. Sự quan tâm cơ thể (than phiền hoặc bận tâm về bệnh tật, rối loạn chức năng cơ thể) | Bệnh lý chung |
| 16 | G2. Lo âu (kinh nghiệm chủ quan về căng thẳng, lo lắng, sợ hãi hoặc bất an) | Bệnh lý chung |
| 17 | G3. Cảm giác tội lỗi (cảm giác ăn năn, tự trách về hành vi sai trái có thật hoặc tưởng tượng trong quá khứ) | Bệnh lý chung |
| 18 | G4. Căng thẳng (biểu hiện cơ thể rõ rệt của sợ hãi, lo âu và bứt rứt: cứng cơ, run, vã mồ hôi) | Bệnh lý chung |
| 19 | G5. Điệu bộ và tư thế (cử động hoặc tư thế không tự nhiên: vụng về, cứng ngắc, lộn xộn hoặc kỳ quái) | Bệnh lý chung |
| 20 | G6. Trầm cảm (cảm giác buồn bã, chán nản, vô dụng và bi quan) | Bệnh lý chung |
| 21 | G7. Vận động chậm chạp (giảm hoạt động vận động: chậm chạp cử động và ngôn ngữ, giảm trương lực) | Bệnh lý chung |
| 22 | G8. Không hợp tác (chủ động từ chối tuân thủ quy định của người có trách nhiệm; ngờ vực, tự vệ, chống đối) | Bệnh lý chung |
| 23 | G9. Nội dung tư duy khác thường (ý nghĩ kỳ lạ, ly kỳ hoặc kỳ quái, từ ý nghĩ xa vời đến lệch lạc, vô lý rõ rệt) | Bệnh lý chung |
| 24 | G10. Rối loạn định hướng lực (không nhận biết mối liên hệ với môi trường xung quanh: người, không gian, thời gian) | Bệnh lý chung |
| 25 | G11. Chú ý kém (giảm tập trung, cảnh giác; dễ bị lôi cuốn bởi kích thích, khó duy trì hoặc chuyển sự chú ý) | Bệnh lý chung |
| 26 | G12. Mất khả năng phán đoán và tự nhận thức (giảm nhận thức về tình trạng tâm thần của bản thân; từ chối nhập viện/điều trị) | Bệnh lý chung |
| 27 | G13. Rối loạn ý chí (rối loạn khởi đầu, duy trì và kiểm soát ý nghĩ, hành vi, cử động, ngôn ngữ) | Bệnh lý chung |
| 28 | G14. Khó kiểm soát xung động (rối loạn điều chỉnh xung động nội tâm: bùng nổ căng thẳng, cảm xúc đột ngột, không phù hợp) | Bệnh lý chung |
| 29 | G15. Bận tâm (bị thu hút bởi ý nghĩ, cảm giác nội tâm và kinh nghiệm tự kỷ đến mức ảnh hưởng định hướng thực tại) | Bệnh lý chung |
| 30 | G16. Tránh né xã hội tích cực (giảm quan hệ xã hội do sợ hãi, thù hằn hoặc ngờ vực vô cớ) | Bệnh lý chung |

### Cách tính điểm

**Dương tính (`positive`):**
- Công thức: Tổng điểm câu {1, 2, 3, 4, 5, 6, 7}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | > -1 | Nhóm triệu chứng dương tính (thang điểm thô 7–49; tài liệu nguồn không quy định ngưỡng phân loại mức độ nặng) |

**Âm tính (`negative`):**
- Công thức: Tổng điểm câu {8, 9, 10, 11, 12, 13, 14}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | > -1 | Nhóm triệu chứng âm tính (thang điểm thô 7–49; tài liệu nguồn không quy định ngưỡng phân loại mức độ nặng) |

**Bệnh lý chung (`general`):**
- Công thức: Tổng điểm câu {15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | > -1 | Thang bệnh lý tâm thần chung (thang điểm thô 16–112; tài liệu nguồn không quy định ngưỡng phân loại mức độ nặng) |

**Tổng điểm (`total`):**
- Công thức: Tổng điểm câu {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | > -1 | Tổng điểm PANSS (thang điểm thô 30–210; tài liệu nguồn không quy định ngưỡng phân loại mức độ nặng) |


---

## AIMS — Trắc nghiệm vận động bất thường (Abnormal Involuntary Movement Scale)

*Mã hệ thống: `aims` · Số câu: 10 · Điểm tối đa: 40 · Mốc thời gian hỏi: Hiện tại*

### Câu hỏi & đáp án

**Thang trả lời chung cho tất cả câu:** ✅ Không có (0) · 🟡 Tối thiểu (1) · 🟠 Nhẹ (2) · 🔴 Trung bình (3) · 🚨 Nghiêm trọng (4)

| # | Câu hỏi | Nhóm |
|---|---|---|
| 1 | Các cơ thể hiện nét mặt: chuyển động của trán, lông mày, vùng quanh mắt, má… bao gồm cau mày, chớp mắt, nhăn mặt | Mặt và miệng |
| 2 | Môi và vùng quanh miệng: nhăn nhó, bĩu môi… | Mặt và miệng |
| 3 | Hàm: cắn, nghiến, nhai, há miệng, chuyển động ngang… | Mặt và miệng |
| 4 | Lưỡi: tăng chuyển động cả trong và ngoài miệng, không có khả năng duy trì chuyển động | Mặt và miệng |
| 5 | Chi trên (cánh tay, cổ tay, bàn tay, ngón tay): bao gồm các động tác múa giật (nhanh, không mục đích, không thường xuyên) hoặc múa vờn (chậm, không đều, phức tạp, uốn éo); không bao gồm run | Vận động quá mức |
| 6 | Chi dưới (chân, đầu gối, mắt cá chân, ngón chân): cử động đầu gối sang bên, gõ bàn chân, hạ gót chân, vặn vẹo bàn chân, đảo ngược và chuyển hướng bàn chân | Vận động quá mức |
| 7 | Cổ, vai, hông: đung đưa, vặn người, vặn vẹo, xoay vùng chậu; bao gồm chuyển động của cơ hoành | Chuyển động thân |
| 8 | Mức độ nghiêm trọng chung của các cử động bất thường, dựa trên số điểm đơn cao nhất của các mục trên | Đánh giá chung |
| 9 | Mức độ mất khả năng (ảnh hưởng chức năng) do các cử động bất thường gây ra (0: Không có/bình thường, 1: Tối thiểu, 2: Nhẹ, 3: Vừa phải, 4: Nghiêm trọng) | Đánh giá chung |
| 10 | Nhận thức của bệnh nhân về các cử động bất thường và mức độ đau khổ liên quan (0: Không nhận biết, 1: Nhận biết - không đau khổ, 2: Nhận biết - đau khổ nhẹ, 3: Nhận biết - đau khổ vừa phải, 4: Nhận biết - đau khổ nghiêm trọng) | Đánh giá chung |

### Cách tính điểm

**Mặt và miệng (`orofacial`):**
- Công thức: Tổng điểm câu {1, 2, 3, 4}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | > -1 | Mặt và miệng |

**Vận động quá mức (`extremity`):**
- Công thức: Tổng điểm câu {5, 6}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | > -1 | Vận động quá mức (chi) |

**Chuyển động thân (`trunk`):**
- Công thức: Tổng điểm câu {7}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | > -1 | Chuyển động thân |

**Đánh giá chung (`global`):**
- Công thức: Tổng điểm câu {8, 9, 10}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | > -1 | Đánh giá chung |

**Tổng điểm (`total`):**
- Công thức: Tổng điểm câu {1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | > -1 | Điểm tổng AIMS (theo dõi diễn tiến lâm sàng — nguồn không nêu ngưỡng phân loại mức độ) |


---

## HACHINSKI — Trắc nghiệm điểm thiếu máu cục bộ Hachinski (Hachinski Ischemic Score)

*Mã hệ thống: `hachinski` · Số câu: 13 · Điểm tối đa: 18 · Mốc thời gian hỏi: Hiện tại*

### Câu hỏi & đáp án

**Thang trả lời chung cho tất cả câu:** ❌ Không có (0) · ✅ Có (1)

| # | Câu hỏi | Nhóm |
|---|---|---|
| 1 | Triệu chứng xuất hiện đột ngột | Thiếu máu cục bộ |
| 2 | Tiến triển nặng dần kiểu bậc thang (ví dụ: suy giảm - ổn định - suy thoái) | Thiếu máu cục bộ |
| 3 | Tiến triển dao động | Thiếu máu cục bộ |
| 4 | Lú lẫn về đêm | Thiếu máu cục bộ |
| 5 | Nhân cách tương đối ít thay đổi | Thiếu máu cục bộ |
| 6 | Trầm cảm | Thiếu máu cục bộ |
| 7 | Phàn nàn về cơ thể (ví dụ: đau nhức cơ thể, đau ngực) | Thiếu máu cục bộ |
| 8 | Rối loạn cảm xúc | Thiếu máu cục bộ |
| 9 | Tiền sử tăng huyết áp | Thiếu máu cục bộ |
| 10 | Tiền sử đột quỵ | Thiếu máu cục bộ |
| 11 | Bằng chứng về xơ vữa động mạch cùng tồn tại (ví dụ: bệnh động mạch ngoại vi - PAD, nhồi máu cơ tim - MI) | Thiếu máu cục bộ |
| 12 | Các triệu chứng thần kinh khu trú (ví dụ: liệt nửa người, bán manh đồng danh, mất ngôn ngữ) | Thiếu máu cục bộ |
| 13 | Dấu hiệu thần kinh khu trú (ví dụ: yếu một bên, mất cảm giác, phản xạ không đối xứng, dấu hiệu Babinski) | Thiếu máu cục bộ |

### Cách tính điểm

**Thiếu máu cục bộ (`ischemic`):**
- Công thức: Tổng điểm câu {1, 1, 2, 3, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 12, 12, 13, 13}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–3 | Gợi ý sa sút trí tuệ nguyên phát (kiểu Alzheimer) |
  | 4–7 | Không xác định / Sa sút trí tuệ hỗn hợp |
  | > 7 | Gợi ý sa sút trí tuệ mạch máu |


---

## HIMMELBACH — Trắc nghiệm mức độ nghiện Himmelbach (Himmelbach Withdrawal Scale)

*Mã hệ thống: `himmelbach` · Số câu: 12 · Điểm tối đa: 24 · Mốc thời gian hỏi: Hiện tại*

### Câu hỏi & đáp án

**Thang trả lời chung cho tất cả câu:** ❌ Không có (0) · ✅ Có (1)

| # | Câu hỏi | Nhóm |
|---|---|---|
| 1 | Ngáp | Hội chứng cai |
| 2 | Chảy nước mắt, nước mũi | Hội chứng cai |
| 3 | Tăng thân nhiệt | Hội chứng cai |
| 4 | Toát mồ hôi, ớn lạnh, nổi da gà | Hội chứng cai |
| 5 | Thèm chất ma túy | Hội chứng cai |
| 6 | Đau mỏi các khớp, co cứng cơ bụng | Hội chứng cai |
| 7 | Mất ngủ | Hội chứng cai |
| 8 | Ỉa chảy | Hội chứng cai |
| 9 | Mạch nhanh (> 90 chu kỳ/phút) | Hội chứng cai |
| 10 | Buồn nôn, nôn | Hội chứng cai |
| 11 | Dị cảm (cảm giác dòi bò trong xương) | Hội chứng cai |
| 12 | Dãn đồng tử | Hội chứng cai |

### Cách tính điểm

**Hội chứng cai (`withdrawal`):**
- Công thức: Tổng điểm câu {1, 2, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 10, 11, 11, 11, 12, 12, 12}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–7 | Nghiện nhẹ |
  | 8–16 | Nghiện trung bình |
  | > 16 | Nghiện nặng |


---

## EPI — Trắc nghiệm Nhân cách Eysenck (Eysenck Personality Inventory)

*Mã hệ thống: `epi` · Số câu: 57 · Điểm tối đa: 24 · Mốc thời gian hỏi: Nhìn chung, về bản thân bạn*

### Câu hỏi & đáp án

**Thang trả lời chung cho tất cả câu:** ✅ Có (1) · ❌ Không (0)

| # | Câu hỏi | Nhóm |
|---|---|---|
| 1 | Bạn thường mong muốn những điều mới lạ, gây hồi hộp. | Hướng ngoại |
| 2 | Bạn cần những người bạn có thể hiểu, động viên, an ủi mình. | Tính thần kinh |
| 3 | Bạn là người vô tư, không bận tâm đến điều gì. | Hướng ngoại |
| 4 | Bạn cảm thấy khó khăn trong việc từ chối một điều gì đó. | Tính thần kinh |
| 5 | Bạn có suy nghĩ kỹ trước khi quyết định một việc gì đó. | Hướng ngoại |
| 6 | Bạn luôn giữ lời hứa bất kể điều đó có thuận lợi hay không đối với bạn. | Độ tin cậy |
| 7 | Tâm trạng của bạn thường hay thất thường. | Tính thần kinh |
| 8 | Bạn thường hành động hay phát ngôn rất nhanh không cần suy nghĩ. | Hướng ngoại |
| 9 | Bạn thường cảm thấy mình bất hạnh mà không rõ nguyên nhân. | Tính thần kinh |
| 10 | Bạn thường bảo vệ đến cùng ý kiến của mình trong các cuộc tranh luận. | Hướng ngoại |
| 11 | Bạn thường cảm thấy rụt rè, ngượng ngùng khi nói chuyện với người khác giới không quen. | Tính thần kinh |
| 12 | Đôi lúc bạn không kiềm chế được và nổi nóng. | Độ tin cậy |
| 13 | Bạn thường hành động một cách bồng bột. | Hướng ngoại |
| 14 | Bạn thường day dứt vì đã làm một việc lẽ ra không nên làm. | Tính thần kinh |
| 15 | Bạn thường thích đọc sách hơn là gặp gỡ mọi người. | Hướng ngoại |
| 16 | Bạn dễ tự ái, phật lòng. | Tính thần kinh |
| 17 | Bạn thích nhập hội với bạn bè. | Hướng ngoại |
| 18 | Đôi lúc bạn có ý nghĩ mà ban đầu không muốn cho người khác biết. | Độ tin cậy |
| 19 | Đôi khi bạn cảm thấy mình đầy nghị lực, nhiệt tình làm mọi việc nhưng có lúc lại hoàn toàn uể oải. | Tính thần kinh |
| 20 | Bạn thích thà ít bạn nhưng thân còn hơn. | Hướng ngoại |
| 21 | Bạn hay mơ mộng. | Tính thần kinh |
| 22 | Bạn phản ứng lại ngay khi người ta nói nặng lời với bạn. | Hướng ngoại |
| 23 | Bạn thường day dứt khi mình có lỗi. | Tính thần kinh |
| 24 | Tất cả những thói quen của bạn đều là tốt và cần thiết. | Độ tin cậy |
| 25 | Bạn có khả năng truyền cảm hứng và gây cười trong nhóm bạn bè. | Hướng ngoại |
| 26 | Bạn là một người nhạy cảm. | Tính thần kinh |
| 27 | Bạn là một người hoạt bát, vui vẻ. | Hướng ngoại |
| 28 | Sau khi làm một việc quan trọng, bạn thường có cảm giác rằng lẽ ra có thể làm việc đó tốt hơn. | Tính thần kinh |
| 29 | Bạn thường im lặng ở chốn có người lạ. | Hướng ngoại |
| 30 | Bạn cũng có lúc đồn chuyện, phao tin. | Độ tin cậy |
| 31 | Bạn thường mất ngủ vì những ý nghĩ khác nhau trong đầu. | Tính thần kinh |
| 32 | Nếu muốn biết điều gì đó bạn thường thích tự tìm hiểu hơn là hỏi người khác. | Hướng ngoại |
| 33 | Bạn thường hay hồi hộp. | Tính thần kinh |
| 34 | Bạn thích công việc đòi hỏi phải tập trung chú ý liên tục. | Hướng ngoại |
| 35 | Cũng có lúc bạn run lên vì vui sướng hay sợ hãi. | Tính thần kinh |
| 36 | Bạn luôn trả cước phí giao thông đầy đủ mặc dù không bị kiểm soát. | Độ tin cậy |
| 37 | Bạn cảm thấy khó chịu khi ở nơi mà người ta hay châm chọc nhau. | Hướng ngoại |
| 38 | Bạn dễ nổi giận. | Tính thần kinh |
| 39 | Bạn thích công việc đòi hỏi hành động nhanh chóng. | Hướng ngoại |
| 40 | Bạn thấy hồi hộp khi cảm thấy những việc bất lợi có thể xảy ra. | Tính thần kinh |
| 41 | Bạn đi đứng ung dung, chậm rãi. | Hướng ngoại |
| 42 | Đã có lúc bạn đến nơi hẹn hoặc đi làm muộn. | Độ tin cậy |
| 43 | Bạn thường có ác mộng. | Tính thần kinh |
| 44 | Bạn thích trò chuyện đến nỗi không bao giờ bỏ qua cơ hội bắt chuyện với cả những người không quen biết. | Hướng ngoại |
| 45 | Bạn hay lo lắng vì có chỗ đau nào đó trên cơ thể. | Tính thần kinh |
| 46 | Bạn cảm thấy khổ sở khi lâu không được giao thiệp rộng rãi với mọi người. | Hướng ngoại |
| 47 | Bạn là người dễ cáu kỉnh. | Tính thần kinh |
| 48 | Trong số những người quen có những người bạn không thích. | Độ tin cậy |
| 49 | Bạn là người rất tự tin. | Hướng ngoại |
| 50 | Bạn dễ phật ý khi có người chỉ ra các khuyết điểm của bạn. | Tính thần kinh |
| 51 | Bạn nghĩ rằng khó có thể thực sự thoải mái ở các cuộc liên hoan. | Hướng ngoại |
| 52 | Bạn cảm thấy không yên tâm khi thua kém bạn bè ở điểm nào đó. | Tính thần kinh |
| 53 | Bạn dễ dàng mang lại sự vui vẻ cho một cuộc họp mặt khá tẻ nhạt. | Hướng ngoại |
| 54 | Bạn thường hay nói về những vấn đề mà mình chưa nắm chắc. | Độ tin cậy |
| 55 | Bạn lo lắng về sức khỏe của mình. | Tính thần kinh |
| 56 | Bạn thích trêu đùa người khác. | Hướng ngoại |
| 57 | Bạn bị mất ngủ. | Tính thần kinh |

### Cách tính điểm

**Tính thần kinh (`neuroticism`):**
- Công thức: Tổng điểm câu {2, 4, 7, 9, 11, 14, 16, 19, 21, 23, 26, 28, 31, 33, 35, 38, 40, 43, 45, 47, 50, 52, 55, 57}
- Xếp loại:

  | Khoảng điểm | Xếp loại |
  |---|---|
  | 0–7 | Ổn định (thấp) |
  | 8–16 | Trung bình |
  | > 16 | Không ổn định (cao) |


---

## Vanderbilt — Thang Đánh giá Rối loạn Tăng động Giảm chú ý Vanderbilt (dành cho cha mẹ)

*Mã hệ thống: `vanderbilt` · Số câu: 47 · Điểm tối đa: 141 · Mốc thời gian hỏi: 6 tháng qua*

### Câu hỏi & đáp án

**Thang trả lời chung cho tất cả câu:** 🙂 Không bao giờ (0) · 😐 Đôi khi (1) · 😟 Thường xuyên (2) · 😣 Rất thường xuyên (3)

| # | Câu hỏi | Nhóm |
|---|---|---|
| 1 | Không tập trung chú ý vào chi tiết hoặc gây ra lỗi do cẩu thả, ví dụ như khi làm bài tập về nhà | Giảm chú ý |
| 2 | Gặp khó khăn trong việc chú ý vào những việc cần phải làm | Giảm chú ý |
| 3 | Có vẻ như không lắng nghe khi người khác đang nói trực tiếp với mình | Giảm chú ý |
| 4 | Không làm theo hướng dẫn và không hoàn thành nhiệm vụ hay bài tập | Giảm chú ý |
| 5 | Gặp khó khăn trong việc sắp xếp hay tổ chức nhiệm vụ và hoạt động | Giảm chú ý |
| 6 | Né tránh, không thích hoặc không muốn bắt đầu hay thực hiện các nhiệm vụ hay bài tập đòi hỏi nỗ lực trí tuệ liên tục | Giảm chú ý |
| 7 | Mất những vật dụng cần cho nhiệm vụ hay hoạt động (bài tập, bút, sách vở) | Giảm chú ý |
| 8 | Dễ bị sao nhãng bởi âm thanh hoặc những thứ khác | Giảm chú ý |
| 9 | Hay quên trong các hoạt động hàng ngày | Giảm chú ý |
| 10 | Cựa quậy chân tay hoặc vặn vẹo người khi ngồi | Tăng hoạt động/Xung động |
| 11 | Rời khỏi chỗ ngồi ở những tình huống cần ngồi yên tại chỗ | Tăng hoạt động/Xung động |
| 12 | Chạy loanh quanh hoặc leo trèo quá mức trong những tình huống cần phải ngồi yên tại chỗ | Tăng hoạt động/Xung động |
| 13 | Gặp khó khăn trong việc chơi và bắt đầu chơi các trò chơi đòi hỏi sự yên tĩnh | Tăng hoạt động/Xung động |
| 14 | Luôn chân luôn tay hoặc hành động như thể "được gắn động cơ" | Tăng hoạt động/Xung động |
| 15 | Nói quá nhiều | Tăng hoạt động/Xung động |
| 16 | Buột miệng trả lời khi người hỏi chưa hỏi xong | Tăng hoạt động/Xung động |
| 17 | Gặp khó khăn trong việc chờ đợi đến lượt mình | Tăng hoạt động/Xung động |
| 18 | Ngắt quãng hay chen ngang vào khi người khác đang nói chuyện hay chơi trò chơi | Tăng hoạt động/Xung động |
| 19 | Cãi nhau với người lớn | Thách thức chống đối |
| 20 | Tức giận đến mức độ mất kiểm soát | Thách thức chống đối |
| 21 | Chủ động không tuân theo hoặc từ chối làm theo yêu cầu hay quy định của người lớn | Thách thức chống đối |
| 22 | Chủ định quấy rầy người khác | Thách thức chống đối |
| 23 | Đổ tội cho người khác vì lỗi của chính mình | Thách thức chống đối |
| 24 | Tự ái và dễ bực mình bởi người khác | Thách thức chống đối |
| 25 | Tức giận hoặc chua cay | Thách thức chống đối |
| 26 | Hằn học và trả thù | Thách thức chống đối |
| 27 | Bắt nạt, đe dọa hoặc làm người khác sợ | Hành vi ứng xử |
| 28 | Khởi đầu việc đánh nhau | Hành vi ứng xử |
| 29 | Nói dối để né tránh rắc rối hoặc tránh nhiệm vụ (ví dụ lừa dối người khác) | Hành vi ứng xử |
| 30 | Nghỉ hoặc trốn học mà không có sự cho phép | Hành vi ứng xử |
| 31 | Đánh, đá hoặc làm thương người khác | Hành vi ứng xử |
| 32 | Ăn trộm những thứ có giá trị | Hành vi ứng xử |
| 33 | Phá hoại đồ đạc người khác một cách chủ ý | Hành vi ứng xử |
| 34 | Đã từng sử dụng vũ khí có thể gây hại nghiêm trọng (như gậy, dao, gạch đá, súng) | Hành vi ứng xử |
| 35 | Đánh, đá hoặc làm thương động vật | Hành vi ứng xử |
| 36 | Đã đốt lửa để phá hoại một cách có chủ ý | Hành vi ứng xử |
| 37 | Đã từng đột nhập vào nhà, văn phòng hay xe ôtô của ai đó | Hành vi ứng xử |
| 38 | Đã từng qua đêm bên ngoài mà không có sự cho phép | Hành vi ứng xử |
| 39 | Đã từng bỏ nhà đi qua đêm | Hành vi ứng xử |
| 40 | Đã từng cưỡng ép ai đó thực hiện hành vi tình dục | Hành vi ứng xử |
| 41 | Sợ hãi, bồn chồn, hoặc lo lắng | Lo âu/Trầm cảm |
| 42 | Sợ thử những điều mới vì sợ mắc lỗi | Lo âu/Trầm cảm |
| 43 | Cảm thấy vô dụng hoặc thấp kém | Lo âu/Trầm cảm |
| 44 | Tự trách bản thân, cảm thấy có tội | Lo âu/Trầm cảm |
| 45 | Cảm thấy cô đơn, vô ích, không được yêu thương; phàn nàn rằng "không có ai yêu con" | Lo âu/Trầm cảm |
| 46 | Buồn rầu, sầu não, hoặc trầm cảm | Lo âu/Trầm cảm |
| 47 | E dè và dễ ngượng ngùng | Lo âu/Trầm cảm |

### Cách tính điểm


---

## Phụ lục: Raven CPM (test hình, không nằm trong khuôn dạng câu hỏi/đáp án văn bản)

Bài Raven Màu (Colored Progressive Matrices) dùng 36 tấm hình (bộ A/AB/B, mỗi bộ 12 tấm), người làm chọn 1 trong 6 mảnh để hoàn thiện hình — không phải dạng câu hỏi Likert nên không liệt kê trong bảng trên. Đáp án đúng và bảng chuẩn hoá theo tuổi (4–11 tuổi) vẫn được giữ đầy đủ trong hệ thống.

