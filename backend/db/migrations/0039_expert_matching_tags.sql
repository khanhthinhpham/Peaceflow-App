-- Normalize expert specialties into tags used by PeaceCat matching.
update experts set tags = '["mental_health","anxiety","depression","stress","sleep"]'::jsonb, updated_at = now()
where code = 'EXP-3d155d';

update experts set tags = '["mental_health","anxiety","depression","stress","sleep","substance_use","elderly","child_adolescent"]'::jsonb, updated_at = now()
where code = 'EXP-16ceb9';

update experts set tags = '["mental_health","anxiety","depression","child_adolescent"]'::jsonb, updated_at = now()
where code = 'EXP-88d001';

update experts set tags = '["mental_health","anxiety","depression","stress","sleep","substance_use","adolescent"]'::jsonb, updated_at = now()
where code = 'EXP-5209e3';

update experts set tags = '["anxiety","depression","stress","sleep"]'::jsonb, updated_at = now()
where code = 'EXP-1f5c94';

update experts set tags = '["mental_health","anxiety","depression","stress","sleep","substance_use","elderly","child_adolescent"]'::jsonb, updated_at = now()
where code = 'EXP-563620';
