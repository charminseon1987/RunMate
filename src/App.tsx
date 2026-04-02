/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  User,
  signOut
} from 'firebase/auth';
import { 
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { 
  Activity, 
  Camera, 
  ChefHat, 
  Home, 
  User as UserIcon, 
  LogOut,
  Sparkles,
  UtensilsCrossed,
  MessageSquare,
  Plus,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { UserProfile } from './types';

// Components
import CommunityFeed from './components/CommunityFeed';
import RunTracker from './components/RunTracker';
import RunHistory from './components/RunHistory';
import FridgeScanner from './components/FridgeScanner';
import RecipeFeed from './components/RecipeFeed';
import SavedRecipes from './components/SavedRecipes';
import ProfileView from './components/ProfileView';

type Tab = 'feed' | 'track' | 'history' | 'kitchen' | 'recipes' | 'saved' | 'profile';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('feed');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const profileDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (profileDoc.exists()) {
          setProfile(profileDoc.data() as UserProfile);
        } else {
          const newProfile: UserProfile = {
            uid: currentUser.uid,
            displayName: currentUser.displayName || 'Runner',
            photoURL: currentUser.photoURL || '',
            skillLevel: 'beginner',
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'users', currentUser.uid), newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-orange-500 font-bold text-2xl tracking-tighter"
        >
          RUNMATE & CHEF
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 p-6 text-center">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <div className="w-24 h-24 bg-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Activity className="text-white w-12 h-12" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-3">RunMate & Chef</h1>
          <p className="text-zinc-400 max-w-xs mx-auto text-lg">
            The ultimate lifestyle app: Track your runs and scan your fridge.
          </p>
        </motion.div>
        
        <button 
          onClick={handleLogin}
          className="bg-white text-black px-10 py-4 rounded-2xl font-semibold flex items-center gap-3 hover:bg-zinc-200 transition-all shadow-lg active:scale-95"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          Get Started with Google
        </button>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'feed': return <CommunityFeed user={user} profile={profile} />;
      case 'track': return <RunTracker user={user} />;
      case 'history': return <RunHistory user={user} />;
      case 'kitchen': return <FridgeScanner user={user} onRecipesFound={() => setActiveTab('recipes')} />;
      case 'recipes': return <RecipeFeed user={user} />;
      case 'saved': return <SavedRecipes user={user} />;
      case 'profile': return <ProfileView user={user} profile={profile} onLogout={handleLogout} />;
      default: return <CommunityFeed user={user} profile={profile} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Activity className="text-orange-500 w-7 h-7" />
          <span className="font-bold text-xl tracking-tight">RunMate & Chef</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-zinc-800">
            <img src={user.photoURL || ''} alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-900 px-4 py-4 flex justify-around items-center z-50">
        <NavButton 
          active={activeTab === 'feed'} 
          onClick={() => setActiveTab('feed')} 
          icon={<Home className="w-5 h-5" />} 
          label="Feed" 
        />
        <NavButton 
          active={activeTab === 'kitchen'} 
          onClick={() => setActiveTab('kitchen')} 
          icon={<ChefHat className="w-5 h-5" />} 
          label="Kitchen" 
        />
        <NavButton 
          active={activeTab === 'history'} 
          onClick={() => setActiveTab('history')} 
          icon={<History className="w-5 h-5" />} 
          label="History" 
        />
        <div className="relative -top-6">
          <button 
            onClick={() => setActiveTab('track')}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90",
              activeTab === 'track' ? "bg-white text-black" : "bg-orange-500 text-white"
            )}
          >
            <Plus className="w-8 h-8" />
          </button>
        </div>
        <NavButton 
          active={activeTab === 'saved'} 
          onClick={() => setActiveTab('saved')} 
          icon={<UtensilsCrossed className="w-5 h-5" />} 
          label="Recipes" 
        />
        <NavButton 
          active={activeTab === 'profile'} 
          onClick={() => setActiveTab('profile')} 
          icon={<UserIcon className="w-5 h-5" />} 
          label="Me" 
        />
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all",
        active ? "text-orange-500" : "text-zinc-500 hover:text-zinc-300"
      )}
    >
      <div className={cn("p-1 rounded-xl transition-all", active && "bg-orange-500/10")}>
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}
