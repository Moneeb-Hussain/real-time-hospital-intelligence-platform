-- ============================================================
-- Demo assignments — run in Supabase → SQL Editor
-- Makes Live Patient Queue show doctor names, beds, fresh waits
-- Safe to re-run (updates existing demo rows)
-- ============================================================

-- Fresh wait times + doctor / bed assignments
UPDATE patients SET
  created_at = NOW() - INTERVAL '14 minutes',
  updated_at = NOW(),
  status = 'WAITING',
  assigned_doctor_id = NULL,
  assigned_bed_id = NULL,
  assigned_unit = NULL,
  notes = 'Awaiting ER assignment — P1 overdue risk'
WHERE id = 'PT-001';

UPDATE patients SET
  created_at = NOW() - INTERVAL '9 minutes',
  updated_at = NOW(),
  status = 'WAITING',
  assigned_doctor_id = 'D-04',
  assigned_bed_id = NULL,
  assigned_unit = 'CCU',
  notes = 'Neurology consult in progress'
WHERE id = 'PT-002';

UPDATE patients SET
  created_at = NOW() - INTERVAL '22 minutes',
  updated_at = NOW(),
  status = 'WAITING',
  assigned_doctor_id = 'D-01',
  assigned_bed_id = 'ER-03',
  assigned_unit = 'Emergency Resuscitation',
  notes = 'Stabilizing in ER bay'
WHERE id = 'PT-004';

UPDATE patients SET
  created_at = NOW() - INTERVAL '28 minutes',
  updated_at = NOW(),
  status = 'WAITING',
  assigned_doctor_id = 'D-06',
  assigned_bed_id = NULL,
  assigned_unit = 'Ward',
  notes = 'Queued for ward assessment'
WHERE id = 'PT-005';

UPDATE patients SET
  created_at = NOW() - INTERVAL '41 minutes',
  updated_at = NOW(),
  status = 'WAITING',
  assigned_doctor_id = 'D-07',
  assigned_bed_id = 'WARD-12',
  assigned_unit = 'Ward',
  notes = 'Non-urgent ortho pathway'
WHERE id = 'PT-006';

-- Optional: one more assigned patient so mix is clear
INSERT INTO patients (
  id, name, age, gender, arrival_type, complaint, symptoms, vitals,
  consciousness, urgency_score, priority, triggered_rules, status,
  assigned_unit, assigned_bed_id, assigned_doctor_id, notes, created_at
) VALUES (
  'PT-003', 'Omar Farooq', 45, 'male', 'WALK_IN', 'Severe Headache',
  ARRAY['headache','photophobia','nausea'],
  '{"heartRate":92,"oxygenSaturation":97,"systolicBP":158,"diastolicBP":96,"temperature":37.1}'::jsonb,
  'ALERT', 48, 'P3',
  ARRAY['Hypertension'],
  'WAITING',
  'Emergency Resuscitation', NULL, 'D-08',
  'Seen by ER — observation',
  NOW() - INTERVAL '16 minutes'
)
ON CONFLICT (id) DO UPDATE SET
  assigned_doctor_id = EXCLUDED.assigned_doctor_id,
  assigned_unit = EXCLUDED.assigned_unit,
  notes = EXCLUDED.notes,
  created_at = EXCLUDED.created_at,
  updated_at = NOW(),
  status = 'WAITING',
  urgency_score = EXCLUDED.urgency_score,
  priority = EXCLUDED.priority;

-- Sync doctor workload so Resource Overview / alerts stay coherent
UPDATE resources SET workload_count = 1, is_available = TRUE, last_updated = NOW()
WHERE id = 'D-01';

UPDATE resources SET workload_count = 1, is_available = TRUE, last_updated = NOW()
WHERE id = 'D-04';

UPDATE resources SET workload_count = 1, is_available = TRUE, last_updated = NOW()
WHERE id = 'D-06';

UPDATE resources SET workload_count = 1, is_available = FALSE, last_updated = NOW()
WHERE id = 'D-07';

UPDATE resources SET workload_count = 5, is_available = TRUE, max_load = 6, last_updated = NOW()
WHERE id = 'D-08';

-- Mark assigned beds occupied (if those bed rows exist)
UPDATE resources SET is_available = FALSE, assigned_to = 'PT-004', last_updated = NOW()
WHERE id = 'ER-03';

UPDATE resources SET is_available = FALSE, assigned_to = 'PT-006', last_updated = NOW()
WHERE id = 'WARD-12';

-- Keep one critical alert for the still-unassigned P1
UPDATE alerts SET
  active = TRUE,
  message = 'PT-001 (P1 Chest Pain) waiting without assignment.',
  related_patient_id = 'PT-001',
  created_at = NOW() - INTERVAL '8 minutes'
WHERE id = 'ALT-04';

-- Quick check
SELECT
  id,
  name,
  priority,
  status,
  assigned_doctor_id,
  assigned_bed_id,
  ROUND(EXTRACT(EPOCH FROM (NOW() - created_at)) / 60) AS wait_min
FROM patients
WHERE id LIKE 'PT-%'
ORDER BY urgency_score DESC NULLS LAST;
