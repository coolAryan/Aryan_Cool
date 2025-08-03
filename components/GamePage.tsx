import React, { useRef, useEffect, useCallback, useReducer } from 'react';
import { Brick, Ball, Paddle, GameStatus, PowerUp, PowerUpType, PowerUpCategory, ActiveEffect, Particle, Star } from '../types';

// --- GAME CONSTANTS ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_INITIAL_WIDTH = 120;
const PADDLE_HEIGHT = 20;
const PADDLE_Y_OFFSET = 30;
const BALL_RADIUS = 10;
const INITIAL_LIVES = 3;
const BRICK_ROW_COUNT = 7;
const BRICK_COLUMN_COUNT = 10;
const BRICK_WIDTH = 75;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 10;
const BRICK_OFFSET_TOP = 80;
const BRICK_OFFSET_LEFT = 30;
const POWERUP_CHANCE = 0.3; // 30% chance to drop a power-up
const POWERUP_SPEED = 2;
const POWERUP_WIDTH = 50;
const POWERUP_HEIGHT = 25;
const POWERUP_DURATION = 10000; // 10 seconds
const STAR_COUNT = 150;
const PARTICLE_LIFE = 40;

const BRICK_COLORS = ["#3498DB", "#1ABC9C", "#F1C40F", "#9B59B6", "#E74C3C"];

const POWERUP_CONFIG: { [key in PowerUpType]: { category: PowerUpCategory, symbol: string } } = {
    [PowerUpType.EXPAND_PADDLE]: { category: PowerUpCategory.POSITIVE, symbol: 'E' },
    [PowerUpType.SHRINK_PADDLE]: { category: PowerUpCategory.NEGATIVE, symbol: '<' },
    [PowerUpType.FAST_BALL]: { category: PowerUpCategory.NEGATIVE, symbol: 'F' },
    [PowerUpType.SLOW_BALL]: { category: PowerUpCategory.POSITIVE, symbol: 'S' },
    [PowerUpType.SPLIT_BALL]: { category: PowerUpCategory.POSITIVE, symbol: '+' },
    [PowerUpType.GRAB_PADDLE]: { category: PowerUpCategory.POSITIVE, symbol: 'G' },
    [PowerUpType.KILL_PADDLE]: { category: PowerUpCategory.NEGATIVE, symbol: 'X' },
    [PowerUpType.THRU_BRICK]: { category: PowerUpCategory.POSITIVE, symbol: 'T' },
};


// --- GAME STATE & ACTIONS ---
interface GameState {
  status: GameStatus;
  balls: Ball[];
  paddle: Paddle;
  bricks: Brick[];
  powerUps: PowerUp[];
  activeEffects: ActiveEffect[];
  particles: Particle[];
  stars: Star[];
  score: number;
  lives: number;
  level: number;
}

type GameAction =
  | { type: 'MOVE_PADDLE'; payload: { x: number } }
  | { type: 'UPDATE_GAME' }
  | { type: 'START_LEVEL' }
  | { type: 'LAUNCH_BALL' }
  | { type: 'LOSE_LIFE' }
  | { type: 'BRICK_HIT'; payload: { brickId: string, ballId: string } }
  | { type: 'SPAWN_POWERUP'; payload: { x: number, y: number } }
  | { type: 'ACTIVATE_POWERUP'; payload: { powerUp: PowerUp } }
  | { type: 'DEACTIVATE_POWERUP'; payload: { effectType: PowerUpType } }
  | { type: 'SPAWN_PARTICLES'; payload: { x: number, y: number, color: string, count: number, speed: number }};

const createBricksForLevel = (level: number): Brick[] => {
    const bricks: Brick[] = [];
    const rowCount = BRICK_ROW_COUNT + Math.min(level - 1, 3);
    for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
            bricks.push({
                id: `brick-${level}-${r}-${c}`,
                x: c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT,
                y: r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP,
                width: BRICK_WIDTH,
                height: BRICK_HEIGHT,
                color: BRICK_COLORS[(r + level) % BRICK_COLORS.length],
                active: true,
            });
        }
    }
    return bricks;
};

