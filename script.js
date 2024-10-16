const WHEEL_SECTORS = [
    { label: '$10', type: 'cash', color: '#FF6B6B', weight: 1 },
    { label: 'Sigue participando', type: 'no-cash', color: '#4ECDC4', weight: 30 },
    { label: '$50', type: 'cash', color: '#45B7D1', weight: 8 },
    { label: 'Sigue participando', type: 'no-cash', color: '#F7DC6F', weight: 40 },
    { label: '$100', type: 'cash', color: '#B8E986', weight: 4 },
    { label: 'Sigue participando', type: 'no-cash', color: '#FF8C42', weight: 50 },
    { label: '$500', type: 'cash', color: '#98DDCA', weight: 1 },
    { label: 'Sigue participando', type: 'no-cash', color: '#D198C5', weight: 70 },
];

let gameState = 'START';
let participationType = 'VIEWS';
let winner = null;
let cashWon = null;
let wheelCanvas, wheelCtx;
let userProfile = null;
let stripe;
let freeSpinUsed = false;

const backendSimulation = {
    users: [],
    payments: [],
    gameHistory: [],

    registerUser: function(userData) {
        const userId = Date.now().toString();
        this.users.push({ ...userData, id: userId, level: 1, achievements: [] });
        return userId;
    },

    processPayment: function(userId, amount) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const paymentId = Date.now().toString();
                this.payments.push({ userId, amount, id: paymentId, status: 'completed' });
                resolve({ success: true, paymentId });
            }, 1000);
        });
    },

    getUserData: function(userId) {
        return this.users.find(user => user.id === userId);
    },

    getPaymentStatus: function(paymentId) {
        const payment = this.payments.find(p => p.id === paymentId);
        return payment ? payment.status : 'not found';
    },

    addGameToHistory: function(userId, result) {
        this.gameHistory.push({ userId, result, timestamp: new Date() });
    },

    getUserGameHistory: function(userId) {
        return this.gameHistory.filter(game => game.userId === userId);
    },

    updateUserLevel: function(userId) {
        const user = this.getUserData(userId);
        if (user) {
            user.level += 1;
            // Check for achievements
            if (user.level === 5) {
                user.achievements.push('Jugador Frecuente');
            }
            if (user.level === 10) {
                user.achievements.push('Maestro del Juego');
            }
        }
    }
};

function renderGameContent() {
    const gameContent = document.getElementById('gameContent');
    gameContent.innerHTML = '';
    gameContent.className = 'fade-in';

    switch (gameState) {
        case 'START':
            gameContent.innerHTML = `
                <h2 class="slide-in">¡Gira la rueda y gana!</h2>
                <button id="spinButton" class="button slide-in">Girar gratis</button>
            `;
            document.getElementById('spinButton').addEventListener('click', () => {
                if (freeSpinUsed) {
                    showMessage('Ya has usado tu giro gratis. Debes pagar para jugar de nuevo.', 'error');
                    gameState = 'PAYMENT';
                    renderGameContent();
                } else {
                    freeSpinUsed = true;
                    gameState = 'WHEEL';
                    renderGameContent();
                }
            });
            break;
        case 'WHEEL':
            gameContent.innerHTML = `
                <div class="wheel-container slide-in">
                    <canvas id="wheelCanvas" width="300" height="300"></canvas>
                    <div class="wheel-pointer"></div>
                </div>
                <button id="spinButton" class="button slide-in">Girar</button>
            `;
            wheelCanvas = document.getElementById('wheelCanvas');
            wheelCtx = wheelCanvas.getContext('2d');
            drawWheel();
            document.getElementById('spinButton').addEventListener('click', spinWheel);
            break;
        case 'SPINNING':
            gameContent.innerHTML = `
                <div class="wheel-container slide-in">
                    <canvas id="wheelCanvas" width="300" height="300"></canvas>
                    <div class="wheel-pointer"></div>
                </div>
                <p class="slide-in">Girando...</p>
            `;
            wheelCanvas = document.getElementById('wheelCanvas');
            wheelCtx = wheelCanvas.getContext('2d');
            drawWheel();
            break;
        case 'RESULT':
            const result = WHEEL_SECTORS[winner];
            if (result.type === 'cash') {
                gameContent.innerHTML = `
                    <h2 class="slide-in">¡Felicidades! Ganaste ${result.label}</h2>
                    <form id="winnerForm" class="slide-in">
                        <div class="form-group">
                            <label for="name">Nombre completo</label>
                            <input type="text" id="name" required>
                        </div>
                        <div class="form-group">
                            <label for="paymentMethod">Método de pago preferido</label>
                            <select id="paymentMethod" required>
                                <option value="">Selecciona un método</option>
                                <option value="bank">Transferencia bancaria</option>
                                <option value="paypal">PayPal</option>
                                <option value="crypto">Criptomoneda</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="whatsapp">WhatsApp</label>
                            <input type="tel" id="whatsapp" required>
                        </div>
                        <div class="form-group">
                            <label for="email">Correo electrónico</label>
                            <input type="email" id="email" required>
                        </div>
                        <button type="submit" class="button">Enviar</button>
                    </form>
                `;
                document.getElementById('winnerForm').addEventListener('submit', handleWinnerForm);
            } else {
                gameContent.innerHTML = `
                    <h2 class="slide-in">¡Sigue participando!</h2>
                    <button id="playAgainButton" class="button slide-in">Volver a jugar</button>
                `;
                document.getElementById('playAgainButton').addEventListener('click', () => {
                    gameState = 'PAYMENT';
                    renderGameContent();
                });
            }
            break;
        case 'PAYMENT':
            gameContent.innerHTML = `
                <h2 class="slide-in">Pago para jugar</h2>
                <p class="slide-in">Realiza el pago de $1.29 para girar la rueda:</p>
                <form id="paymentForm" class="slide-in">
                    <div id="card-element"></div>
                    <div id="card-errors" role="alert"></div>
                    <button type="submit" class="button">Pagar y Jugar</button>
                </form>
            `;
            setupStripeElements();
            document.getElementById('paymentForm').addEventListener('submit', handlePaymentSubmit);
            break;
    }
}

