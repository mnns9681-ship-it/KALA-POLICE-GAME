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
    } catch (e) { }
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
    maxRounds: 10,
    scores: {},
    rajaIndex: -1,
    raniIndex: -1,
    senapatiIndex: -1,
    sahukaraIndex: -1,
    mantriIndex: -1,
    policeIndex: -1,
    kalaIndex: -1,
    pocketChoraIndex: -1,
    currentPhase: '',
    viewedCount: 0,
    // Manual role selection (ids of active roles)
    selectedRoleIds: ['kala', 'police', 'raja', 'rani']
};

// ═══════════════════════════════════════════════════════════
// ROLES DEFINITION (Full expanded set)
// ═══════════════════════════════════════════════════════════
const ROLE_RAJA = {
    id: 'raja',
    name: 'ರಾಜ',
    points: 1000,
    icon: '👑',
    desc: 'ನೀವು ರಾಜ್ಯದ ಒಡೆಯ. ರಾಣಿಯ ಜೊತೆ ತನ್ನನ್ನು ಬಹಿರಂಗಪಡಿಸಿ.',
    color: 'role-raja',
    badge: '🔴',
    canSearch: false
};
const ROLE_RANI = {
    id: 'rani',
    name: 'ರಾಣಿ',
    points: 900,
    icon: '👸',
    desc: 'ರಾಜನ ಕೆಳಗೆ ಎರಡನೇ ಅತ್ಯುನ್ನತ ಸ್ಥಾನ. ರಾಜನ ಜೊತೆ ತನ್ನನ್ನು ಬಹಿರಂಗಪಡಿಸಿ.',
    color: 'role-rani',
    badge: '🟣',
    canSearch: false
};
const ROLE_SENAPATI = {
    id: 'senapati',
    name: 'ಸೇನಾಪತಿ',
    points: 700,
    icon: '⚔️',
    desc: 'ಪೋಲೀಸ್‌ಗೆ ಸಹಾಯ ಮಾಡುತ್ತಾರೆ. ರಾಜನು ನೇರವಾಗಿ ಸೇನಾಪತಿಯನ್ನು ಕಳ್ಳನನ್ನು ಹಿಡಿಯಲು ಕಳಿಸಬಹುದು.',
    color: 'role-senapati',
    badge: '🟠',
    canSearch: true
};
const ROLE_SAHUKARA = {
    id: 'sahukara',
    name: 'ಸಾಹುಕಾರ',
    points: 600,
    icon: '💰',
    desc: 'ಶ್ರೀಮಂತ ವ್ಯಾಪಾರಿ. ಸುಮ್ಮನಿದ್ದು ಪೋಲೀಸ್ ಗೊಂದಲಕ್ಕೆ ಕಾರಣವಾಗಿ.',
    color: 'role-sahukara',
    badge: '🟡',
    canSearch: false
};
const ROLE_MANTRI = {
    id: 'mantri',
    name: 'ಮಂತ್ರಿ',
    points: 800,
    icon: '💂',
    desc: 'ರಾಜ್ಯ ಮಂತ್ರಿ. ಕಳ್ಳನನ್ನು ಪತ್ತೆಹಚ್ಚಿ 800 ಅಂಕ ಗಳಿಸಿ.',
    color: 'role-mantri',
    badge: '🟣',
    canSearch: true
};
const ROLE_POLICE = {
    id: 'police',
    name: 'ಪೋಲೀಸ್',
    points: 500,
    icon: '🚨',
    desc: 'ಕಳ್ಳನನ್ನು ಬಂಧಿಸಿ ನ್ಯಾಯ ತನ್ನಿ!',
    color: 'role-police',
    badge: '🔵',
    canSearch: true
};
const ROLE_KALA = {
    id: 'kala',
    name: 'ಕಳ್ಳ',
    points: 0,
    icon: '🥷',
    desc: 'ಸಿಕ್ಕಿಬೀಳದಂತೆ ಜಾಗರೂಕರಾಗಿರಿ! ಪೋಲೀಸ್ ತಪ್ಪಾಗಿ ಗುರುತಿಸಿದರೆ ಅಂಕ ಗಳಿಸಿ.',
    color: 'role-kala',
    badge: '⚫',
    canSearch: false
};
const ROLE_POCKET_CHORA = {
    id: 'pocket_chora',
    name: 'ಪಾಕೆಟ್ ಚೋರ',
    points: 0,  // Can become 400 if police confuses with Kalla
    icon: '🕵️',
    desc: 'ಚಿಕ್ಕ ಕಳ್ಳ. ಪೋಲೀಸ್ ಮುಖ್ಯ ಕಳ್ಳ ಮತ್ತು ನಿಮ್ಮನ್ನು ತಪ್ಪಾಗಿ ಗುರುತಿಸಿದರೆ ಅಂಕ ಬದಲಾಗುತ್ತದೆ.',
    color: 'role-pocket-chora',
    badge: '🟤',
    canSearch: false
};
const ROLE_PRAJA = {
    id: 'praja',
    name: 'ಪ್ರಜೆ',
    points: 300,
    icon: '🧑‍🌾',
    desc: 'ಮುಗ್ಧ ಪ್ರಜೆ. ಪೋಲೀಸ್‌ಗೆ ಗೊಂದಲ ಉಂಟುಮಾಡಿ.',
    color: 'role-praja',
    badge: '⚪',
    canSearch: false
};

