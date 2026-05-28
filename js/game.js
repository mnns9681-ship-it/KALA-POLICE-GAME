// Sound System
const sounds = {
    bgm: new Audio('https://actions.google.com/sounds/v1/science_fiction/spaceship_engine_idle.ogg'),
    shuffle: new Audio('https://actions.google.com/sounds/v1/foley/playing_cards_shuffle.ogg'),
    open: new Audio('https://actions.google.com/sounds/v1/foley/paper_rip.ogg'),
    success: new Audio('https://actions.google.com/sounds/v1/crowds/crowd_cheer.ogg'),
    fail: new Audio('https://actions.google.com/sounds/v1/cartoon/slip_and_fall.ogg')
};
sounds.bgm.loop = true;
sounds.bgm.volume = 0.2;

let bgmStarted = false;
function playSound(name) {
    try {
        sounds[name].currentTime = 0;
        sounds[name].play().catch(e => console.log(e));
    } catch(e) {}
}
function playBGM() {
    if (!bgmStarted) {
        sounds.bgm.play().catch(e => console.log(e));
        bgmStarted = true;
    }
}

// Game State
let gameState = {
    players: [],
    roles: [],
    currentPlayerIndex: 0,
    roundNumber: 1,
    maxRounds: 3,
    scores: {},
    rajaIndex: -1,
    mantriIndex: -1,
    policeIndex: -1,
    kalaIndex: -1,
    currentPhase: '', // 'setup', 'shuffle', 'view', 'search', 'result'
    viewedCount: 0
};

// Roles Definition
const ROLE_RAJA = { id: 'raja', name: 'ರಾಜ', points: 1000, icon: '👑', desc: 'ನೀವು ರಾಜ್ಯದ ಒಡೆಯ.', color: 'role-raja' };
const ROLE_MANTRI = { id: 'mantri', name: 'ಮಂತ್ರಿ', points: 800, icon: '🧙', desc: 'ಕಳ್ಳನನ್ನು ಪತ್ತೆಹಚ್ಚಿ.', color: 'role-mantri' };
const ROLE_POLICE = { id: 'police', name: 'ಪೋಲೀಸ್', points: 500, icon: '🚔', desc: 'ಕಾಳನನ್ನು ಬಂಧಿಸಿ.', color: 'role-police' };
const ROLE_KALA = { id: 'kala', name: 'ಕಳ್ಳ', points: 0, icon: '💰', desc: 'ಸಿಕ್ಕಿಬೀಳದಂತೆ ಜಾಗರೂಕರಾಗಿರಿ!', color: 'role-kala' };
const ROLE_PRAJA = { id: 'praja', name: 'ಪ್ರಜೆ', points: 200, icon: '🧑‍🌾', desc: 'ಸಾಮಾನ್ಯ ಪ್ರಜೆ, ಆಟ ವೀಕ್ಷಿಸಿ.', color: 'role-praja' };

// Base deck for 4 players
let baseDeck = [ROLE_RAJA, ROLE_MANTRI, ROLE_POLICE, ROLE_KALA];

// Utility functions
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    if (screenId === 'screen-players') {
        playBGM();
    }
}

function showToast(msg, duration = 3000) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => { toast.classList.add('hidden'); }, duration);
}

// ---------------------------
// SETUP PHASE
// ---------------------------
let selectedPlayerCount = 4;

