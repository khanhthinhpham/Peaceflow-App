-- Assessment definitions are rendered and scored by the Vue client.  These rows allow
-- completed client-side assessments to be saved in assessment_results.
insert into public.assessments (code, name, version, description, active)
values
  ('HDRS', 'Hamilton Depression Rating Scale', '1.0', 'Clinician-administered depression severity scale', true),
  ('CDI', 'Children''s Depression Inventory', '1.0', 'Depression screening for children and adolescents', true),
  ('GDS', 'Geriatric Depression Scale', '1.0', 'Depression screening for older adults', true),
  ('EPDS', 'Edinburgh Postnatal Depression Scale', '1.0', 'Postnatal depression screening', true),
  ('ZAI', 'Zung Self-Rating Anxiety Scale', '1.0', 'Self-rated anxiety scale', true),
  ('HADS', 'Hospital Anxiety and Depression Scale', '1.0', 'Anxiety and depression screening scale', true),
  ('MCHAT', 'Modified Checklist for Autism in Toddlers', '1.0', 'Autism-risk screening for toddlers', true),
  ('ASQ3', 'Ages and Stages Questionnaires 3', '1.0', 'Developmental screening questionnaire', true),
  ('CGIS', 'Clinical Global Impression Severity Scale', '1.0', 'Clinician-rated overall illness severity', true),
  ('BPRS', 'Brief Psychiatric Rating Scale', '1.0', 'Clinician psychiatric symptom rating scale', true),
  ('PANSS', 'Positive and Negative Syndrome Scale', '1.0', 'Clinician schizophrenia symptom rating scale', true),
  ('AIMS', 'Abnormal Involuntary Movement Scale', '1.0', 'Clinician-rated involuntary movement scale', true),
  ('HACHINSKI', 'Hachinski Ischemic Score', '1.0', 'Vascular dementia screening score', true),
  ('HIMMELBACH', 'Himmelbach Withdrawal Scale', '1.0', 'Withdrawal severity scale', true),
  ('EPI', 'Eysenck Personality Inventory', '1.0', 'Personality questionnaire', true),
  ('VANDERBILT', 'Vanderbilt ADHD Diagnostic Rating Scale', '1.0', 'Parent ADHD rating scale', true)
on conflict (code) do update
set
  name = excluded.name,
  version = excluded.version,
  description = excluded.description,
  active = excluded.active;