// ── All roles registry (for manual selection UI) ────────────────────────────
const ALL_ROLES = [
    ROLE_RAJA, ROLE_RANI, ROLE_MANTRI, ROLE_SENAPATI,
    ROLE_SAHUKARA, ROLE_POLICE, ROLE_KALA, ROLE_POCKET_CHORA, ROLE_PRAJA
];

// Build deck from manually selected roles
// Mandatory: kala + police always included
// If selected roles < players, pad with Praja copies
// If selected roles > players, trim non-mandatory extras
function buildDeck(count) {
    const mandatory = ['kala', 'police'];
    const selected = gameState.selectedRoleIds.slice();

    // Make sure mandatory roles are in
    mandatory.forEach(id => {
        if (!selected.includes(id)) selected.unshift(id);
    });

    // Build deck from selected roles (one copy each)
    let deck = selected
        .map(id => ALL_ROLES.find(r => r.id === id))
        .filter(Boolean);

    // Pad with Praja copies if not enough
    while (deck.length < count) deck.push({ ...ROLE_PRAJA });

    // Trim to exact count (never remove mandatory)
    while (deck.length > count) {
        const trimIdx = deck.map((r, i) => ({ r, i }))
            .reverse()
            .find(({ r }) => !mandatory.includes(r.id));
        if (trimIdx) deck.splice(trimIdx.i, 1);
        else break;
    }

    return deck;
}

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
    const activeBtn = document.getElementById(`btn-count-${count}`);
    if (activeBtn) activeBtn.classList.add('active');
    // Sync custom input
    const customInput = document.getElementById('custom-player-count');
    if (customInput) customInput.value = count;
    renderPlayerForms();
    renderRoleSelector();
}

function onPlayerCountInput(val) {
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 2) {
        selectedPlayerCount = n;
        document.querySelectorAll('.count-btn').forEach(b => b.classList.remove('active'));
        const activeBtn = document.getElementById(`btn-count-${n}`);
        if (activeBtn) activeBtn.classList.add('active');
        renderPlayerForms();
        renderRoleSelector();
    }
}

