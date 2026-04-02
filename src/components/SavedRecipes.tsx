import React, { useState, useEffect } from 'react';
import { Recipe } from '../types';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Heart, Trash2, ChevronRight, Flame, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  user: User;
}

export default function SavedRecipes({ user }: Props) {
  const [saved, setSaved] = useState<Recipe[]>([]);
  const [selected, setSelected] = useState<Recipe | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'savedRecipes'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSaved(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Recipe[]);
    });
    return () => unsubscribe();
  }, [user.uid]);

  const removeRecipe = async (id: string) => {
    if (confirm("Remove this recipe from your collection?")) {
      await deleteDoc(doc(db, 'savedRecipes', id));
      setSelected(null);
    }
  };

  if (saved.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-6">
        <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center text-stone-300">
          <Heart size={48} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-stone-900">Your collection is empty</h3>
          <p className="text-stone-500">Save recipes you love to find them here later.</p>
        </div>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="p-6 space-y-8 pb-32">
        <button onClick={() => setSelected(null)} className="text-stone-500 font-bold flex items-center gap-2">
          <ChevronRight className="rotate-180" /> Back
        </button>
        <h2 className="text-3xl font-bold text-stone-900">{selected.title}</h2>
        <div className="space-y-4">
          <h3 className="text-xl font-bold border-b pb-2">Instructions</h3>
          <div className="space-y-4">
            {selected.instructions.map((s, i) => (
              <div key={i} className="flex gap-3">
                <span className="font-bold text-orange-600">{i + 1}.</span>
                <p className="text-stone-700">{s}</p>
              </div>
            ))}
          </div>
        </div>
        <button 
          onClick={() => selected.id && removeRecipe(selected.id)}
          className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
        >
          <Trash2 size={20} /> Remove Recipe
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-stone-900">Saved Recipes</h2>
      <div className="grid grid-cols-1 gap-4">
        {saved.map((recipe) => (
          <div 
            key={recipe.id}
            onClick={() => setSelected(recipe)}
            className="bg-white border border-stone-200 rounded-2xl p-4 flex items-center justify-between shadow-sm"
          >
            <div>
              <h3 className="font-bold text-stone-900">{recipe.title}</h3>
              <div className="flex gap-3 text-xs text-stone-500 mt-1">
                <span className="flex items-center gap-1"><Flame size={12} /> {recipe.calories}</span>
                <span className="flex items-center gap-1"><Clock size={12} /> {recipe.time || '20m'}</span>
              </div>
            </div>
            <ChevronRight className="text-stone-300" />
          </div>
        ))}
      </div>
    </div>
  );
}