function drawWheel(rotation = 0) {
    // Esta función ahora está vacía para que puedas implementar tu propio diseño de ruleta
    // Puedes usar el parámetro 'rotation' para aplicar la rotación a tu diseño
}

function spinWheel() {
    gameState = 'SPINNING';
    renderGameContent();
    
    let currentRotation = 0;
    const totalRotation = 1440 + Math.random() * 360;
    const duration = 5000; // 5 seconds
    const startTime = performance.now();

    function animate(currentTime) {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        currentRotation = easeOutCubic(progress) * totalRotation;

        drawWheel(currentRotation * Math.PI / 180);

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            finishSpin(totalRotation);
        }
    }

    requestAnimationFrame(animate);
}

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function finishSpin(totalRotation) {
    const normalizedRotation = (360 - totalRotation % 360) % 360;
    let accumulatedWeight = 0;
    const totalWeight = WHEEL_SECTORS.reduce((sum, sector) => sum + sector.weight, 0);

    for (let i = 0; i < WHEEL_SECTORS.length; i++) {
        accumulatedWeight += WHEEL_SECTORS[i].weight;
        if (normalizedRotation <= (accumulatedWeight / totalWeight) * 360) {
            winner = i;
            break;
        }
    }

    const result = WHEEL_SECTORS[winner];
    if (result.type === 'cash') {
        cashWon = result.label;
    }
    
    if (userProfile) {
        backendSimulation.addGameToHistory(userProfile.id, result);
        backendSimulation.updateUserLevel(userProfile.id);
    }
    
    gameState = 'RESULT';
    renderGameContent();
}

function setupStripeElements() {
    stripe = Stripe('your_publishable_key');
    const elements = stripe.elements();
    const cardElement = elements.create('card');
    cardElement.mount('#card-element');

    cardElement.on('change', function(event) {
        const displayError = document.getElementById('card-errors');
        if (event.error) {
            displayError.textContent = event.error.message;
        } else {
            displayError.textContent = '';
        }
    });
}

async function handlePaymentSubmit(e) {
    e.preventDefault();
    
    const { token, error } = await stripe.createToken('#card-element');

    if (error) {
        const errorElement = document.getElementById('card-errors');
        errorElement.textContent = error.message;
    } else {
        try {
            const result = await backendSimulation.processPayment(userProfile.id, 1.29);
            if (result.success) {
                showMessage('Pago procesado correctamente. ¡A jugar!', 'success');
                gameState = 'WHEEL';
                renderGameContent();
            } else {
                showMessage('Error en el pago. Por favor, intenta de nuevo.', 'error');
            }
        } catch (error) {
            showMessage('Error en el pago. Por favor, intenta de nuevo.', 'error');
        }
    }
}

