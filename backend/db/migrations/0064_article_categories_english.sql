alter table article_categories add column if not exists label_en varchar(100);

update article_categories set label_en = 'Stress relief' where key = 'giam_cang_thang';
update article_categories set label_en = 'Sleep' where key = 'giac_ngu';
update article_categories set label_en = 'Real stories' where key = 'cau_chuyen_that';
update article_categories set label_en = 'Life skills' where key = 'ky_nang_song';
update article_categories set label_en = 'Mental health' where key = 'suc_khoe_tinh_than';
update article_categories set label_en = 'Other' where key = 'khac';