const createInitialBall = (level: number): Ball => ({
    id: `ball-${Date.now()}`,
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - PADDLE_Y_OFFSET - PADDLE_HEIGHT - BALL_RADIUS,
    radius: BALL_RADIUS,
    dx: 4 + level * 0.5,
    dy: -4 - level * 0.5,
    isThru: false,
});

const createStars = (): Star[] => {
    return Array.from({ length: STAR_COUNT }).map(() => ({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        radius: Math.random() * 1.5,
        alpha: Math.random() * 0.5 + 0.2,
        dAlpha: (Math.random() - 0.5) * 0.01,
    }));
};

const getInitialState = (): GameState => ({
    status: GameStatus.MENU,
    balls: [],
    paddle: { x: (CANVAS_WIDTH - PADDLE_INITIAL_WIDTH) / 2, width: PADDLE_INITIAL_WIDTH, height: PADDLE_HEIGHT, hasGrab: false },
    bricks: [],
    powerUps: [],
    activeEffects: [],
    particles: [],
    stars: createStars(),
    score: 0,
    lives: INITIAL_LIVES,
    level: 1,
});

const clearAllEffects = (state: GameState): GameState => {
    state.activeEffects.forEach(effect => clearTimeout(effect.timeoutId));
    const cleanState = getInitialState();
    return {
        ...state,
        paddle: cleanState.paddle,
        balls: state.balls.map(b => ({ ...b, isThru: false, radius: BALL_RADIUS })),
        powerUps: [],
        activeEffects: [],
        particles: [], // Also clear particles
    };
};

