const ANIMALS = ['🐰', '🦊', '🦌', '🐻', '🐦', '🐿'];
const BOARD_SIZE = 10;
const INITIAL_MOVES = 30;

const state = {
  board: [],
  score: 0,
  moves: INITIAL_MOVES,
  selectedCell: null,
  isAnimating: false
};

function init() {
  state.board = [];
  state.score = 0;
  state.moves = INITIAL_MOVES;
  state.selectedCell = null;
  state.isAnimating = false;

  generateBoard();
  renderBoard();
  updateHUD();
  document.getElementById('game-over').classList.add('hidden');
}

function generateBoard() {
  for (let row = 0; row < BOARD_SIZE; row++) {
    state.board[row] = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      let animal;
      do {
        animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
      } while (wouldCreateMatch(row, col, animal));
      state.board[row][col] = animal;
    }
  }
}

function wouldCreateMatch(row, col, animal) {
  // Check horizontal (left 2)
  if (col >= 2 &&
      state.board[row][col - 1] === animal &&
      state.board[row][col - 2] === animal) {
    return true;
  }
  // Check vertical (up 2)
  if (row >= 2 &&
      state.board[row - 1] && state.board[row - 1][col] === animal &&
      state.board[row - 2] && state.board[row - 2][col] === animal) {
    return true;
  }
  return false;
}

function renderBoard() {
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.textContent = state.board[row][col];
      cell.addEventListener('click', () => handleCellClick(row, col));
      boardEl.appendChild(cell);
    }
  }
}

function updateHUD() {
  document.getElementById('score').textContent = state.score;
  document.getElementById('moves').textContent = state.moves;
}

document.getElementById('restart-btn').addEventListener('click', init);
document.getElementById('play-again-btn').addEventListener('click', init);

function handleCellClick(row, col) {
  if (state.isAnimating || state.moves <= 0) return;

  const clickedCell = { row, col };

  if (!state.selectedCell) {
    // First selection
    state.selectedCell = clickedCell;
    highlightCell(row, col, true);
  } else if (state.selectedCell.row === row && state.selectedCell.col === col) {
    // Clicked same cell - deselect
    highlightCell(row, col, false);
    state.selectedCell = null;
  } else if (isAdjacent(state.selectedCell, clickedCell)) {
    // Adjacent cell - attempt swap
    highlightCell(state.selectedCell.row, state.selectedCell.col, false);
    attemptSwap(state.selectedCell, clickedCell);
    state.selectedCell = null;
  } else {
    // Non-adjacent - change selection
    highlightCell(state.selectedCell.row, state.selectedCell.col, false);
    state.selectedCell = clickedCell;
    highlightCell(row, col, true);
  }
}

