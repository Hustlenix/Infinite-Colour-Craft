import React, { useState, useEffect, useMemo } from 'react';
import { ColorItem, BoardTile, ActiveTab, Palette, Quest, DailyChallengeState, QuestReward } from './types';
import { BASE_COLORS, hexToRgb, rgbToHsl } from './utils/colorEngine';
import { generateDailyChallenge, getTodayDateString, checkColorMatchesChallenge } from './utils/dailyChallengeEngine';
import {
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
  safeParseJSON,
  normalizeUnlockedColors,
  normalizeBoardTiles,
  normalizePalettes,
  normalizeDailyChallengeState,
  normalizeStringArray,
} from './utils/storage';
import { audioSynth } from './utils/audioSynth';
import { Navbar } from './components/Navbar';
import { SidebarInventory } from './components/SidebarInventory';
import { WorkspaceBoard } from './components/WorkspaceBoard';
import { UnlockModal } from './components/UnlockModal';
import { PaintCanvas } from './components/PaintCanvas';
import { RecipeBook } from './components/RecipeBookModal';
import { PaletteBuilder } from './components/PaletteBuilder';
import { QuestsModal } from './components/QuestsModal';
import { DailyChallengeModal } from './components/DailyChallengeModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { HackTheArtsModal } from './components/HackTheArtsModal';
import { DoodleAI } from './components/DoodleAI';
import { DoodleChallenge } from './components/DoodleChallenge';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('board');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = safeGetItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return safeGetItem('icc_theme_dark') === 'true';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      document.body.style.backgroundColor = '#0F172A';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      document.body.style.backgroundColor = '#EBEBEB';
    }
    safeSetItem('theme', isDarkMode ? 'dark' : 'light');
    safeSetItem('icc_theme_dark', String(isDarkMode));
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Global App Keyboard Shortcuts (Tab switching 1-6, Theme toggle Alt+T, Help ?)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      const isAlt = e.altKey;

      if (isAlt || activeTab !== 'studio') {
        if (key === '1') {
          e.preventDefault();
          setActiveTab('board');
          audioSynth.playPop();
          return;
        }
        if (key === '2') {
          e.preventDefault();
          setActiveTab('studio');
          audioSynth.playPop();
          return;
        }
        if (key === '3') {
          e.preventDefault();
          setActiveTab('recipes');
          audioSynth.playPop();
          return;
        }
        if (key === '4') {
          e.preventDefault();
          setActiveTab('palettes');
          audioSynth.playPop();
          return;
        }
        if (key === '5') {
          e.preventDefault();
          setActiveTab('quests');
          audioSynth.playPop();
          return;
        }
        if (key === '6') {
          e.preventDefault();
          setActiveTab('daily');
          audioSynth.playPop();
          return;
        }
        if (key === '7') {
          e.preventDefault();
          setActiveTab('ai');
          audioSynth.playPop();
          return;
        }
        if (key === '8') {
          e.preventDefault();
          setActiveTab('challenge');
          audioSynth.playPop();
          return;
        }
      }

      // Quick Theme toggle shortcut (Alt+T or T when not in studio)
      if ((isAlt && key === 't') || (key === 't' && activeTab !== 'studio' && !e.ctrlKey && !e.metaKey)) {
        e.preventDefault();
        toggleTheme();
        audioSynth.playPop();
        return;
      }

      // Help / How to Play modal (?)
      if ((key === '?' || (e.key === '/' && e.shiftKey)) && activeTab !== 'studio') {
        e.preventDefault();
        setShowHelp((prev) => !prev);
        audioSynth.playPop();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  const [showHelp, setShowHelp] = useState<boolean>(() => {
    return !safeGetItem('icc_seen_welcome');
  });
  const [showHackTheArtsModal, setShowHackTheArtsModal] = useState<boolean>(false);
  const [isTrashOver, setIsTrashOver] = useState<boolean>(false);
  const [newlyUnlockedColor, setNewlyUnlockedColor] = useState<ColorItem | null>(null);

  // Unlocked Colors state with LocalStorage persistence
  const [unlockedColors, setUnlockedColors] = useState<ColorItem[]>(() => {
    const saved = safeGetItem('icc_unlocked_colors');
    if (saved) {
      const normalized = normalizeUnlockedColors(safeParseJSON<unknown>(saved, null));
      if (normalized) {
        return normalized;
      }
    }
    return BASE_COLORS;
  });

  // Board Tiles state
  const [boardTiles, setBoardTiles] = useState<BoardTile[]>(() => {
    const saved = safeGetItem('icc_board_tiles');
    if (saved) {
      const normalized = normalizeBoardTiles(safeParseJSON<unknown>(saved, null));
      if (normalized) {
        return normalized;
      }
    }
    return [];
  });

  // Palettes state
  const [palettes, setPalettes] = useState<Palette[]>(() => {
    const saved = safeGetItem('icc_palettes');
    if (saved) {
      const normalized = normalizePalettes(safeParseJSON<unknown>(saved, null));
      if (normalized) {
        return normalized;
      }
    }
    return [
      {
        id: 'p1',
        name: 'Cyberpunk Neon',
        colors: ['#FF00FF', '#00FFFF', '#8A2BE2', '#FFFF00'],
        createdAt: Date.now(),
      },
    ];
  });

  // Daily Challenge state
  const todayStr = getTodayDateString();
  const todayChallenge = useMemo(() => generateDailyChallenge(todayStr), [todayStr]);

  const [dailyState, setDailyState] = useState<DailyChallengeState>(() => {
    const saved = safeGetItem('icc_daily_challenge_state');
    const stored = saved
      ? normalizeDailyChallengeState(safeParseJSON<unknown>(saved, null))
      : null;
    if (stored && stored.lastDate === todayStr) {
      return stored;
    }
    // New day (or unreadable state) — compute streak from the stored history
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    const keepStreak = stored !== null && stored.lastCompletedDate === yStr;
    return {
      lastDate: todayStr,
      completed: false,
      claimed: false,
      progress: 0,
      streak: keepStreak ? stored.streak : 0,
      lastCompletedDate: stored?.lastCompletedDate || '',
    };
  });

  // Save daily state
  useEffect(() => {
    safeSetItem('icc_daily_challenge_state', JSON.stringify(dailyState));
  }, [dailyState]);

  // Claim Daily Challenge Reward
  const handleClaimDailyReward = (reward: QuestReward) => {
    if (dailyState.claimed) return;

    setDailyState((prev) => ({ ...prev, claimed: true }));

    const rgb = hexToRgb(reward.hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    const rewardColorItem: ColorItem = {
      id: reward.hex,
      name: reward.pigmentName,
      hex: reward.hex,
      rgb,
      hsl,
      emoji: reward.emoji,
      discoveredAt: Date.now(),
      rarity: reward.rarity,
      category: reward.category,
      description: reward.description,
    };

    handleDiscoverNewColor(rewardColorItem);
  };

  // Claimed Quests state
  const [claimedQuestIds, setClaimedQuestIds] = useState<string[]>(() => {
    const saved = safeGetItem('icc_claimed_quests');
    if (saved) {
      const normalized = normalizeStringArray(safeParseJSON<unknown>(saved, null));
      if (normalized) {
        return normalized;
      }
    }
    return [];
  });

  // Save claimed quests
  useEffect(() => {
    safeSetItem('icc_claimed_quests', JSON.stringify(claimedQuestIds));
  }, [claimedQuestIds]);

  // Handle quest reward claim
  const handleClaimReward = (quest: Quest) => {
    if (claimedQuestIds.includes(quest.id) || !quest.rewardPigment) return;

    setClaimedQuestIds((prev) => [...prev, quest.id]);

    const rgb = hexToRgb(quest.rewardPigment.hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    const rewardColorItem: ColorItem = {
      id: quest.rewardPigment.hex,
      name: quest.rewardPigment.pigmentName,
      hex: quest.rewardPigment.hex,
      rgb,
      hsl,
      emoji: quest.rewardPigment.emoji,
      discoveredAt: Date.now(),
      rarity: quest.rewardPigment.rarity,
      category: quest.rewardPigment.category,
      description: quest.rewardPigment.description,
    };

    handleDiscoverNewColor(rewardColorItem);
  };

  // Active Brush Color for Paint Studio
  const [activeBrushColor, setActiveBrushColor] = useState<ColorItem>(
    unlockedColors[0] || BASE_COLORS[0]
  );

  // Save state changes to LocalStorage
  useEffect(() => {
    safeSetItem('icc_unlocked_colors', JSON.stringify(unlockedColors));
  }, [unlockedColors]);

  useEffect(() => {
    safeSetItem('icc_board_tiles', JSON.stringify(boardTiles));
  }, [boardTiles]);

  useEffect(() => {
    safeSetItem('icc_palettes', JSON.stringify(palettes));
  }, [palettes]);

  // Fast map lookup for unlocked colors
  const unlockedColorsMap = useMemo(() => {
    const map = new Map<string, ColorItem>();
    unlockedColors.forEach((c) => {
      map.set(c.hex.toUpperCase(), c);
      map.set(c.id.toUpperCase(), c);
    });
    return map;
  }, [unlockedColors]);

  // Handle color discovery
  const handleDiscoverNewColor = (color: ColorItem) => {
    const existing = unlockedColorsMap.get(color.hex.toUpperCase());
    if (!existing) {
      setUnlockedColors((prev) => [color, ...prev]);
      setNewlyUnlockedColor(color);
      audioSynth.playUnlock();
    }

    // Evaluate Daily Challenge Progress
    if (!dailyState.completed && checkColorMatchesChallenge(color, todayChallenge)) {
      setDailyState((prev) => {
        const newProgress = Math.min(todayChallenge.requiredAmount, prev.progress + 1);
        const isDone = newProgress >= todayChallenge.requiredAmount;
        return {
          ...prev,
          progress: newProgress,
          completed: isDone || prev.completed,
          streak: isDone && !prev.completed ? prev.streak + 1 : prev.streak,
          lastCompletedDate: isDone ? todayStr : prev.lastCompletedDate,
        };
      });
    }
  };

  // Spawn base 5 spectrum elements onto workspace board
  const spawnBaseSpectrum = () => {
    const startX = 80;
    const startY = 80;
    const spacing = 130;

    const newTiles: BoardTile[] = BASE_COLORS.map((color, idx) => ({
      id: Date.now().toString() + idx + Math.random().toString(),
      colorId: color.id,
      name: color.name,
      hex: color.hex,
      emoji: color.emoji,
      x: startX + (idx % 3) * spacing,
      y: startY + Math.floor(idx / 3) * 70,
      zIndex: idx + 1,
    }));

    setBoardTiles((prev) => [...prev, ...newTiles]);
    audioSynth.playPop();
  };

  // Spawn single tile onto board
  const spawnTileToBoard = (color: ColorItem) => {
    const newTile: BoardTile = {
      id: Date.now().toString() + Math.random().toString(),
      colorId: color.id,
      name: color.name,
      hex: color.hex,
      emoji: color.emoji,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      zIndex: Date.now(),
    };
    setBoardTiles((prev) => [...prev, newTile]);
    audioSynth.playPop();
  };

  // Toggle sound
  const handleToggleSound = () => {
    const enabled = audioSynth.toggleSound();
    setSoundEnabled(enabled);
  };

  // Reset progress
  const handleResetProgress = () => {
    if (window.confirm('Are you sure you want to reset all discovered pigments and clear board?')) {
      setUnlockedColors(BASE_COLORS);
      setBoardTiles([]);
      setClaimedQuestIds([]);
      setDailyState({
        lastDate: todayStr,
        completed: false,
        claimed: false,
        progress: 0,
        streak: 0,
        lastCompletedDate: '',
      });
      safeRemoveItem('icc_unlocked_colors');
      safeRemoveItem('icc_board_tiles');
      safeRemoveItem('icc_claimed_quests');
      safeRemoveItem('icc_daily_challenge_state');
    }
  };

  return (
    <div className={`w-full h-screen flex flex-col font-sans overflow-hidden select-none ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-[#F3F3EF] text-black'}`}>
      {/* Top Navbar */}
       <Navbar
         activeTab={activeTab}
         setActiveTab={setActiveTab}
         discoveredCount={unlockedColors.length}
         totalEstimate={150}
         soundEnabled={soundEnabled}
         onToggleSound={handleToggleSound}
         onClearBoard={() => setBoardTiles([])}
         onOpenHelp={() => setShowHelp(true)}
         onOpenHackTheArts={() => setShowHackTheArtsModal(true)}
         boardTileCount={boardTiles.length}
         hasUnclaimedDaily={dailyState.completed && !dailyState.claimed}
         isDarkMode={isDarkMode}
         onToggleTheme={toggleTheme}
       />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Render Active View Tab */}
        {activeTab === 'board' && (
          <WorkspaceBoard
            tiles={boardTiles}
            setTiles={setBoardTiles}
            unlockedColorsMap={unlockedColorsMap}
            onDiscoverNewColor={handleDiscoverNewColor}
            onSpawnBaseSpectrum={spawnBaseSpectrum}
            setIsTrashOver={setIsTrashOver}
            dailyChallenge={todayChallenge}
            dailyState={dailyState}
            onOpenDailyTab={() => setActiveTab('daily')}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'studio' && (
          <PaintCanvas
            activeColor={activeBrushColor}
            unlockedColors={unlockedColors}
            onSelectColor={setActiveBrushColor}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'recipes' && (
          <RecipeBook
            unlockedColors={unlockedColors}
            onSpawnToBoard={spawnTileToBoard}
            onSelectForStudio={(color) => {
              setActiveBrushColor(color);
              setActiveTab('studio');
            }}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'palettes' && (
          <PaletteBuilder
            unlockedColors={unlockedColors}
            palettes={palettes}
            onSavePalette={(p) => setPalettes((prev) => [p, ...prev])}
            onDeletePalette={(id) => setPalettes((prev) => prev.filter((p) => p.id !== id))}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'quests' && (
          <QuestsModal
            unlockedColors={unlockedColors}
            claimedQuestIds={claimedQuestIds}
            onClaimReward={handleClaimReward}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'daily' && (
          <DailyChallengeModal
            challenge={todayChallenge}
            dailyState={dailyState}
            onClaimReward={handleClaimDailyReward}
            onNavigateToBoard={() => setActiveTab('board')}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'ai' && (
          <DoodleAI isDarkMode={isDarkMode} />
        )}

        {activeTab === 'challenge' && (
          <DoodleChallenge isDarkMode={isDarkMode} />
        )}

        {/* Right Inventory Sidebar */}
        <SidebarInventory
          unlockedColors={unlockedColors}
          activeColor={activeBrushColor}
          onSelectColorForBrush={(color) => {
            setActiveBrushColor(color);
          }}
          onSpawnTileToBoard={spawnTileToBoard}
          onResetProgress={handleResetProgress}
          activeTab={activeTab}
          isTrashOver={isTrashOver}
          isDarkMode={isDarkMode}
        />
      </div>

      {/* New Color Unlock Modal Celebration */}
      {newlyUnlockedColor && (
        <UnlockModal
          color={newlyUnlockedColor}
          onClose={() => setNewlyUnlockedColor(null)}
          onGoToStudio={(color) => {
            setActiveBrushColor(color);
            setNewlyUnlockedColor(null);
            setActiveTab('studio');
          }}
          isDarkMode={isDarkMode}
        />
      )}

       {/* How to Play / Onboarding Tutorial Modal */}
       {showHelp && (
         <HowToPlayModal
           isDarkMode={isDarkMode}
           onClose={() => {
             setShowHelp(false);
             safeSetItem('icc_seen_welcome', 'true');
           }}
           onSpawnStarter={() => {
             safeSetItem('icc_seen_welcome', 'true');
             if (boardTiles.length === 0) {
               spawnBaseSpectrum();
             }
           }}
         />
       )}

       {/* Hack The Arts Submission Modal */}
       <HackTheArtsModal
         isOpen={showHackTheArtsModal}
         onClose={() => setShowHackTheArtsModal(false)}
         onLaunchStudio={() => setActiveTab('studio')}
         isDarkMode={isDarkMode}
       />
     </div>
  );
}
