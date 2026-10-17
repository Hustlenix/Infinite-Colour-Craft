import React from 'react';
import { Quest, ColorItem } from '../types';
import {QUESTS,evaluateQuest,type CraftedCollection} from '../utils/quests';
import { 
  Award, 
  CheckCircle2, 
  Sparkles, 
  Flame, 
  Trophy, 
  Zap, 
  Star,
  Gift,
  Check
} from 'lucide-react';

interface QuestsModalProps {
  unlockedColors: ColorItem[];
  claimedQuestIds: string[];
  onClaimReward: (quest: Quest) => void;
  isDarkMode?: boolean;
  crafted:CraftedCollection;
}

export const QuestsModal: React.FC<QuestsModalProps> = ({ 
  unlockedColors, 
  claimedQuestIds, 
  onClaimReward,
  isDarkMode = false,crafted,
}) => {
  const quests:Quest[]=QUESTS.map(q=>{const p=evaluateQuest(q,crafted);return {id:q.id,title:q.title,description:q.description,targetType:q.kind==='category'?'category':'count',targetValue:q.value||q.required,requiredAmount:q.required,currentAmount:p.amount,completed:p.complete,rewardBadge:'✦ '+q.title,rewardPigment:q.reward,claimed:claimedQuestIds.includes(q.id)};});

  const completedCount = quests.filter((q) => q.completed).length;
  const totalQuests = quests.length;
  const overallPercent = Math.round((completedCount / totalQuests) * 100);

  return (
    <div className={`flex-1 h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] p-4 md:p-8 overflow-y-auto custom-scrollbar transition-colors duration-300 ${
      isDarkMode ? 'bg-slate-950 text-white' : 'bg-[#F3F3EF] text-black'
    }`}>
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header with Stats */}
        <div className={`border-b-4 pb-6 p-6 border-2 shadow-[6px_6px_0px_0px_#000] space-y-4 ${
          isDarkMode ? 'bg-slate-900 border-slate-700 shadow-[6px_6px_0px_0px_#1E293B]' : 'bg-white border-black shadow-[6px_6px_0px_0px_#000]'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Trophy className={`w-7 h-7 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                <h2 className={`text-2xl md:text-3xl font-black uppercase italic tracking-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Alchemy Quests & Rewards
                </h2>
              </div>
              <p className={`text-xs font-black uppercase ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Complete milestones to earn bonus pigments and badges!
              </p>
            </div>

            <div className="flex items-center gap-2 bg-yellow-300 border-2 border-black p-3 shadow-[3px_3px_0px_0px_#000] shrink-0 text-black">
              <Award className="w-6 h-6 text-black" />
              <div>
                <p className="text-[10px] font-black uppercase text-black">Overall Progress</p>
                <p className="text-lg font-black font-mono text-black">
                  {completedCount} / {totalQuests} ({overallPercent}%)
                </p>
              </div>
            </div>
          </div>

          {/* Master Progress Bar */}
          <div className="space-y-1 pt-2">
            <div className={`flex justify-between text-xs font-black uppercase font-mono ${isDarkMode ? 'text-white' : 'text-black'}`}>
              <span>Overall Achievement Mastery</span>
              <span>{overallPercent}% Completed</span>
            </div>
            <div className={`w-full h-5 border-2 border-black shadow-[2px_2px_0px_0px_#000] overflow-hidden ${
              isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
            }`}>
              <div
                className="h-full bg-yellow-400 border-r-2 border-black transition-all duration-500"
                style={{ width: `${overallPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quests List */}
        <div className="space-y-4">
          {quests.map((q) => {
            const percent = Math.min(100, Math.round((q.currentAmount / q.requiredAmount) * 100));

            return (
              <div
                key={q.id}
                className={`p-5 border-4 transition-all shadow-[6px_6px_0px_0px_#000] ${
                  q.completed
                    ? 'bg-yellow-300 text-black border-black'
                    : isDarkMode
                      ? 'bg-slate-900 border-slate-700 text-white shadow-[6px_6px_0px_0px_#1E293B]'
                      : 'bg-white border-black text-black'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 border-2 border-black flex items-center justify-center text-lg shadow-[2px_2px_0px_0px_#000] shrink-0 ${
                        q.completed ? 'bg-black text-white' : 'bg-slate-100 text-black'
                      }`}
                    >
                      {q.completed ? <CheckCircle2 className="w-5 h-5 text-yellow-300" /> : <Star className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-black text-base uppercase text-black">{q.title}</h3>
                      <p className="text-xs font-black uppercase text-slate-700">{q.description}</p>
                    </div>
                  </div>

                  <span className="text-xs font-black uppercase px-2.5 py-1 bg-white border-2 border-black text-black font-mono shadow-[2px_2px_0px_0px_#000] shrink-0 self-start">
                    {q.rewardBadge}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1 mb-4">
                  <div className="flex items-center justify-between text-xs font-mono font-black uppercase text-black">
                    <span>Progress: {q.currentAmount} / {q.requiredAmount}</span>
                    <span>{percent}%</span>
                  </div>
                  <div className="w-full bg-white h-4 border-2 border-black shadow-[2px_2px_0px_0px_#000] overflow-hidden">
                    <div
                      className={`h-full border-r-2 border-black transition-all duration-500 ${
                        q.completed ? 'bg-black' : 'bg-yellow-400'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Reward Section */}
                {q.rewardPigment && (
                  <div className="pt-3 border-t-2 border-black flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/80 p-3 border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                      <div
                        className="w-9 h-9 border-2 border-black shadow-[2px_2px_0px_0px_#000] flex items-center justify-center text-base shrink-0"
                        style={{ backgroundColor: q.rewardPigment.hex }}
                      >
                        <span>{q.rewardPigment.emoji}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black uppercase text-black">{q.rewardPigment.pigmentName}</span>
                          <span className="text-[9px] font-mono font-black uppercase bg-yellow-300 border border-black px-1">
                            {q.rewardPigment.rarity}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-600 line-clamp-1">{q.rewardPigment.description}</p>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto shrink-0">
                      {q.claimed ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0px_0px_#000] w-full sm:w-auto justify-center">
                          <Check className="w-4 h-4 text-yellow-300" />
                          <span>REWARD CLAIMED</span>
                        </div>
                      ) : q.completed ? (
                        <button
                          onClick={() => onClaimReward(q)}
                          className="w-full sm:w-auto inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-300 hover:bg-yellow-400 border-2 border-black text-black font-black uppercase text-xs shadow-[3px_3px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none animate-bounce-short transition-all justify-center"
                        >
                          <Gift className="w-4 h-4" />
                          <span>CLAIM BONUS PIGMENT</span>
                        </button>
                      ) : (
                        <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 px-2.5 py-1 border border-black inline-block w-full sm:w-auto text-center">
                          LOCKED REWARD
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

