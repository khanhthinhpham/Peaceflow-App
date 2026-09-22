// Reference catalogue from “Tài liệu hướng dẫn các quy trình bộ y tế q1.docx”, items 45–69.
// Execution remains the responsibility of credentialed clinicians using the approved full protocol.
const PROTOCOLS = [
  { id: 'relaxation', no: 45, group: 'therapy', icon: '🧘', title: 'Trị liệu thư giãn luyện tập', summary: 'Can thiệp thư giãn có cấu trúc, sau khi chuyên gia đánh giá chỉ định và khả năng hợp tác.' },
  { id: 'group', no: 46, group: 'therapy', icon: '👥', title: 'Trị liệu tâm lý nhóm', summary: 'Can thiệp nhóm có mục tiêu, sàng lọc thành viên, bảo mật và theo dõi diễn biến.' },
  { id: 'family', no: 47, group: 'therapy', icon: '👨‍👩‍👧', title: 'Trị liệu tâm lý gia đình', summary: 'Làm việc với hệ thống gia đình theo mục tiêu điều trị và đồng thuận phù hợp.' },
  { id: 'counseling', no: 48, group: 'therapy', icon: '💬', title: 'Tư vấn tâm lý cho người bệnh hoặc người nhà', summary: 'Cung cấp thông tin, hỗ trợ quyết định và kế hoạch theo dõi trong phạm vi chuyên môn.' },
  { id: 'rational', no: 49, group: 'therapy', icon: '🧭', title: 'Trị liệu giải thích hợp lý', summary: 'Can thiệp dựa trên giải thích, tái khung và phối hợp điều trị theo hồ sơ lâm sàng.' },
  { id: 'behavior', no: 50, group: 'therapy', icon: '🔁', title: 'Trị liệu hành vi', summary: 'Can thiệp hành vi theo phân tích chức năng, mục tiêu đo lường được và theo dõi đáp ứng.' },
  { id: 'suggestion', no: 51, group: 'therapy', icon: '🗣️', title: 'Trị liệu ám thị', summary: 'Can thiệp chuyên môn cần đánh giá chỉ định, đồng thuận và theo dõi sát của người thực hiện.' },
  { id: 'cbt', no: 52, group: 'therapy', icon: '🧠', title: 'Trị liệu nhận thức hành vi', summary: 'Can thiệp CBT có cấu trúc, lượng giá tiến triển và bài tập phù hợp giữa các buổi.' },
  { id: 'cognitive', no: 53, group: 'therapy', icon: '💭', title: 'Trị liệu nhận thức', summary: 'Can thiệp tập trung vào nhận diện và điều chỉnh quá trình nhận thức theo công thức ca bệnh.' },
  { id: 'psychodynamic', no: 54, group: 'therapy', icon: '🔎', title: 'Trị liệu tâm lý động', summary: 'Can thiệp chuyên sâu cần nhà trị liệu được đào tạo, khung trị liệu và giám sát chuyên môn.' },
  { id: 'activation', no: 55, group: 'therapy', icon: '🌱', title: 'Trị liệu kích hoạt hành vi', summary: 'Lập kế hoạch hoạt động theo giá trị, theo dõi né tránh và điều chỉnh theo mức độ đáp ứng.' },
  { id: 'aba', no: 56, group: 'therapy', icon: '🧩', title: 'Phân tích hành vi ứng dụng (ABA)', summary: 'Can thiệp ABA cần đánh giá hành vi chức năng, mục tiêu cá nhân hoá và giám sát chuyên môn.' },
  { id: 'music', no: 57, group: 'therapy', icon: '🎵', title: 'Liệu pháp âm nhạc', summary: 'Sử dụng âm nhạc có mục tiêu điều trị, điều chỉnh theo tình trạng và đáp ứng người bệnh.' },
  { id: 'art', no: 58, group: 'therapy', icon: '🎨', title: 'Liệu pháp hội họa', summary: 'Can thiệp biểu đạt sáng tạo trong khung trị liệu, bảo mật và lượng giá phù hợp.' },
  { id: 'sport', no: 59, group: 'therapy', icon: '🏃', title: 'Liệu pháp thể dục, thể thao', summary: 'Kế hoạch hoạt động thể chất cần sàng lọc nguy cơ và phối hợp y khoa khi cần.' },
  { id: 'social', no: 60, group: 'therapy', icon: '🤝', title: 'Liệu pháp tái thích ứng xã hội', summary: 'Hỗ trợ phục hồi chức năng, kỹ năng sống và tái hòa nhập theo mục tiêu cá nhân.' },
  { id: 'occupational', no: 61, group: 'therapy', icon: '🛠️', title: 'Liệu pháp hoạt động – lao động', summary: 'Can thiệp hoạt động có mục tiêu phục hồi chức năng, theo khả năng và môi trường.' },
  { id: 'eeg', no: 62, group: 'diagnostic', icon: '📈', title: 'Đo điện não vi tính', summary: 'Kỹ thuật cận lâm sàng cần thiết bị đạt chuẩn, chỉ định và người thực hiện được đào tạo.' },
  { id: 'video-eeg', no: 63, group: 'diagnostic', icon: '🎥', title: 'Đo điện não video', summary: 'Theo dõi điện não kết hợp video theo chỉ định chuyên khoa và quy trình an toàn cơ sở.' },
  { id: 'rheography', no: 64, group: 'diagnostic', icon: '🩺', title: 'Đo lưu huyết não', summary: 'Kỹ thuật thăm dò chức năng cần chỉ định, thiết bị và diễn giải bởi nhân sự phù hợp.' },
  { id: 'tms', no: 65, group: 'restricted', icon: '🧲', title: 'Kích thích từ xuyên sọ', summary: 'Can thiệp chuyên khoa chỉ thực hiện tại cơ sở đủ điều kiện, sau sàng lọc và đồng thuận.' },
  { id: 'ect', no: 66, group: 'restricted', icon: '⚡', title: 'Sốc não thông thường', summary: 'Thủ thuật nguy cơ cao, chỉ thực hiện bởi ê-kíp đủ thẩm quyền theo quy trình cơ sở.' },
  { id: 'agitation', no: 67, group: 'safety', icon: '🛡️', title: 'Kỹ thuật kiểm soát kích động', summary: 'Quy trình an toàn khẩn cấp: bảo vệ người bệnh, nhân viên và gọi hỗ trợ theo quy định cơ sở.' },
  { id: 'suicide', no: 68, group: 'safety', icon: '🚨', title: 'Kỹ thuật kiểm soát tự sát', summary: 'Quy trình an toàn khẩn cấp: đánh giá nguy cơ trực tiếp, không để người bệnh một mình và kích hoạt hỗ trợ ngay.' },
  { id: 'refusal', no: 69, group: 'safety', icon: '🍽️', title: 'Kỹ thuật kiểm soát tình trạng không ăn', summary: 'Quy trình chuyên khoa cần đánh giá nguyên nhân, nguy cơ nội khoa và kế hoạch theo dõi tại cơ sở.' }
];

