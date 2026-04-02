import React, { useState, useEffect } from 'react';
import { Recipe } from '../types';
import { Flame, Clock, ChefHat, ChevronRight, Heart, Share2, Utensils } from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

interface Props {
  user: User;
}

export default function RecipeFeed({ user }: Props) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    const lastRecipes = localStorage.getItem('last_recipes');
    const lastIngredients = localStorage.getItem('last_ingredients');
    if (lastRecipes) setRecipes(JSON.parse(lastRecipes));
    if (lastIngredients) setIngredients(JSON.parse(lastIngredients));
  }, []);

  const saveRecipe = async (recipe: Recipe) => {
    try {
      await addDoc(collection(db, 'savedRecipes'), {
        ...recipe,
        userId: user.uid,
        timestamp: new Date().toISOString()
      });
      alert("Recipe saved to your collection!");
    } catch (error) {
      console.error("Error saving recipe:", error);
    }
  };

  if (recipes.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-6">
        <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center text-stone-300">
          <Utensils size={48} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-stone-900">No recipes yet</h3>
          <p className="text-stone-500">Scan your fridge first to get personalized recipe ideas.</p>
        </div>
      </div>
    );
  }

  if (selectedRecipe) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 space-y-8 pb-32"
      >
        <button 
          onClick={() => setSelectedRecipe(null)}
          className="text-stone-500 font-bold flex items-center gap-2 mb-4"
        >
          <ChevronRight className="rotate-180" /> Back to ideas
        </button>

        <div className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight text-stone-900">{selectedRecipe.title}</h2>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-3 py-1 rounded-full text-sm font-bold">
              <Flame size={16} /> {selectedRecipe.calories} kcal
            </div>
            <div className="flex items-center gap-1.5 text-stone-600 bg-stone-100 px-3 py-1 rounded-full text-sm font-bold">
              <Clock size={16} /> {selectedRecipe.time || '20m'}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-stone-900 border-b border-stone-200 pb-2">Ingredients</h3>
          <ul className="space-y-2">
            {selectedRecipe.ingredients.map((ing, i) => (
              <li key={i} className="flex items-center gap-3 text-stone-700">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                {ing}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold text-stone-900 border-b border-stone-200 pb-2">Instructions</h3>
          <div className="space-y-6">
            {selectedRecipe.instructions.map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-stone-900 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {i + 1}
                </div>
                <p className="text-stone-700 leading-relaxed pt-1">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="fixed bottom-24 left-6 right-6 flex gap-3">
          <button 
            onClick={() => saveRecipe(selectedRecipe)}
            className="flex-1 bg-orange-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
          >
            <Heart size={20} /> Save Recipe
          </button>
          <button className="p-4 bg-stone-100 text-stone-600 rounded-2xl">
            <Share2 size={20} />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-stone-900">Recipe Ideas</h2>
        <p className="text-stone-500 text-sm">Based on {ingredients.length} ingredients found in your fridge.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {ingredients.map((ing, i) => (
          <span key={i} className="bg-stone-100 text-stone-600 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
            {ing}
          </span>
        ))}
      </div>

      <div className="space-y-6">
        {recipes.map((recipe, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => setSelectedRecipe(recipe)}
            className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-stone-900 group-hover:text-orange-600 transition-colors">{recipe.title}</h3>
                <div className="bg-orange-50 text-orange-600 px-2 py-1 rounded-lg text-[10px] font-black uppercase">
                  {recipe.difficulty || 'Easy'}
                </div>
              </div>
              
              <div className="flex gap-4 text-xs font-bold text-stone-500">
                <span className="flex items-center gap-1"><Flame size={14} className="text-orange-500" /> {recipe.calories} kcal</span>
                <span className="flex items-center gap-1"><Clock size={14} /> {recipe.time || '20m'}</span>
                <span className="flex items-center gap-1"><ChefHat size={14} /> {recipe.ingredients.length} items</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