function handleWinnerForm(e) {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const whatsapp = document.getElementById('whatsapp').value;
    const email = document.getElementById('email').value;

    const message = `Nuevo ganador:
Nombre: ${name}
Premio: ${cashWon}
Método de pago: ${paymentMethod}
WhatsApp: ${whatsapp}
Email: ${email}`;

    // Aquí deberías enviar el mensaje a tu número de WhatsApp
    // Por ahora, solo mostraremos un mensaje de éxito
    showMessage('¡Formulario enviado! Te contactaremos pronto para entregarte tu premio.', 'success');

    // Reiniciar el juego
    gameState = 'START';
    renderGameContent();
}

function showMessage(message, type) {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.className = `message ${type} slide-in`;
    document.body.appendChild(messageElement);
    setTimeout(() => {
        messageElement.remove();
    }, 3000);
}

function setupAdSlider() {
    const adContainer = document.getElementById('adContainer');
    const adImages = adContainer.getElementsByTagName('img');
    let currentAd = 0;

    setInterval(() => {
        currentAd = (currentAd + 1) % adImages.length;
        adContainer.style.transform = `translateX(-${currentAd * 100}%)`;
    }, 5000);
}

function setupLogoSlider() {
    const logoSlider = document.getElementById('logoSlider');
    const logos = logoSlider.getElementsByTagName('img');
    let currentLogo = 0;

    setInterval(() => {
        currentLogo = (currentLogo + 1) % logos.length;
        logoSlider.style.transform = `translateX(-${currentLogo * 100}px)`;
    }, 3000);
}

function setupAccessibilityControls() {
    const increaseFont = document.getElementById('increaseFont');
    const decreaseFont = document.getElementById('decreaseFont');
    const toggleContrast = document.getElementById('toggleContrast');

    increaseFont.addEventListener('click', () => {
        document.body.style.fontSize = `${parseFloat(getComputedStyle(document.body).fontSize) * 1.1}px`;
    });

    decreaseFont.addEventListener('click', () => {
        document.body.style.fontSize = `${parseFloat(getComputedStyle(document.body).fontSize) * 0.9}px`;
    });

    toggleContrast.addEventListener('click', () => {
        document.body.classList.toggle('high-contrast');
    });
}

function setupAnalytics() {
    // Ejemplo de evento de análisis
    function logGamePlay() {
        gtag('event', 'game_play', {
            'event_category': 'engagement',
            'event_label': participationType
        });
    }

    // Añadir el registro de eventos en los lugares apropiados
    document.getElementById('spinButton').addEventListener('click', logGamePlay);
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    renderGameContent();
    setupAdSlider();
    setupLogoSlider();
    setupAccessibilityControls();
    setupAnalytics();

    // Simular inicio de sesión del usuario
    userProfile = backendSimulation.registerUser({
        name: 'Usuario de Prueba',
        email: 'usuario@ejemplo.com',
        phone: '1234567890'
    });

    document.getElementById('profileLink').addEventListener('click', (e) => {
        e.preventDefault();
        showUserProfile();
    });
});

function showUserProfile() {
    const user = backendSimulation.getUserData(userProfile.id);
    const gameHistory = backendSimulation.getUserGameHistory(userProfile.id);

    const gameContent = document.getElementById('gameContent');
    gameContent.innerHTML = `
        <h2>Perfil de Usuario</h2>
        <p>Nombre: ${user.name}</p>
        <p>Email: ${user.email}</p>
        <p>Nivel: ${user.level}</p>
        <h3>Logros:</h3>
        <ul>
            ${user.achievements.map(achievement => `<li>${achievement}</li>`).join('')}
        </ul>
        <h3>Historial de Juegos:</h3>
        <ul>
            ${gameHistory.map(game => `<li>${game.result.label} - ${game.timestamp.toLocaleString()}</li>`).join('')}
        </ul>
        <button id="backToGame" class="button">Volver al Juego</button>
    `;

    document.getElementById('backToGame').addEventListener('click', () => {
        gameState = 'START';
        renderGameContent();
    });
}