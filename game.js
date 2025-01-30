const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score-display');
const highScoreDisplay = document.getElementById('high-score-display');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const moodButtons = document.querySelectorAll('.mood-btn');

// Game Constants
let GRID_SIZE = 20;
let TILE_COUNT;
let snake = [];
let food = {};
let direction = 'right';
let nextDirection = 'right';
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameLoop;
let isPaused = false;
let currentMood = 'classic';

const MOODS = {
    classic: {
        snakeHead: '#2ecc71',
        snakeBody: '#27ae60',
        foodColor: '#e74c3c',
        bgColor: '#34495e'
    },
    neon: {
        snakeHead: '#9b59b6',
        snakeBody: '#8e44ad',
        foodColor: '#2ecc71',
        bgColor: '#2c3e50'
    },
    dark: {
        snakeHead: '#34495e',
        snakeBody: '#2c3e50',
        foodColor: '#e67e22',
        bgColor: '#2c3e50'
    }
};

const FRUITS = [
    { symbol: '🍎', color: '#e74c3c' },
    { symbol: '🍇', color: '#9b59b6' },
    { symbol: '🍊', color: '#e67e22' },
    { symbol: '🍌', color: '#f1c40f' }
];

// Game Initialization
function initGame() {
    snake = [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
        { x: 3, y: 5 }
    ];
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    scoreDisplay.textContent = `Score: ${score}`;
    highScoreDisplay.textContent = `High Score: ${highScore}`;
    createFood();
    isPaused = false;
    resizeCanvas();
    draw();
}

function createFood() {
    do {
        food = {
            x: Math.floor(Math.random() * TILE_COUNT),
            y: Math.floor(Math.random() * TILE_COUNT),
            ...FRUITS[Math.floor(Math.random() * FRUITS.length)]
        };
    } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
}

// Drawing Functions
function draw() {
    ctx.fillStyle = MOODS[currentMood].bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw snake
    snake.forEach((segment, index) => {
        const size = GRID_SIZE * (0.9 - (index * 0.02));
        const x = segment.x * GRID_SIZE + (GRID_SIZE - size) / 2;
        const y = segment.y * GRID_SIZE + (GRID_SIZE - size) / 2;

        const gradient = ctx.createRadialGradient(
            x + size/2, y + size/2, size/4,
            x + size/2, y + size/2, size/1.5
        );
        gradient.addColorStop(0, MOODS[currentMood].snakeHead);
        gradient.addColorStop(1, MOODS[currentMood].snakeBody);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(
            x + size/2, 
            y + size/2, 
            size/2, 
            size/1.5, 
            Math.PI/4, 
            0, 
            2 * Math.PI
        );
        ctx.fill();

        if (index === 0) {
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(x + size/3, y + size/4, 2, 0, Math.PI * 2);
            ctx.arc(x + size - size/3, y + size/4, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Draw fruit
    const foodSize = GRID_SIZE * 0.8;
    const foodX = food.x * GRID_SIZE + (GRID_SIZE - foodSize)/2;
    const foodY = food.y * GRID_SIZE + (GRID_SIZE - foodSize)/2;

    ctx.fillStyle = food.color;
    ctx.beginPath();
    ctx.arc(foodX + foodSize/2, foodY + foodSize/2, foodSize/2, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `${foodSize * 0.8}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText(food.symbol, foodX + foodSize/2, foodY + foodSize/2 + 2);
}

// Game Logic
function move() {
    if (isPaused) return;

    direction = nextDirection;
    const head = { x: snake[0].x, y: snake[0].y };

    switch (direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }

    // Collision detection
    if (head.x < 0 || head.x >= TILE_COUNT || 
        head.y < 0 || head.y >= TILE_COUNT ||
        snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreDisplay.textContent = `Score: ${score}`;
        createFood();
    } else {
        snake.pop();
    }

    draw();
}

function gameOver() {
    clearInterval(gameLoop);
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreDisplay.textContent = `High Score: ${highScore}`;
    }
    startBtn.textContent = 'Restart';
    startBtn.disabled = false;
    alert(`Game Over! Score: ${score}`);
}

// Controls
function setupControls() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (isPaused) return;
        
        switch (e.key) {
            case 'ArrowUp':
                if (direction !== 'down') nextDirection = 'up';
                break;
            case 'ArrowDown':
                if (direction !== 'up') nextDirection = 'down';
                break;
            case 'ArrowLeft':
                if (direction !== 'right') nextDirection = 'left';
                break;
            case 'ArrowRight':
                if (direction !== 'left') nextDirection = 'right';
                break;
        }
    });

    // Mobile controls
    document.querySelectorAll('.arrow').forEach(button => {
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleControl(button.classList[1]);
        });
        button.addEventListener('mousedown', (e) => {
            e.preventDefault();
            handleControl(button.classList[1]);
        });
    });

    // Mood selection
    moodButtons.forEach(button => {
        button.addEventListener('click', () => {
            moodButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentMood = button.classList[1];
            draw();
        });
    });

    // Game buttons
    startBtn.addEventListener('click', () => {
        if (!isPaused) initGame();
        startGame();
    });
    
    pauseBtn.addEventListener('click', togglePause);
}

function handleControl(directionKey) {
    if (isPaused) return;
    const newDirection = {
        up: 'up', down: 'down', left: 'left', right: 'right'
    }[directionKey];
    
    if ((newDirection === 'up' && direction !== 'down') ||
        (newDirection === 'down' && direction !== 'up') ||
        (newDirection === 'left' && direction !== 'right') ||
        (newDirection === 'right' && direction !== 'left')) {
        nextDirection = newDirection;
    }
}

function togglePause() {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
}

// Game Loop
function startGame() {
    if (gameLoop) clearInterval(gameLoop);
    startBtn.disabled = true;
    gameLoop = setInterval(move, 100);
}

// Responsive Design
function resizeCanvas() {
    const containerWidth = document.querySelector('.game-container').offsetWidth;
    const maxSize = Math.min(400, containerWidth - 40);
    canvas.width = maxSize;
    canvas.height = maxSize;
    GRID_SIZE = Math.floor(maxSize / 20);
    TILE_COUNT = Math.floor(canvas.width / GRID_SIZE);
}

window.addEventListener('resize', () => {
    resizeCanvas();
    createFood();
    draw();
});

// Initialize Game
setupControls();
resizeCanvas();
initGame();