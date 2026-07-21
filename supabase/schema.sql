-- ============================================================
-- Opus Pulse AI — DB for dashboard / intake / queue / AI screens
-- Run once in Supabase SQL Editor
-- ============================================================

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS recommendations CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS resources CASCADE;

-- ------------------------------------------------------------
-- patients (Intake, Queue, KPIs, AI context)
-- ------------------------------------------------------------
CREATE TABLE patients (
  id TEXT PRIMARY KEY DEFAULT ('PT-' || lpad((floor(random()*900)+100)::text, 3, '0')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  name TEXT NOT NULL,
  age INT NOT NULL,
  gender TEXT,                                    -- male | female | other
  arrival_type TEXT NOT NULL DEFAULT 'WALK_IN',
  complaint TEXT NOT NULL DEFAULT '',
  symptoms TEXT[] NOT NULL DEFAULT '{}',

  vitals JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- { heartRate, oxygenSaturation, systolicBP, diastolicBP, temperature }

  consciousness TEXT NOT NULL DEFAULT 'ALERT',    -- ALERT | CONFUSED | UNCONSCIOUS

  urgency_score INT,
  priority TEXT CHECK (priority IN ('P1', 'P2', 'P3', 'P4')),
  triggered_rules TEXT[] NOT NULL DEFAULT '{}',

  status TEXT NOT NULL DEFAULT 'REGISTERED',
  -- REGISTERED | WAITING | AWAITING_REVIEW | ALLOCATED | IN_TREATMENT | DISCHARGED

  assigned_unit TEXT,
  assigned_bed_id TEXT,
  assigned_doctor_id TEXT,
  assigned_equipment_ids TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT
);

CREATE INDEX idx_patients_status ON patients (status);
CREATE INDEX idx_patients_priority ON patients (priority);
CREATE INDEX idx_patients_created ON patients (created_at DESC);

-- ------------------------------------------------------------
-- resources (Resource Overview, Departments, AI allocation)
-- ------------------------------------------------------------
CREATE TABLE resources (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  resource_type TEXT NOT NULL CHECK (resource_type IN ('bed', 'doctor', 'equipment')),
  name TEXT NOT NULL,
  unit TEXT,                                      -- ICU | Emergency Resuscitation | CCU | Ward | Observation
  specialty TEXT,
  sub_type TEXT,                                  -- ICU | emergency | ccu | ward | cardiac_monitor | ventilator
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  workload_count INT NOT NULL DEFAULT 0,
  max_load INT NOT NULL DEFAULT 6,                -- doctors: for overload alerts
  assigned_to TEXT REFERENCES patients(id)
);

CREATE INDEX idx_resources_type_available ON resources (resource_type, is_available);
CREATE INDEX idx_resources_subtype ON resources (sub_type);

-- ------------------------------------------------------------
-- recommendations (AI Recommendations cards + Approve/Reject)
-- ------------------------------------------------------------
CREATE TABLE recommendations (
  id TEXT PRIMARY KEY DEFAULT ('REC-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  patient_id TEXT NOT NULL REFERENCES patients(id),
  parent_id TEXT REFERENCES recommendations(id),

  status TEXT NOT NULL DEFAULT 'PENDING_VALIDATION',
  recommendation JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_valid BOOLEAN,
  validation_errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  validation_warnings JSONB NOT NULL DEFAULT '[]'::jsonb,

  decision TEXT,
  reviewed_by TEXT,
  override_reason TEXT,
  override_allocation JSONB,
  decided_at TIMESTAMPTZ
);

CREATE INDEX idx_recommendations_patient ON recommendations (patient_id);
CREATE INDEX idx_recommendations_status ON recommendations (status);

-- ------------------------------------------------------------
-- audit_logs (Activity Timeline)
-- ------------------------------------------------------------
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY DEFAULT ('EVT-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  patient_id TEXT REFERENCES patients(id),
  action TEXT NOT NULL,
  -- patient_arrived | priority_calculated | recommendation_generated
  -- recommendation_approved | bed_assigned | alert_fired | ...
  recommendation JSONB,
  status TEXT,
  description TEXT,
  actor TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_audit_created ON audit_logs (created_at DESC);

-- ------------------------------------------------------------
-- alerts (System Alerts panel)
-- ------------------------------------------------------------
CREATE TABLE alerts (
  id TEXT PRIMARY KEY DEFAULT ('ALT-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type TEXT,                                      -- ICU_FULL | DOCTOR_OVERLOAD | EQUIPMENT_LOW | HIGH_RISK_WAITING
  severity TEXT NOT NULL,                         -- CRITICAL | WARNING | INFO
  message TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by TEXT,
  related_resource_id TEXT REFERENCES resources(id),
  related_patient_id TEXT REFERENCES patients(id)
);

-- ============================================================
-- SEED: resources (matches dashboard Resource Overview scale)
-- ICU 10 (1 free), ER 20 (~5 free), CCU 8, Ward 40 — hackathon-sized
-- ============================================================

-- ICU beds: 1 available, 9 occupied
INSERT INTO resources (id, resource_type, name, unit, sub_type, is_available) VALUES
  ('ICU-01', 'bed', 'ICU-01', 'ICU', 'ICU', TRUE);
INSERT INTO resources (id, resource_type, name, unit, sub_type, is_available)
SELECT 'ICU-' || lpad(g::text, 2, '0'), 'bed', 'ICU-' || lpad(g::text, 2, '0'), 'ICU', 'ICU', FALSE
FROM generate_series(2, 10) g;

-- ER beds: 5 available, 15 occupied
INSERT INTO resources (id, resource_type, name, unit, sub_type, is_available)
SELECT 'ER-' || lpad(g::text, 2, '0'), 'bed', 'ER-' || lpad(g::text, 2, '0'), 'Emergency Resuscitation', 'emergency',
       CASE WHEN g <= 5 THEN TRUE ELSE FALSE END
FROM generate_series(1, 20) g;

-- CCU beds: 2 available, 6 occupied
INSERT INTO resources (id, resource_type, name, unit, sub_type, is_available)
SELECT 'CCU-' || lpad(g::text, 2, '0'), 'bed', 'CCU-' || lpad(g::text, 2, '0'), 'CCU', 'ccu',
       CASE WHEN g <= 2 THEN TRUE ELSE FALSE END
FROM generate_series(1, 8) g;

-- Ward beds: 18 available, 22 occupied
INSERT INTO resources (id, resource_type, name, unit, sub_type, is_available)
SELECT 'WARD-' || lpad(g::text, 2, '0'), 'bed', 'WARD-' || lpad(g::text, 2, '0'), 'Ward', 'ward',
       CASE WHEN g <= 18 THEN TRUE ELSE FALSE END
FROM generate_series(1, 40) g;

-- Observation
INSERT INTO resources (id, resource_type, name, unit, sub_type, is_available) VALUES
  ('OBS-01', 'bed', 'OBS-01', 'Observation', 'observation', TRUE);

-- Doctors
INSERT INTO resources (id, resource_type, name, unit, specialty, sub_type, is_available, workload_count, max_load) VALUES
  ('D-01', 'doctor', 'Dr. Ahmed Khan', 'Emergency', 'Emergency Medicine', 'emergency', TRUE, 3, 6),
  ('D-02', 'doctor', 'Dr. Sarah Malik', 'CCU', 'Cardiology', 'ccu', TRUE, 4, 5),
  ('D-03', 'doctor', 'Dr. James Okonkwo', 'ICU', 'Critical Care', 'ICU', TRUE, 4, 4),
  ('D-04', 'doctor', 'Dr. Fatima Raza', 'Ward', 'Neurology', 'ward', TRUE, 2, 6),
  ('D-05', 'doctor', 'Dr. Carlos Mendez', 'OT', 'Surgery', 'ot', TRUE, 1, 3),
  ('D-06', 'doctor', 'Dr. Aisha Patel', 'Pediatrics', 'Pediatrics', 'peds', TRUE, 3, 7),
  ('D-07', 'doctor', 'Dr. Robert Chen', 'Ward', 'Internal Medicine', 'ward', FALSE, 0, 5),
  ('D-08', 'doctor', 'Dr. Leila Hassan', 'Emergency', 'Emergency Medicine', 'emergency', TRUE, 6, 6);

-- Equipment
INSERT INTO resources (id, resource_type, name, unit, sub_type, is_available) VALUES
  ('MON-01', 'equipment', 'Cardiac Monitor #1', 'Emergency Resuscitation', 'cardiac_monitor', TRUE),
  ('MON-02', 'equipment', 'Cardiac Monitor #2', 'Emergency Resuscitation', 'cardiac_monitor', FALSE),
  ('MON-03', 'equipment', 'Cardiac Monitor #3', 'CCU', 'cardiac_monitor', TRUE),
  ('VEN-01', 'equipment', 'Ventilator #1', 'ICU', 'ventilator', FALSE),
  ('VEN-02', 'equipment', 'Ventilator #2', 'ICU', 'ventilator', TRUE),
  ('VEN-03', 'equipment', 'Ventilator #3', 'ICU', 'ventilator', FALSE),
  ('ECG-01', 'equipment', 'ECG Machine #1', 'CCU', 'ecg', TRUE),
  ('DEF-01', 'equipment', 'Defibrillator #1', 'Emergency Resuscitation', 'defibrillator', TRUE),
  ('DEF-02', 'equipment', 'Defibrillator #2', 'Emergency Resuscitation', 'defibrillator', TRUE);

-- ------------------------------------------------------------
-- Demo waiting patients (Live Patient Queue)
-- ------------------------------------------------------------
INSERT INTO patients (id, name, age, gender, arrival_type, complaint, symptoms, vitals, consciousness, urgency_score, priority, triggered_rules, status, created_at) VALUES
(
  'PT-001', 'Hassan Al-Rashid', 58, 'male', 'AMBULANCE', 'Chest Pain',
  ARRAY['chest pain','shortness of breath','diaphoresis'],
  '{"heartRate":118,"oxygenSaturation":82,"systolicBP":85,"diastolicBP":50,"temperature":37.2}'::jsonb,
  'ALERT', 92, 'P1',
  ARRAY['SpO2 82% — Severe Hypoxia','BP 85/50 — Hypotension','Chest pain reported'],
  'WAITING', NOW() - INTERVAL '19 minutes'
),
(
  'PT-002', 'Maria Rodriguez', 67, 'female', 'AMBULANCE', 'Facial Droop',
  ARRAY['facial droop','arm weakness','speech difficulty'],
  '{"heartRate":95,"oxygenSaturation":94,"systolicBP":185,"diastolicBP":105,"temperature":37.4}'::jsonb,
  'ALERT', 88, 'P1',
  ARRAY['Stroke symptoms','BP 185/105 Severe Hypertension'],
  'WAITING', NOW() - INTERVAL '12 minutes'
),
(
  'PT-004', 'Li Wei', 34, 'female', 'WALK_IN', 'Breathing Difficulty',
  ARRAY['difficulty breathing','wheezing'],
  '{"heartRate":108,"oxygenSaturation":91,"systolicBP":130,"diastolicBP":82,"temperature":37.6}'::jsonb,
  'ALERT', 58, 'P2',
  ARRAY['Moderate hypoxia'],
  'WAITING', NOW() - INTERVAL '18 minutes'
),
(
  'PT-005', 'Amina Diallo', 29, 'female', 'WALK_IN', 'Abdominal Pain',
  ARRAY['abdominal pain','nausea'],
  '{"heartRate":88,"oxygenSaturation":98,"systolicBP":118,"diastolicBP":75,"temperature":38.1}'::jsonb,
  'ALERT', 32, 'P3',
  ARRAY['Fever'],
  'WAITING', NOW() - INTERVAL '35 minutes'
),
(
  'PT-006', 'Robert Kim', 71, 'male', 'WALK_IN', 'Hip Pain',
  ARRAY['hip pain','limited mobility'],
  '{"heartRate":76,"oxygenSaturation":96,"systolicBP":142,"diastolicBP":88,"temperature":36.8}'::jsonb,
  'ALERT', 22, 'P4',
  ARRAY[]::text[],
  'WAITING', NOW() - INTERVAL '62 minutes'
);

-- Pending AI recommendations (AI Recommendations cards)
INSERT INTO recommendations (id, patient_id, status, is_valid, recommendation, validation_warnings) VALUES
(
  'REC-001', 'PT-001', 'AWAITING_HUMAN_APPROVAL', TRUE,
  '{
    "recommendedPriority":"P1",
    "recommendedQueuePosition":1,
    "recommendedUnit":"Emergency Resuscitation",
    "recommendedBedId":"ER-02",
    "recommendedDoctorId":"D-01",
    "requiredEquipmentIds":["MON-01"],
    "immediateActions":["Move patient to emergency resuscitation","Assign emergency doctor","Start continuous monitoring"],
    "reasoningSummary":["SpO2 82% — Severe Hypoxia","No ICU bed available","BP 85/50 — Hypotension"],
    "resourceConflicts":["No ICU bed currently available"],
    "alternativePlan":{"unit":"Emergency Resuscitation","actions":["Stabilize in ER","Monitor vitals","First in ICU transfer queue"]},
    "confidence":0.72,
    "requiresHumanApproval":true
  }'::jsonb,
  '["ICU currently full"]'::jsonb
),
(
  'REC-002', 'PT-002', 'AWAITING_HUMAN_APPROVAL', TRUE,
  '{
    "recommendedPriority":"P1",
    "recommendedQueuePosition":2,
    "recommendedUnit":"CCU",
    "recommendedBedId":"CCU-01",
    "recommendedDoctorId":"D-04",
    "requiredEquipmentIds":["ECG-01","MON-03"],
    "immediateActions":["Move patient to CCU","Assign neurologist","Begin stroke protocol"],
    "reasoningSummary":["Stroke symptoms","BP 185/105 Severe Hypertension"],
    "resourceConflicts":[],
    "alternativePlan":{"unit":"Emergency Resuscitation","actions":["ER with neurologist on call"]},
    "confidence":0.85,
    "requiresHumanApproval":true
  }'::jsonb,
  '[]'::jsonb
);

-- Activity timeline
INSERT INTO audit_logs (id, patient_id, action, description, actor, created_at, meta) VALUES
  ('EVT-01', 'PT-002', 'recommendation_generated', 'CCU allocation recommendation generated', 'SYSTEM', NOW() - INTERVAL '10 minutes', '{}'),
  ('EVT-02', 'PT-001', 'recommendation_generated', 'ER fallback recommendation generated', 'SYSTEM', NOW() - INTERVAL '16 minutes', '{}'),
  ('EVT-03', 'PT-001', 'patient_arrived', 'Patient registered through ambulance intake', 'SYSTEM', NOW() - INTERVAL '19 minutes', '{"priority":"P1"}'),
  ('EVT-04', 'PT-002', 'patient_arrived', 'Patient registered through ambulance intake', 'SYSTEM', NOW() - INTERVAL '12 minutes', '{"priority":"P1"}'),
  ('EVT-05', NULL, 'alert_fired', 'ICU is at 90% capacity. Only 1 bed remaining.', 'SYSTEM', NOW() - INTERVAL '27 minutes', '{"type":"ICU_FULL"}');

-- System alerts panel
INSERT INTO alerts (id, type, severity, message, active, related_resource_id, related_patient_id, created_at) VALUES
  ('ALT-01', 'ICU_FULL', 'CRITICAL', 'ICU is at 90% capacity. Only 1 bed remaining.', TRUE, 'ICU-01', NULL, NOW() - INTERVAL '15 minutes'),
  ('ALT-02', 'DOCTOR_OVERLOAD', 'WARNING', 'Dr. Leila Hassan at maximum patient load.', TRUE, 'D-08', NULL, NOW() - INTERVAL '20 minutes'),
  ('ALT-03', 'EQUIPMENT_LOW', 'WARNING', 'Ventilator #3 under maintenance. Only 1 available.', TRUE, 'VEN-03', NULL, NOW() - INTERVAL '25 minutes'),
  ('ALT-04', 'HIGH_RISK_WAITING', 'CRITICAL', 'PT-001 (P1 Chest Pain) waiting without assignment.', TRUE, NULL, 'PT-001', NOW() - INTERVAL '8 minutes');
