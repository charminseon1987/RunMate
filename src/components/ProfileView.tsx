import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { LogOut, ChefHat, Activity, Heart, Award, TrendingUp, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface Props {
  user: User;
  profile: UserProfile | null;
  onLogout: () => void;
}

export default function ProfileView({ user, profile, onLogout }: Props) {
  const [savedCount, setSavedCount] = useState(0);
  const [runCount, setRunCount] = useState(0);
  const [totalKm, setTotalKm] = useState(0);

  useEffect(() => {
    const qRecipes = query(collection(db, 'savedRecipes'), where('userId', '==', user.uid));
    const unsubRecipes = onSnapshot(qRecipes, (snapshot) => setSavedCount(snapshot.size));

    const qRuns = query(collection(db, 'runs'), where('userId', '==', user.uid));
    const unsubRuns = onSnapshot(qRuns, (snapshot) => {
      setRunCount(snapshot.size);
      const km = snapshot.docs.reduce((acc, doc) => acc + (doc.data().distance || 0), 0);
      setTotalKm(parseFloat(km.toFixed(1)));
    });

    return () => { unsubRecipes(); unsubRuns(); };
  }, [user.uid]);

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-3xl overflow-hidden border-4 border-zinc-800 shadow-xl">
            <img src={user.photoURL || ''} className="w-full h-full object-cover" alt="Me" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{profile?.displayName}</h2>
            <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">{profile?.skillLevel} Runner</p>
          </div>
        </div>
        <button onClick={onLogout} className="p-3 bg-zinc-900 rounded-2xl text-zinc-500 hover:text-red-500 transition-all">
          <LogOut size={20} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-1">
          <div className="text-orange-500 font-black text-3xl">{totalKm}</div>
          <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Total KM</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-1">
          <div className="text-white font-black text-3xl">{savedCount}</div>
          <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Saved Recipes</div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-white">Achievements</h3>
        <div className="grid grid-cols-4 gap-4">
          <Badge icon={<Activity size={24} />} label="Runner" active />
          <Badge icon={<ChefHat size={24} />} label="Cook" active />
          <Badge icon={<Heart size={24} />} label="Healthy" />
          <Badge icon={<Award size={24} />} label="Pro" />
        </div>
      </div>

      <div className="bg-orange-500 text-white p-6 rounded-[2rem] shadow-2xl shadow-orange-500/20 space-y-4">
        <h3 className="text-xl font-bold">Daily Goal</h3>
        <p className="text-orange-100 text-sm">Run 5km and cook one healthy meal today!</p>
        <div className="w-full bg-orange-600 h-2 rounded-full overflow-hidden">
          <div className="bg-white w-1/2 h-full" />
        </div>
      </div>
    </div>
  );
}

function Badge({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
        active ? "bg-orange-500 text-white shadow-lg" : "bg-zinc-900 text-zinc-700 border border-zinc-800"
      )}>
        {icon}
      </div>
      <span className={cn("text-[10px] font-bold text-center leading-tight", active ? "text-white" : "text-zinc-600")}>
        {label}
      </span>
    </div>
  );
}
