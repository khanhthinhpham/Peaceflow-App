import { db } from '../../config/db.js';

// Mã hồ sơ NA-TVHD-[Năm]-[Tháng]-[STT] theo đúng tài liệu "Cổng dữ liệu số tư vấn học
// đường Nghệ An" — vd NA-TVHD-2026-05-001. Dùng UPSERT tăng dần atomic (1 câu lệnh, Postgres
// tự khoá dòng khi conflict) để tránh 2 phiếu nộp cùng lúc bị trùng số thứ tự.
export async function nextCaseCode() {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const r = await db.query(
    `insert into case_code_counters (year_month, last_number) values ($1, 1)
     on conflict (year_month) do update set last_number = case_code_counters.last_number + 1
     returning last_number`,
    [yearMonth]
  );
  const seq = String(r.rows[0].last_number).padStart(3, '0');
  return `NA-TVHD-${yearMonth}-${seq}`;
}