const gameReducer = (state: GameState, action: GameAction): GameState => {
    switch (action.type) {
        case 'START_LEVEL': {
            const isNewGame = state.status === GameStatus.MENU || state.status === GameStatus.GAME_OVER;
            let resetState = isNewGame ? getInitialState() : state;
            
            resetState = clearAllEffects(resetState);

            const currentLevel = isNewGame ? 1 : state.level + 1;
            const newBall = createInitialBall(currentLevel);
            // Ball is stuck to paddle initially
            newBall.dx = 0;
            newBall.dy = 0;
            newBall.y = CANVAS_HEIGHT - PADDLE_Y_OFFSET - PADDLE_HEIGHT - BALL_RADIUS;

            return {
                ...resetState,
                level: currentLevel,
                status: GameStatus.PLAYING,
                bricks: createBricksForLevel(currentLevel),
                balls: [newBall],
                paddle: { ...resetState.paddle, x: (CANVAS_WIDTH - PADDLE_INITIAL_WIDTH) / 2, width: PADDLE_INITIAL_WIDTH }
            };
        }

        case 'LAUNCH_BALL': {
            const stuckBalls = state.balls.filter(b => b.dx === 0 && b.dy === 0);
            if (stuckBalls.length > 0) {
                const newBalls = state.balls.map(ball => {
                    if (ball.dx === 0 && ball.dy === 0) {
                        return { ...ball, dx: 4 + state.level * 0.5, dy: -4 - state.level * 0.5 };
                    }
                    return ball;
                });
                return { ...state, balls: newBalls, paddle: { ...state.paddle, hasGrab: false } };
            }
            return state;
        }

        case 'MOVE_PADDLE': {
            const newBalls = state.balls.map(ball => {
                if (ball.dx === 0 && ball.dy === 0) { // Ball is stuck to paddle
                    return { ...ball, x: action.payload.x + state.paddle.width / 2 };
                }
                return ball;
            });
            return { ...state, paddle: { ...state.paddle, x: action.payload.x }, balls: newBalls };
        }
        
        case 'LOSE_LIFE': {
            const newState = clearAllEffects(state);
            const newLives = newState.lives - 1;
            if (newLives <= 0) {
                return { ...newState, lives: 0, status: GameStatus.GAME_OVER };
            }
            // Reset for next life
            const newBall = createInitialBall(newState.level);
            newBall.dx = 0;
            newBall.dy = 0;
            return { ...newState, lives: newLives, status: GameStatus.PLAYING, balls: [newBall] };
        }
        
        case 'BRICK_HIT': {
            const brick = state.bricks.find(b => b.id === action.payload.brickId);
            if (!brick) return state;

            const newBricks = state.bricks.map(b => b.id === action.payload.brickId ? { ...b, active: false } : b);
            let newState: GameState = { 
                ...state, 
                score: state.score + 10, 
                bricks: newBricks,
                balls: state.balls.map(b => {
                    if (b.id === action.payload.ballId && !b.isThru) {
                        return {...b, dy: -b.dy};
                    }
                    return b;
                })
            };
            
            // Spawn shatter particles
            newState = gameReducer(newState, { type: 'SPAWN_PARTICLES', payload: { x: brick.x + brick.width / 2, y: brick.y + brick.height / 2, color: brick.color, count: 15, speed: 3 }});

            if (Math.random() < POWERUP_CHANCE) {
                newState = gameReducer(newState, {type: 'SPAWN_POWERUP', payload: {x: brick.x, y: brick.y}});
            }

            const allBricksBroken = newBricks.every(b => !b.active);
            if (allBricksBroken) {
                return { ...newState, status: GameStatus.LEVEL_COMPLETE };
            }

            return newState;
        }

        case 'SPAWN_PARTICLES': {
            const { x, y, color, count, speed } = action.payload;
            const newParticles: Particle[] = Array.from({ length: count }).map(() => ({
                id: `particle-${Date.now()}-${Math.random()}`,
                x,
                y,
                dx: (Math.random() - 0.5) * speed * 2,
                dy: (Math.random() - 0.5) * speed * 2,
                radius: Math.random() * 2 + 1,
                color,
                life: PARTICLE_LIFE,
            }));
            return { ...state, particles: [...state.particles, ...newParticles] };
        }
        
        case 'SPAWN_POWERUP': {
            const powerUpTypes = Object.keys(POWERUP_CONFIG) as PowerUpType[];
            const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
            const config = POWERUP_CONFIG[type];
            const newPowerUp: PowerUp = {
                id: `powerup-${Date.now()}`,
                type,
                ...config,
                x: action.payload.x + BRICK_WIDTH / 2 - POWERUP_WIDTH / 2,
                y: action.payload.y,
                width: POWERUP_WIDTH,
                height: POWERUP_HEIGHT,
            };
            return { ...state, powerUps: [...state.powerUps, newPowerUp] };
        }

        case 'ACTIVATE_POWERUP': {
            const { powerUp } = action.payload;
            let newState = { ...state, powerUps: state.powerUps.filter(p => p.id !== powerUp.id) };

            // Handle immediate effects
            if (powerUp.type === PowerUpType.KILL_PADDLE) return gameReducer(newState, { type: 'LOSE_LIFE' });
            if (powerUp.type === PowerUpType.SPLIT_BALL) {
                const newBalls: Ball[] = [];
                newState.balls.forEach(ball => {
                   newBalls.push({...ball, id: `${ball.id}-split-${Date.now()}`, dx: -ball.dx});
                });
                return { ...newState, balls: [...newState.balls, ...newBalls] };
            }
            if(powerUp.type === PowerUpType.GRAB_PADDLE) {
                 return { ...newState, paddle: {...newState.paddle, hasGrab: true} };
            }
            
            // Handle timed effects
            const timeoutId = setTimeout(() => {
                // This will be dispatched from the component
            }, POWERUP_DURATION);
            
            newState.activeEffects.push({ type: powerUp.type, timeoutId });

            switch(powerUp.type) {
                case PowerUpType.EXPAND_PADDLE: newState.paddle.width *= 1.5; break;
                case PowerUpType.SHRINK_PADDLE: newState.paddle.width *= 0.6; break;
                case PowerUpType.FAST_BALL: newState.balls = newState.balls.map(b => ({...b, dx: b.dx * 1.5, dy: b.dy * 1.5})); break;
                case PowerUpType.SLOW_BALL: newState.balls = newState.balls.map(b => ({...b, dx: b.dx * 0.6, dy: b.dy * 0.6})); break;
                case PowerUpType.THRU_BRICK: newState.balls = newState.balls.map(b => ({...b, isThru: true})); break;
            }
            return newState;
        }

        case 'DEACTIVATE_POWERUP': {
            const { effectType } = action.payload;
            let newState = { ...state, activeEffects: state.activeEffects.filter(e => e.type !== effectType) };
             switch(effectType) {
                case PowerUpType.EXPAND_PADDLE:
                case PowerUpType.SHRINK_PADDLE:
                    newState.paddle.width = PADDLE_INITIAL_WIDTH; break;
                case PowerUpType.FAST_BALL:
                case PowerUpType.SLOW_BALL:
                    const baseSpeed = 4 + state.level * 0.5;
                    newState.balls = newState.balls.map(b => ({...b, dx: Math.sign(b.dx) * baseSpeed, dy: Math.sign(b.dy) * baseSpeed})); 
                    break;
                case PowerUpType.THRU_BRICK: newState.balls = newState.balls.map(b => ({...b, isThru: false})); break;
                case PowerUpType.GRAB_PADDLE: newState.paddle.hasGrab = false; break;
            }
            return newState;
        }
        
        case 'UPDATE_GAME': {
            if (state.status !== GameStatus.PLAYING) return state;
            
            let newState: GameState = { ...state };

            // Update stars for twinkling background
            const updatedStars = state.stars.map(star => {
                let newAlpha = star.alpha + star.dAlpha;
                if (newAlpha < 0.2 || newAlpha > 0.7) {
                    newAlpha = Math.max(0.2, Math.min(0.7, newAlpha)); // Clamp
                    return { ...star, alpha: newAlpha, dAlpha: -star.dAlpha };
                }
                return { ...star, alpha: newAlpha };
            });
            newState.stars = updatedStars;
            
            // Update particles
            const updatedParticles = state.particles
                .map(p => ({ ...p, x: p.x + p.dx, y: p.y + p.dy, life: p.life - 1 }))
                .filter(p => p.life > 0);
            newState.particles = updatedParticles;


            // Update powerups
            const updatedPowerUps = state.powerUps
                .map(p => ({ ...p, y: p.y + POWERUP_SPEED }))
                .filter(p => p.y < CANVAS_HEIGHT);
            
             // Add trails for powerups
            updatedPowerUps.forEach(p => {
                newState = gameReducer(newState, {type: 'SPAWN_PARTICLES', payload: {x: p.x + p.width/2, y: p.y+p.height/2, color: p.category === PowerUpCategory.POSITIVE ? '#0ea5e9' : '#ef4444', count: 1, speed: 0.5}});
            });

            newState.powerUps = updatedPowerUps;

            // Check for powerup collection
            for (const powerUp of state.powerUps) {
                if (powerUp.x < state.paddle.x + state.paddle.width &&
                    powerUp.x + powerUp.width > state.paddle.x &&
                    powerUp.y + powerUp.height > CANVAS_HEIGHT - PADDLE_Y_OFFSET - PADDLE_HEIGHT &&
                    powerUp.y < CANVAS_HEIGHT - PADDLE_Y_OFFSET) 
                {
                    return gameReducer(newState, { type: 'ACTIVATE_POWERUP', payload: { powerUp } });
                }
            }
            
            // Update balls
            const nextBalls: Ball[] = [];
            let brickHitOccurred = false;

            for (const ball of state.balls) {
                 if (ball.dx === 0 && ball.dy === 0) { // Ball is stuck
                    nextBalls.push(ball);
                    continue;
                }
                 // Add ball trail
                newState = gameReducer(newState, {type: 'SPAWN_PARTICLES', payload: {x: ball.x, y: ball.y, color: ball.isThru ? '#F472B6' : '#06B6D4', count: 1, speed: 0.5}});
                
                let newBallX = ball.x + ball.dx;
                let newBallY = ball.y + ball.dy;
                let newBall = {...ball};

                // Wall collision
                if (newBallX + ball.radius > CANVAS_WIDTH || newBallX - ball.radius < 0) {
                    newBall.dx = -newBall.dx;
                    newState = gameReducer(newState, {type: 'SPAWN_PARTICLES', payload: {x: ball.x, y:ball.y, color: '#FFFFFF', count: 5, speed: 1}});
                }
                if (newBallY - ball.radius < 0) {
                    newBall.dy = -newBall.dy;
                     newState = gameReducer(newState, {type: 'SPAWN_PARTICLES', payload: {x: ball.x, y:ball.y, color: '#FFFFFF', count: 5, speed: 1}});
                }
                
                // Paddle collision
                if (newBallY + ball.radius > CANVAS_HEIGHT - PADDLE_Y_OFFSET - state.paddle.height &&
                    newBallY - ball.radius < CANVAS_HEIGHT - PADDLE_Y_OFFSET &&
                    newBallX + ball.radius > state.paddle.x &&
                    newBallX - ball.radius < state.paddle.x + state.paddle.width) {
                    
                     newState = gameReducer(newState, {type: 'SPAWN_PARTICLES', payload: {x: newBallX, y: newBallY, color: '#FFFFFF', count: 10, speed: 2}});

                    if(state.paddle.hasGrab) {
                        newBall.dx = 0;
                        newBall.dy = 0;
                        newBall.y = CANVAS_HEIGHT - PADDLE_Y_OFFSET - PADDLE_HEIGHT - ball.radius;
                    } else {
                        newBall.dy = -newBall.dy;
                        let collidePoint = newBallX - (state.paddle.x + state.paddle.width / 2);
                        newBall.dx = collidePoint * 0.1; 
                    }
                }
                
                 // Brick collision
                for (const brick of state.bricks) {
                    if (brick.active && 
                        newBallX > brick.x && newBallX < brick.x + brick.width && 
                        newBallY > brick.y && newBallY < brick.y + brick.height
                    ) {
                        brickHitOccurred = true;
                        newState = gameReducer(newState, { type: 'BRICK_HIT', payload: { brickId: brick.id, ballId: ball.id } });
                        break;
                    }
                }
                if (brickHitOccurred) continue;
                
                // Bottom wall (lose ball)
                if (newBallY + ball.radius < CANVAS_HEIGHT) {
                    nextBalls.push({...newBall, x: newBall.x + newBall.dx, y: newBall.y + newBall.dy});
                }
            }

            if (brickHitOccurred) return newState;

            newState.balls = nextBalls;

            if (newState.balls.length === 0) {
                return gameReducer(newState, { type: 'LOSE_LIFE' });
            }
            
            return newState;
        }
        default:
            return state;
    }
};

