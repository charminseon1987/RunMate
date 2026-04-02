import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from 'firebase/auth';
import { RunRecord } from '../types';
import { Calendar, ArrowUpDown, MapPin, Clock, Zap, X, ChevronRight, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  user: User;
}

type SortKey = 'timestamp' | 'distance';
type SortOrder = 'asc' | 'desc';

export default function RunHistory({ user }: Props) {
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedRun, setSelectedRun] = useState<RunRecord | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'runs'),
      where('userId', '==', user.uid),
      orderBy(sortKey, sortOrder)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const runsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RunRecord[];
      setRuns(runsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid, sortKey, sortOrder]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Run History</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => toggleSort('timestamp')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all",
              sortKey === 'timestamp' ? "bg-orange-500 text-white" : "bg-zinc-900 text-zinc-400"
            )}
          >
            <Calendar size={14} />
            Date {sortKey === 'timestamp' && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
          <button 
            onClick={() => toggleSort('distance')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all",
              sortKey === 'distance' ? "bg-orange-500 text-white" : "bg-zinc-900 text-zinc-400"
            )}
          >
            <ArrowUpDown size={14} />
            Distance {sortKey === 'distance' && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      ) : runs.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/50 rounded-[2rem] border border-dashed border-zinc-800">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="text-zinc-600 w-8 h-8" />
          </div>
          <h3 className="text-zinc-400 font-medium">No runs recorded yet</h3>
          <p className="text-zinc-600 text-sm mt-1">Start your first run to see it here!</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {runs.map((run) => (
              <motion.div
                key={run.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setSelectedRun(run)}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 hover:border-orange-500/50 transition-all group cursor-pointer active:scale-[0.98]"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                      <Zap className="text-orange-500 w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-white">
                        {format(new Date(run.timestamp), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {format(new Date(run.timestamp), 'h:mm a')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div className="text-2xl font-black text-white leading-none">
                      {run.distance}<span className="text-xs text-orange-500 ml-1">KM</span>
                    </div>
                    <ChevronRight className="text-zinc-700 group-hover:text-orange-500 transition-colors" size={20} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800/50">
                  <div className="flex items-center gap-2">
                    <Clock className="text-zinc-500 w-4 h-4" />
                    <div className="text-sm">
                      <span className="text-zinc-500 text-[10px] uppercase block font-bold tracking-wider">Duration</span>
                      <span className="font-bold text-zinc-200">{formatDuration(run.duration)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="text-zinc-500 w-4 h-4" />
                    <div className="text-sm">
                      <span className="text-zinc-500 text-[10px] uppercase block font-bold tracking-wider">Avg Pace</span>
                      <span className="font-bold text-zinc-200">{run.pace} /km</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedRun && (
          <RunDetailModal 
            run={selectedRun} 
            onClose={() => setSelectedRun(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function RunDetailModal({ run, onClose }: { run: RunRecord, onClose: () => void }) {
  // Generate simulated pace variation data
  const paceSeconds = (p: string) => {
    const [m, s] = p.split(':').map(Number);
    return m * 60 + s;
  };

  const avgPaceSec = paceSeconds(run.pace);
  const chartData = Array.from({ length: Math.max(3, Math.ceil(run.distance)) }).map((_, i) => {
    const variation = (Math.random() - 0.5) * 40; // +/- 20 seconds variation
    const pace = avgPaceSec + variation;
    const mins = Math.floor(pace / 60);
    const secs = Math.floor(pace % 60);
    return {
      km: `KM ${i + 1}`,
      pace: pace / 60, // for chart axis
      label: `${mins}:${secs.toString().padStart(2, '0')}`
    };
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col"
    >
      <div className="p-6 flex items-center justify-between border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
            <Zap className="text-white w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Run Details</h3>
            <p className="text-xs text-zinc-500">{format(new Date(run.timestamp), 'MMMM d, yyyy • h:mm a')}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Map Placeholder */}
        <div className="bg-zinc-900 rounded-[2.5rem] h-64 relative overflow-hidden border border-zinc-800">
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.svg 
              width="80%" 
              height="60%" 
              viewBox="0 0 200 100"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            >
              <path 
                d="M20,50 Q40,20 60,50 T100,80 T140,50 T180,20" 
                fill="none" 
                stroke="#f97316" 
                strokeWidth="4" 
                strokeLinecap="round"
              />
              <circle cx="20" cy="50" r="6" fill="#22c55e" />
              <circle cx="180" cy="20" r="6" fill="#ef4444" />
            </motion.svg>
          </div>
          <div className="absolute bottom-4 left-6 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
            <MapPin size={12} className="text-orange-500" /> Seoul, South Korea
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <DetailStat label="Distance" value={`${run.distance} km`} icon={<MapPin size={14} />} />
          <DetailStat label="Duration" value={Math.floor(run.duration / 60) + 'm'} icon={<Clock size={14} />} />
          <DetailStat label="Avg Pace" value={run.pace} icon={<Zap size={14} />} />
        </div>

        {/* Pace Chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="font-bold flex items-center gap-2">
              <TrendingUp size={18} className="text-orange-500" /> Pace Variation
            </h4>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">min/km</span>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                <XAxis 
                  dataKey="km" 
                  stroke="#52525b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  hide 
                  domain={['dataMin - 0.5', 'dataMax + 0.5']} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                  labelStyle={{ color: '#f97316', fontWeight: 'bold' }}
                  formatter={(value: any, name: any, props: any) => [props.payload.label, 'Pace']}
                />
                <Line 
                  type="monotone" 
                  dataKey="pace" 
                  stroke="#f97316" 
                  strokeWidth={3} 
                  dot={{ fill: '#f97316', r: 4 }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Splits List */}
        <div className="space-y-4">
          <h4 className="font-bold px-2">Split Breakdown</h4>
          <div className="space-y-2">
            {chartData.map((split, i) => (
              <div key={i} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-zinc-500 font-bold text-xs w-8">{i + 1}</span>
                  <div className="h-1 flex-1 w-32 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500" 
                      style={{ width: `${Math.max(30, 100 - (split.pace - 4) * 20)}%` }} 
                    />
                  </div>
                </div>
                <span className="font-mono font-bold text-sm">{split.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function DetailStat({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-1">
      <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5">
        {icon} {label}
      </div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  );
}