function changePlayerCount(delta) {
    const newCount = Math.max(2, selectedPlayerCount + delta);
    selectedPlayerCount = newCount;
    document.querySelectorAll('.count-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-count-${newCount}`);
    if (activeBtn) activeBtn.classList.add('active');
    const customInput = document.getElementById('custom-player-count');
    if (customInput) customInput.value = newCount;
    renderPlayerForms();
    renderRoleSelector();
}

// ── Manual Role Selector ─────────────────────────────────────────────────────
function renderRoleSelector() {
    const container = document.getElementById('role-selector-grid');
    if (!container) return;
    container.innerHTML = '';

    const mandatory = ['kala', 'police'];
    const count = selectedPlayerCount;

    ALL_ROLES.forEach(role => {
        const isMandatory = mandatory.includes(role.id);
        const isSelected = gameState.selectedRoleIds.includes(role.id) || isMandatory;

        const chip = document.createElement('label');
        chip.className = `role-chip ${isSelected ? 'selected' : ''} ${isMandatory ? 'mandatory' : ''}`;
        chip.setAttribute('data-role', role.id);
        chip.title = isMandatory ? 'ಕಡ್ಡಾಯ ಪಾತ್ರ (ತೆಗೆಯಲು ಆಗದು)' : '';

        chip.innerHTML = `
            <input type="checkbox" class="role-chip-check" data-role="${role.id}"
                ${isSelected ? 'checked' : ''}
                ${isMandatory ? 'disabled' : ''}
                onchange="toggleRole('${role.id}', this.checked)">
            <span class="role-chip-icon">${role.icon}</span>
            <span class="role-chip-name ${role.color}">${role.name}</span>
            <span class="role-chip-pts">${role.id === 'pocket_chora' ? '0/400' : role.points}</span>
            ${isMandatory ? '<span class="role-chip-lock">🔒</span>' : ''}
        `;
        container.appendChild(chip);
    });

    updateRoleSelectorStatus();
}

function toggleRole(roleId, checked) {
    const mandatory = ['kala', 'police'];
    if (mandatory.includes(roleId)) return; // cannot remove mandatory

    if (checked) {
        if (!gameState.selectedRoleIds.includes(roleId)) {
            gameState.selectedRoleIds.push(roleId);
        }
    } else {
        gameState.selectedRoleIds = gameState.selectedRoleIds.filter(id => id !== roleId);
    }

    // Sync chip visual state
    document.querySelectorAll(`.role-chip[data-role="${roleId}"]`).forEach(el => {
        el.classList.toggle('selected', checked);
    });

    updateRoleSelectorStatus();
}

function updateRoleSelectorStatus() {
    const statusEl = document.getElementById('role-selector-status');
    if (!statusEl) return;

    const mandatory = ['kala', 'police'];
    const allSelected = [
        ...new Set([...mandatory, ...gameState.selectedRoleIds])
    ].filter(id => ALL_ROLES.find(r => r.id === id));

    const count = selectedPlayerCount;
    const rolesCount = allSelected.length;

    let msg = '';
    if (rolesCount === count) {
        msg = `✅ ${rolesCount} ಪಾತ್ರಗಳು = ${count} ಆಟಗಾರರು — ಸರಿ!`;
        statusEl.className = 'role-selector-status ok';
    } else if (rolesCount < count) {
        const diff = count - rolesCount;
        msg = `⚠️ ${diff} ಹೆಚ್ಚು ಪಾತ್ರ ಬೇಕು — ಉಳಿದವರಿಗೆ ಪ್ರಜೆ ಪಾತ್ರ ಸ್ವಯಂ ನೀಡಲಾಗುತ್ತದೆ`;
        statusEl.className = 'role-selector-status warn';
    } else {
        const diff = rolesCount - count;
        msg = `ℹ️ ${diff} ಪಾತ್ರ ಹೆಚ್ಚಾಗಿವೆ — ಆಟ ಪ್ರಾರಂಭಿಸುವಾಗ ಕಡಿತ ಮಾಡಲಾಗುತ್ತದೆ`;
        statusEl.className = 'role-selector-status info';
    }
    statusEl.textContent = msg;
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

function setRounds(rounds) {
    gameState.maxRounds = rounds;
    const inp = document.getElementById('round-count-input');
    if (inp) inp.value = rounds;
    document.querySelectorAll('.round-preset-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`round-btn-${rounds}`);
    if (activeBtn) activeBtn.classList.add('active');
}

function changeRounds(delta) {
    gameState.maxRounds = Math.max(1, gameState.maxRounds + delta);
    const inp = document.getElementById('round-count-input');
    if (inp) inp.value = gameState.maxRounds;
    document.querySelectorAll('.round-preset-btn').forEach(btn => btn.classList.remove('active'));
    const presets = [3, 5, 10, 15, 20, 25, 50, 100];
    if (presets.includes(gameState.maxRounds)) {
        const b = document.getElementById(`round-btn-${gameState.maxRounds}`);
        if (b) b.classList.add('active');
    }
}

function onRoundInputChange(val) {
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 1) {
        gameState.maxRounds = n;
        document.querySelectorAll('.round-preset-btn').forEach(btn => btn.classList.remove('active'));
        const presets = [3, 5, 10, 15, 20, 25, 50, 100];
        if (presets.includes(n)) {
            const b = document.getElementById(`round-btn-${n}`);
            if (b) b.classList.add('active');
        }
    }
}

function beginGame() {
    // Read rounds from input field
    const roundInp = document.getElementById('round-count-input');
    if (roundInp) {
        const n = parseInt(roundInp.value, 10);
        if (!isNaN(n) && n >= 1) gameState.maxRounds = n;
    }

    gameState.players = [];
    gameState.scores = {};
    for (let i = 1; i <= selectedPlayerCount; i++) {
        const name = document.getElementById(`p${i}-name`).value.trim();
        const pwd = document.getElementById(`p${i}-pwd`).value.trim();
        if (!name || !pwd) {
            showToast('ದಯವಿಟ್ಟು ಎಲ್ಲಾ ಹೆಸರು ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್‌ಗಳನ್ನು ನಮೂದಿಸಿ!');
            return;
        }
        gameState.players.push({ id: i - 1, name, pwd, role: null });
        gameState.scores[i - 1] = 0;
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

    // Reset all role indices
    gameState.rajaIndex = -1;
    gameState.raniIndex = -1;
    gameState.senapatiIndex = -1;
    gameState.sahukaraIndex = -1;
    gameState.mantriIndex = -1;
    gameState.policeIndex = -1;
    gameState.kalaIndex = -1;
    gameState.pocketChoraIndex = -1;

    // Build and shuffle deck
    let currentDeck = buildDeck(gameState.players.length);
    gameState.roles = currentDeck.sort(() => Math.random() - 0.5);

    // Assign roles to players
    gameState.players.forEach((p, index) => {
        p.role = gameState.roles[index];
        switch (p.role.id) {
            case 'raja':         gameState.rajaIndex = index; break;
            case 'rani':         gameState.raniIndex = index; break;
            case 'senapati':     gameState.senapatiIndex = index; break;
            case 'sahukara':     gameState.sahukaraIndex = index; break;
            case 'mantri':       gameState.mantriIndex = index; break;
            case 'police':       gameState.policeIndex = index; break;
            case 'kala':         gameState.kalaIndex = index; break;
            case 'pocket_chora': gameState.pocketChoraIndex = index; break;
        }
    });

    showScreen('screen-shuffle');
    renderShuffleAnimation();
}

// Deal phase will reveal roles to players one by one using passwords

function renderShuffleAnimation() {
    playSound('shuffle');
    const container = document.getElementById('shuffle-papers-container');
    container.innerHTML = '';
    document.getElementById('btn-start-deal').classList.add('hidden');
    document.getElementById('shuffle-status').textContent = 'ಮಿಶ್ರಣ ಮಾಡಲಾಗುತ್ತಿದೆ...';

    if (window.THREE && window.ShuffleAnimation) {
        try {
            ShuffleAnimation.play(container, gameState.players.length, () => {
                document.getElementById('shuffle-status').textContent = '✨ ಪತ್ರಗಳು ಸಿದ್ಧವಾಗಿವೆ!';
                document.getElementById('btn-start-deal').classList.remove('hidden');
            });
            return;
        } catch (e) {
            console.error("Three.js Shuffle Animation failed:", e);
        }
    }

    // Fallback if Three.js fails to load
    runCSSShuffleFallback(container, () => {
        document.getElementById('shuffle-status').textContent = '✨ ಪತ್ರಗಳು ಸಿದ್ಧವಾಗಿವೆ!';
        document.getElementById('btn-start-deal').classList.remove('hidden');
    });
}

function runCSSShuffleFallback(container, callback) {
    container.innerHTML = '';
    const numCards = Math.min(gameState.players.length, 6);
    const cards = [];

    // Create cards in a stacked pile
    for (let i = 0; i < numCards; i++) {
        const card = document.createElement('div');
        card.className = 'shuffle-paper shuffling';
        card.innerHTML = '🔒';
        
        // Base positioning in the center of the container
        card.style.left = 'calc(50% - 40px)';
        card.style.top = '45px';
        card.style.position = 'absolute';
        
        // Add random translation offset during setup to make pile look organic
        const offX = (Math.random() - 0.5) * 10;
        const offY = (Math.random() - 0.5) * 10;
        const rot = (Math.random() - 0.5) * 15;
        card.style.transform = `translate(${offX}px, ${offY}px) rotate(${rot}deg)`;
        card.style.animationDelay = `${i * 0.1}s`;
        
        container.appendChild(card);
        cards.push(card);
    }

    // After 1.8 seconds of chaotic CSS shuffling animation, fan them out neatly!
    setTimeout(() => {
        cards.forEach((card, i) => {
            card.classList.remove('shuffling');
            
            // Calculate beautiful horizontal fan layout positions
            const spread = Math.min(numCards * 40, 240);
            const step = numCards > 1 ? spread / (numCards - 1) : 0;
            const tx = numCards > 1 ? (i * step) - (spread / 2) : 0;
            
            // Arc logic for vertical height
            const ty = -Math.pow(tx / 150, 2) * 15 + 5; 
            const rot = numCards > 1 ? (i / (numCards - 1) - 0.5) * 30 : 0;
            
            card.style.transform = `translate(${tx}px, ${ty}px) rotate(${rot}deg)`;
            card.style.zIndex = i;
        });
        
        if (callback) callback();
    }, 1800);
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
// VIEW ROLE PHASE (with photorealistic paper animation)
// ---------------------------
function setupViewScreen() {
    gameState.currentPhase = 'view';
    const player = gameState.players[gameState.currentPlayerIndex];

    document.getElementById('turn-player-name').textContent = player.name;
    document.getElementById('paper-player-name-display').textContent = player.name;
    document.getElementById('player-password-input').value = '';
    document.getElementById('pwd-error').classList.add('hidden');

    // Reset 3D paper (CSS version — keep for fallback)
    const paper3d = document.getElementById('player-paper-3d');
    if (paper3d) paper3d.classList.remove('flipped');

    // Hide Three.js canvas scene initially; show password box
    const threeContainer = document.getElementById('paper-three-scene');
    if (threeContainer) {
        threeContainer.style.display = 'none';
        threeContainer.innerHTML = '';
    }
    // Destroy any previous animation
    if (window.PaperAnimation) window.PaperAnimation.destroy();

    // Show the legacy paper icon (CSS 3D) while password is being entered
    document.getElementById('paper-3d-scene').style.display = '';
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
        // Shake animation on input
        const input = document.getElementById('player-password-input');
        input.classList.add('shake-error');
        setTimeout(() => input.classList.remove('shake-error'), 500);
        return;
    }

    document.getElementById('pwd-error').classList.add('hidden');
    document.getElementById('password-entry-box').classList.add('hidden');

    // ── Launch photorealistic Three.js paper animation ──
    playSound('open');

    // Hide CSS 3D paper, show Three.js canvas
    const cssScene = document.getElementById('paper-3d-scene');
    if (cssScene) cssScene.style.display = 'none';

    const threeContainer = document.getElementById('paper-three-scene');
    threeContainer.style.display = 'block';
    threeContainer.innerHTML = '';

    if (window.THREE && window.PaperAnimation) {
        try {
            PaperAnimation.play(threeContainer, player.role, () => {
                // Called when paper is fully open — show role reveal box
                setTimeout(() => {
                    showRoleRevealBox(player);
                }, 600);
            });
        } catch (e) {
            console.error("Three.js Paper Animation failed:", e);
            triggerFallbackView(cssScene, threeContainer, player);
        }
    } else {
        // Fallback if Three.js not loaded: use CSS flip
        triggerFallbackView(cssScene, threeContainer, player);
    }
}

function triggerFallbackView(cssScene, threeContainer, player) {
    if (cssScene) cssScene.style.display = '';
    if (threeContainer) threeContainer.style.display = 'none';
    const paper3d = document.getElementById('player-paper-3d');
    const roleContent = document.getElementById('paper-role-content');
    roleContent.innerHTML = buildRoleHTML(player.role);
    paper3d.classList.add('flipped');
    setTimeout(() => showRoleRevealBox(player), 700);
}

function buildRoleHTML(role) {
    return `
        <div style="font-size:3rem;margin-bottom:10px;">${role.icon}</div>
        <h3 class="${role.color}" style="font-size:1.5rem;margin-bottom:5px;">${role.name}</h3>
        <p style="color:rgba(255,255,255,0.7);font-size:0.8rem;">${role.points} ಅಂಕಗಳು</p>
    `;
}

function showRoleRevealBox(player) {
    const roleBox = document.getElementById('role-revealed-box');
    document.getElementById('revealed-role-icon').textContent = player.role.icon;

    const titleEl = document.getElementById('revealed-role-title');
    titleEl.textContent = player.role.name;
    titleEl.className = player.role.color;

    document.getElementById('revealed-role-desc').textContent = player.role.desc;
    document.getElementById('revealed-role-points').textContent = `${player.role.points} ಅಂಕ`;

    // Special note for pocket chora
    const extraNote = document.getElementById('revealed-role-extra');
    if (extraNote) {
        if (player.role.id === 'pocket_chora') {
            extraNote.textContent = '⚠️ ಪೋಲೀಸ್ ತಪ್ಪಾಗಿ ಆಯ್ಕೆ ಮಾಡಿದರೆ: 400 ↔ 0 ಅಂಕ ಬದಲಾಗುತ್ತದೆ';
            extraNote.style.display = '';
        } else {
            extraNote.style.display = 'none';
        }
    }

    roleBox.classList.remove('hidden');
}

function doneViewingRole() {
    // Stop Three.js animation to save resources between players
    if (window.PaperAnimation) PaperAnimation.destroy();
    const threeContainer = document.getElementById('paper-three-scene');
    if (threeContainer) { threeContainer.style.display = 'none'; threeContainer.innerHTML = ''; }

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
    document.getElementById('round-result-section').classList.add('hidden');

    startPoliceSearch();
}

function startPoliceSearch() {
    document.getElementById('police-section').classList.remove('hidden');

    // ONLY Police can search — no Senapati/Mantri fallback
    let searcher = null;

    if (gameState.policeIndex !== -1) {
        searcher = gameState.players[gameState.policeIndex];
    }

    if (!searcher) {
        // No police in this round — skip to scoring
        calculateRoundScores(false);
        return;
    }

    gameState._currentSearcherIndex = gameState.players.indexOf(searcher);

    document.getElementById('police-section-title').textContent = `🚨 ಕಳ್ಳನನ್ನು ಹಿಡಿಯಿರಿ!`;
    document.getElementById('police-instruction').innerHTML =
        `ಪೋಲೀಸ್ ಆಟಗಾರ: <strong>${searcher.name}</strong>`;

    const suspectList = document.getElementById('suspect-list');
    suspectList.innerHTML = '';

    // Show ALL players as suspects (except the Police)
    // Roles are hidden — no hint shown, just names
    const excludedIds = new Set([searcher.id]);

    gameState.players.forEach(p => {
        if (!excludedIds.has(p.id)) {
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
        // ✅ Correct: caught the main Kalla
        playSound('success');
        searchResult.className = 'search-result success';
        searchResult.innerHTML = `
            <h4>🎉 ಯಶಸ್ವಿ ಕಾರ್ಯಾಚರಣೆ!</h4>
            <p><strong>${suspect.name}</strong> ನಿಜವಾದ ಕಳ್ಳ! ✅</p>
        `;
        setTimeout(() => calculateRoundScores('caught_kala'), 2500);

    } else if (suspect.role.id === 'pocket_chora') {
        // ⚠️ Confused: caught Pocket Chora instead of Kalla
        playSound('fail');
        const actualKala = gameState.players[gameState.kalaIndex];
        searchResult.className = 'search-result warning';
        searchResult.innerHTML = `
            <h4>⚠️ ಪಾಕೆಟ್ ಚೋರ ಹಿಡಿಯಲಾಯಿತು!</h4>
            <p><strong>${suspect.name}</strong> ಪಾಕೆಟ್ ಚೋರ (ಚಿಕ್ಕ ಕಳ್ಳ). ನಿಜವಾದ ಕಳ್ಳ <strong>${actualKala.name}</strong>!</p>
            <p class="swap-note">🔄 ಅಂಕಗಳು ಬದಲಾಗುತ್ತವೆ: ಕಳ್ಳ ↔ ಪಾಕೆಟ್ ಚೋರ</p>
        `;
        setTimeout(() => calculateRoundScores('caught_pocket_chora'), 3500);

    } else {
        // ❌ Wrong: caught an innocent player
        playSound('fail');
        const actualKala = gameState.players[gameState.kalaIndex];
        searchResult.className = 'search-result failure';
        searchResult.innerHTML = `
            <h4>❌ ತಪ್ಪು ಊಹೆ!</h4>
            <p><strong>${suspect.name}</strong> ಕಳ್ಳ ಅಲ್ಲ (${suspect.role.name}). ನಿಜವಾದ ಕಳ್ಳ <strong>${actualKala.name}</strong>!</p>
        `;
        setTimeout(() => calculateRoundScores('missed'), 3500);
    }
}

function calculateRoundScores(result) {
    // result: 'caught_kala' | 'caught_pocket_chora' | 'missed' | false
    document.getElementById('police-section').classList.add('hidden');
    document.getElementById('round-result-section').classList.remove('hidden');

    const scoreList = document.getElementById('round-score-list');
    scoreList.innerHTML = '';

    // Searcher is ALWAYS Police now
    const searcherIdx = gameState.policeIndex;

    gameState.players.forEach(p => {
        let pts = 0;
        let pClass = 'zero';

        switch (p.role.id) {
            case 'raja':
                pts = ROLE_RAJA.points;
                pClass = 'earned';
                break;

            case 'rani':
                pts = ROLE_RANI.points;
                pClass = 'earned';
                break;

            case 'senapati':
                if (searcherIdx !== -1 && p.id === gameState.players[searcherIdx].id) {
                    pts = result === 'caught_kala' ? ROLE_SENAPATI.points : 0;
                    pClass = result === 'caught_kala' ? 'earned' : 'zero';
                } else {
                    pts = ROLE_SENAPATI.points;
                    pClass = 'earned';
                }
                break;

            case 'mantri':
                if (searcherIdx !== -1 && p.id === gameState.players[searcherIdx].id) {
                    pts = result === 'caught_kala' ? ROLE_MANTRI.points : 0;
                    pClass = result === 'caught_kala' ? 'earned' : 'zero';
                } else {
                    pts = ROLE_MANTRI.points;
                    pClass = 'earned';
                }
                break;

            case 'police':
                if (searcherIdx !== -1 && p.id === gameState.players[searcherIdx].id) {
                    pts = result === 'caught_kala' ? ROLE_POLICE.points : 0;
                    pClass = result === 'caught_kala' ? 'earned' : 'zero';
                } else {
                    pts = ROLE_POLICE.points;
                    pClass = 'earned';
                }
                break;

            case 'kala':
                if (result === 'caught_kala') {
                    // Police correctly caught Kalla — Kalla gets 0
                    pts = 0; pClass = 'zero';
                } else if (result === 'caught_pocket_chora') {
                    // Police confused Pocket Chora with Kalla:
                    // SWAP rule — Kalla gets Pocket Chora's default (0)
                    pts = 0; pClass = 'zero';
                } else {
                    // Missed or no police: Kalla escapes — gets Police's points
                    pts = ROLE_POLICE.points;
                    pClass = 'earned';
                }
                break;

            case 'pocket_chora':
                if (result === 'caught_pocket_chora') {
                    // SWAP rule: Police picked Pocket Chora thinking it's Kalla
                    // Pocket Chora gets 400 pts (swap with what Kalla would have lost)
                    pts = 400;
                    pClass = 'earned';
                } else {
                    // Not caught, not confused — Pocket Chora stays at 0
                    pts = 0; pClass = 'zero';
                }
                break;

            case 'sahukara':
                pts = ROLE_SAHUKARA.points;
                pClass = 'earned';
                break;

            case 'praja':
                pts = ROLE_PRAJA.points;
                pClass = 'earned';
                break;
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

    let sortedPlayers = [...gameState.players].sort((a, b) => gameState.scores[b.id] - gameState.scores[a.id]);

    sortedPlayers.forEach((p, index) => {
        let rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : 'rank-other';
        let rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1);

        list.innerHTML += `
            <div class="score-entry ${rankClass}">
                <div class="score-rank ${rankClass}">${rankIcon}</div>
                <div class="score-avatar bg-praja">${p.role ? p.role.icon : '👤'}</div>
                <div class="score-info">
                    <div class="score-name">${p.name}</div>
                    <div class="score-sub">${p.role ? p.role.name : ''}</div>
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
    gameState.players.forEach(p => gameState.scores[p.id] = 0);
    gameState.roundNumber = 1;
    startRound();
}

// ---------------------------
// INITIALIZE
// ---------------------------
window.onload = () => {
    setPlayerCount(4);
    setRounds(10);
};

// Simple Confetti
function triggerConfetti() {
    const colors = ['#f5c842', '#3b82f6', '#ef4444', '#a855f7', '#22c55e', '#f97316'];
    for (let i = 0; i < 60; i++) {
        setTimeout(() => {
            createParticle(colors[Math.floor(Math.random() * colors.length)]);
        }, Math.random() * 800);
    }
}
function createParticle(color) {
    const p = document.createElement('div');
    p.style.cssText = `position:fixed;width:${Math.random()*8+4}px;height:${Math.random()*8+4}px;
    background:${color};left:${Math.random()*100}vw;top:-10px;
    border-radius:${Math.random()>0.5?'50%':'2px'};z-index:9999;pointer-events:none;`;
    document.body.appendChild(p);

    const animation = p.animate([
        { transform: `translate3d(0,0,0) rotate(0deg)`, opacity: 1 },
        { transform: `translate3d(${Math.random()*150-75}px,${window.innerHeight+20}px,0) rotate(${Math.random()*720}deg)`, opacity: 0 }
    ], {
        duration: Math.random() * 2500 + 2000,
        easing: 'cubic-bezier(0,.9,.57,1)'
    });
    animation.onfinish = () => p.remove();
}
