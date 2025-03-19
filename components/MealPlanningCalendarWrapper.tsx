'use client';

import { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import MealPlanningCalendar from './MealPlanningCalendar';
import { PerDayMealsAggregate } from '@/types/meal';

type PlannedMealType = {
  _id: string;
  date: Date;
  recipes: {
    recipe: {
      _id: string;
      name: string;
    };
    servings: number;
    mealTime: string;
  }[];
  totalCalories: number;
};

interface MealPlanningCalendarWrapperProps {
  initialMeals: PerDayMealsAggregate[];
  initialPlannedMeals: PlannedMealType[];
}

export default function MealPlanningCalendarWrapper({ 
  initialMeals, 
  initialPlannedMeals 
}: MealPlanningCalendarWrapperProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(currentDate, { weekStartsOn: 1 }));
  const [weekEnd, setWeekEnd] = useState(endOfWeek(currentDate, { weekStartsOn: 1 }));
  const [plannedMeals, setPlannedMeals] = useState<PlannedMealType[]>(initialPlannedMeals);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load meal plans for the selected week
  useEffect(() => {
    const fetchWeeklyMealPlans = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const response = await fetch(`/api/meal-plan/get-weekly?date=${dateStr}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch weekly meal plans');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setPlannedMeals(data.mealPlans.map((plan: any) => ({
            ...plan,
            date: new Date(plan.date)
          })));
        } else {
          throw new Error(data.error || 'Unknown error');
        }
      } catch (err: any) {
        console.error('Error fetching weekly meal plans:', err);
        setError(err.message || 'Failed to load meal plans');
      } finally {
        setLoading(false);
      }
    };
    
    // Don't fetch on initial render (we already have the data from SSR)
    if (format(weekStart, 'yyyy-MM-dd') !== format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')) {
      fetchWeeklyMealPlans();
    }
  }, [currentDate, weekStart]);

  // Handle week navigation
  const handleWeekChange = (newDate: Date) => {
    setCurrentDate(newDate);
    setWeekStart(startOfWeek(newDate, { weekStartsOn: 1 }));
    setWeekEnd(endOfWeek(newDate, { weekStartsOn: 1 }));
  };

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
          <div className="bg-white p-4 rounded-lg shadow text-gray-700">
            Loading meal plans...
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <MealPlanningCalendar
        perDayMeals={initialMeals}
        plannedMeals={plannedMeals}
        onWeekChange={handleWeekChange}
      />
    </div>
  );
} 