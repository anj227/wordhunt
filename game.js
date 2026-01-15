// Embedded word dictionary - Common English words (4+ letters)

// Game state
let gameState = {
    letters: [],
    centerLetter: '',
    foundWords: [],
    score: 0,
    possibleWords: [],
    maxScore: 0
};

// Rank thresholds (based on percentage of max score)
const RANKS = [
    { name: 'Beginner', threshold: 0 },
    { name: 'Good Start', threshold: 0.02 },
    { name: 'Moving Up', threshold: 0.05 },
    { name: 'Good', threshold: 0.08 },
    { name: 'Solid', threshold: 0.15 },
    { name: 'Nice', threshold: 0.25 },
    { name: 'Great', threshold: 0.40 },
    { name: 'Amazing', threshold: 0.50 },
    { name: 'Genius', threshold: 0.70 }
];

// DOM elements
const letterBtns = document.querySelectorAll('.letter-btn');
const centerLetterBtn = document.getElementById('centerLetter');
const wordInput = document.getElementById('wordInput');
const submitBtn = document.getElementById('submitBtn');
const deleteBtn = document.getElementById('deleteBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const newGameBtn = document.getElementById('newGame');
const messageEl = document.getElementById('message');
const scoreEl = document.getElementById('score');
const rankEl = document.getElementById('rank');
const wordCountEl = document.getElementById('wordCount');
const foundCountEl = document.getElementById('foundCount');
const wordListEl = document.getElementById('wordList');

// Modal elements
const customGameBtn = document.getElementById('customGame');
const modal = document.getElementById('customModal');
const closeModal = document.querySelector('.close');
const customLettersInput = document.getElementById('customLetters');
const centerLetterSelect = document.getElementById('centerLetterSelect');
const startCustomBtn = document.getElementById('startCustom');
const customErrorEl = document.getElementById('customError');

// Answers modal elements
const showAnswersBtn = document.getElementById('showAnswers');
const answersModal = document.getElementById('answersModal');
const closeAnswersModal = document.querySelector('.close-answers');
const userScoreEl = document.getElementById('userScore');
const maxScoreDisplayEl = document.getElementById('maxScoreDisplay');
const percentageDisplayEl = document.getElementById('percentageDisplay');
const foundWordsCountEl = document.getElementById('foundWordsCount');
const missedWordsCountEl = document.getElementById('missedWordsCount');
const foundWordsListEl = document.getElementById('foundWordsList');
const missedWordsListEl = document.getElementById('missedWordsList');

// Initialize game
function initGame() {
    generatePuzzle();
    renderLetters();
    loadGameState();
    updateUI();
}

// Generate a new puzzle
function generatePuzzle(customLetters = null, customCenter = null) {
    // If custom letters provided; use them directly
    if (customLetters && customCenter) {
        const possibleWords = findPossibleWords(customLetters, customCenter);
        gameState.letters = customLetters;
        gameState.centerLetter = customCenter;
        gameState.possibleWords = possibleWords;
        gameState.maxScore = calculateMaxScore(possibleWords);
        gameState.foundWords = [];
        gameState.score = 0;
        return;
    }

    // Find a good set of 7 letters that produces many valid words
    let bestPuzzle = null;
    let maxWords = 0;

    // Helper function to check if there's at least one pangram
    const hasPangram = (words, letters) => {
        return words.some(word => {
            const uniqueLetters = new Set(word.toLowerCase());
            return uniqueLetters.size === letters.length;
        });
    };

    // Try multiple random combinations to find a good puzzle
    for (let attempts = 0; attempts < 100; attempts++) {
        const letters = generateRandomLetters();
        const centerLetter = letters[Math.floor(Math.random() * 7)];
        const possibleWords = findPossibleWords(letters, centerLetter);

        // Check if this puzzle has at least one pangram
        const hasValidPangram = hasPangram(possibleWords, letters);

        if (possibleWords.length > maxWords && hasValidPangram) {
            maxWords = possibleWords.length;
            bestPuzzle = { letters, centerLetter, possibleWords };
        }

        // If we found a puzzle with at least 20 words and a pangram; that's good enough
        if (possibleWords.length >= 20 && hasValidPangram) {
            break;
        }
    }

    if (bestPuzzle) {
        gameState.letters = bestPuzzle.letters;
        gameState.centerLetter = bestPuzzle.centerLetter;
        gameState.possibleWords = bestPuzzle.possibleWords;
        gameState.maxScore = calculateMaxScore(bestPuzzle.possibleWords);
        gameState.foundWords = [];
        gameState.score = 0;
    }
}

// Generate 7 random unique letters with common vowels
function generateRandomLetters() {
    const vowels = 'aeiou';
    const consonants = 'bcdfghjklmnprstvwyz';
    const letters = new Set();

    // Add 2-3 vowels
    const numVowels = 2 + Math.floor(Math.random() * 2);
    while (letters.size < numVowels) {
        letters.add(vowels[Math.floor(Math.random() * vowels.length)]);
    }

    // Fill rest with consonants
    while (letters.size < 7) {
        letters.add(consonants[Math.floor(Math.random() * consonants.length)]);
    }

    return Array.from(letters);
}

// Find all valid words for this puzzle
function findPossibleWords(letters, centerLetter) {
    return DICTIONARY.filter(word => {
        if (word.length < 4) return false;
        if (!word.includes(centerLetter)) return false;

        const wordLetters = word.split('');
        return wordLetters.every(letter => letters.includes(letter));
    });
}

// Calculate maximum possible score
function calculateMaxScore(words) {
    return words.reduce((total, word) => total + calculateWordScore(word), 0);
}

// Calculate score for a single word
function calculateWordScore(word) {
    let score = word.length === 4 ? 1 : word.length;

    // Pangram bonus (uses all 7 letters)
    const uniqueLetters = new Set(word.split(''));
    if (uniqueLetters.size === 7) {
        score += 7;
    }

    return score;
}

// Render letters on buttons
function renderLetters() {
    // Set center letter (first button)
    centerLetterBtn.textContent = gameState.centerLetter;

    // Set outer letters (remaining buttons)
    const outerLetters = gameState.letters.filter(l => l !== gameState.centerLetter);
    letterBtns.forEach((btn, index) => {
        if (btn.classList.contains('center')) return;
        const dataIndex = parseInt(btn.getAttribute('data-index'));
        btn.textContent = outerLetters[dataIndex] || '';
    });
}

// Shuffle outer letters
function shuffleLetters() {
    const outerLetters = gameState.letters.filter(l => l !== gameState.centerLetter);

    // Fisher-Yates shuffle
    for (let i = outerLetters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [outerLetters[i], outerLetters[j]] = [outerLetters[j], outerLetters[i]];
    }

    gameState.letters = [...outerLetters, gameState.centerLetter];
    renderLetters();
}

// Validate and submit word
function submitWord() {
    const word = wordInput.value.toLowerCase().trim();

    if (!word) return;

    // Check minimum length
    if (word.length < 4) {
        showMessage('Too short', 'error');
        return;
    }

    // Check if already found
    if (gameState.foundWords.includes(word)) {
        showMessage('Already found', 'error');
        return;
    }

    // Check if word uses center letter
    if (!word.includes(gameState.centerLetter)) {
        showMessage('Missing center letter', 'error');
        return;
    }

    // Check if word uses only available letters
    const wordLetters = word.split('');
    const validLetters = wordLetters.every(letter => gameState.letters.includes(letter));
    if (!validLetters) {
        showMessage('Invalid letters', 'error');
        return;
    }

    // Check if word is in dictionary
    if (!DICTIONARY.includes(word)) {
        showMessage('Not in word list', 'error');
        return;
    }

    // Word is valid!
    const wordScore = calculateWordScore(word);
    gameState.foundWords.push(word);
    gameState.score += wordScore;

    // Check if pangram
    const uniqueLetters = new Set(word.split(''));
    if (uniqueLetters.size === 7) {
        showMessage(`Pangram! +${wordScore}`, 'great');
    } else {
        showMessage(`+${wordScore}`, 'success');
    }

    wordInput.value = '';
    updateUI();
    saveGameState();
}

// Show message
function showMessage(text, type = '') {
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;

    setTimeout(() => {
        messageEl.textContent = '';
        messageEl.className = 'message';
    }, 2000);
}

// Update UI
function updateUI() {
    scoreEl.textContent = gameState.score;
    wordCountEl.textContent = gameState.possibleWords.length;
    foundCountEl.textContent = gameState.foundWords.length;

    // Update rank
    const percentage = gameState.score / gameState.maxScore;
    const rank = RANKS.slice().reverse().find(r => percentage >= r.threshold);
    rankEl.textContent = rank.name;

    // Update found words list
    wordListEl.innerHTML = '';
    gameState.foundWords.sort().forEach(word => {
        const wordEl = document.createElement('div');
        wordEl.className = 'word-item';

        const uniqueLetters = new Set(word.split(''));
        if (uniqueLetters.size === 7) {
            wordEl.classList.add('pangram');
        }

        wordEl.textContent = word;
        wordListEl.appendChild(wordEl);
    });
}

// Save game state to localStorage
function saveGameState() {
    localStorage.setItem('spellingBeeState', JSON.stringify(gameState));
}

// Load game state from localStorage
function loadGameState() {
    const saved = localStorage.getItem('spellingBeeState');
    if (saved) {
        const savedState = JSON.parse(saved);
        // Only load if it's the same puzzle
        if (savedState.letters &&
            savedState.letters.join('') === gameState.letters.join('') &&
            savedState.centerLetter === gameState.centerLetter) {
            gameState.foundWords = savedState.foundWords || [];
            gameState.score = savedState.score || 0;
        }
    }
}

// Modal functions
function openCustomModal() {
    modal.classList.add('show');
    customLettersInput.value = '';
    centerLetterSelect.innerHTML = '<option value="">-- Choose center letter --</option>';
    customErrorEl.textContent = '';
}

function closeCustomModal() {
    modal.classList.remove('show');
}

function openAnswersModal() {
    // Show confirmation dialog
    if (!confirm('Are you sure you want to see all the answers? This will reveal all possible words including the ones you missed.')) {
        return;
    }
    
    populateAnswersModal();
    answersModal.classList.add('show');
}

function closeAnswersBtnModal() {
    answersModal.classList.remove('show');
}

function populateAnswersModal() {
    const foundWords = gameState.foundWords;
    const allWords = gameState.possibleWords;
    const missedWords = allWords.filter(word => !foundWords.includes(word));
    
    // Calculate scores and percentage
    const userScore = gameState.score;
    const maxScore = gameState.maxScore;
    const percentage = maxScore > 0 ? Math.round((userScore / maxScore) * 100) : 0;
    
    // Update score comparison display
    userScoreEl.textContent = userScore;
    maxScoreDisplayEl.textContent = maxScore;
    percentageDisplayEl.textContent = percentage + '%';
    
    // Update counts
    foundWordsCountEl.textContent = foundWords.length;
    missedWordsCountEl.textContent = missedWords.length;
    
    // Helper function to check if word is pangram
    const isPangram = (word) => {
        const uniqueLetters = new Set(word.toLowerCase());
        return uniqueLetters.size === gameState.letters.length;
    };
    
    // Populate found words list
    foundWordsListEl.innerHTML = '';
    foundWords.sort().forEach(word => {
        const wordEl = document.createElement('div');
        wordEl.className = 'answer-word found';
        if (isPangram(word)) {
            wordEl.classList.add('pangram');
        }
        wordEl.textContent = word;
        foundWordsListEl.appendChild(wordEl);
    });
    
    // Populate missed words list
    missedWordsListEl.innerHTML = '';
    missedWords.sort().forEach(word => {
        const wordEl = document.createElement('div');
        wordEl.className = 'answer-word missed';
        if (isPangram(word)) {
            wordEl.classList.add('pangram');
        }
        wordEl.textContent = word;
        wordEl.style.cursor = 'pointer';
        wordEl.title = 'Click to see definition';

        // Add click event to open Merriam-Webster dictionary
        wordEl.addEventListener('click', () => {
            const dictionaryUrl = `https://www.merriam-webster.com/dictionary/${word.toLowerCase()}`;
            window.open(dictionaryUrl, '_blank');
        });

        missedWordsListEl.appendChild(wordEl);
    });
}

function updateCenterLetterOptions() {
    const letters = customLettersInput.value.toUpperCase().split('').filter(l => /[A-Z]/.test(l));
    const uniqueLetters = [...new Set(letters)];

    centerLetterSelect.innerHTML = '<option value="">-- Choose center letter --</option>';

    if (uniqueLetters.length > 0) {
        uniqueLetters.forEach(letter => {
            const option = document.createElement('option');
            option.value = letter.toLowerCase();
            option.textContent = letter;
            centerLetterSelect.appendChild(option);
        });
    }
}

function validateAndStartCustomPuzzle() {
    const letters = customLettersInput.value.toLowerCase().split('').filter(l => /[a-z]/.test(l));
    const uniqueLetters = [...new Set(letters)];
    const centerLetter = centerLetterSelect.value;

    // Validation
    if (uniqueLetters.length !== 7) {
        customErrorEl.textContent = 'Please enter exactly 7 unique letters';
        return;
    }

    if (!centerLetter) {
        customErrorEl.textContent = 'Please select a center letter';
        return;
    }

    if (!uniqueLetters.includes(centerLetter)) {
        customErrorEl.textContent = 'Center letter must be one of the 7 letters';
        return;
    }

    // Check if there's at least one pangram
    const possibleWords = findPossibleWords(uniqueLetters, centerLetter);
    const hasPangram = possibleWords.some(word => {
        const uniqueWordLetters = new Set(word.toLowerCase());
        return uniqueWordLetters.size === uniqueLetters.length;
    });

    if (!hasPangram) {
        const proceed = confirm('Warning: This letter combination has no pangrams (words using all 7 letters). Do you want to continue anyway?');
        if (!proceed) {
            return;
        }
    }

    // Start custom puzzle
    generatePuzzle(uniqueLetters, centerLetter);
    renderLetters();
    updateUI();
    closeCustomModal();
    showMessage('Custom puzzle started!', 'success');
}

// Event listeners
letterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const letter = btn.textContent.toLowerCase();
        wordInput.value += letter;
        wordInput.focus();
    });
});

