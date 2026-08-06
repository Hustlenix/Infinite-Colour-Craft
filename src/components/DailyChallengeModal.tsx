import React, { useState, useEffect } from 'react';
import { DailyChallenge, DailyChallengeState, QuestReward } from '../types';
import { 
  calculateTimeRemainingUntilMidnight, 
  getTodayDateString 
} from '../utils/dailyChallengeEngine';
import { 
  Calendar, 
  Flame, 
  Gift, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  HelpCircle, 
  Award,
  Zap,
  ArrowRight
} from 'lucide-react';

interface DailyChallengeModalProps {
  challenge: DailyChallenge;
  dailyState: DailyChallengeState;
  onClaimReward: (reward: QuestReward) => void;
  onNavigateToBoard: () => void;
  isDarkMode?: boolean;
}

export const DailyChallengeModal: React.FC<DailyChallengeModalProps> = ({
  challenge,
  dailyState,
  onClaimReward,
  onNavigateToBoard,
  isDarkMode = false,
}) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeRemainingUntilMidnight());
  const [showHint, setShowHint] = useState(false);

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeRemainingUntilMidnight());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isCompleted = dailyState.progress >= challenge.requiredAmount || dailyState.completed;
  const isClaimed = dailyState.claimed;
  const progressPercent = Math.min(100, Math.round((dailyState.progress / challenge.requiredAmount) * 100));

  return (
    <div className={`flex-1 h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] p-4 md:p-8 overflow-y-auto custom-scrollbar transition-colors duration-300 ${
      isDarkMode ? 'bg-slate-950 text-white' : 'bg-[#F3F3EF] text-black'
    }`}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Top Header & Streak Banner */}
        <div className={`border-2 p-6 shadow-[6px_6px_0px_0px_#000] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          isDarkMode ? 'bg-slate-900 border-slate-700 shadow-[6px_6px_0px_0px_#1E293B]' : 'bg-white border-black shadow-[6px_6px_0px_0px_#000]'
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className={`w-7 h-7 ${isDarkMode ? 'text-white' : 'text-black'}`} />
              <h2 className={`text-2xl md:text-3xl font-black uppercase italic tracking-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Daily Color Challenge
              </h2>
            </div>
            <p className={`text-xs font-black uppercase font-mono ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              📅 {challenge.dateFormatted} • A fresh challenge every midnight!
            </p>
          </div>

          {/* Streak Badge & Timer */}
          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
            {/* Streak Box */}
            <div className="flex-1 md:flex-initial bg-yellow-300 border-2 border-black p-3 shadow-[3px_3px_0px_0px_#000] flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-600 fill-orange-500 animate-bounce" />
              <div>
                <p className="text-[9px] font-black uppercase text-black">Current Streak</p>
                <p className="text-lg font-black font-mono text-black">{dailyState.streak} Days</p>
              </div>
            </div>

            {/* Countdown Box */}
            <div className="flex-1 md:flex-initial bg-black text-white border-2 border-black p-3 shadow-[3px_3px_0px_0px_#000] flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-300" />
              <div>
                <p className="text-[9px] font-black uppercase text-slate-400">Resets In</p>
                <p className="text-sm font-black font-mono text-yellow-300 tracking-wider">
                  {timeLeft.formatted}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Challenge Main Card */}
        <div className="bg-white border-2 border-black p-6 shadow-[6px_6px_0px_0px_#000] space-y-6">
          <div className="flex items-start justify-between gap-4 border-b-2 border-black pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-yellow-300 border border-black text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_#000]">
                <Zap className="w-3 h-3 text-black" />
                <span>Today's Goal</span>
              </div>
              <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black">
                {challenge.title}
              </h3>
              <p className="text-sm font-bold text-slate-700">
                {challenge.description}
              </p>
            </div>

            {/* Completion Stamp */}
            {isCompleted && (
              <div className="shrink-0 px-3 py-1 bg-emerald-400 border-2 border-black font-black text-xs uppercase flex items-center gap-1 shadow-[2px_2px_0px_0px_#000] text-black animate-pulse">
                <CheckCircle2 className="w-4 h-4" />
                <span>GOAL MET!</span>
              </div>
            )}
          </div>

          {/* Progress Tracker */}
          <div className="space-y-2 bg-[#FAFAFA] p-4 border-2 border-black shadow-[3px_3px_0px_0px_#000]">
            <div className="flex items-center justify-between text-xs font-mono font-black uppercase text-black">
              <span className="flex items-center gap-1">
                <Award className="w-4 h-4 text-black" />
                <span>Synthesis Progress</span>
              </span>
              <span>
                {dailyState.progress} / {challenge.requiredAmount} ({progressPercent}%)
              </span>
            </div>

            <div className="w-full bg-white h-6 border-2 border-black shadow-[2px_2px_0px_0px_#000] p-0.5 overflow-hidden">
              <div
                className="h-full bg-yellow-400 border-r-2 border-black transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Hint Dropdown Toggle */}
            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => setShowHint(!showHint)}
                className="inline-flex items-center gap-1 text-xs font-black uppercase text-slate-700 hover:text-black underline"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showHint ? 'Hide Alchemy Hint' : 'Need an Alchemy Hint?'}</span>
              </button>

              {!isCompleted && (
                <button
                  onClick={onNavigateToBoard}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-300 hover:bg-yellow-400 border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                >
                  <span>Go Craft On Board</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {showHint && (
              <div className="mt-2 p-3 bg-yellow-100 border-2 border-black text-xs font-bold text-black shadow-[2px_2px_0px_0px_#000]">
                💡 <span className="underline">Hint:</span> {challenge.hint}
              </div>
            )}
          </div>

          {/* Exclusive Reward Card */}
          <div className="border-2 border-black bg-gradient-to-br from-yellow-50 via-white to-amber-50 p-6 shadow-[5px_5px_0px_0px_#000] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="w-6 h-6 text-black" />
                <h4 className="font-black text-lg uppercase tracking-tight text-black">
                  Exclusive Daily Reward
                </h4>
              </div>
              <span className="text-[10px] font-black uppercase bg-black text-white px-2 py-0.5 border border-black font-mono">
                📅 Daily Rare Pigment
              </span>
            </div>

            {/* Reward Swatch Display */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 border-2 border-black shadow-[3px_3px_0px_0px_#000]">
              <div
                className="w-16 h-16 border-2 border-black shadow-[3px_3px_0px_0px_#000] flex items-center justify-center text-2xl shrink-0"
                style={{ backgroundColor: challenge.rewardPigment.hex }}
              >
                <span className="drop-shadow-md">{challenge.rewardPigment.emoji}</span>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h5 className="font-black text-base uppercase text-black">
                    {challenge.rewardPigment.pigmentName}
                  </h5>
                  <span className="text-[10px] font-mono font-black uppercase bg-yellow-300 border border-black px-1.5 py-0.5">
                    {challenge.rewardPigment.rarity}
                  </span>
                  <span className="text-[10px] font-mono font-black uppercase bg-slate-100 border border-black px-1.5 py-0.5">
                    {challenge.rewardPigment.hex}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-700">
                  {challenge.rewardPigment.description}
                </p>
              </div>

              {/* Action Button */}
              <div className="w-full sm:w-auto shrink-0">
                {isClaimed ? (
                  <div className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-black text-white border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0px_0px_#000] w-full sm:w-auto">
                    <CheckCircle2 className="w-4 h-4 text-yellow-300" />
                    <span>CLAIMED TODAY</span>
                  </div>
                ) : isCompleted ? (
                  <button
                    onClick={() => onClaimReward(challenge.rewardPigment)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-yellow-300 hover:bg-yellow-400 border-2 border-black text-black font-black uppercase text-xs shadow-[4px_4px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none animate-bounce transition-all"
                  >
                    <Sparkles className="w-4 h-4 fill-black" />
                    <span>CLAIM EXCLUSIVE PIGMENT</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-4 py-2 bg-slate-200 border-2 border-black text-slate-500 font-black uppercase text-xs opacity-80 cursor-not-allowed"
                  >
                    <span>LOCKED UNTIL COMPLETE</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Information & Streak Rule Footer */}
        <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_#000] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-slate-700">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <span>Complete challenges daily to keep your flame streak burning!</span>
          </div>
          <span className="font-mono text-[10px] uppercase text-slate-500">
            Next challenge unlocks in {timeLeft.formatted}
          </span>
        </div>

      </div>
    </div>
  );
};
