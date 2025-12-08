-- Mizan Database Initialization Script
-- This script runs when the PostgreSQL container is first created

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create tables (these will also be created by Entity Framework/Drizzle migrations)
-- This is for reference and initial setup

-- Seed some default achievements
INSERT INTO achievements (id, name, description, icon_url, points, category) VALUES
  (gen_random_uuid(), 'First Steps', 'Log your first food item', '/achievements/first-steps.svg', 10, 'nutrition'),
  (gen_random_uuid(), 'Week Warrior', 'Log food for 7 consecutive days', '/achievements/week-warrior.svg', 50, 'streak'),
  (gen_random_uuid(), 'Protein Pro', 'Hit your protein goal 5 days in a row', '/achievements/protein-pro.svg', 75, 'nutrition'),
  (gen_random_uuid(), 'Gym Regular', 'Complete 10 workouts', '/achievements/gym-regular.svg', 100, 'workout'),
  (gen_random_uuid(), 'Recipe Creator', 'Create your first recipe', '/achievements/recipe-creator.svg', 25, 'nutrition'),
  (gen_random_uuid(), 'Month Master', 'Log food for 30 consecutive days', '/achievements/month-master.svg', 200, 'streak'),
  (gen_random_uuid(), 'Balance Keeper', 'Hit all macro goals in a single day', '/achievements/balance-keeper.svg', 50, 'nutrition'),
  (gen_random_uuid(), 'Century Club', 'Log 100 food entries', '/achievements/century-club.svg', 150, 'nutrition')
ON CONFLICT DO NOTHING;

-- Seed some common exercises
INSERT INTO exercises (id, name, description, category, muscle_group, equipment, is_custom) VALUES
  (gen_random_uuid(), 'Barbell Bench Press', 'Lie on bench, lower bar to chest, press up', 'strength', 'chest', 'barbell', false),
  (gen_random_uuid(), 'Barbell Squat', 'Bar on back, squat down keeping back straight', 'strength', 'legs', 'barbell', false),
  (gen_random_uuid(), 'Deadlift', 'Lift bar from floor with straight back', 'strength', 'back', 'barbell', false),
  (gen_random_uuid(), 'Pull-ups', 'Hang from bar and pull body up', 'strength', 'back', 'bodyweight', false),
  (gen_random_uuid(), 'Push-ups', 'Lower body to floor and push up', 'strength', 'chest', 'bodyweight', false),
  (gen_random_uuid(), 'Dumbbell Rows', 'Bend over, pull dumbbell to hip', 'strength', 'back', 'dumbbell', false),
  (gen_random_uuid(), 'Shoulder Press', 'Press weight overhead from shoulders', 'strength', 'shoulders', 'dumbbell', false),
  (gen_random_uuid(), 'Bicep Curls', 'Curl weight up to shoulders', 'strength', 'arms', 'dumbbell', false),
  (gen_random_uuid(), 'Tricep Dips', 'Lower body between parallel bars', 'strength', 'arms', 'bodyweight', false),
  (gen_random_uuid(), 'Lunges', 'Step forward and lower rear knee', 'strength', 'legs', 'bodyweight', false),
  (gen_random_uuid(), 'Plank', 'Hold body in push-up position', 'strength', 'core', 'bodyweight', false),
  (gen_random_uuid(), 'Running', 'Cardiovascular running exercise', 'cardio', 'full body', 'none', false),
  (gen_random_uuid(), 'Cycling', 'Stationary or outdoor cycling', 'cardio', 'legs', 'bicycle', false),
  (gen_random_uuid(), 'Jump Rope', 'Skip rope for cardio', 'cardio', 'full body', 'jump rope', false),
  (gen_random_uuid(), 'Rowing', 'Row on machine or boat', 'cardio', 'full body', 'rowing machine', false)
ON CONFLICT DO NOTHING;

-- Seed some common foods (Ethiopian and international)
INSERT INTO foods (id, name, brand, serving_size, serving_unit, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, is_verified) VALUES
  -- Ethiopian foods
  (gen_random_uuid(), 'Injera (Teff)', NULL, 100, 'g', 185, 4.5, 36, 1.5, 4.8, true),
  (gen_random_uuid(), 'Doro Wat', NULL, 100, 'g', 150, 18, 5, 7, 1.2, true),
  (gen_random_uuid(), 'Misir Wat (Red Lentils)', NULL, 100, 'g', 116, 9, 20, 0.5, 8, true),
  (gen_random_uuid(), 'Kitfo (Raw Beef)', NULL, 100, 'g', 225, 20, 0, 16, 0, true),
  (gen_random_uuid(), 'Shiro', NULL, 100, 'g', 130, 8, 18, 3, 5, true),
  (gen_random_uuid(), 'Gomen (Collard Greens)', NULL, 100, 'g', 45, 3, 6, 1, 4, true),
  (gen_random_uuid(), 'Tibs (Beef)', NULL, 100, 'g', 175, 22, 2, 9, 0.5, true),
  (gen_random_uuid(), 'Ayib (Ethiopian Cheese)', NULL, 100, 'g', 98, 11, 3, 5, 0, true),
  -- International foods
  (gen_random_uuid(), 'Chicken Breast', NULL, 100, 'g', 165, 31, 0, 3.6, 0, true),
  (gen_random_uuid(), 'Brown Rice', NULL, 100, 'g', 112, 2.6, 24, 0.9, 1.8, true),
  (gen_random_uuid(), 'Salmon', NULL, 100, 'g', 208, 20, 0, 13, 0, true),
  (gen_random_uuid(), 'Broccoli', NULL, 100, 'g', 34, 2.8, 7, 0.4, 2.6, true),
  (gen_random_uuid(), 'Egg', NULL, 50, 'g', 155, 13, 1.1, 11, 0, true),
  (gen_random_uuid(), 'Greek Yogurt', NULL, 100, 'g', 59, 10, 3.6, 0.7, 0, true),
  (gen_random_uuid(), 'Banana', NULL, 120, 'g', 89, 1.1, 23, 0.3, 2.6, true),
  (gen_random_uuid(), 'Oatmeal', NULL, 100, 'g', 68, 2.4, 12, 1.4, 1.7, true),
  (gen_random_uuid(), 'Almonds', NULL, 30, 'g', 579, 21, 22, 50, 12, true),
  (gen_random_uuid(), 'Sweet Potato', NULL, 100, 'g', 86, 1.6, 20, 0.1, 3, true),
  (gen_random_uuid(), 'Quinoa', NULL, 100, 'g', 120, 4.4, 21, 1.9, 2.8, true),
  (gen_random_uuid(), 'Avocado', NULL, 100, 'g', 160, 2, 9, 15, 7, true)
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO mizan;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO mizan;