// --- DRAWING & UI ---
const drawPowerUpIcon = (ctx: CanvasRenderingContext2D, powerUp: PowerUp) => {
    const { type, x, y, width, height } = powerUp;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;

    switch (type) {
        case PowerUpType.EXPAND_PADDLE:
            ctx.fillRect(centerX - 12, centerY - 2.5, 24, 5);
            break;
        case PowerUpType.SHRINK_PADDLE:
            ctx.fillRect(centerX - 7, centerY - 2.5, 14, 5);
            break;
        case PowerUpType.FAST_BALL:
            ctx.beginPath();
            ctx.moveTo(centerX - 6, centerY + 6);
            ctx.lineTo(centerX, centerY);
            ctx.lineTo(centerX - 6, centerY - 6);
            ctx.moveTo(centerX, centerY + 6);
            ctx.lineTo(centerX + 6, centerY);
            ctx.lineTo(centerX, centerY - 6);
            ctx.stroke();
            break;
        case PowerUpType.SLOW_BALL:
            ctx.beginPath();
            ctx.moveTo(centerX - 6, centerY - 6);
            ctx.lineTo(centerX + 6, centerY - 6);
            ctx.lineTo(centerX - 6, centerY + 6);
            ctx.lineTo(centerX + 6, centerY + 6);
            ctx.closePath();
            ctx.stroke();
            break;
        case PowerUpType.SPLIT_BALL:
            ctx.beginPath();
            ctx.arc(centerX - 5, centerY, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(centerX + 5, centerY, 4, 0, Math.PI * 2);
            ctx.fill();
            break;
        case PowerUpType.GRAB_PADDLE:
            ctx.beginPath();
            ctx.moveTo(centerX - 7, centerY - 5);
            ctx.lineTo(centerX - 7, centerY + 2);
            ctx.arc(centerX, centerY + 2, 7, Math.PI, 0, false);
            ctx.lineTo(centerX + 7, centerY - 5);
            ctx.fillRect(centerX - 9, centerY - 8, 4, 4);
            ctx.fillRect(centerX + 5, centerY - 8, 4, 4);
            ctx.stroke();
            break;
        case PowerUpType.KILL_PADDLE:
            ctx.beginPath();
            ctx.arc(centerX, centerY - 2, 6, Math.PI, Math.PI * 2);
            ctx.rect(centerX - 6, centerY - 2, 12, 6);
            ctx.fill();
            ctx.fillStyle = powerUp.category === PowerUpCategory.POSITIVE ? '#0ea5e9' : '#ef4444';
            ctx.beginPath();
            ctx.arc(centerX - 3, centerY - 2, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(centerX + 3, centerY - 2, 1.5, 0, Math.PI * 2);
            ctx.fill();
            break;
        case PowerUpType.THRU_BRICK:
            ctx.beginPath();
            ctx.arc(centerX, centerY - 2, 7, Math.PI, 0);
            ctx.lineTo(centerX + 7, centerY + 7);
            ctx.quadraticCurveTo(centerX + 3.5, centerY + 5, centerX, centerY + 7);
            ctx.quadraticCurveTo(centerX - 3.5, centerY + 5, centerX - 7, centerY + 7);
            ctx.closePath();
            ctx.fill();
            break;
    }
}

const drawCanvas = (ctx: CanvasRenderingContext2D, state: GameState) => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    // Black background
    ctx.fillStyle = '#020617'; // slate-950
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Stars
    state.stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.fill();
    });
    
    // UI
    ctx.font = '20px Inter, sans-serif';
    ctx.fillStyle = '#E2E8F0';
    ctx.shadowColor = '#E2E8F0';
    ctx.shadowBlur = 5;
    ctx.fillText(`Score: ${state.score}`, 20, 40);
    ctx.fillText(`Level: ${state.level}`, CANVAS_WIDTH / 2 - 40, 40);
    ctx.fillText(`Lives: ${'❤️'.repeat(state.lives)}`, CANVAS_WIDTH - 120, 40);
    ctx.shadowBlur = 0;

    // Bricks
    state.bricks.forEach(brick => {
        if (brick.active) {
            ctx.beginPath();
            ctx.rect(brick.x, brick.y, brick.width, brick.height);
            ctx.fillStyle = brick.color;
            ctx.shadowColor = brick.color;
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    });

    // Paddle
    const paddleColor = state.paddle.hasGrab ? '#F59E0B' : '#6366F1';
    ctx.beginPath();
    ctx.rect(state.paddle.x, CANVAS_HEIGHT - PADDLE_Y_OFFSET - state.paddle.height, state.paddle.width, state.paddle.height);
    ctx.fillStyle = paddleColor;
    ctx.shadowColor = paddleColor;
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Balls
    state.balls.forEach(ball => {
        if(ball.isThru) { // Fireball effect
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#F43F5E';
            ctx.fillStyle = '#F43F5E';
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius * 1.2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#FBBF24';
            ctx.fillStyle = '#FBBF24';
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius * 0.8, 0, Math.PI * 2);
            ctx.fill();
            
        } else {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#06B6D4';
            ctx.fillStyle = '#06B6D4';
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    });
     ctx.shadowBlur = 0;

    // Particles
    state.particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.globalAlpha = p.life / PARTICLE_LIFE;
        ctx.fillStyle = p.color;
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // PowerUps
    state.powerUps.forEach(p => {
        const pColor = p.category === PowerUpCategory.POSITIVE ? '#0ea5e9' : '#ef4444';
        ctx.shadowColor = pColor;
        ctx.shadowBlur = 15;
        ctx.fillStyle = pColor;
        
        ctx.beginPath();
        if (ctx.roundRect) {
             ctx.roundRect(p.x, p.y, p.width, p.height, [12]);
        } else {
            ctx.rect(p.x, p.y, p.width, p.height);
        }
        ctx.fill();
        ctx.shadowBlur = 0;
        
        drawPowerUpIcon(ctx, p);
    });
};