// Full text from section “Đại cương” of the source procedure document.
const DEFINITIONS = {
  45: `Phương pháp thư giãn (Relaxation) đã được xây dựng từ những năm đầu của thế kỷ 20, dựa trên thuyết tâm lý thần kinh, cho rằng thư giãn, giãn mềm về cơ bắp thì có tác động lên con đường cảm xúc của hệ viền và vùng dưới đồi, tạo ra sự yên dịu, giảm stress, cũng như giảm các triệu chứng khác trong các bệnh lý tâm căn. Một số phương pháp như phương pháp điều khiển tích cực trương lực cơ của B.Stokvis, phương pháp giãn cơ tuần tiến của E.Jacobson và năm 1926, Schultz đã xây dựng phương pháp thư giãn tập trung. Phương pháp thư giãn tập trung của Schultz hết sức khoa học nhưng các bài tập đòi hỏi thời gian và giai đoạn hai của bài tập mang tính trừu tượng nên không được phổ biến rộng rãi. Từ năm 1970, GS. Nguyễn Việt và cộng sự đã nghiên cứu phương pháp “thư giãn-luyện tập”, khắc phục phần nào những hạn chế của phương pháp thư giãn tập trung, thu được những kết quả khả quan, phù hợp với những đặc điểm riêng của bệnh, tạo ra sự hào hứng và kiên trì tập luyện.

Cơ chế tác dụng: có hai cơ chế chính

Cơ chế tự ám thị được hiểu là sự tiếp nhận một cách chủ động những tác động tâm lý từ chính bản thân và từ đó cũng gây ra những biến đổi nhất định.

Cơ chế phản hồi sinh học trong phương pháp thư giãn luyện tập gồm ba hiện tượng phản hồi. Phản hồi thứ nhất là giữa trương lực cơ và cảm xúc. Thông qua tác dụng tự ám thị, việc tập luyện có tác dụng làm giảm trương lực cơ, tạo ra tác động lên thần kinh trung ương làm giảm trương lực cảm xúc. Ngược lại, giảm căng thẳng cũng sẽ tác động làm giảm trương lực cơ. Phản hồi thứ hai là giữa cơ thể và tâm thần. Tập các động tác Yoga làm hoạt hóa hệ thống cơ, xương khớp, từ đó làm cho cơ thể khỏe mạnh, tinh thần thư thái và ngược lại. Phản hồi thứ ba là giữa hô hấp và tâm thần. Việc tập thở chậm, đều làm cho tinh thần điềm tĩnh hơn và ngược lại.  Như vậy, thư giãn làm cho tâm thần yên tĩnh, thư thái và làm cho các bắp thịt mềm đi, giãn ra (làm mất trạng thái căng thẳng trong tâm thần và trong bắp thịt).

Nội dung của bài tập

Phần thư giãn: có 3 bài cơ bản: “Tâm thần thư thái”, “Giãn mềm cơ bắp” và “Sưởi ấm cơ thể”.

Phần luyện tập gồm: Luyện thở theo kiểu khí công và tập một số động tác Yoga: Trong phương pháp này sử dụng kết hợp 6 tư thế (Asana) Yoga nhằm làm cho phương pháp thư giãn ít rơi vào trạng thái tĩnh hơn, đặc biệt luyện tư thế giúp cho cơ thể cường tráng hơn và giúp hoạt hóa cơ, xương, khớp.`,
  46: `Liệu pháp tâm lý nhóm (Group Psychotherapy) là một hình thức điều trị mà trong đó nhiều người bệnh cùng được tham gia, họ được lựa chọn một cách cẩn thận và được hướng dẫn bởi nhà liệu pháp nhóm nhằm thay đổi hành vi, nhận thức, cảm xúc không thích ứng của từng thành viên thông qua sự tác động tương hỗ và sự thông cảm giữa các thành viên trong nhóm.

*Cơ chế:

Tác động cùng lúc lên nhiều bệnh nhân nhằm điều chỉnh, phục hồi và thay đổi hành vi, nhận thức, cảm xúc không thích ứng của từng thành viên trong nhóm thông qua việc thiết lập lại các mối quan hệ liên cá nhân, khuyến khích sự hồi tưởng và nhớ lại những trải nghiệm trong cuộc sống trước đây, khuyến khích tham gia vào các cuộc trò chuyện của nhóm.

Tạo điều kiện để loại bỏ hoặc làm thuyên giảm sự căng thẳng về cảm xúc, hướng dẫn các mẫu ứng xử phù hợp, huấn luyện các kỹ năng xử lý các mâu thuẫn, nâng cao lòng tự trọng (hỗ trợ việc nhớ lại nhưng thành tích và năng lực trước đây), khuyến khích sự thể hiện bản thân bằng lời nói và cảm xúc nhằm điều chỉnh những nét tính cách chưa phù hợp.

Tạo ra những thay đổi về nhận thức, cách cư xử và sự phát triển tính cách của mỗi người bệnh, hỗ trợ họ trong việc ra quyết định, giải quyết vấn đề và cách sắp xếp ưu tiên trong cuộc sống của họ.

Tăng cường xã hội hóa và giảm sự cô lập (khuyến khích hành vi hỗ trợ lẫn nhau giữa các thành viên trong nhóm), giúp phát triển mối quan hệ hài hòa nhằm mục đích tăng cường sự tham gia của họ trong nhóm, tạo sự gắn bó về mặt tình cảm, sự chấp nhận để hiểu người khác; giúp họ có cơ hội để quan sát, bắt chước và được cổ vũ về mặt xã hội. Tạo ra những thay đổi về hành vi: Khuyến khích các hành vi xã hội phù hợp, nâng cao kỹ năng xã hội

Quản lý chứng mất trí nhớ và định hướng thực tế (kết nối kí ức và chủ đề với các sự kiện hiện tại) làm: (1) Tăng khoảng chú ý; (2) Tăng khả năng diễn đạt bằng lời nói; (3) Tăng cường kỹ năng xã hội; (4) Tăng kích thích giác quan; (5) Tăng cường lòng tự trọng và giá trị bản thân.`,
  47: `Trị liệu tâm lý gia đình (Family Psychotherapy) là một loại hình trị liệu gia đình có thể giúp các thành viên trong gia đình cải thiện giao tiếp, giải quyết xung đột, cải thiện bầu không khí gia đình. Mặt khác, liệu pháp cũng cung cấp kĩ năng mới cho các thành viên trong gia đình để trợ giúp người bệnh đang gặp khó khăn về vấn đề tâm lý.

*Cơ chế:

Trị liệu gia đình coi trọng cấu trúc và tổ chức của một gia đình (kiểu hành vi, thói quen, thói quen giao tiếp…) nhằm giải quyết các nhu cầu tâm lý và cảm xúc của gia đình và tập trung giải quyết những khiếm khuyết trong cấu trúc gia đình để khôi phục chức năng bình thường của hệ thống gia đình, khắc phục sự mất cân bằng trong gia đình, đảm bảo trật tự gia đình hoạt động hiệu quả nhằm thiết lập bầu không khí hòa thuận trong gia đình.

Làm giảm cảm xúc căng thẳng, thiết lập lại trạng thái cân bằng đã bị phá vỡ trong gia đình và tạo ra những cuộc đối thoại bình đẳng, cải thiện giao tiếp, cải thiện thứ bậc trong gia đình, tăng cường năng lực và sự hài lòng của cha mẹ giúp mỗi người nhận ra những điểm tích cực cũng như tiêu cực trong các quan hệ của họ.

Giúp xây dựng mối quan hệ gia đình, giúp các cá nhân cải thiện phản ứng của họ trước nhu cầu thay đổi, quản lý hành vi thích nghi của các thành viên trong gia đình, cung cấp kỹ năng làm cha mẹ, xây dựng quy tắc ứng xử trong gia đình, sử dụng các kỹ thuật kỷ luật tích cực, giúp các thành viên trong gia đình hiểu và chấp nhận thực tế đang xảy ra trong gia đình họ và họ tự giải quyết.

Cơ cấu lại hệ thống tương tác trong gia đình, thiết lập ranh giới lành mạnh nhằm tăng cường khả năng thích ứng của gia đình trước tác động của môi trường.

Những thay đổi trong cách ứng xử cố hữu của gia đình sẽ cải thiện bầu không khí bế tắc trong gia đình, giúp các cá nhân hiểu hơn về bản thân, về các thành viên khác và về những hành vi ứng xử trong mối tương tác với người khác. Từ đó tạo ra sự thay đổi, cải thiện môi trường sống, làm giảm nguy cơ duy trì và phát triển hành vi không thích nghi trong gia đình. Các thành viên sử dụng những tiềm năng mới và tăng cường khả năng đối mặt với căng thẳng, xung đột. Đồng thời xây dựng những phương pháp giáo dục phù hợp (kỷ luật tích cực, khen thưởng tích cực) với người bệnh, giúp gia đình quản lý những hành vi thích hợp ở người bệnh.

Thông thường, một liệu trình của liệu pháp gia đình kéo dài khoảng 8 phiên. Tuy nhiên, số lượng phiên thay đổi khác nhau tùy tình trạng gia đình và các vấn đề của người bệnh cụ thể.`,
  48: `Tư vấn tâm lý cho người bệnh hoặc người nhà người bệnh là hoạt động tham vấn tâm lý giữa cán bộ tâm lý với những người đang cần sự hỗ trợ về mặt tinh thần để đối mặt với khó khăn hoặc vướng mắc trong cuộc sống. Tư vấn tâm lý là giúp người bệnh hoặc người nhà sáng tỏ hơn vấn đề của họ, xem xét các giải pháp khả thi để giải quyết vấn đề và giúp họ tự đưa ra được những lựa chọn tối ưu nhất. Các vấn đề của người bệnh có thể là những khó khăn trong cuộc sống, trong tư duy, tình cảm, ứng xử, định hướng… liên quan đến các vấn đề sức khoẻ, hôn nhân gia đình, giao tiếp gia đình, các xung đột từ gia đình, sang chấn gia đình... Trọng tâm của tư vấn tâm lý là định hướng sự việc/vấn đề và tập trung giải quyết vấn đề, không cần quá đi sâu vào giải quyết bản chất nảy sinh ra vấn đề.

Mục đích của tư vấn tâm lý cho người bệnh hoặc người nhà:

Giúp người bệnh hoặcngười nhà giảm bớt các cảm xúc tiêu cực trong hoàn cảnh khó khăn và cảm thấy thoải mái khi trò chuyện về vấn đề khó khăn của họ.

Giúp người bệnh hoặcngười nhà tăng thêm hiểu biết về bản thân và hoàn cảnh của họ; giúp họ chấp nhận vấn đề của mình như nó đang có.

Giúp họ đưa ra các quyết định phù hợp và có khả năng xử lý được vấn đề

Hướng dẫn người bệnh hoặc người nhà tiến hành các quyết định của họ và có khả năng dự phòng các tình huống tương tự xảy ra trong tương lai.`,
  49: `Liệu pháp giải thích hợp lý (Rational Explanation Therapy) là liệu pháp tâm lý dùng lý lẽ logic để giải thích và thuyết phục, giúp người bệnh tự điều chỉnh lại các mối quan hệ và hệ thống thái độ có ý thức, chủ động khắc phục ý nghĩ sai lệch, tư duy thiếu logic về bệnh tật của mình.

Lý thuyết của liệu pháp giải thích hợp lý cho rằng, người bệnh do sự thiếu hiểu biết, lệch lạc và do tư duy không logic của người bệnh gây ra, vì vậy nhiệm vụ của nhân viên y tế là giải thích và dung lời lẽ để thuyết phục người bệnh, làm cho họ có ý thức và hiểu được ý nghĩ sai lệch của mình về bệnh tật. Vai trò của liệu pháp là làm cho người bệnh hoàn toàn tin tưởng vào kết quả điều trị.

Liệu pháp giải thích hợp lý nhằm giải thích cho người bệnh hiểu rõ về bệnh tật của họ và gây dựng niềm tin cho người bệnh trong quá trình thăm khám, điều trị nhằm mục đích làm tăng hiệu quả của quá trình đó.

Người trị liệu trò chuyện với người bệnh, tìm hiểu những khó khăn của họ, tìm hiểu nguyên nhân gây bệnh, giúp người bệnh bộc lộ bản thân, và khi cần thiết dùng lời lẽ hợp lý, logic giải thích cho người bệnh về cơ chế sinh bệnh của họ, hay giúp họ điều chỉnh các mối quan hệ và điều chỉnh thái độ cho phù hợp với chuẩn mực, đồng thời tuân thủ điều trị.`,
  50: `Trị liệu hành vi (Behavioral Therapy) là Cán bộ thực hiện trị liệu sử dụng một loạt các kỹ thuật để thay đổi các hành vi không thích nghi ở người bệnh. Mục tiêu là củng cố các hành vi mong muốn và loại bỏ những hành vi không mong muốn của họ.

Lý thuyết về hành vi cho rằng tất cả các hành vi của con người đều được học và có thể được thay đổi. Hành vi của con người được học thông qua trải nghiệm và tương tác giữa họ với môi trường. Các hành vi được hình thành bằng cách quan sát ai đó thể hiện các hành vi này và lặp lại những hành vi đó.

Cả những hành vi bình thường và bất thường đều được hình thành theo chuỗi kích thích – phản ứng trên ba quá trình cơ bản: (1) điều kiện hóa cổ điển (một hành vi có thể được hình thành hay bị dập tắt (biến mất) dựa trên hai trường hợp: hoặc nó đi kèm hay không đi kèm với cái kích thích tạo ra sự căng thẳng tinh thần cho đối tượng); (2) điều kiện hóa thao tác (một hành vi sẽ được gia tăng, nâng cao hay được hoàn thiện nếu nó liên tục được củng cố, và ngược lại hành vi đó sẽ bị giảm bớt hay biến mất nếu nó liên tục bị trừng phạt ) và (3) học qua quan sát (mỗi con người luôn có những yếu tố phản xạ bẩm sinh để giúp cho họ có khả năng tiếp nhận, học hỏi và đạt được mọi điều trong cuộc sống, những yếu tố tự nhiên và đơn giản này chính là bước đầu cho sự hình thành mọi hành vi và khả năng hành xử phức tạp về sau).

Khi một cá nhân có quá trình học hỏi đúng nguyên tắc thì đời sống tinh thần (suy nghĩ, cảm xúc) của người đó sẽ luôn thích hợp, lành mạnh và có tính xây dựng. Ngược lại, suy nghĩ và cảm xúc của họ sẽ không được cân bằng nếu trong quá trình sống người đó chỉ học hỏi, tiếp thu những cái xấu và điều sai, lệch lạc. Trọng tâm của việc điều trị thường là các vấn đề hiện tại và cách thay đổi chúng. Liệu pháp hành vi không chú trọng đến nguyên nhân, chỉ tập trung vào điều chỉnh những hành vi lệch lạc. Người bệnh chỉnh hành vi theo mẫu đúng, có sự hướng dẫn đánh giá của nhà trị liệu và chế độ thưởng phạt rõ ràng, nhằm thay đổi những hành vi của họ từ đó điều chỉnh được các triệu chứng.

Một số các kỹ thuật được áp dụng như: kỹ thuật khử điều kiện, kỹ thuật tự điều chỉnh, kỹ thuật phản hồi sinh học, kỹ thuật tràn ngập, kỹ thuật giải mẫn cảm có hệ thống, kỹ thuật điều kiện hóa thao tác, kỹ thuật làm theo mẫu, kỹ thuật thư giãn và thở, kỹ thuật ác cảm (sự kích thích khó chịu có thể là thứ gây ra sự khó chịu, ví dụ, Cán bộ thực hiện trị liệu có thể dạy người bệnh về mối liên kết rượu với một ký ức khó chịu)…`,
  51: `Liệu pháp ám thị (Suggestion Therapy) là sự tiếp nhận một cách thụ động những tác động tâm lý từ bên ngoài của một cá thể, từ đó gây ra những biến đổi nhất định về thể chất và tâm thần. Nói cách khác, liệu pháp ám thị là tác động tâm lý của một người lên người khác, làm cho họ nhận thức và tiếp thu một cách không phê phán những lời lẽ, ý nghĩa và ý chí biểu hiện trong đó.

Đây là phương pháp hay dùng nhất để điều trị các triệu chứng chức năng và khi đó nhân cách người bệnh được điều chỉnh lại.

Các loại ám thị:

Tự ám thị và bị ám thị

Ám thị trực tiếp và ám thị gián tiếp

Ám thị lúc thức (nhằm xóa bỏ một triệu chứng chức năng nào đó), ám thị trong giấc ngủ thôi miên và ám thị sau thôi miên.`,
  52: `Liệu pháp nhận thức hành vi (Cognitive Behavioral Therapy-CBT) là liệu pháp được áp dụng để tìm hiểu và điều trị các dạng suy nghĩ và cảm xúc ảnh hưởng đến hành vi tiêu cực trong nhận thức của người bệnh, nhằm xác định và giải quyết các kiểu suy nghĩ không thích hợp dai dẳng để thay đổi cảm xúc và hành vi. Thông qua hoạt động trị liệu, người làm trị liệu sẽ hướng dẫn người bệnh các kỹ năng để họ đối phó với những khó khăn về mặt tâm lý bao gồm 5 lĩnh vực: tình huống, suy nghĩ, cảm xúc, cảm giác thể chất và hành động. Năm lĩnh vực này được kết nối và ảnh hưởng lẫn nhau.

Liệu pháp nhận thức hành vi sử dụng các lý thuyết về phản xạ của Pavlov, học thuyết tập nhiễm của Skinner, học thuyết củng cố Albert Bandura, lý thuyết nhận thức Beck trong điều chỉnh hành vi thích nghi ở người bệnh thông qua việc thay đổi niềm tin sai lệch trong suy nghĩ của người bệnh. Mục tiêu của CBT là giúp người bệnh điều chỉnh suy nghĩ tự động (đôi khi được gọi là “suy nghĩ nóng nảy”), bằng cách đạt được những suy nghĩ cân bằng. Từ đó giúp họ có những cảm xúc, hành vi đúng mực, thích nghi hơn trong cuộc sống.

Các kỹ thuật CBT bao gồm việc xác định những sai lệch như: (1) khái quát hóa quá mức các sự kiện tiêu cực, (2) thảm họa hóa, (3) giảm thiểu các sự kiện tích cực và (4) tối đa hóa các sự kiện tiêu cực. Người bệnh làm việc với nhà trị liệu để xác định và thay đổi những biến dạng trong nhận thức cũng như hành vi né tránh gây ra các triệu chứng của họ, giúp người bệnh tìm ra cách thay đổi những suy nghĩ và hành vi không có lợi. Sau khi tìm ra những gì người bệnh có thể thay đổi, người làm trị liệu sẽ yêu cầu họ thực hành những thay đổi này trong cuộc sống hàng ngày. Điều này sẽ giúp họ kiểm soát các vấn đề của mình và ngăn chặn chúng có tác động tiêu cực đến cuộc sống của họ, đồng thời làm giảm khả năng các triệu chứng bệnh lý quay trở lại ngay cả khi quá trình điều trị đã kết thúc.`,
  53: `Liệu pháp nhận thức (Cognitive Therapy) là một hình thức trị liệu nhấn mạnh vào những gì người bệnh nghĩ hơn là những gì họ làm. Dựa trên mô hình nhận thức, trong đó suy nghĩ, cảm xúc và hành vi có mối liên hệ với nhau và người bệnh có thể hướng tới việc vượt qua khó khăn và đạt được mục tiêu của mình bằng cách xác định và thay đổi những suy nghĩ vô ích hoặc không chính xác, hành vi có vấn đề và những phản ứng cảm xúc đau khổ

Liệu pháp nhận thứcđược xây dựng dựa trên nguyên tắc cho rằng hành vi không thích hợp/ hành vi không hiệu quả được kích hoạt bởi những suy nghĩ tự động không phù hợp hoặc không hợp lý.

Liệu pháp nhận thức nhằm thay đổi những cảm xúc và hành động có ảnh hưởng lên tư duy của người bệnh. Nhà trị liệu giúp người bệnh đồng nhất những suy nghĩ lệch lạc của họ và học cách thay đổi suy nghĩ thiết thực hơn. Nhà trị liệu sử dụng nhiều kỹ thuật khác nhau tác động lên người bệnh nhằm tạo ra những thay đổi nhận thức – thay đổi hệ thống tư duy và niềm tin của người bệnh và cuối cùng đem đến sự thay đổi trong cảm xúc và hành vi.

Lý thuyết nhận thức cho rằng những mẫu ứng xử bất thường và rối loạn cảm xúc bắt đầu với những suy nghĩ. Liệu pháp nhận thức tập trung vào (1) Thay đổi hành vi bằng kỹ thuật tự khẳng định bản thân. Những mẫu hành vi không phù hợp sẽ được biến đổi bằng sự tự khẳng định tiêu cực về bản thân chuyển sang sự tự khẳng định tích cực, sáng tạo. (2) Điều chỉnh hệ thống niềm tin sai lệch của người bệnh bằng việc chỉ ra 3 kiểu nhận thức không chuẩn mực: Những thái độ không hợp lý, những tiền đề sai lệch và những luật lệ hà khắc

Liệu pháp nhận thứctập trung vào việc thay đổi những khuôn mẫu suy nghĩ lệch lạc bằng cách kiểm tra tính hợp lý và hợp lệ của các giả định đằng sau chúng. Quá trình này được gọi là tái cấu trúc nhận thức. Các nhà trị liệu sử dụng một số kỹ thuật khác nhau trong quá trình Liệu pháp nhận thứcđể giúp người bệnh kiểm tra suy nghĩ và hành vi. Bao gồm: (1) Kiểm tra tính hợp lệ, (2) Diễn tập nhận thức, (3) Khám phá có hướng dẫn, (4) Viết nhật ký, (5) Bài tập về nhà, (6) Làm mẫu. Từ đó, người bệnh có thể mô hình hóa hành vi này.`,
  54: `Liệu pháp tâm lý động (Psychodynamic Therapy) còn có các tên gọi khác như Liệu pháp tâm lý động lực học, trị liệu tâm động học,… có nguồn gốc từ liệu pháp phân tâm học dựa trên công trình của Sigmund Freud. Trị liệu tâm động học là một hình thức trị liệu trò chuyện chuyên sâu dựa trên các lý thuyết và nguyên tắc phân tâm học, nhằm mục đích giúp các cá nhân hiểu rõ hơn về cảm xúc, động cơ vô thức và mô hình hành vi của họ. Liệu pháp tâm lý động tìm cách khám phá tiềm thức của người bệnh và ảnh hưởng của tiềm thức đối với sự tự nhận thức và hành vi của họ. Tâm lý động đi sâu vào các vấn đề có thể nảy sinh từ những trải nghiệm đầu đời và nhằm mục đích khám phá những động lực cơ bản, khám phá những khuôn mẫu ẩn giấu và thúc đẩy sự phát triển cá nhân.

Liệu pháp tâm lý động tập trung vào việc nhận biết, thừa nhận, hiểu, bày tỏ và vượt qua những cảm giác tiêu cực và mâu thuẫn cũng như những cảm xúc bị kìm nén để cải thiện trải nghiệm và mối quan hệ giữa các cá nhân của người bệnh. Điều này bao gồm việc giúp người bệnh hiểu những cảm xúc bị kìm nén trong quá khứ ảnh hưởng như thế nào đến việc ra quyết định, hành vi và các mối quan hệ hiện tại. Liệu pháp tâm lý động cũng nhằm mục đích giúp đỡ những người bệnh nhận thức và hiểu được nguồn gốc của những khó khăn xã hội của họ nhưng không thể tự mình khắc phục vấn đề. Người bệnh học cách phân tích và giải quyết những khó khăn hiện tại cũng như thay đổi hành vi trong các mối quan hệ hiện tại thông qua việc khám phá và phân tích sâu sắc những trải nghiệm và cảm xúc trước đó.

Liệu pháp tâm lý động tập trung vào vấn đề chủ yếu của người bệnh, nhằm giải thích động cơ thúc đẩy bên trong của người bệnh, nhấn mạnh vai trò của ý thức và vô thức đến hành vi của họ, ảnh hưởng quá khứ đến hình thành và quyết định nhân cách người bệnh. Liệu pháp tâm lý động tập trung hơn vào việc giải quyết vấn đề và kết quả, trái ngược với việc đi sâu vào các vấn đề có thể nảy sinh từ trải nghiệm đầu đời từ trị liệu phân tâm. Thời gian Liệu pháp tâm lý động thường ngắn hơn so với trị liệu phân tâm, khoảng 25 buổi hoặc hơn. Những lợi ích mang lại:

Giảm triệu chứng: Mục tiêu là đạt được sự thuyên giảm các triệu chứng liên quan đến tình trạng sức khỏe tâm thần.

Tăng giá trị bản thân: Người bệnh thường cảm thấy giá trị bản thân tăng lên và tận dụng tốt hơn tài năng và khả năng của chính mình.

Cải thiện các mối quan hệ: Liệu pháp tâm lý động nâng cao khả năng phát triển và duy trì các mối quan hệ tốt hơn.`,
  55: `Trị liệu kích hoạt hành vi (Behavioral Activation) là một phương pháp trị liệu tâm lý cho người bệnh trầm cảm được áp dụng nhiều trên thế giới, và được xem là phương pháp tương đối đơn giản, có hiệu quả, và có thể áp dụng tại cộng đồng.

Kích hoạt hành vi là trị liệu tâm lý dựa trên cơ sở của lý thuyết hành vi nhằm mục đích động viên người bệnh thực hiện các hoạt động mà người bệnh thích thú. Nhờ tăng cường thực hiện hoạt động đó, cảm xúc của người bệnh sẽ thay đổi, từ đó tình trạng bệnh được cải thiện.

Trị liệu kích hoạt hành vi là cán bộ thực hiện trị liệu giáo dục cho người bệnh về các vấn đề như: (1) thay đổi cảm xúc giúp họ thay đổi hoạt động của mình. (2) Các thay đổi trong cuộc sống có thể dẫn tới trầm cảm và các chiến lược thích ứng ngắn hạn có thể làm họ lún sâu vào cảm giác buồn chán. (3) Việc duy trì và sử dụng thuốc chống trầm cảm là quan trọng. (4) Lên chương trình hoạt động dựa vào kế hoạch chứ không dựa vào cảm xúc. (5) Thay đổi sẽ dễ dàng hơn khi thực hiện từng bước nhỏ. (6) Nhấn mạnh các hoạt động được củng cố một cách tự nhiên. (6) Hoạt động như huấn luyện viên (7) Nhấn mạnh phương pháp thực nghiệm giải quyết vấn đề và nhận diện rằng mọi kết quả đều hữu ích. (8) Không chỉ nói mà phải làm. (9) Giải quyết sự cố có thể xảy ra và các cản trở thực tế đối với sự kích hoạt. Tất cả các kỹ thuật trong quá trình trị liệu đều nhằm mục tiêu làm gia tăng sự kích hoạt và hướng người bệnh tham gia nhiều hoạt động trong xã hội, làm giảm các hành vi né tránh.`,
  56: `Phân tích hành vi ứng dụng (Applied Behavioral Analysis (ABA)) là việc sử dụng kỹ thuật phân tích hành vi và hậu quả của hành vi nhằm hướng dẫn cho người bệnh những cách cư xử hiệu quả hơn, thay đổi hậu quả của hành vi hiện có thông qua củng cố tích cực.

Người sáng lập ra ABA là nhà tâm lý học Ole Ivar Lovaas vào những năm 1960 ABA sử dụng củng cố tích cực để giảng dạy và thúc đẩy các kỹ năng xã hội, khả năng giao tiếp, kỹ năng học tập, hình thành thói quen tự chăm sóc bản thân, học các kỹ năng mới và duy trì các hành vi tích cực. ABA giúp điều chỉnh các kỹ năng và hành vi từ tình huống này sang tình huống khác, kiểm soát tình huống phát sinh hành vi tiêu cực và giảm thiểu hành vi tiêu cực. ABA cũng giúp người bệnh đối phó với những giảm sút do tuổi tác, như giảm trí nhớ và duy trì các mối quan hệ. ABA giúp người bệnh quản lý một số thách thức về lối sống đi kèm với nhiều tình trạng sức khỏe thể chất và tinh thần. Tất cả các hành vi mong muốn được chia thành các bước nhỏ hơn và khi học được từng bước, người bệnh sẽ được khen thưởng vì đã thực hiện thành công hành vi mục tiêu.

*Cơ chế:

Triết lý của chủ nghĩa hành vi là nỗ lực cải thiện tình trạng của người bệnh thông qua thay đổi hành vi (ví dụ: giáo dục, điều trị sức khỏe hành vi) sẽ hiệu quả nhất nếu bản thân hành vi là trọng tâm chính. Hành vi là sản phẩm của hoàn cảnh, đặc biệt là các sự kiện xảy ra ngay sau hành vi. Hành vi có thể dự đoán được, hành vi sẽ học được và sẽ thay đổi được theo thời gian. Do đó, thông qua các hành vi để có thể phân tích, đánh giá và đề xuất những hành vi thay thế phù hợp, tích cực.

ABA được thực hiện theo nguyên lý “những hành vi được củng cố (thưởng) sẽ tái diễn thường xuyên hơn là những hành vi bị bỏ qua hoặc bị phạt”. ABA giúp cải thiện nhiều lĩnh vực chức năng: nhận thức, quan hệ xã hội, ngôn ngữ, tự phục vụ… Đồng thời phương pháp này cũng nhấn mạnh việc loại bỏ những hành vi tiêu cực và thay thế bằng những hành vi tích cực, giúp trẻ có ứng xử phù hợp với cuộc sống

Cơ sở của phương pháp ABA là hành vi được củng cố sẽ được lặp lại liên tục, mục đích dạy kỹ năng cho người bệnh để tự chăm sóc, phục vụ cho chính mình, cải thiện tối đa các hành vi tiêu cực, chưa phù hợp và cuối cùng là cải thiện cuộc sống.

ABA cho rằng mọi hành vi mong muốn thay đổi cần xác định ba yếu tố sau đây: “A-BC” trong đó:

Tiền đề: là những gì xảy ra ngay trước hành vi (có thể bằng lời nói, chẳng hạn như một mệnh lệnh hoặc yêu cầu. Nó cũng có thể là vật chất, chẳng hạn như đồ chơi hoặc đồ vật, hoặc ánh sáng, âm thanh hoặc thứ gì đó khác trong môi trường). Tiền đề có thể đến từ môi trường, từ người khác hoặc từ bên trong (chẳng hạn như suy nghĩ hoặc cảm giác).

Hành vi kết quả: là phản ứng của người bệnh phản ứng đối với tiền đề. Nó có thể là một hành động, một phản ứng bằng lời nói, hoặc một cái gì đó khác

(cử chỉ phi ngôn ngữ, biểu cảm cơ thể…)

Hậu quả: là kết quả xảy ra ngay sau hành vi.

Tùy thuộc vào nhu cầu, kỹ năng, sở thích và mức độ đáp ứng của mỗi người bệnh mà nhà trị liệu triển khai nhiều kỹ thuật ABA khác nhau và sử dụngcác hệ thống củng cố liên quan khác nhau để dạy người bệnh về hậu quả của việc tham gia vào các hành vi và hoạt động cụ thể, với mục đích những hành vi đó sẽ được tăng lên và lặp lại trong tương lai.`,
  57: `Âm nhạc trị liệu là việc sử dụng âm nhạc (nhịp điệu, giai điệu, hòa âm, tiết tấu…) trong mối quan hệ trị liệu để duy trì phục hồi hoặc cải thiện sự tập trung chú ý, cảm xúc, nhận thức, hành vi, giao tiếp…

Âm nhạc trị liệu có 2 hình thức:

Liệu pháp âm nhạc tích cực chủ động: Người bệnh có thể hát, di chuyển theo điệu nhạc, viết bài hát và chơi các nhạc cụ…

Liệu pháp âm nhạc thụ động: Người bệnh nghe, cảm nhận và tưởng tượng, âm nhạc tưởng tượng có hướng dẫn.

Âm nhạc giúp cho người bệnh nhanh chóng lấy lại sự cân bằng dễ dàng vượt qua các bất ổn về tinh thần thể chất và xã hội. Các giai điệu âm nhạc kích thích sự hoạt động của các giác quan kích hoạt cơ chế điều hòa của não bộ giúp cho con người điều chỉnh cảm xúc, phục hồi chức năng nhận thức như tập trung chú ý và trí nhớ, giúp cải thiện nhận thức và điều chỉnh hành vi, sống tự tin vào bản thân, sống thỏai mái hơn, hạnh phúc hơn và dễ gắn kết yêu thương nhau hơn.

Qua các hoạt động âm nhạc người bệnh được cải thiện khả năng và kỹ năng giao tiếp với mọi người giúp họ tự khám phá bản thân, phát triển tư duy sáng tạo, tâm lý thoải mái hỗ trợ cho quá trình điều trị và phục hồi chức năng.`,
  58: `Trị liệu nghệ thuật hội họa là một hình thức trị liệu tâm lý sử dụng tiến trình sáng tạo trong một không gian chữa lành an toàn để cải thiện và gia tăng sức khỏe tâm lý cho người bệnh.

Có nhiều hình thức nghệ thuật được sử dụng trong liệu pháp này, tuy nhiên cách hiểu phổ biến nhất với cụm từ “nghệ thuật” ở đây là nghệ thuật thị giác. Nghệ thuật thị giác được sử dụng trong trị liệu nghệ thuật bao gồm nhưng không giới hạn trong các hình thức vẽ tranh với than, chì, màu nước, sáp màu, cắt dán hình ảnh, vẽ kể chuyện, nặn đất sét, sáng tạo với vải…

Nghệ thuật phản ánh cái đẹp bằng màu sắc, đường nét, hình khối, sắc độ.

Thông qua tương tác với các chất liệu và dụng cụ người bệnh có thể khám phá và giải quyết những mâu thuẫn nội tâm, cải thiện hành vi ứng xử, có thể phát triển khả năng nhận thức, tự nhận thức và niềm tin vào bản thân, tự tin tham gia vào các hoạt động xã hội.

Giúp người bệnh giảm căng thẳng, cải thiện về mặt cảm xúc: người bệnh chủ động giải phóng những cảm xúc tiêu cực thay vì thụ động chờ đợi.

Giúp người bệnh cải thiện về mặt xã hội: người bệnh tự tin hòa nhập với xã hội, phát huy khả năng bản thân.

Giúp người bệnh cải thiện về mặt thể chất: Người bệnh giảm căng thẳng, khơi dậy tính chủ động tham gia vào các hoạt động.

Giúp người bệnh cải thiện về thể chất: cải thiện chức năng chi trên (các hoạt động tinh, kỹ năng khéo léo bàn tay trong các bài tô vẽ, tạo hình bằng đất nặn…nghệ thuật trị liệu cải thiện chức năng nhận thức đặc biệt trí nhớ, chức năng điều hành, không gian thị giác…`,
  59: `Rèn luyện thể dục thể thao đều đặn không chỉ giúp chúng ta thư giãn đầu óc, cải thiện trí nhớ, giảm căng thẳng và ngủ ngon hơn, mà nó còn là liệu pháp tích cực có tác dụng chống trầm cảm, lo âu, khắc phục chứng tăng động giảm chú ý và nhiều chứng bệnh khác liên quan đến tâm thần.

Chức năng rèn luyện sức khỏe của thể dục thể thao đó là thông qua các hoạt động vận động khoa học, hợp lý, thông qua cơ chế sinh học, y học để cải thiện và nâng cao hiệu quả quá trình trao đổi chất, năng lực tổng hợp và phân giải các chất dinh dưỡng trong cơ thể, nâng cao sức khỏe và tăng cường thể chất, làm cho cơ thể và bản thân người tập có được sự phát triển hiệu quả.

Luyện tập thể dục thể thao là phương pháp nên phối hợp để nâng cao thể lực của người bệnh cũng như giúp người bệnh có thể hòa đồng với những người xung quanh, tập dẫn khả năng phối hợp và tạo dựng lại niềm tin vào cuộc sống. Trong điều trị, tập luyên giúp cải thiện triệu chứng, hỗ trợ điều trị nguyên nhân, giảm các bệnh. Lấy lại cho người bệnh không chỉ thể lục tâm lý và sự tự tin khi hòa nhập với tập thể.`,
  60: `Liệu pháp tái thích ứng xã hội là liệu pháp tâm lý dùng kỹ thuật tâm lý để giải thích và thuyết phục người bệnh, giúp họ tự điều chỉnh lại hành vi/ việc làm của mình để chủ động khắc phục những khiếm khuyết về bệnh tật, đảm bảo người bệnh không tách rời các phương thức sinh hoạt xã hội trước đây, nhằm thích ứng và tái hoà nhập với cuộc sống.

Liệu pháp tái thích ứng xã hội trong điều trị bệnh tâm thần cho người bệnh bao gồm 3 cấp độ: (1) dự phòng độ I: điều trị khỏi hoàn toàn, không để tái lại các triệu chứng, biểu hiện bệnh. (2) dự phòng độ II: phát hiện sớm, can thiệp và điều trị sớm giúp ngăn chặn tác hại của bệnh. (3) Dự phòng độ III: tái thích ứng xã hội, phục hồi chức năng về tâm lý xã hội cho người bệnh để họ có thể sinh hoạt, làm việc có ích cho bản thân, gia đình và xã hội.`,
  61: `Đây là liệu pháp quan trọng vào bậc nhất trong tâm thần học, không thể thiếu được trong cơ sở điều trị nào, nội trú cũng như ngoại trú.

Bất kỳ một hoạt động nào của con người đều có 2 thành tố chính: thành tố tâm lý bên trong và các thao tác bên ngoài. Lao động liệu pháp nhằm làm thay đổi, điều chỉnh cái tâm lý bên trong thông qua việc tổ chức thực hiện các thao tác bên ngoài.

Liệu pháp hoạt động lao động làm cho người bệnh quên những cảm giác khó chịu do hoang tưởng ảo giác gây ra, giảm bớt lo lắng về bệnh tật, làm mất những ý nghĩ tiêu cực khi không hoạt động.

Liệu pháp hoạt động lao động giúp người bệnh gắn với tập thể trong dây chuyền sản xuất, tăng tính tổ chức và kỷ luật.

Liệu pháp hoạt động lao động giúp người bệnh có cảm giác thoải mái, khoan khoái trước sản phẩm của mình, khí sắc vui vẻ, lạc quan, gây lòng tin vào khả năng giúp ích xã hội của mình.

Liệu pháp hoạt động lao động giúp người bệnh cải thiện các mối quan hệ và duy trì các mối quan hệ với các thành viên. Huấn luyện bệnh nhân có khả năng độc lập, tự chủ trong hoạt động tự chăm sóc bản thân, giao tiếp, tái thích ứng xã hội.

Giúp bệnh nhân cải thiện và phát huy khả năng tập trung chú ý, sự biểu lộ, tính tổ chức, lòng tự tin.

Liệu pháp hoạt động lao động giúp người bệnh khôi phục và duy trì thói quen và động tác sản xuất, huấn luyện bệnh nhân một số kỹ năng lao động, nghề nghiệp cơ bản để người bệnh sớm hòa nhập cộng đồng.

Liệu pháp hoạt động lao động giúp người bệnh ăn ngon hơn, ngủ yên hơn. Hỗ trợ bệnh nhân lập kế hoạch tái hòa nhập cộng đồng trong tương lai.`,
  62: `Phương pháp đo điện não được sử dụng rộng rãi trên thế giới từ năm 1930. Điện não đồ là phương pháp thăm dò không xâm lấn, dễ thực hiện. Đo điện não đồ là phương pháp ghi hoạt động điện học của não bằng các điện cực đặt tại da đầu một cách chuẩn mực

Cùng với sự hiểu biết ngày càng rõ ràng hơn về các vùng chức năng trong não bộ, các quá trình hoạt động tâm thần, hành vi được cho là gây ra các biến đổi sinh hoá, hình ảnh trên điện não đồ đáng tin cậy và lặp lại giống nhau khi các hoạt động đó diễn ra. Việc chạy trên máy chạy bộ giúp bác sĩ tim mạch xác định hoạt động của tim người bệnh, giống như vậy, việc kiểm tra các hoạt động tâm thần như đọc, tính toán, giải quyết vấn đề… thay đổi trên điện não đồ giúp bác sĩ tâm thần biết hoạt động của não bộ người bệnh xử lý như thế nào.`,
  63: `Phương pháp đo điện não được sử dụng rộng rãi trên thế giới từ năm 1930, đến nay có nhiều kỹ thuật mới và hiện đại như đo điện não video, ghi điện não não - cộng hưởng từ… Kỹ thuật đo điện não với các điện cực trên da đầu hoặc đặt trong nội sọ (điện não đồ nội sọ); dưới da đầu (dưới màng cứng)

Điện não đồ là phương pháp thăm dò không xâm lấn, dễ thực hiện.

Điện não video sử dụng một máy quay video kết nối đồng bộ với máy ghi điện não. Máy quay video sẽ ghi lại toàn bộ chuyển động thấy được của người bệnh, cùng lúc đố máy điện não sẽ ghi lại sóng điện não.

Điện não video được ghi kéo dài với nhiều mốc thời gian khác nhau tùy theo mục đích chẩn đoán. Thời gian phụ thuộc vào tần số xuất hiện cơn, sự cần thiết khảo sát giấc ngủ, cần xác minh sự liên quan giữa hình thái lâm sàng và biểu hiện trên điện não…`,
  64: `Đo lưu huyết não là phương pháp ghi lại đại lượng điện trở biến đổi của các mô sống, các cơ quan hoặc các phần của cơ thể khi cho một dòng điện xoay chiều tần số cao, cường độ yếu chạy qua.

Các cơ quan hoặc một phần cơ thể sống luôn có một đại lượng điện trở tương đối ổn định. Những phần của cơ thể luôn có khả năng thay đổi về thể tích làm cho tính dẫn điện cũng thay đổi, sau khi hoạt động có một lượng máu nhất định vào hệ thống tuần hoàn, nhờ khả năng co giãn của mạch máu, lượng máu vào cơ quan tổ chức gây ra biến đổi điện trở.

Trong thực tiễn y học hiện nay, lưu huyết não đồ được sử dụng như một phương pháp chẩn đoán khách quan có giá trị đối với một số bệnh về não, đặc biệt là chẩn đoán trương lực và lưu lượng tuần hoàn mạch máu não.`,
  65: `Kích thích từ xuyên sọ TMS (Transcranial Magnetic Stimulation - TMS) là một kỹ thuật kích thích và điều biến thần kinh dựa trên nguyên tắc cảm ứng điện từ của một điện trường trong não, dùng các xung từ tính sóng ngắn xuyên qua xương sọ kích thích các tế bào thần kinh để làm thay đổi chức năng điện thần kinh của vùng não tương ứng. Khi sử dụng các xung từ tính sóng ngắn dưới dạng xung đơn cùng cường độ tác động lặp lại tại một vùng não gọi là kích thích từ xuyên sọ lặp lại (repetitive Transcranial Magnetic Stimulation – rTMS).`,
  66: `Định nghĩa

Sốc não (Sốc điện) là một liệu pháp điều trị bằng cách đưa dòng điện một chiều có điện thế, cường độ và thời gian nhất định qua đầu người bệnh tạo nên một cơn co giật giống động kinh cơn lớn. Người bệnh mất ý thức một thời gian ngắn sau đó tỉnh lại dần.

Nguyên lý:Dòng điện được truyền vào não, làm thay đổi các hoạt chất hóa học trong não, làm thay đổi các thụ thể thần kinh trong não, từ đó làm thay đổi các triệu chứng.

Mục đích: Điều trị một số bệnh lý tâm thần.`,
  67: `Định nghĩa:

Kích động là một trạng thái hưng phấn tâm lý, vận động quá mức xuất hiện đột ngột, không có mục đích, không thích hợp với hoàn cảnh, thường mang tính chất phá hoại, nguy hiểm cho bản thân và những người xung quanh.

Nguyên nhân:

Rối loạn tâm thần:

Kích động: thường gặp nhất trong các bệnh sau: Tâm thần phân liệt, hưng cảm nặng ở bệnh rối loạn cảm xúc lưỡng cực. Động kinh tâm thần, nhân cách bệnh: thể bùng nổ, paranoia. Rối loạn tâm thần ở người già (sa sút trí tuệ).

Các trạng thái kích động phản ứng: do căn nguyên tâm lý

Sang chấn tâm lý mạnh: rối loạn stress sau sang chấn, rối loạn phân ly…

Do thay đổi đột ngột môi trường sinh hoạt (chuyển viện, chuyển phòng), do bệnh nhân tâm thần khác kích động mà kích động theo, do giận dữ, bất bình với những sự việc không vừa ý trong phòng bệnh. Do nhận thức sai là bị đưa đi giam giữ hoặc bị cưỡng ép, bị gia đình lừa dối đưa đi bệnh viện; thường có phủ định bệnh.

Kích động do các bệnh thực thể tại não: u não, chấn thương sọ não, dị dạng mạch não, nhiễm khuẩn não –màng não,….

Kích động liên quan đến rượu và ma túy:Trạng thái nhiễm độc rượu và ma túy, hội chứng cai.`,
  68: `Tự sát là hành vi tự giết bản thân. Theo tổ chức y tế thế giới WHO, tự sát được chia thành:

Ý tưởng tự sát (suicidal ideation): Thể hiện đơn thuần trong ý nghĩ muốn chết nhưng chưa hành động.

Toan tự sát (attempted suicide): Bao gồm các hành vi khác nhau cố gắng để tự tử nhưng không thành công.

Tự sát hoàn thành (completed suicide): hành vi trực tiếp hay gián tiếp của bệnh nhân dẫn đến tử vong.

Một số nguyên nhân và các yếu tố nguy cơ hay gặp:

Rối loạn trầm cảm

Tâm thần phân liệt và rối loạn loạn thần cấp

Rối loạn hoang tưởng dai dẳng

Rối loạn tâm thần thực tổn

Lệ thuộc rượu và sử dụng chất kích thích

Rối loạn nhân cách

Rối loạn hành vi ăn uống

Tự sát và các nguyên nhân xã hội…`,
  69: `Trạng thái không ăn là tình trạng người bệnh từ chối sử dụng bất kỳ loại thực phẩm dinh dưỡng nào kéo dài trên 24h mà không có lý do hoặc lý do không hợp lý. Đây là một cấp cứu tâm thần và là một trạng thái bệnh lý thường gặp ở bệnh nhân tâm thần do nhiều nguyên nhân khác nhau với bệnh cảnh kéo dài rất lâu, điều trị gặp nhiều khó khăn. Người bệnh dễ dẫn đến sụt cân, mất nước, suy kiệt, mắc các bệnh nhiễm trùng cơ hội, tử vong, đòi hỏi phải được chẩn đoán đúng, điều trị tích cực và chăm sóc tốt. Nguyên nhân:

Trạng thái căng trương lực (kích động hoặc bất động) của tâm thần phân liệt: Người bệnh thường ngồi hoặc nằm bất động, không chịu ăn uống; khi đưa cơm nước vào miệng thì ngậm chặt lại.

Do hoang tưởng, ảo giác chi phối:

+Hoang tưởng bị tội: người bệnh cho rằng bản thân họ là xấu xa và có nhiều tội lỗi, không đáng sống, không đáng được ăn uống và từ chối không chịu ăn uống.

+Hoang tưởng bị hại: người bệnh luôn lo sợ bị người khác ám hại, đầu độc mình bằng cách bỏ thuốc độc vào thức ăn nên không chịu ăn uống.

+Ảo thanh xui khiến: có tiếng người bảo bệnh nhân không được ăn uống.

+Ảo khứu và ảo vị với nội dung khó chịu: mùi hôi, mùi tanh, vị đắng… -Trầm cảm nặng.

Rối loạn bản năng ăn uống: ở trẻ chậm phát triển tâm thần, tâm thần phân liệt giai đoạn sa sút, sa sút trí tuệ ở người già.

Do bệnh lý cơ thể: viêm dạ dày, lao phổi, ung thư, kém hấp thu …

Nguyên nhân tâm lý: thức ăn không thích hợp, tôn giáo … -Chán ăn tâm thần (anorexia nevrosa).`
};

export const CLINICAL_PROTOCOLS = PROTOCOLS.map((protocol) => ({
  ...protocol,
  definition: DEFINITIONS[protocol.no]
}));

export const CLINICAL_PROTOCOL_GROUPS = { all: 'Tất cả', therapy: 'Trị liệu tâm lý – phục hồi', diagnostic: 'Cận lâm sàng', restricted: 'Thủ thuật chuyên khoa', safety: 'An toàn khẩn cấp' };
