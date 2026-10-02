-- Migration: Add pedagogical research fields to challenges and students in Cloudflare D1
ALTER TABLE challenges ADD COLUMN custom_task_prompt TEXT DEFAULT '';
ALTER TABLE challenges ADD COLUMN custom_clue TEXT DEFAULT '';
ALTER TABLE challenges ADD COLUMN subject_category TEXT DEFAULT 'obecne';
ALTER TABLE challenges ADD COLUMN solution_answer TEXT DEFAULT '';

ALTER TABLE students ADD COLUMN avatar TEXT DEFAULT '🦊';
ALTER TABLE students ADD COLUMN morning_steps INTEGER DEFAULT 0;
ALTER TABLE students ADD COLUMN streak_days INTEGER DEFAULT 5;