function isAdjacent(cell1, cell2) {
  const rowDiff = Math.abs(cell1.row - cell2.row);
  const colDiff = Math.abs(cell1.col - cell2.col);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

function highlightCell(row, col, highlight) {
  const index = row * BOARD_SIZE + col;
  const cell = document.getElementById('board').children[index];
  if (cell) {
    cell.classList.toggle('selected', highlight);
  }
}

function attemptSwap(cell1, cell2) {
  state.isAnimating = true;

  // Perform swap in state
  const temp = state.board[cell1.row][cell1.col];
  state.board[cell1.row][cell1.col] = state.board[cell2.row][cell2.col];
  state.board[cell2.row][cell2.col] = temp;

  // Re-render to show swap
  renderBoard();

  // Check for matches
  const matches = findAllMatches();

  if (matches.length === 0) {
    // No match - swap back
    setTimeout(() => {
      state.board[cell2.row][cell2.col] = state.board[cell1.row][cell1.col];
      state.board[cell1.row][cell1.col] = temp;
      renderBoard();
      state.isAnimating = false;
    }, 300);
  } else {
    // Valid move - process matches
    state.moves--;
    updateHUD();
    processMatches(matches);
  }
}

function findAllMatches() {
  const matches = [];

  // Find horizontal matches
  for (let row = 0; row < BOARD_SIZE; row++) {
    let matchStart = 0;
    let matchLength = 1;

    for (let col = 1; col <= BOARD_SIZE; col++) {
      if (col < BOARD_SIZE && state.board[row][col] === state.board[row][matchStart]) {
        matchLength++;
      } else {
        if (matchLength >= 3) {
          for (let i = matchStart; i < matchStart + matchLength; i++) {
            matches.push({ row, col: i, length: matchLength, animal: state.board[row][matchStart] });
          }
        }
        matchStart = col;
        matchLength = 1;
      }
    }
  }

  // Find vertical matches
  for (let col = 0; col < BOARD_SIZE; col++) {
    let matchStart = 0;
    let matchLength = 1;

    for (let row = 1; row <= BOARD_SIZE; row++) {
      if (row < BOARD_SIZE && state.board[row][col] === state.board[matchStart][col]) {
        matchLength++;
      } else {
        if (matchLength >= 3) {
          for (let i = matchStart; i < matchStart + matchLength; i++) {
            matches.push({ row: i, col, length: matchLength, animal: state.board[matchStart][col] });
          }
        }
        matchStart = row;
        matchLength = 1;
      }
    }
  }

  return matches;
}

function processMatches(matches) {
  let chainCount = 1;

  function process() {
    if (matches.length === 0) {
      // Check for game over
      if (state.moves <= 0) {
        showGameOver();
      }
      state.isAnimating = false;
      return;
    }

    // Identify special matches (4+ and 5+)
    const specials = {};
    matches.forEach(m => {
      if (m.length >= 5 && !specials[m.animal]) {
        specials[m.animal] = 'lightning';
      } else if (m.length === 4 && !specials[`${m.row},${m.col}`]) {
        specials[`${m.row},${m.col}`] = 'bomb';
      }
    });

    // Calculate score
    let points = 0;
    matches.forEach(m => {
      if (m.length >= 5) {
        points += 50;
      } else if (m.length === 4) {
        points += 20;
      } else {
        points += 10;
      }
    });
    points += chainCount * 10; // chain bonus
    state.score += points;
    updateHUD();

    // Collect cells to remove (including lightning/board clear, bomb/row)
    const toRemove = new Set();
    const bombRows = new Set();

    matches.forEach(m => {
      // Lightning: 5+ removes all of that animal
      if (m.length >= 5) {
        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            if (state.board[r][c] === m.animal) {
              toRemove.add(`${r},${c}`);
            }
          }
        }
      }
      // Bomb: 4 removes entire row
      else if (m.length === 4) {
        bombRows.add(m.row);
        for (let c = 0; c < BOARD_SIZE; c++) {
          toRemove.add(`${m.row},${c}`);
        }
      }
      // Normal 3
      else {
        toRemove.add(`${m.row},${m.col}`);
      }
    });

    // Apply animations
    toRemove.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      const index = r * BOARD_SIZE + c;
      const cell = document.getElementById('board').children[index];
      if (cell) {
        if (bombRows.has(r)) {
          cell.classList.add('bomb');
        } else if (matches.some(m => m.row === r && m.col === c && m.length >= 5)) {
          cell.classList.add('lightning');
        }
      }
    });

    // Remove matched animals from state
    toRemove.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      state.board[r][c] = null;
    });

    // After animation, cascade and check again
    setTimeout(() => {
      cascadeAndRefill(() => {
        chainCount++;
        matches = findAllMatches();
        process();
      });
    }, 350);
  }

  process();
}

function cascadeAndRefill(callback) {
  let hasFallen = false;

  // Cascade: move animals down to fill nulls
  for (let col = 0; col < BOARD_SIZE; col++) {
    let writeRow = BOARD_SIZE - 1;
    for (let row = BOARD_SIZE - 1; row >= 0; row--) {
      if (state.board[row][col] !== null) {
        if (writeRow !== row) {
          state.board[writeRow][col] = state.board[row][col];
          state.board[row][col] = null;
          hasFallen = true;
        }
        writeRow--;
      }
    }

    // Fill remaining with new animals
    for (let row = writeRow; row >= 0; row--) {
      state.board[row][col] = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
      hasFallen = true;
    }
  }

  renderBoard();

  // Add cascade animation class to new/fallen cells
  if (hasFallen) {
    const cells = document.getElementById('board').children;
    for (let i = 0; i < cells.length; i++) {
      cells[i].classList.add('cascade');
      setTimeout(() => cells[i].classList.remove('cascade'), 300);
    }
  }

  setTimeout(callback, 300);
}

function showGameOver() {
  document.getElementById('final-score').textContent = state.score;
  document.getElementById('game-over').classList.remove('hidden');
}

init();