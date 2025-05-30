'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Loading from '@/components/Loading';
import placeHolderImage from '@/public/placeholder-recipe.jpg';
import type Recipe from '@/types/recipe';

export default function RecipeSuggestions() {
  const [suggestions, setSuggestions] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSuggestions() {
      try {
        setLoading(true);
        const response = await fetch('/api/recipes/suggestion');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch suggestions: ${response.status}`);
        }
        
        const data = await response.json();
        setSuggestions(data);
      } catch (err) {
        console.error('Error fetching recipe suggestions:', err);
        setError('Failed to load recipe suggestions. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchSuggestions();
  }, []);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Suggested for You</h2>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loading />
        </div>
      ) : suggestions.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <h3 className="text-xl font-semibold mb-4">No Suggestions Available</h3>
          <p className="text-gray-600">
            Add more meals or update your preferences to get personalized recipe suggestions.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {suggestions.map((recipe) => (
            <Link
              key={recipe._id.toString()}
              href={`/recipes/${recipe._id}`}
              className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex">
                <div className="w-48 h-48 bg-gray-200 rounded-l-lg relative">
                  <Image
                    src={recipe.images[0] || placeHolderImage}
                    alt={recipe.name}
                    fill
                    className="object-cover rounded-l-lg"
                  />
                </div>
                <div className="flex-1 p-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{recipe.name}</h3>
                    <p className="text-gray-600 mb-4">
                      {recipe.description || `A delicious recipe with ${recipe.ingredients.length} ingredients`}
                    </p>
                  </div>
                  <div className="flex gap-6">
                    <div>
                      <span className="text-gray-500 text-sm">Calories</span>
                      <p className="font-semibold">
                        {recipe.totalMacros.calories.toFixed(0)} kcal
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-sm">Protein</span>
                      <p className="font-semibold">
                        {recipe.totalMacros.protein.toFixed(1)}g
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-sm">Carbs</span>
                      <p className="font-semibold">
                        {recipe.totalMacros.carbs.toFixed(1)}g
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-sm">Fat</span>
                      <p className="font-semibold">
                        {recipe.totalMacros.fat.toFixed(1)}g
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