// --- MAIN COMPONENT ---
const GamePage: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [state, dispatch] = useReducer(gameReducer, undefined, getInitialState);
    const animationFrameId = useRef<number | null>(null);
    
    useEffect(() => {
        state.activeEffects.forEach(effect => {
            clearTimeout(effect.timeoutId);
            const newTimeoutId = setTimeout(() => {
                dispatch({ type: 'DEACTIVATE_POWERUP', payload: { effectType: effect.type } });
            }, POWERUP_DURATION);
            effect.timeoutId = newTimeoutId as unknown as number;
        });
    }, [state.activeEffects.length]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const relativeX = e.clientX - rect.left;
        let paddleX = relativeX - state.paddle.width / 2;
        if (paddleX < 0) paddleX = 0;
        if (paddleX + state.paddle.width > CANVAS_WIDTH) paddleX = CANVAS_WIDTH - state.paddle.width;
        dispatch({ type: 'MOVE_PADDLE', payload: { x: paddleX } });
    }, [state.paddle.width]);

    const handleClick = useCallback(() => {
        if (state.status === GameStatus.PLAYING) {
            dispatch({ type: 'LAUNCH_BALL' });
        }
    }, [state.status]);
    
    const gameLoop = useCallback(() => {
        dispatch({ type: 'UPDATE_GAME' });
        animationFrameId.current = requestAnimationFrame(gameLoop);
    }, []);

    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) drawCanvas(ctx, state);
    }, [state]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (state.status === GameStatus.PLAYING) {
            animationFrameId.current = requestAnimationFrame(gameLoop);
            window.addEventListener('mousemove', handleMouseMove);
            canvas?.addEventListener('click', handleClick);
        } else {
             if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
             window.removeEventListener('mousemove', handleMouseMove);
             canvas?.removeEventListener('click', handleClick);
        }
        return () => {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            window.removeEventListener('mousemove', handleMouseMove);
            canvas?.removeEventListener('click', handleClick);
            state.activeEffects.forEach(effect => clearTimeout(effect.timeoutId));
        };
    }, [state.status, gameLoop, handleMouseMove, handleClick, state.activeEffects]);
    
    const renderOverlay = () => {
        let title = '';
        let buttonText = '';
        let show = false;

        switch (state.status) {
            case GameStatus.MENU:
                title = 'DX BALL: POWER-UP MADNESS';
                buttonText = 'Start Game';
                show = true;
                break;
            case GameStatus.GAME_OVER:
                title = "GAME OVER";
                buttonText = 'Try Again';
                show = true;
                break;
            case GameStatus.LEVEL_COMPLETE:
                title = `LEVEL ${state.level} COMPLETE!`;
                buttonText = `Start Level ${state.level + 1}`;
                show = true;
                break;
        }

        if (!show) return null;

        const handleButtonClick = () => {
            dispatch({type: 'START_LEVEL'});
        }

        return (
            <div className="absolute inset-0 bg-slate-900 bg-opacity-80 flex flex-col justify-center items-center backdrop-blur-sm z-10 transition-opacity duration-500">
                <h2 className="text-5xl font-extrabold text-white mb-4 text-center drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">{title}</h2>
                <p className="text-2xl text-slate-300 mb-8">Score: {state.score}</p>
                <button 
                    onClick={handleButtonClick}
                    className="px-8 py-4 bg-cyan-500 text-white font-bold text-xl rounded-lg shadow-lg hover:bg-cyan-600 transform hover:scale-105 transition-all duration-300 shadow-cyan-500/50 hover:shadow-cyan-400/60">
                    {buttonText}
                </button>
            </div>
        )
    }

    return (
    <div className="flex flex-col justify-center items-center p-4 sm:p-8">
        <div className="relative shadow-2xl shadow-cyan-500/20" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
            <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="bg-slate-900 rounded-lg cursor-pointer"
            />
            {renderOverlay()}
        </div>
        <div className="mt-4 text-center text-slate-400 max-w-2xl">
            <p><strong className="text-cyan-400">How to Play:</strong> Move the mouse to control the paddle. Click to launch the ball.</p>
            <p><strong className="text-cyan-400">Power-Ups:</strong> Catch falling blocks! Cyan ones are good, Red ones are bad. Good luck!</p>
        </div>
    </div>
    );
};

export default GamePage;