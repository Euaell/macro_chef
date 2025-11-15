import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@macrochef.com' },
    update: {},
    create: {
      email: 'admin@macrochef.com',
      emailVerified: true,
      username: 'admin',
      name: 'Admin User',
      isAdmin: true,
      role: 'admin',
      isPublic: true,
      bio: 'MacroChef Administrator',
    },
  });

  // Create account with password for admin
  await prisma.account.upsert({
    where: {
      providerId_accountId: {
        providerId: 'credential',
        accountId: admin.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      accountId: admin.id,
      providerId: 'credential',
      password: hashedPassword,
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create test user
  const testUserPassword = await bcrypt.hash('test123', 10);
  const testUser = await prisma.user.upsert({
    where: { email: 'test@macrochef.com' },
    update: {},
    create: {
      email: 'test@macrochef.com',
      emailVerified: true,
      username: 'testuser',
      name: 'Test User',
      isAdmin: false,
      role: 'user',
      isPublic: true,
      bio: 'Fitness enthusiast and meal prep lover',
    },
  });

  // Create account with password for test user
  await prisma.account.upsert({
    where: {
      providerId_accountId: {
        providerId: 'credential',
        accountId: testUser.id,
      },
    },
    update: {},
    create: {
      userId: testUser.id,
      accountId: testUser.id,
      providerId: 'credential',
      password: testUserPassword,
    },
  });
  console.log('✅ Created test user:', testUser.email);

  // Create sample ingredients
  const ingredients = [
    {
      name: 'Chicken Breast',
      description: 'Boneless, skinless chicken breast',
      servingSize: 100,
      servingUnit: 'g',
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      fiber: 0,
      verified: true,
    },
    {
      name: 'Brown Rice',
      description: 'Cooked brown rice',
      servingSize: 100,
      servingUnit: 'g',
      calories: 111,
      protein: 2.6,
      carbs: 23,
      fat: 0.9,
      fiber: 1.8,
      verified: true,
    },
    {
      name: 'Broccoli',
      description: 'Fresh broccoli florets',
      servingSize: 100,
      servingUnit: 'g',
      calories: 34,
      protein: 2.8,
      carbs: 7,
      fat: 0.4,
      fiber: 2.6,
      verified: true,
    },
    {
      name: 'Olive Oil',
      description: 'Extra virgin olive oil',
      servingSize: 15,
      servingUnit: 'ml',
      calories: 119,
      protein: 0,
      carbs: 0,
      fat: 13.5,
      fiber: 0,
      verified: true,
    },
    {
      name: 'Banana',
      description: 'Medium banana',
      servingSize: 118,
      servingUnit: 'g',
      calories: 105,
      protein: 1.3,
      carbs: 27,
      fat: 0.4,
      fiber: 3.1,
      verified: true,
    },
    {
      name: 'Eggs',
      description: 'Large whole egg',
      servingSize: 50,
      servingUnit: 'g',
      calories: 72,
      protein: 6.3,
      carbs: 0.4,
      fat: 4.8,
      fiber: 0,
      verified: true,
    },
    {
      name: 'Oats',
      description: 'Rolled oats',
      servingSize: 40,
      servingUnit: 'g',
      calories: 150,
      protein: 5.3,
      carbs: 27,
      fat: 2.8,
      fiber: 4,
      verified: true,
    },
    {
      name: 'Salmon',
      description: 'Atlantic salmon fillet',
      servingSize: 100,
      servingUnit: 'g',
      calories: 206,
      protein: 22,
      carbs: 0,
      fat: 12.4,
      fiber: 0,
      verified: true,
    },
  ];

  for (const ing of ingredients) {
    await prisma.ingredient.upsert({
      where: { id: `seed-${ing.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: ing,
      create: {
        ...ing,
        id: `seed-${ing.name.toLowerCase().replace(/\s+/g, '-')}`,
        createdBy: admin.id,
      },
    });
  }
  console.log('✅ Created', ingredients.length, 'sample ingredients');

  // Create sample achievements
  const achievements = [
    {
      name: 'First Recipe',
      description: 'Create your first recipe',
      category: 'recipes',
      points: 10,
      icon: '🍳',
      criteria: { type: 'recipe_count', value: 1 },
    },
    {
      name: 'Recipe Master',
      description: 'Create 10 recipes',
      category: 'recipes',
      points: 50,
      icon: '👨‍🍳',
      criteria: { type: 'recipe_count', value: 10 },
    },
    {
      name: 'First Workout',
      description: 'Log your first workout',
      category: 'fitness',
      points: 10,
      icon: '💪',
      criteria: { type: 'workout_count', value: 1 },
    },
    {
      name: 'Fitness Enthusiast',
      description: 'Log 30 workouts',
      category: 'fitness',
      points: 100,
      icon: '🏋️',
      criteria: { type: 'workout_count', value: 30 },
    },
    {
      name: 'Meal Planner',
      description: 'Plan your first week of meals',
      category: 'nutrition',
      points: 25,
      icon: '📅',
      criteria: { type: 'meal_plan_days', value: 7 },
    },
    {
      name: 'Social Butterfly',
      description: 'Get 10 followers',
      category: 'social',
      points: 30,
      icon: '🦋',
      criteria: { type: 'follower_count', value: 10 },
    },
    {
      name: 'Macro Tracker',
      description: 'Track your macros for 7 consecutive days',
      category: 'nutrition',
      points: 50,
      icon: '📊',
      criteria: { type: 'tracking_streak', value: 7 },
    },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { name: achievement.name },
      update: achievement,
      create: achievement,
    });
  }
  console.log('✅ Created', achievements.length, 'achievements');

  // Create a sample goal for test user
  await prisma.goal.create({
    data: {
      userId: testUser.id,
      name: 'Weight Loss Goal',
      calories: 2000,
      protein: 150,
      carbs: 200,
      fat: 67,
      fiber: 30,
      isActive: true,
    },
  });
  console.log('✅ Created sample goal for test user');

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