submitBtn.addEventListener('click', submitWord);

wordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        submitWord();
    }
});

deleteBtn.addEventListener('click', () => {
    wordInput.value = wordInput.value.slice(0, -1);
    wordInput.focus();
});

shuffleBtn.addEventListener('click', () => {
    shuffleLetters();
});

newGameBtn.addEventListener('click', () => {
    if (confirm('Start a new puzzle? Your current progress will be lost.')) {
        localStorage.removeItem('spellingBeeState');
        initGame();
        showMessage('New puzzle!', 'success');
    }
});

// Modal event listeners
customGameBtn.addEventListener('click', openCustomModal);

closeModal.addEventListener('click', closeCustomModal);

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeCustomModal();
    }
});

customLettersInput.addEventListener('input', updateCenterLetterOptions);

startCustomBtn.addEventListener('click', validateAndStartCustomPuzzle);

// Allow Enter key to start custom puzzle
customLettersInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && centerLetterSelect.value) {
        validateAndStartCustomPuzzle();
    }
});


// Answers modal event listeners
showAnswersBtn.addEventListener('click', openAnswersModal);

closeAnswersModal.addEventListener('click', closeAnswersBtnModal);

answersModal.addEventListener('click', (e) => {
    if (e.target === answersModal) {
        closeAnswersBtnModal();
    }
});

function closeAnswersBtnModal() {
    answersModal.classList.remove('show');
}
// Start game
initGame();
