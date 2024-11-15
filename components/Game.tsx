'use client';

import { useEffect, useRef, useState } from 'react';
import { KondorButton } from "@/components/kondor";

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 640;
const PIPE_WIDTH = 70;
const PIPE_GAP = 180;
const PIPE_SPEED = 1.5;
const BIRD_RADIUS = 15;

interface Pipe {
  x: number;
  topHeight: number;
  passed: boolean;
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
    const bird = birdRef.current;
    pipesRef.current.forEach(pipe => {
      if (!pipe.passed && bird.x > pipe.x + PIPE_WIDTH) {
        pipe.passed = true;
        setScore(prev => prev + 1);
      }
    });
  };

  const resetGame = () => {
    const bird = birdRef.current;
    bird.y = CANVAS_HEIGHT / 2;
    bird.velocity = 0;
    pipesRef.current = [];
    frameCountRef.current = 0;
    if (score > bestScore) {
      setBestScore(score);
    }
    setScore(0);
    setGameOver(false);
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
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(score.toString(), CANVAS_WIDTH / 2, 80);
      
      // Draw best score
      ctx.font = 'bold 24px Arial';
      ctx.fillText(`Best: ${bestScore}`, CANVAS_WIDTH / 2, 120);
    };

    const update = () => {
      if (gameOver) return;

      bird.velocity += bird.gravity;
      bird.y += bird.velocity;

      frameCountRef.current++;
      if (frameCountRef.current % 180 === 0) {
        createPipe();
      }

      pipes.forEach(pipe => {
        pipe.x -= PIPE_SPEED;
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
      // ctx.fillStyle = '#4dc6ff';
      // ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      drawPipes();
      drawBird();
      drawScore();

      if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.font = 'bold 24px Arial';
        ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
        ctx.fillText('Click or press SPACE to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
      }
    };

    const gameLoop = () => {
      update();
      draw();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    const handleJump = (e: KeyboardEvent | MouseEvent) => {
      if (e instanceof KeyboardEvent && e.code !== 'Space') return;
      
      if (gameOver) {
        resetGame();
      } else {
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
    <div className="relative flex flex-col items-center">
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
  );
};

export default Game; 