-- Phương thức nhận thanh toán (payout) của chuyên gia.
-- Nền tảng thu tiền tập trung rồi chi trả 75% cho chuyên gia theo chu kỳ,
-- nên cần lưu tài khoản ngân hàng để admin đối soát & chuyển khoản.

alter table experts add column if not exists payout_bank_name varchar(120);
alter table experts add column if not exists payout_account_number varchar(40);
alter table experts add column if not exists payout_account_name varchar(255);
