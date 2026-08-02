import React from 'react';
import { Quest, ColorItem } from '../types';
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
}

export const QuestsModal: React.FC<QuestsModalProps> = ({ 
  unlockedColors, 
  claimedQuestIds, 
  onClaimReward,
  isDarkMode = false,
}) => {
  const quests: Quest[] = [
    {
      id: 'q0',
      title: 'First Transmutation',
      description: 'Combine two base colors to synthesize your very first custom pigment.',
      targetType: 'count',
      targetValue: 6,
      requiredAmount: 6,
      currentAmount: unlockedColors.length,
      completed: unlockedColors.length >= 6,
      rewardBadge: '🌱 First Spark',
      claimed: claimedQuestIds.includes('q0'),
      rewardPigment: {
        pigmentName: 'Spark Crimson',
        hex: '#FF3366',
        emoji: '✨',
        rarity: 'Rare',
        category: 'Secondary',
        description: 'Bonus crimson spark pigment granted for completing your first transmutation.',
      },
    },
    {
      id: 'q1',
      title: 'Spectrum Initiate',
      description: 'Discover at least 10 unique procedural pigments in your alchemy journal.',
      targetType: 'count',
      targetValue: 10,
      requiredAmount: 10,
      currentAmount: Math.min(10, unlockedColors.length),
      completed: unlockedColors.length >= 10,
      rewardBadge: '🏅 Apprentice Alchemist',
      claimed: claimedQuestIds.includes('q1'),
      rewardPigment: {
        pigmentName: 'Apprentice Azure',
        hex: '#00B4D8',
        emoji: '📜',
        rarity: 'Uncommon',
        category: 'Secondary',
        description: 'Azure pigment awarded to initiates embarking on color synthesis.',
      },
    },
    {
      id: 'q2',
      title: 'Neon Catalyst',
      description: 'Synthesize a radiant Neon category pigment.',
      targetType: 'category',
      targetValue: 'Neon',
      requiredAmount: 1,
      currentAmount: Math.min(1, unlockedColors.filter((c) => c.category === 'Neon').length),
      completed: unlockedColors.some((c) => c.category === 'Neon'),
      rewardBadge: '⚡ Neon Weaver',
      claimed: claimedQuestIds.includes('q2'),
      rewardPigment: {
        pigmentName: 'Hyper Neon Plasma',
        hex: '#39FF14',
        emoji: '⚡',
        rarity: 'Rare',
        category: 'Neon',
        description: 'Hyper-luminescent radioactive green pigment.',
      },
    },
    {
      id: 'q3',
      title: 'Pastel Whisperer',
      description: 'Synthesize 3 soft Pastel category pigments.',
      targetType: 'category',
      targetValue: 'Pastel',
      requiredAmount: 3,
      currentAmount: Math.min(3, unlockedColors.filter((c) => c.category === 'Pastel').length),
      completed: unlockedColors.filter((c) => c.category === 'Pastel').length >= 3,
      rewardBadge: '🌸 Soft Bloom Master',
      claimed: claimedQuestIds.includes('q3'),
      rewardPigment: {
        pigmentName: 'Sakura Whisper',
        hex: '#FFB7B2',
        emoji: '🌸',
        rarity: 'Rare',
        category: 'Pastel',
        description: 'Soft delicate blossom pastel pigment.',
      },
    },
    {
      id: 'q4',
      title: 'Dark Shadow Alchemist',
      description: 'Discover 3 Dark category pigments using dark shade transmutations.',
      targetType: 'category',
      targetValue: 'Dark',
      requiredAmount: 3,
      currentAmount: Math.min(3, unlockedColors.filter((c) => c.category === 'Dark').length),
      completed: unlockedColors.filter((c) => c.category === 'Dark').length >= 3,
      rewardBadge: '🌙 Shadow Weaver',
      claimed: claimedQuestIds.includes('q4'),
      rewardPigment: {
        pigmentName: 'Obsidian Void',
        hex: '#121212',
        emoji: '🖤',
        rarity: 'Rare',
        category: 'Dark',
        description: 'An ultra-dense dark shade forged in alchemy.',
      },
    },
    {
      id: 'q5',
      title: 'Metallic Forge',
      description: 'Forge a shiny Metallic category pigment (Gold, Silver, Bronze, or Copper).',
      targetType: 'category',
      targetValue: 'Metallic',
      requiredAmount: 1,
      currentAmount: Math.min(1, unlockedColors.filter((c) => c.category === 'Metallic').length),
      completed: unlockedColors.some((c) => c.category === 'Metallic'),
      rewardBadge: '⚔️ Forge Master',
      claimed: claimedQuestIds.includes('q5'),
      rewardPigment: {
        pigmentName: 'Imperial Bronze',
        hex: '#CD7F32',
        emoji: '🛡️',
        rarity: 'Rare',
        category: 'Metallic',
        description: 'Forged from bronze heat and metal alchemy.',
      },
    },
    {
      id: 'q6',
      title: 'Cosmic Voyager',
      description: 'Synthesize a mystic Cosmic category pigment from deep spectrum blending.',
      targetType: 'category',
      targetValue: 'Cosmic',
      requiredAmount: 1,
      currentAmount: Math.min(1, unlockedColors.filter((c) => c.category === 'Cosmic').length),
      completed: unlockedColors.some((c) => c.category === 'Cosmic'),
      rewardBadge: '🌌 Starlight Seeker',
      claimed: claimedQuestIds.includes('q6'),
      rewardPigment: {
        pigmentName: 'Astral Stardust',
        hex: '#9D4EDD',
        emoji: '🌌',
        rarity: 'Epic',
        category: 'Cosmic',
        description: 'Interstellar cosmic pigment shimmering with starlight.',
      },
    },
    {
      id: 'q7',
      title: 'Rare Collector',
      description: 'Discover 3 Rare tier pigments in your spectrum collection.',
      targetType: 'rarity',
      targetValue: 'Rare',
      requiredAmount: 3,
      currentAmount: Math.min(3, unlockedColors.filter((c) => c.rarity === 'Rare').length),
      completed: unlockedColors.filter((c) => c.rarity === 'Rare').length >= 3,
      rewardBadge: '🔹 Prism Collector',
      claimed: claimedQuestIds.includes('q7'),
      rewardPigment: {
        pigmentName: 'Prismatic Crystal',
        hex: '#00F5D4',
        emoji: '💎',
        rarity: 'Rare',
        category: 'Secondary',
        description: 'Brilliant crystalline teal hue awarded for rare collection.',
      },
    },
    {
      id: 'q8',
      title: 'Legendary Synthesizer',
      description: 'Discover an Epic or Legendary pigment through multi-step alchemy.',
      targetType: 'rarity',
      targetValue: 'Legendary',
      requiredAmount: 1,
      currentAmount: Math.min(1, unlockedColors.filter((c) => c.rarity === 'Legendary' || c.rarity === 'Epic').length),
      completed: unlockedColors.some((c) => c.rarity === 'Legendary' || c.rarity === 'Epic'),
      rewardBadge: '👑 Grand Master Craftsman',
      claimed: claimedQuestIds.includes('q8'),
      rewardPigment: {
        pigmentName: 'Phoenix Flame Gold',
        hex: '#FFD100',
        emoji: '🐉',
        rarity: 'Legendary',
        category: 'Metallic',
        description: 'Legendary phoenix gold pigment of ancient alchemy.',
      },
    },
    {
      id: 'q9',
      title: 'Godlike Alchemist',
      description: 'Synthesize a supreme God tier pigment (Pure Gold or Sterling Silver).',
      targetType: 'rarity',
      targetValue: 'God',
      requiredAmount: 1,
      currentAmount: Math.min(1, unlockedColors.filter((c) => c.rarity === 'God').length),
      completed: unlockedColors.some((c) => c.rarity === 'God'),
      rewardBadge: '🌟 Divine Alchemist',
      claimed: claimedQuestIds.includes('q9'),
      rewardPigment: {
        pigmentName: 'Celestial Godhead',
        hex: '#E0AAFF',
        emoji: '👑',
        rarity: 'God',
        category: 'Cosmic',
        description: 'Supreme divine pigment granted only to godlike alchemists.',
      },
    },
    {
      id: 'q10',
      title: 'Master Colorist',
      description: 'Discover 25 total unique color pigments in your spectrum.',
      targetType: 'count',
      targetValue: 25,
      requiredAmount: 25,
      currentAmount: Math.min(25, unlockedColors.length),
      completed: unlockedColors.length >= 25,
      rewardBadge: '💎 Master Colorist',
      claimed: claimedQuestIds.includes('q10'),
      rewardPigment: {
        pigmentName: 'Empress Violet',
        hex: '#7209B7',
        emoji: '💎',
        rarity: 'Legendary',
        category: 'Cosmic',
        description: 'Regal royal violet awarded for mastering 25 pigments.',
      },
    },
    {
      id: 'q11',
      title: 'Chromatic Sovereign',
      description: 'Expand your collection to 50 unique color pigments!',
      targetType: 'count',
      targetValue: 50,
      requiredAmount: 50,
      currentAmount: Math.min(50, unlockedColors.length),
      completed: unlockedColors.length >= 50,
      rewardBadge: '🏆 Chromatic Sovereign',
      claimed: claimedQuestIds.includes('q11'),
      rewardPigment: {
        pigmentName: 'Sovereign Sunburst',
        hex: '#FF9F1C',
        emoji: '🏆',
        rarity: 'God',
        category: 'Neon',
        description: 'Supreme sovereign sunburst pigment awarded for discovering 50 pigments.',
      },
    },
  ];

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
                Complete pigment milestones to claim exclusive bonus secret pigments & badges!
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

