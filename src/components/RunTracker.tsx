import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Play, Square, Timer, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  user: User;
}

export default function RunTracker({ user }: Props) {
  const [isTracking, setIsTracking] = useState(false);
  const [distance, setDistance] = useState(0);
  const [time, setTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  const startTracking = () => {
    setIsTracking(true);
    const interval = setInterval(() => {
      setTime(prev => prev + 1);
      setDistance(prev => prev + 0.002);
    }, 1000);
    setTimerInterval(interval);
  };

  const stopTracking = async () => {
    if (timerInterval) clearInterval(timerInterval);
    setIsTracking(false);
    try {
      await addDoc(collection(db, 'runs'), {
        userId: user.uid,
        distance: parseFloat(distance.toFixed(2)),
        duration: time,
        pace: calculatePace(distance, time),
        timestamp: new Date().toISOString()
      });
      setDistance(0);
      setTime(0);
    } catch (error) {
      console.error("Error saving run:", error);
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculatePace = (dist: number, t: number) => {
    if (dist === 0) return "0:00";
    const paceMins = (t / 60) / dist;
    const mins = Math.floor(paceMins);
    const secs = Math.floor((paceMins - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col p-6 items-center justify-center space-y-12">
      <div className="text-center">
        <div className="text-zinc-500 text-xs uppercase tracking-widest mb-2 font-bold">Distance</div>
        <div className="text-8xl font-black tracking-tighter text-white">
          {distance.toFixed(2)}<span className="text-2xl text-orange-500 ml-2">KM</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-12 w-full max-w-xs">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-zinc-500 text-[10px] uppercase tracking-widest mb-1 font-bold">
            <Timer className="w-3 h-3" /> Time
          </div>
          <div className="text-3xl font-bold">{formatTime(time)}</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-zinc-500 text-[10px] uppercase tracking-widest mb-1 font-bold">
            <Zap className="w-3 h-3" /> Pace
          </div>
          <div className="text-3xl font-bold">{calculatePace(distance, time)}</div>
        </div>
      </div>

      <div className="pt-12">
        {!isTracking ? (
          <button onClick={startTracking} className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all">
            <Play className="w-10 h-10 text-white fill-current" />
          </button>
        ) : (
          <button onClick={stopTracking} className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all">
            <Square className="w-10 h-10 text-black fill-current" />
          </button>
        )}
      </div>
    </div>
  );
}
