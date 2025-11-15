import { Prisma } from '@prisma/client';

// User with relations
export type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    goals: true;
    _count: {
      select: {
        recipes: true;
        followers: true;
        following: true;
        achievements: true;
      };
    };
  };
}>;

// Recipe with all relations
export type RecipeWithRelations = Prisma.RecipeGetPayload<{
  include: {
    creator: {
      select: {
        id: true;
        name: true;
        username: true;
        image: true;
      };
    };
    ingredients: {
      include: {
        ingredient: true;
      };
    };
    subRecipes: {
      include: {
        subRecipe: {
          select: {
            id: true;
            name: true;
            images: true;
            calories: true;
            protein: true;
            carbs: true;
            fat: true;
            fiber: true;
          };
        };
      };
    };
    _count: {
      select: {
        likes: true;
        comments: true;
      };
    };
  };
}>;

// Recipe with detailed comments
export type RecipeWithComments = Prisma.RecipeGetPayload<{
  include: {
    creator: {
      select: {
        id: true;
        name: true;
        username: true;
        image: true;
      };
    };
    comments: {
      include: {
        user: {
          select: {
            id: true;
            name: true;
            username: true;
            image: true;
          };
        };
      };
      orderBy: {
        createdAt: 'desc';
      };
    };
    ingredients: {
      include: {
        ingredient: true;
      };
    };
    _count: {
      select: {
        likes: true;
      };
    };
  };
}>;

// Meal plan with recipes
export type MealPlanWithRecipes = Prisma.MealPlanGetPayload<{
  include: {
    recipes: {
      include: {
        recipe: {
          include: {
            creator: {
              select: {
                id: true;
                name: true;
                username: true;
              };
            };
          };
        };
      };
    };
  };
}>;

// Workout with exercises
export type WorkoutWithExercises = Prisma.WorkoutGetPayload<{
  include: {
    exercises: true;
  };
}>;

// Activity feed item
export type ActivityWithUser = Prisma.ActivityGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        name: true;
        username: true;
        image: true;
      };
    };
  };
}>;

// Collection with recipes
export type CollectionWithRecipes = Prisma.CollectionGetPayload<{
  include: {
    recipes: {
      include: {
        recipe: {
          select: {
            id: true;
            name: true;
            images: true;
            description: true;
            calories: true;
            protein: true;
            carbs: true;
            fat: true;
            fiber: true;
          };
        };
      };
      orderBy: {
        order: 'asc';
      };
    };
    _count: {
      select: {
        recipes: true;
      };
    };
  };
}>;

// Macros type
export type Macros = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

// Achievement progress
export type AchievementProgress = {
  achievement: Prisma.AchievementGetPayload<{}>;
  isUnlocked: boolean;
  progress?: number;
  total?: number;
};

// API Response types
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// Pagination
export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
};

// Form states
export type FormState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};
