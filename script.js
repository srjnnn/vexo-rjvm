class PianoTilesGame {
    constructor() {
        this.gameBoard = document.getElementById('gameBoard');
        this.scoreElement = document.getElementById('score');
        this.livesElement = document.getElementById('lives');
        this.levelElement = document.getElementById('level');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.gameOverModal = document.getElementById('gameOverModal');
        this.finalScoreElement = document.getElementById('finalScore');
        this.finalLevelElement = document.getElementById('finalLevel');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.speedSlider = document.getElementById('speedSlider');
        this.speedValue = document.getElementById('speedValue');
        
        this.gameState = 'stopped'; 
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.tiles = [];
        this.baseGameSpeed = 2000;
        this.gameSpeed = 2000;
        this.baseTileSpeed = 1.5;
        this.tileSpeed = 1.5; 
        this.speedMultiplier = 1.0; 
        this.gameLoop = null;
        this.tileSpawnTimer = null;
        this.lastFrameTime = 0;
        
        this.letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        this.boardWidth = 0;
        this.tileWidth = 80;
        this.tileHeight = 60;
        this.maxTilesPerRow = 0;
        
        this.init();
    }
    
    init() {
        this.calculateBoardDimensions();
        this.setupEventListeners();
        this.updateDisplay();
    }
    
    calculateBoardDimensions() {
        const boardRect = this.gameBoard.getBoundingClientRect();
        this.boardWidth = boardRect.width;
        this.maxTilesPerRow = Math.floor(this.boardWidth / (this.tileWidth + 10));
    }
    
    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.resetBtn.addEventListener('click', () => this.resetGame());
        this.playAgainBtn.addEventListener('click', () => this.resetGame());
        this.speedSlider.addEventListener('input', (e) => this.updateSpeed(e.target.value));
        
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.calculateBoardDimensions();
        });
    }
    
    startGame() {
        if (this.gameState === 'stopped' || this.gameState === 'gameOver') {
            // Ensure the board is completely clear before starting
            this.clearBoard();
            
            this.gameState = 'playing';
            this.startBtn.disabled = true;
            this.pauseBtn.disabled = false;
            this.startGameLoop();
            this.startTileSpawning();
        }
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.pauseBtn.textContent = 'Resume';
            this.pauseGame();
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.pauseBtn.textContent = 'Pause';
            this.resumeGame();
        }
    }
    
    resetGame() {
        this.stopGame();
        
        this.clearBoard();
        
        this.gameState = 'stopped';
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.tiles = [];
        this.gameSpeed = this.baseGameSpeed;
        this.tileSpeed = this.baseTileSpeed;
        this.speedMultiplier = parseFloat(this.speedSlider.value);
        
        this.updateDisplay();
        this.hideGameOverModal();
        
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.pauseBtn.textContent = 'Pause';
        
        this.gameBoard.innerHTML = '';
    }
    
    startGameLoop() {
        const gameLoop = (currentTime) => {
            if (this.gameState === 'playing') {
                const deltaTime = currentTime - this.lastFrameTime;
                this.lastFrameTime = currentTime;
                
                this.updateGame(deltaTime);
                requestAnimationFrame(gameLoop);
            }
        };
        this.lastFrameTime = performance.now();
        requestAnimationFrame(gameLoop);
    }
    
    startTileSpawning() {
        this.tileSpawnTimer = setInterval(() => {
            this.spawnTile();
        }, this.gameSpeed);
    }
    
    pauseGame() {
        this.gameLoop = null;
        if (this.tileSpawnTimer) {
            clearInterval(this.tileSpawnTimer);
            this.tileSpawnTimer = null;
        }
    }
    
    resumeGame() {
        this.startGameLoop();
        this.startTileSpawning();
    }
    
    stopGame() {
        this.gameLoop = null;
        if (this.tileSpawnTimer) {
            clearInterval(this.tileSpawnTimer);
            this.tileSpawnTimer = null;
        }
    }
    
    spawnTile() {
        if (this.gameState !== 'playing') return;
        
        const letter = this.letters[Math.floor(Math.random() * this.letters.length)];
        const maxPosition = this.maxTilesPerRow - 1;
        const position = Math.floor(Math.random() * maxPosition);
        
        const tile = {
            id: Date.now() + Math.random(),
            letter: letter,
            x: position * (this.tileWidth + 10) + 5,
            y: -this.tileHeight,
            element: null,
            hit: false
        };
        
        this.createTileElement(tile);
        this.tiles.push(tile);
    }
    
    createTileElement(tile) {
        const tileElement = document.createElement('div');
        tileElement.className = 'tile';
        tileElement.textContent = tile.letter;
        tileElement.style.left = tile.x + 'px';
        tileElement.style.top = '0px';
        tileElement.style.transform = `translate3d(0, ${tile.y}px, 0)`;
        
        this.gameBoard.appendChild(tileElement);
        tile.element = tileElement;
    }
    
    updateGame(deltaTime) {
        if (!this.isGameActive()) return;
        
        this.moveTiles(deltaTime);
        this.checkGameOver();
    }
    
    moveTiles(deltaTime) {
        const speedMultiplier = deltaTime / 16.67; 
        const adjustedSpeed = this.tileSpeed * speedMultiplier;
        
        for (let i = this.tiles.length - 1; i >= 0; i--) {
            const tile = this.tiles[i];
            if (!tile.hit) {
                tile.y += adjustedSpeed;
                
                tile.element.style.transform = `translate3d(0, ${tile.y}px, 0)`;
                
                const gameBoardHeight = this.gameBoard.offsetHeight;
                if (tile.y > gameBoardHeight) {
                    this.missTile(tile, i);
                }
            }
        }
    }
    
    handleKeyPress(event) {
        if (!this.isGameActive()) return;
        
        const pressedKey = event.key.toUpperCase();
        const tileIndex = this.tiles.findIndex(tile => 
            !tile.hit && tile.letter === pressedKey
        );
        
        if (tileIndex !== -1) {
            this.hitTile(tileIndex);
        }
    }
    
    hitTile(tileIndex) {
        const tile = this.tiles[tileIndex];
        if (!tile || tile.hit) return; 
        
        tile.hit = true;
        tile.element.classList.add('hit');
        
        this.score += 10;
        this.updateDisplay();
        
        setTimeout(() => {
            this.removeTileById(tile.id);
        }, 300);
        
        this.checkLevelUp();
    }
    
    missTile(tile, index) {
        if (tile.hit) return;
        
        tile.hit = true;
        tile.element.classList.add('missed');
        this.lives--;
        this.updateDisplay();
        
        setTimeout(() => {
            this.removeTileById(tile.id);
        }, 300);
        
        if (this.lives <= 0) {
            this.gameOver();
        }
    }
    
    removeTile(index) {
        if (index >= 0 && index < this.tiles.length) {
            const tile = this.tiles[index];
            if (tile.element && tile.element.parentNode) {
                tile.element.parentNode.removeChild(tile.element);
            }
            this.tiles.splice(index, 1);
        }
    }
    
    removeTileById(tileId) {
        const index = this.tiles.findIndex(tile => tile.id === tileId);
        if (index !== -1) {
            const tile = this.tiles[index];
            if (tile.element && tile.element.parentNode) {
                tile.element.parentNode.removeChild(tile.element);
            }
            this.tiles.splice(index, 1);
        }
    }
    
    checkLevelUp() {
        const newLevel = Math.floor(this.score / 100) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.increaseDifficulty();
            this.updateDisplay();
        }
    }
    
    increaseDifficulty() {
        this.baseTileSpeed = Math.min(this.baseTileSpeed + 0.3, 6);
        this.baseGameSpeed = Math.max(this.baseGameSpeed - 100, 500);
        
        this.tileSpeed = this.baseTileSpeed * this.speedMultiplier;
        this.gameSpeed = this.baseGameSpeed / this.speedMultiplier;
        
        if (this.tileSpawnTimer) {
            clearInterval(this.tileSpawnTimer);
            this.startTileSpawning();
        }
    }
    
    checkGameOver() {
        if (this.lives <= 0) {
            this.gameOver();
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.stopGame();
        this.showGameOverModal();
    }
    
    showGameOverModal() {
        this.finalScoreElement.textContent = this.score;
        this.finalLevelElement.textContent = this.level;
        this.gameOverModal.style.display = 'flex';
    }
    
    hideGameOverModal() {
        this.gameOverModal.style.display = 'none';
    }
    
    clearBoard() {
        this.tiles.forEach(tile => {
            if (tile.element && tile.element.parentNode) {
                tile.element.parentNode.removeChild(tile.element);
            }
        });
        
        this.tiles = [];
        
        const gameBoardElements = this.gameBoard.querySelectorAll('.tile');
        gameBoardElements.forEach(element => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        
        this.gameBoard.innerHTML = '';
    }
    
    isGameActive() {
        return this.gameState === 'playing' && this.lives > 0;
    }
    
    updateSpeed(speedValue) {
        this.speedMultiplier = parseFloat(speedValue);
        this.speedValue.textContent = this.speedMultiplier.toFixed(1) + 'x';
        
        this.gameSpeed = this.baseGameSpeed / this.speedMultiplier;
        this.tileSpeed = this.baseTileSpeed * this.speedMultiplier;
        
        if (this.gameState === 'playing' && this.tileSpawnTimer) {
            clearInterval(this.tileSpawnTimer);
            this.startTileSpawning();
        }
    }
    
    updateDisplay() {
        this.scoreElement.textContent = this.score;
        this.livesElement.textContent = this.lives;
        this.levelElement.textContent = this.level;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PianoTilesGame();
});
