import React, { useState, useEffect, useMemo } from 'react';
import { ColorItem, BoardTile, ActiveTab, Palette, Quest } from './types';
import { BASE_COLORS } from './utils/colorEngine';
import { generateDailyChallenge } from './utils/dailyChallengeEngine';
import {
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
  safeParseJSON,
  normalizeBoardTiles,
  normalizePalettes,
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
import { AILab } from './components/AILab';
import { CollaborationModal } from './components/CollaborationModal';
import { CollabStatusBar } from './components/CollabStatusBar';
import {useProgression,craftedEvidence} from './hooks/useProgression';
import {GrimoireNav} from './components/GrimoireNav';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('board');
  const [labVisited,setLabVisited]=useState(false),[studioVisited,setStudioVisited]=useState(false);
  const [labEntry,setLabEntry]=useState<'ai'|'challenge'>('ai');
  const [grimoireVisited,setGrimoireVisited]=useState(false);
  const [paletteSeed,setPaletteSeed]=useState<{color:ColorItem;key:number}>();
  const isGrimoire=['recipes','palettes','quests','daily'].includes(activeTab),isLab=activeTab==='ai'||activeTab==='challenge';
  useEffect(()=>{if(isLab){setLabVisited(true);setLabEntry(activeTab==='challenge'?'challenge':'ai');}if(isGrimoire)setGrimoireVisited(true);if(activeTab==='studio')setStudioVisited(true);},[activeTab]);
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
        if (key === '9') {
          e.preventDefault();
          setActiveTab('ai');
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
  const [showCollabModal, setShowCollabModal] = useState<boolean>(false);
  const [isTrashOver, setIsTrashOver] = useState<boolean>(false);
  const [newlyUnlockedColor, setNewlyUnlockedColor] = useState<ColorItem | null>(null);

  const progression=useProgression();
  const unlockedColors=progression.state.colors;
  const crafted=useMemo(()=>craftedEvidence(progression.state),[progression.state.colors,progression.state.recipes]);
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

  const dailyState=progression.state.daily,claimedQuestIds=progression.state.claims;
  const todayStr=dailyState.lastDate;
  const todayChallenge=useMemo(()=>generateDailyChallenge(todayStr),[todayStr]);
  const handleClaimDailyReward=()=>{const color=progression.claimDaily();if(color){setNewlyUnlockedColor(color);audioSynth.playUnlock();}};
  const handleClaimReward=(quest:Quest)=>{const color=progression.claimQuest(quest.id);if(color){setNewlyUnlockedColor(color);audioSynth.playUnlock();}};
  // Active Brush Color for Paint Studio
  const [activeBrushColor, setActiveBrushColor] = useState<ColorItem>(
    unlockedColors[0] || BASE_COLORS[0]
  );

  // Save state changes to LocalStorage


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

  // PIGMENTS_COMBINED records provenance and progression; reward claims do not enter here.
  const handleDiscoverNewColor=(color:ColorItem)=>{if(progression.discover(color)){setNewlyUnlockedColor(color);audioSynth.playUnlock();}};
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

  const handleResetProgress=()=>{if(window.confirm('Are you sure you want to reset all discovered pigments and clear board?')){progression.reset();setBoardTiles([]);safeRemoveItem('icc_board_tiles');}};

  return (
    <div className={`w-full h-screen flex flex-col font-sans overflow-hidden select-none ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-[#F3F3EF] text-black'}`}>
      {/* Top Navbar */}
      <div className="w-full shrink-0 overflow-x-auto" aria-label="Main navigation scroll area">
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
         onOpenCollab={() => setShowCollabModal(true)}
         boardTileCount={boardTiles.length}
         hasUnclaimedDaily={dailyState.completed && !dailyState.claimed}
         isDarkMode={isDarkMode}
         onToggleTheme={toggleTheme}
       />
      </div>

      {/* Real-Time Collaboration Presence Status Bar */}
      <CollabStatusBar
        isDarkMode={isDarkMode}
        onOpenModal={() => setShowCollabModal(true)}
      />

      {progression.warning&&<div role="alert" className="px-4 py-2 text-xs font-bold bg-red-200 text-black border-2 border-black">{progression.warning}<button onClick={progression.retry} className="ml-2 underline">Retry saving</button></div>}
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

        {(studioVisited||activeTab==='studio') && (<div className="flex-1 min-w-0 flex" style={{display:activeTab==='studio'?'flex':'none'}}>
          <PaintCanvas
            activeColor={activeBrushColor}
            unlockedColors={unlockedColors}
            onSelectColor={setActiveBrushColor}
            isDarkMode={isDarkMode}
          /></div>
        )}

        {(grimoireVisited||isGrimoire)&&<div className="flex-1 min-w-0 flex flex-col overflow-hidden" style={{display:isGrimoire?'flex':'none'}}><GrimoireNav activeTab={activeTab} onNavigate={setActiveTab} isDarkMode={isDarkMode}/>
        <div className="flex-1 min-h-0 overflow-y-auto">
        <div style={{display:activeTab==='recipes'?'block':'none'}}>
        {(
          <RecipeBook
            unlockedColors={unlockedColors}
            recipes={progression.state.recipes}
            onAddToPalette={color=>{setPaletteSeed({color,key:Date.now()});setActiveTab('palettes');}}
            onSpawnToBoard={color=>{spawnTileToBoard(color);setActiveTab('board');}}
            onSelectForStudio={(color) => {
              setActiveBrushColor(color);
              setActiveTab('studio');
            }}
            isDarkMode={isDarkMode}
          />
        )}

        </div><div style={{display:activeTab==='palettes'?'block':'none'}}>
        {(
          <PaletteBuilder
            unlockedColors={unlockedColors}
            palettes={palettes} seed={paletteSeed} onStudio={color=>{setActiveBrushColor(color);setActiveTab('studio');}}
            onSavePalette={(p) => setPalettes((prev) => [p, ...prev.filter(old=>old.id!==p.id)])}
            onDeletePalette={(id) => setPalettes((prev) => prev.filter((p) => p.id !== id))}
            isDarkMode={isDarkMode}
          />
        )}

        </div><div style={{display:activeTab==='quests'?'block':'none'}}>
        {(
          <QuestsModal
            unlockedColors={unlockedColors}
            claimedQuestIds={claimedQuestIds} crafted={crafted}
            onClaimReward={handleClaimReward}
            isDarkMode={isDarkMode}
          />
        )}

        </div><div style={{display:activeTab==='daily'?'block':'none'}}>
        {(
          <DailyChallengeModal
            challenge={todayChallenge}
            dailyState={dailyState}
            onClaimReward={handleClaimDailyReward}
            onNavigateToBoard={() => setActiveTab('board')}
            isDarkMode={isDarkMode}
          />
        )}

        </div></div></div>}
        {(labVisited||isLab)&&<div className="flex-1 min-w-0 min-h-0" style={{display:isLab?'flex':'none'}}><AILab initialSubTab={labEntry} isDarkMode={isDarkMode} active={isLab} colors={unlockedColors} ink={activeBrushColor} onInk={setActiveBrushColor} onCraft={()=>setActiveTab('board')} onStudio={()=>setActiveTab('studio')}/></div>}

        {/* Right Inventory Sidebar: only shown on 'board' and 'studio' to prevent clutter */}
        {(activeTab === 'board' || activeTab === 'studio') && (
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
        )}
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

       {/* Real-time Multiplayer Collaboration Modal */}
       <CollaborationModal
         isOpen={showCollabModal}
         onClose={() => setShowCollabModal(false)}
         isDarkMode={isDarkMode}
       />
     </div>
  );
}
