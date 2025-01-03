'use client';

import { useEffect, useRef, useState } from 'react';
import { KondorButton } from "@/components/kondor";

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 640;
const PIPE_WIDTH = 70;
const PIPE_GAP = 180;
const PIPE_SPEED = 1.5;
const BIRD_RADIUS = 15;
const POWERUP_DURATION = 5000; // 5 seconds

interface Pipe {
  x: number;
  topHeight: number;
  passed: boolean;
}

const POWERUP_TYPES = {
  SHIELD: {
    color: '#3498db',
    symbol: '🛡️',
  },
  SLOW_TIME: {
    color: '#9b59b6',
    symbol: '⏰',
  },
  DOUBLE_POINTS: {
    color: '#f1c40f',
    symbol: '2️⃣',
  },
} as const;

interface PowerUpEffect {
  type: keyof typeof POWERUP_TYPES;
  endTime: number;
}

interface HighScore {
  name: string;
  score: number;
}

const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  
  const birdRef = useRef({
    x: CANVAS_WIDTH / 3,
    y: CANVAS_HEIGHT / 2,
    velocity: 0,
    gravity: 0.3,
    jumpStrength: -6
  });
  const pipesRef = useRef<Pipe[]>([]);
  const frameCountRef = useRef(0);
  const [activeEffects, setActiveEffects] = useState<PowerUpEffect[]>([]);
  const [showHighScoreEntry, setShowHighScoreEntry] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [highScores, setHighScores] = useState<HighScore[]>([]);

  const createPipe = () => {
    const minHeight = 100;
    const maxHeight = CANVAS_HEIGHT - PIPE_GAP - minHeight;
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
    
    pipesRef.current.push({
      x: CANVAS_WIDTH,
      topHeight,
      passed: false
    });
  };

  const checkCollision = () => {
    const hasShield = activeEffects.some(effect => effect.type === 'SHIELD');
    if (hasShield) return false;

    const bird = birdRef.current;
    const pipes = pipesRef.current;

    // Check floor/ceiling collision
    if (bird.y + BIRD_RADIUS > CANVAS_HEIGHT || bird.y - BIRD_RADIUS < 0) {
      return true;
    }

    return pipes.some(pipe => {
      const birdLeft = bird.x - BIRD_RADIUS;
      const birdRight = bird.x + BIRD_RADIUS;
      const birdTop = bird.y - BIRD_RADIUS;
      const birdBottom = bird.y + BIRD_RADIUS;

      if (birdRight > pipe.x && birdLeft < pipe.x + PIPE_WIDTH) {
        if (birdTop < pipe.topHeight || birdBottom > pipe.topHeight + PIPE_GAP) {
          return true;
        }
      }
      return false;
    });
  };

  const updateScore = () => {
    const hasDoublePoints = activeEffects.some(effect => effect.type === 'DOUBLE_POINTS');
    const pointMultiplier = hasDoublePoints ? 2 : 1;

    const bird = birdRef.current;
    pipesRef.current.forEach(pipe => {
      if (!pipe.passed && bird.x > pipe.x + PIPE_WIDTH) {
        pipe.passed = true;
        const newScore = score + (1 * pointMultiplier);
        setScore(newScore);
        
        // Activate power-up every 4 pipes
        if (newScore % 4 === 0) {
          const type = Object.keys(POWERUP_TYPES)[Math.floor(Math.random() * Object.keys(POWERUP_TYPES).length)] as keyof typeof POWERUP_TYPES;
          activatePowerUp(type);
        }
      }
    });
  };

  const resetGame = () => {
    const bird = birdRef.current;
    bird.y = CANVAS_HEIGHT / 2;
    bird.velocity = 0;
    pipesRef.current = [];
    frameCountRef.current = 0;

    if (score > 6) {
      const lowestScore = highScores.length === 10 ? highScores[9].score : 0;
      if (highScores.length < 10 || score > lowestScore) {
        setShowHighScoreEntry(true);
        return; // Don't reset game state yet
      }
    }

    if (score > bestScore) {
      setBestScore(score);
    }
    setScore(0);
    setGameOver(false);
  };

  const activatePowerUp = (type: keyof typeof POWERUP_TYPES) => {
    const endTime = Date.now() + POWERUP_DURATION;
    setActiveEffects(prev => [...prev, { type, endTime }]);
  };

  const handleHighScoreSubmit = () => {
    if (playerName.length === 3) {
      const newHighScore: HighScore = {
        name: playerName.toUpperCase(),
        score: score
      };
      
      const newHighScores = [...highScores, newHighScore]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      
      setHighScores(newHighScores);
      setShowHighScoreEntry(false);
      setPlayerName('');
      
      if (score > bestScore) {
        setBestScore(score);
      }
      setScore(0);
      setGameOver(false);
    }
  };

  const handleNameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    if (/^[A-Z]*$/.test(value) && value.length <= 3) {
      setPlayerName(value);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bird = birdRef.current;
    const pipes = pipesRef.current;

    const drawBird = () => {
      ctx.save();
      ctx.translate(bird.x, bird.y);
      ctx.rotate(Math.min(bird.velocity * 0.05, Math.PI / 6));
      
      // Bird body
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      
      // Bird wing
      ctx.fillStyle = '#FFA500';
      ctx.beginPath();
      ctx.ellipse(-5, 0, 8, 5, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Bird eye
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(5, -5, 3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    };

    const drawPipes = () => {
      ctx.fillStyle = '#2ECC71';
      pipes.forEach(pipe => {
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
        ctx.fillRect(
          pipe.x,
          pipe.topHeight + PIPE_GAP,
          PIPE_WIDTH,
          CANVAS_HEIGHT - (pipe.topHeight + PIPE_GAP)
        );
      });
    };

    const drawScore = () => {
      ctx.fillStyle = 'white';
      
      // Score in top right
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(score.toString(), CANVAS_WIDTH - 20, 50);
      
      // Best score below current score
      ctx.font = 'bold 24px Arial';
      ctx.fillText(`Best: ${bestScore}`, CANVAS_WIDTH - 20, 80);
      
      // Power-up progress in top left
      ctx.textAlign = 'left';
      const nextPowerUp = 4 - (score % 4);
      ctx.fillText(`Next power-up: ${nextPowerUp}`, 20, 50);
    };

    const update = () => {
      if (gameOver) return;

      // Update active effects
      setActiveEffects(prev => prev.filter(effect => effect.endTime > Date.now()));

      // Apply power-up effects
      const hasSlowTime = activeEffects.some(effect => effect.type === 'SLOW_TIME');
      const currentSpeed = hasSlowTime ? PIPE_SPEED * 0.5 : PIPE_SPEED;

      bird.velocity += bird.gravity;
      bird.y += bird.velocity;

      frameCountRef.current++;
      if (frameCountRef.current % 180 === 0) {
        createPipe();
      }

      pipes.forEach(pipe => {
        pipe.x -= currentSpeed;
      });
      
      while (pipes.length > 0 && pipes[0].x < -PIPE_WIDTH) {
        pipes.shift();
      }

      updateScore();

      if (checkCollision()) {
        setGameOver(true);
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      // Add a semi-transparent dark background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      drawPipes();
      drawBird();
      drawScore();

      // Draw active effects indicators
      activeEffects.forEach((effect, index) => {
        const timeLeft = (effect.endTime - Date.now()) / POWERUP_DURATION;
        ctx.fillStyle = POWERUP_TYPES[effect.type].color;
        ctx.fillRect(
          10, 
          10 + (index * 30), 
          50 * timeLeft, 
          20
        );
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.fillText(
          POWERUP_TYPES[effect.type].symbol,
          70,
          25 + (index * 30)
        );
      });

      // Draw bird with shield effect if active
      const hasShield = activeEffects.some(effect => effect.type === 'SHIELD');
      if (hasShield) {
        ctx.save();
        ctx.strokeStyle = POWERUP_TYPES.SHIELD.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(birdRef.current.x, birdRef.current.y, BIRD_RADIUS + 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
        ctx.font = 'bold 24px Arial';
        ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

        if (!showHighScoreEntry) {
          ctx.fillText('Click or press SPACE to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
        }
      }
    };

    const gameLoop = () => {
      update();
      draw();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    const handleJump = (e: KeyboardEvent | MouseEvent) => {
      if (e instanceof KeyboardEvent && e.code !== 'Space') return;
      
      if (gameOver && !showHighScoreEntry) {
        resetGame();
      } else if (!gameOver) {
        bird.velocity = bird.jumpStrength;
      }
    };

    // Event listeners
    window.addEventListener('keydown', handleJump);
    canvas.addEventListener('click', handleJump);

    // Start game loop
    gameLoop();

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleJump);
      canvas.removeEventListener('click', handleJump);
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameOver, score, bestScore]);

  return (
    <div className="relative flex flex-row items-start gap-8">
      <div className="flex flex-col items-center">
        <div className="w-full max-w-[480px] flex justify-end mb-4">
          <KondorButton variant="outline" />
        </div>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-4 border-white rounded-lg"
        />
        <div className="w-full max-w-[480px] mt-4 text-center">
          <div className="text-white font-bold">
            {gameOver ? 'Game Over - Press SPACE or Click to restart' : 'Press SPACE or Click to jump'}
          </div>
        </div>
      </div>

      {/* High Scores Panel */}
      <div className="w-48 bg-black/50 border-2 border-white rounded-lg p-4">
        <h2 className="text-white text-xl font-bold text-center mb-4 border-b-2 border-white/50 pb-2">
          HIGH SCORES
        </h2>
        <div className="space-y-2">
          {[...Array(10)].map((_, index) => {
            const highScore = highScores[index];
            if (!highScore) return (
              <div key={index} className="text-white/20 font-mono flex justify-between">
                <span>{index + 1}.</span>
                <span></span>
              </div>
            );

            return (
              <div 
                key={index} 
                className={`text-white font-mono flex justify-between ${
                  highScore.score === score ? 'text-yellow-400' : ''
                }`}
              >
                <span>
                  {index + 1}. {highScore.name}
                </span>
                <span>
                  {highScore.score.toString().padStart(6, '0')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* High Score Entry Modal */}
      {showHighScoreEntry && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/80 p-6 rounded-lg border-2 border-white text-center">
            <h2 className="text-white text-xl mb-4">New High Score!</h2>
            <p className="text-white mb-4">Enter your initials:</p>
            <input
              type="text"
              value={playerName}
              onChange={handleNameInput}
              maxLength={3}
              className="w-24 px-3 py-2 rounded bg-white/10 text-white border border-white/30 focus:border-white outline-none text-center text-2xl tracking-widest uppercase"
              autoFocus
              placeholder="AAA"
            />
            <button
              onClick={handleHighScoreSubmit}
              disabled={playerName.length !== 3}
              className="mt-4 w-full px-4 py-2 bg-white/20 text-white rounded hover:bg-white/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game; 