function setPlayerCount(count) {
    selectedPlayerCount = count;
    document.querySelectorAll('.count-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`btn-count-${count}`).classList.add('active');
    renderPlayerForms();
}

function renderPlayerForms() {
    const container = document.getElementById('player-forms-container');
    container.innerHTML = '';
    for (let i = 1; i <= selectedPlayerCount; i++) {
        container.innerHTML += `
            <div class="player-form-card">
                <div class="player-form-header">
                    <div class="player-avatar bg-praja">👤</div>
                    <h4>ಆಟಗಾರ ${i}</h4>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>ಹೆಸರು</label>
                        <input type="text" id="p${i}-name" class="form-input" placeholder="ಹೆಸರು ನಮೂದಿಸಿ" value="ಆಟಗಾರ ${i}">
                    </div>
                    <div class="form-group">
                        <label>ಪಾಸ್‌ವರ್ಡ್ (ರಹಸ್ಯ)</label>
                        <div class="password-input-wrapper">
                            <input type="password" id="p${i}-pwd" class="form-input" placeholder="ಪಾಸ್‌ವರ್ಡ್">
                            <button class="pwd-toggle" onclick="toggleFormPwd('p${i}-pwd', this)">👁</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

function toggleFormPwd(inputId, btn) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
    } else {
        input.type = 'password';
        btn.textContent = '👁';
    }
}

function changeRounds(delta) {
    gameState.maxRounds = Math.max(1, Math.min(10, gameState.maxRounds + delta));
    document.getElementById('round-count').textContent = gameState.maxRounds;
}

function beginGame() {
    gameState.players = [];
    for (let i = 1; i <= selectedPlayerCount; i++) {
        const name = document.getElementById(`p${i}-name`).value.trim();
        const pwd = document.getElementById(`p${i}-pwd`).value.trim();
        if (!name || !pwd) {
            showToast('ದಯವಿಟ್ಟು ಎಲ್ಲಾ ಹೆಸರು ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್‌ಗಳನ್ನು ನಮೂದಿಸಿ!');
            return;
        }
        gameState.players.push({ id: i - 1, name, pwd, role: null });
        if (!gameState.scores[i - 1]) gameState.scores[i - 1] = 0;
    }
    
    gameState.roundNumber = 1;
    startRound();
}

// ---------------------------
// SHUFFLE PHASE
// ---------------------------
function startRound() {
    gameState.currentPhase = 'shuffle';
    gameState.viewedCount = 0;
    
    // Build deck based on player count
    let currentDeck = [...baseDeck];
    // If we have Mantri, we might not need Police depending on traditional rules, 
    // but we'll include both and let them both search for Kala, or Prajas.
    // For simplicity, if > 4, add Prajas
    while (currentDeck.length < gameState.players.length) {
        currentDeck.push(ROLE_PRAJA);
    }
    
    // Shuffle
    gameState.roles = currentDeck.sort(() => Math.random() - 0.5);
    
    // Assign roles to players
    gameState.players.forEach((p, index) => {
        p.role = gameState.roles[index];
        if (p.role.id === 'raja') gameState.rajaIndex = index;
        if (p.role.id === 'mantri') gameState.mantriIndex = index;
        if (p.role.id === 'police') gameState.policeIndex = index;
        if (p.role.id === 'kala') gameState.kalaIndex = index;
    });

    showScreen('screen-shuffle');
    renderShuffleAnimation();
}

function renderShuffleAnimation() {
    playSound('shuffle');
    const container = document.getElementById('shuffle-papers-container');
    container.innerHTML = '';
    
    // Create 3D papers
    for (let i = 0; i < gameState.players.length; i++) {
        const paper = document.createElement('div');
        paper.className = 'shuffle-paper shuffling';
        paper.textContent = '📜';
        // Random positioning for shuffle effect
        paper.style.left = `${Math.random() * 60 + 20}%`;
        paper.style.top = `${Math.random() * 50 + 10}%`;
        paper.style.animationDelay = `${Math.random() * 0.5}s`;
        container.appendChild(paper);
    }
    
    document.getElementById('btn-start-deal').classList.add('hidden');
    document.getElementById('shuffle-status').textContent = 'ಮಿಶ್ರಣ ಮಾಡಲಾಗುತ್ತಿದೆ...';
    
    setTimeout(() => {
        document.querySelectorAll('.shuffle-paper').forEach(p => {
            p.classList.remove('shuffling');
            p.style.transition = 'all 0.8s ease';
            p.style.left = '50%';
            p.style.top = '50%';
            p.style.transform = 'translate(-50%, -50%) rotate(0deg)';
        });
        document.getElementById('shuffle-status').textContent = 'ಪತ್ರಗಳು ಸಿದ್ಧವಾಗಿವೆ!';
        document.getElementById('btn-start-deal').classList.remove('hidden');
    }, 2000);
}

function startDealPhase() {
    gameState.currentPlayerIndex = 0;
    promptPassDevice();
}

function promptPassDevice() {
    if (gameState.viewedCount >= gameState.players.length) {
        startPlayPhase();
        return;
    }
    
    const player = gameState.players[gameState.currentPlayerIndex];
    document.getElementById('next-player-label').textContent = player.name;
    document.getElementById('pass-device-overlay').classList.remove('hidden');
}

function confirmPass() {
    document.getElementById('pass-device-overlay').classList.add('hidden');
    setupViewScreen();
}

// ---------------------------
// VIEW ROLE PHASE
// ---------------------------
function setupViewScreen() {
    gameState.currentPhase = 'view';
    const player = gameState.players[gameState.currentPlayerIndex];
    
    document.getElementById('turn-player-name').textContent = player.name;
    document.getElementById('paper-player-name-display').textContent = player.name;
    document.getElementById('player-password-input').value = '';
    document.getElementById('pwd-error').classList.add('hidden');
    
    // Reset 3D paper
    const paper3d = document.getElementById('player-paper-3d');
    paper3d.classList.remove('flipped');
    
    document.getElementById('password-entry-box').classList.remove('hidden');
    document.getElementById('role-revealed-box').classList.add('hidden');
    
    showScreen('screen-player-turn');
}

function togglePwdVisibility() {
    const input = document.getElementById('player-password-input');
    const btn = document.getElementById('pwd-eye-btn');
    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
    } else {
        input.type = 'password';
        btn.textContent = '👁';
    }
}

function openPaper() {
    const inputPwd = document.getElementById('player-password-input').value;
    const player = gameState.players[gameState.currentPlayerIndex];
    
    if (inputPwd !== player.pwd) {
        document.getElementById('pwd-error').classList.remove('hidden');
        return;
    }
    
    document.getElementById('pwd-error').classList.add('hidden');
    document.getElementById('password-entry-box').classList.add('hidden');
    
    // Flip paper
    playSound('open');
    const paper3d = document.getElementById('player-paper-3d');
    const roleContent = document.getElementById('paper-role-content');
    
    roleContent.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 10px;">${player.role.icon}</div>
        <h3 class="${player.role.color}" style="font-size: 1.5rem; margin-bottom: 5px;">${player.role.name}</h3>
        <p style="color: rgba(255,255,255,0.7); font-size: 0.8rem;">${player.role.points} ಅಂಕಗಳು</p>
    `;
    
    paper3d.classList.add('flipped');
    
    // Show role box below
    setTimeout(() => {
        document.getElementById('revealed-role-icon').textContent = player.role.icon;
        document.getElementById('revealed-role-title').textContent = player.role.name;
        document.getElementById('revealed-role-title').className = player.role.color;
        document.getElementById('revealed-role-desc').textContent = player.role.desc;
        document.getElementById('revealed-role-points').textContent = `${player.role.points} ಅಂಕ`;
        
        document.getElementById('role-revealed-box').classList.remove('hidden');
    }, 600);
}

function doneViewingRole() {
    gameState.viewedCount++;
    gameState.currentPlayerIndex++;
    promptPassDevice();
}

// ---------------------------
// PLAY PHASE
// ---------------------------
function startPlayPhase() {
    gameState.currentPhase = 'search';
    document.getElementById('round-badge').textContent = `ರೌಂಡ್ ${gameState.roundNumber} / ${gameState.maxRounds}`;
    
    document.getElementById('raja-section').classList.add('hidden');
    document.getElementById('police-section').classList.remove('hidden');
    document.getElementById('round-result-section').classList.add('hidden');
    
    // Determine who searches for Kala. Police searches first.
    let searcher = null;
    let searcherRoleName = '';
    
    if (gameState.policeIndex !== -1) {
        searcher = gameState.players[gameState.policeIndex];
        searcherRoleName = 'ಪೋಲೀಸ್';
    } else if (gameState.mantriIndex !== -1) {
        searcher = gameState.players[gameState.mantriIndex];
        searcherRoleName = 'ಮಂತ್ರಿ';
    }
    
    if (!searcher) {
        // No searcher? Just show results.
        calculateRoundScores(-1);
        return;
    }
    
    document.getElementById('police-section-title').textContent = `${searcherRoleName}, ಕಳ್ಳನನ್ನು ಹಿಡಿಯಿರಿ!`;
    document.getElementById('police-instruction').innerHTML = `${searcherRoleName} ಆಟಗಾರ: <strong>${searcher.name}</strong>`;
    
    const suspectList = document.getElementById('suspect-list');
    suspectList.innerHTML = '';
    
    // List all suspects (excluding the searcher)
    gameState.players.forEach(p => {
        if (p.id !== searcher.id) {
            suspectList.innerHTML += `
                <div class="suspect-card" onclick="accuseKala(${p.id})">
                    <div class="suspect-avatar bg-praja">👤</div>
                    <div>
                        <div class="suspect-name">${p.name}</div>
                        <div class="suspect-hint">ಇವರೇ ಕಳ್ಳ?</div>
                    </div>
                </div>
            `;
        }
    });
    
    document.getElementById('suspect-list').classList.remove('hidden');
    document.getElementById('search-result').classList.add('hidden');
    
    showScreen('screen-round');
}

function accuseKala(suspectId) {
    const suspect = gameState.players.find(p => p.id === suspectId);
    const searchResult = document.getElementById('search-result');
    const suspectList = document.getElementById('suspect-list');
    
    suspectList.classList.add('hidden');
    searchResult.classList.remove('hidden');
    
    if (suspect.role.id === 'kala') {
        // Success
        playSound('success');
        searchResult.className = 'search-result success';
        searchResult.innerHTML = `
            <h4>🎉 ಯಶಸ್ವಿ ಕಾರ್ಯಾಚರಣೆ!</h4>
            <p><strong>${suspect.name}</strong> ನಿಜವಾದ ಕಳ್ಳ!</p>
        `;
        setTimeout(() => calculateRoundScores(true), 2500);
    } else {
        // Failure
        playSound('fail');
        const actualKala = gameState.players[gameState.kalaIndex];
        searchResult.className = 'search-result failure';
        searchResult.innerHTML = `
            <h4>❌ ತಪ್ಪು ಊಹೆ!</h4>
            <p><strong>${suspect.name}</strong> ಕಾಳ ಅಲ್ಲ (${suspect.role.name}). ನಿಜವಾದ ಕಾಳ <strong>${actualKala.name}</strong>!</p>
        `;
        setTimeout(() => calculateRoundScores(false), 3500);
    }
}

function calculateRoundScores(searcherSuccess) {
    document.getElementById('police-section').classList.add('hidden');
    document.getElementById('round-result-section').classList.remove('hidden');
    
    const scoreList = document.getElementById('round-score-list');
    scoreList.innerHTML = '';
    
    let searcherIndex = gameState.policeIndex !== -1 ? gameState.policeIndex : gameState.mantriIndex;
    
    gameState.players.forEach(p => {
        let pts = 0;
        let pClass = '';
        
        if (p.role.id === 'raja') {
            pts = p.role.points;
            pClass = 'earned';
        } else if (p.role.id === 'mantri' || p.role.id === 'police') {
            // Check if this player is the one who searched
            if (searcherIndex !== -1 && p.id === gameState.players[searcherIndex].id) {
                if (searcherSuccess) {
                    pts = p.role.points;
                    pClass = 'earned';
                } else {
                    pts = 0;
                    pClass = 'zero';
                }
            } else {
                // Not the searcher, so they get their full default points
                pts = p.role.points;
                pClass = 'earned';
            }
        } else if (p.role.id === 'kala') {
            if (!searcherSuccess) {
                // Kala gets points if searcher failed. Points equal to searcher's points
                let searcherRole = searcherIndex !== -1 ? gameState.players[searcherIndex].role : null;
                pts = searcherRole ? searcherRole.points : 500; 
                pClass = 'earned';
            } else {
                pts = 0;
                pClass = 'zero';
            }
        } else if (p.role.id === 'praja') {
            pts = p.role.points;
            pClass = 'earned';
        }
        
        gameState.scores[p.id] += pts;
        
        scoreList.innerHTML += `
            <div class="round-score-item">
                <div class="rsi-left">
                    <div class="rsi-avatar">${p.role.icon}</div>
                    <div>
                        <div class="rsi-name">${p.name}</div>
                        <div class="rsi-role ${p.role.color}">${p.role.name}</div>
                    </div>
                </div>
                <div class="rsi-pts ${pClass}">+${pts}</div>
            </div>
        `;
    });
    
    const nextBtn = document.getElementById('next-round-btn-text');
    if (gameState.roundNumber >= gameState.maxRounds) {
        nextBtn.textContent = '🏆 ಅಂತಿಮ ಅಂಕಪಟ್ಟಿ';
    } else {
        nextBtn.textContent = '➡️ ಮುಂದಿನ ರೌಂಡ್';
    }
}

function nextRound() {
    if (gameState.roundNumber >= gameState.maxRounds) {
        showScoreboard();
    } else {
        gameState.roundNumber++;
        startRound();
    }
}

// ---------------------------
// SCOREBOARD
// ---------------------------
function showScoreboard() {
    gameState.currentPhase = 'result';
    const list = document.getElementById('scoreboard-list');
    list.innerHTML = '';
    
    // Sort players by score descending
    let sortedPlayers = [...gameState.players].sort((a, b) => gameState.scores[b.id] - gameState.scores[a.id]);
    
    sortedPlayers.forEach((p, index) => {
        let rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : 'rank-other';
        let rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1);
        
        list.innerHTML += `
            <div class="score-entry ${rankClass}">
                <div class="score-rank ${rankClass}">${rankIcon}</div>
                <div class="score-avatar bg-praja">👤</div>
                <div class="score-info">
                    <div class="score-name">${p.name}</div>
                </div>
                <div>
                    <div class="score-total">${gameState.scores[p.id]}</div>
                    <div class="score-total-label">ಒಟ್ಟು ಅಂಕ</div>
                </div>
            </div>
        `;
    });
    
    showScreen('screen-scoreboard');
    triggerConfetti();
}

function playAgain() {
    // Reset scores but keep players and rounds
    gameState.players.forEach(p => gameState.scores[p.id] = 0);
    gameState.roundNumber = 1;
    startRound();
}

// ---------------------------
// INITIALIZE
// ---------------------------
window.onload = () => {
    setPlayerCount(4);
};

// Simple Confetti
function triggerConfetti() {
    const colors = ['#f5c842', '#3b82f6', '#ef4444', '#a855f7', '#22c55e'];
    for (let i = 0; i < 50; i++) {
        createParticle(colors[Math.floor(Math.random() * colors.length)]);
    }
}
function createParticle(color) {
    const p = document.createElement('div');
    p.style.position = 'fixed';
    p.style.width = '10px';
    p.style.height = '10px';
    p.style.backgroundColor = color;
    p.style.left = Math.random() * 100 + 'vw';
    p.style.top = '-10px';
    p.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
    p.style.zIndex = '9999';
    p.style.pointerEvents = 'none';
    
    document.body.appendChild(p);
    
    const animation = p.animate([
        { transform: `translate3d(0,0,0) rotate(0deg)`, opacity: 1 },
        { transform: `translate3d(${Math.random()*100 - 50}px, ${window.innerHeight}px, 0) rotate(${Math.random()*360}deg)`, opacity: 0 }
    ], {
        duration: Math.random() * 2000 + 2000,
        easing: 'cubic-bezier(0, .9, .57, 1)'
    });
    
    animation.onfinish = () => p.remove();
}
