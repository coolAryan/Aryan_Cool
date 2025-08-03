
// --- Visual Effects Types ---
export interface Particle {
  id: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  color: string;
  life: number; // lifespan in frames
}

export interface Star {
    x: number;
    y: number;
    radius: number;
    alpha: number;
    dAlpha: number;
}


// --- PowerUp System Types ---
export enum PowerUpType {
  EXPAND_PADDLE = 'Expand Paddle',
  SHRINK_PADDLE = 'Shrink Paddle',
  FAST_BALL = 'Fast Ball',
  SLOW_BALL = 'Slow Ball',
  SPLIT_BALL = 'Split Ball',
  GRAB_PADDLE = 'Grab Paddle',
  KILL_PADDLE = 'Kill Paddle',
  THRU_BRICK = 'Thru-Brick',
}

export enum PowerUpCategory {
  POSITIVE,
  NEGATIVE
}

export interface PowerUp {
  id: string;
  type: PowerUpType;
  category: PowerUpCategory;
  x: number;
  y: number;
  width: number;
  height: number;
  symbol: string;
}

export interface ActiveEffect {
    type: PowerUpType;
    timeoutId: number;
}


// --- Game Core Types ---
export interface Brick {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  active: boolean;
}

export interface Ball {
  id: string;
  x: number;
  y: number;
  radius: number;
  dx: number;
  dy: number;
  isThru: boolean;
}

export interface Paddle {
  x: number;
  width: number;
  height: number;
  hasGrab: boolean;
}

export enum GameStatus {
  MENU,
  PLAYING,
  LEVEL_COMPLETE,
  GAME_OVER,
}

// --- Portfolio Types ---
export interface PortfolioItem {
    name: string;
    description: string;
}

export interface LinkItem {
  name: string;
  url: string;
}