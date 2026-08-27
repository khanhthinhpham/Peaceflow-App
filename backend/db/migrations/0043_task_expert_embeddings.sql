create extension if not exists vector;

alter table tasks add column if not exists embedding vector(768);
alter table experts add column if not exists embedding vector(768);
