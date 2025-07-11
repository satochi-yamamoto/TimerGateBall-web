import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Timer from '@/components/Timer';
import PlayerScore from '@/components/PlayerScore';
import TeamScore from '@/components/TeamScore';
import { Button } from '@/components/ui/button';
import { useLocalGame } from '@/hooks/useLocalGame';
import { useAudioManager } from '@/hooks/useAudioManager';

const HomeScreen = () => {
  const navigate = useNavigate();
  const {
    status,
    timeLeft,
    playerScores,
    teamScores,
    startGame,
    pauseGame,
    resetGame,
    updatePlayerScore
  } = useLocalGame();

  const { playSound, initializeAudio } = useAudioManager();
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);

  const handleFirstInteraction = useCallback(async () => {
    if (!isAudioInitialized) {
      await initializeAudio();
      setIsAudioInitialized(true);
    }
  }, [isAudioInitialized, initializeAudio]);

  const handleTimer = useCallback(async () => {
    await handleFirstInteraction();
    if (status === 'lobby') {
      await playSound('parte1');
      startGame();
    } else if (status === 'paused') {
      startGame();
    } else if (status === 'running') {
      pauseGame();
    }
  }, [status, pauseGame, startGame, handleFirstInteraction, playSound]);

  useEffect(() => {
    if (status === 'running') {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      const elapsed = 1800 - timeLeft;

      if (elapsed === 900) playSound('parte2');
      if (elapsed === 1200) playSound('parte3');
      if (elapsed === 1500) playSound('parte4');
      if (timeLeft === 0) playSound('parte5');

      if (seconds === 0 && [15, 10, 5, 2, 1].includes(minutes)) playSound('alert');
      if (timeLeft <= 10 && timeLeft > 0) playSound('beep');
    }
  }, [timeLeft, status, playSound]);

  return (
    <div className="min-h-screen w-screen overflow-y-auto bg-gradient-to-br from-gray-800 via-gray-900 to-black flex flex-col p-2 sm:p-4 gap-4">
      <header className="flex justify-between items-center text-white mb-2">
        <h1 className="text-xl font-bold">Gateball Timer</h1>
        <Button variant="ghost" className="text-yellow-400" onClick={() => navigate('/auth')}>Equipe</Button>
      </header>
      <div className="flex gap-2 sm:gap-4 h-16 sm:h-20">
        <TeamScore team="red" score={teamScores.red} label="EQUIPE VERMELHA" />
        <TeamScore team="white" score={teamScores.white} label="EQUIPE BRANCA" />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <Timer timeLeft={timeLeft} gameState={status} onClick={handleTimer} />
      </div>
      <div className="grid grid-cols-5 grid-rows-2 gap-2 sm:gap-3 h-28 sm:h-32">
        {Object.keys(playerScores).map(pId => {
          const id = parseInt(pId, 10);
          return (
            <PlayerScore
              key={id}
              playerId={id}
              score={playerScores[id]}
              isRedTeam={id % 2 === 1}
              onClick={() => updatePlayerScore(id)}
            />
          );
        })}
      </div>
      <div className="flex justify-center gap-2 sm:gap-4 h-10 sm:h-12">
        <Button variant="outline" size="sm" onClick={handleTimer} className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700">
          {status === 'running' ? 'Pausar' : 'Iniciar'}
        </Button>
        <Button variant="outline" size="sm" onClick={resetGame} className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700">
          Reiniciar
        </Button>
      </div>
    </div>
  );
};

export default HomeScreen;
