const WHEEL_SECTORS = [
    { label: '$10', type: 'cash', color: '#FF6B6B', weight: 1 },
    { label: 'Sigue participando', type: 'no-cash', color: '#4ECDC4', weight: 30 },
    { label: '$50', type: 'cash', color: '#45B7D1', weight: 8 },
    { label: 'Sigue participando', type: 'no-cash', color: '#F7DC6F', weight: 40 },
    { label: '$100', type: 'cash', color: '#B8E986', weight: 4 },
    { label: 'Sigue participando', type:  'no-cash', color: '#FF8C42', weight: 50 },
    { label: '$500', type: 'cash', color: '#98DDCA', weight: 1 },
    { label: 'Sigue participando', type: 'no-cash', color: '#D198C5', weight: 70 },
];

let gameState = 'START';
let participationType = 'VIEWS';
let winner = null;
let cashWon = null;
let wheelCanvas, wheelCtx;

const backendSimulation = {
    users: [],
    payments: [],

    registerUser: function(userData) {
        const userId = Date.now().toString();
        this.users.push({ ...userData, id: userId });
        return userId;
    },

    processPayment: function(userId, amount) {
        const paymentId = Date.now().toString();
        this.payments.push({ userId, amount, id: paymentId, status: 'completed' });
        return { success: true, paymentId };
    },

    getUserData: function(userId) {
        return this.users.find(user => user.id === userId);
    },

    getPaymentStatus: function(paymentId) {
        const payment = this.payments.find(p => p.id === paymentId);
        return payment ? payment.status : 'not found';
    }
};

function renderGameContent() {
    const gameContent = document.getElementById('gameContent');
    gameContent.innerHTML = '';
    gameContent.className = 'fade-in';

    switch (gameState) {
        case 'START':
            gameContent.innerHTML = `
                <h2 class="slide-in">Elige cómo participar:</h2>
                <div class="participation-options slide-in">
                    <button id="viewsButton" class="button">Por visualizaciones</button>
                    <button id="directPaymentButton" class="button">Por pago directo</button>
                </div>
            `;
            document.getElementById('viewsButton').addEventListener('click', () => {
                participationType = 'VIEWS';
                gameState = 'WHEEL';
                renderGameContent();
            });
            document.getElementById('directPaymentButton').addEventListener('click', () => {
                participationType = 'DIRECT_PAYMENT';
                gameState = 'PAYMENT';
                renderGameContent();
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
            gameContent.innerHTML = `
                <h2 class="slide-in">${result.type === 'cash' ? `¡Felicidades! Ganaste ${result.label}` : '¡Sigue participando!'}</h2>
                <button id="playAgainButton" class="button slide-in">Volver a jugar</button>
                <button id="payToPlayButton" class="button slide-in">Jugar por $1.29</button>
            `;
            document.getElementById('playAgainButton').addEventListener('click', () => {
                gameState = 'START';
                renderGameContent();
            });
            document.getElementById('payToPlayButton').addEventListener('click', () => {
                participationType = 'DIRECT_PAYMENT';
                gameState = 'PAYMENT';
                renderGameContent();
            });
            break;
        case 'PAYMENT':
            gameContent.innerHTML = `
                <h2 class="slide-in">${cashWon ? `¡Felicidades! Ganaste ${cashWon}` : 'Pago para jugar'}</h2>
                <p class="slide-in">${cashWon ? 'Completa el formulario para recibir tu pago:' : 'Completa el formulario para realizar el pago de $1.29:'}</p>
                <form id="paymentForm" class="slide-in">
                    <div class="form-group">
                        <label for="name">Nombre completo</label>
                        <input type="text" id="name" required>
                        <span class="error-message" id="nameError"></span>
                    </div>
                    <div class="form-group">
                        <label for="email">Correo electrónico</label>
                        <input type="email" id="email" required>
                        <span class="error-message" id="emailError"></span>
                    </div>
                    <div class="form-group">
                        <label for="phone">Teléfono</label>
                        <input type="tel" id="phone" required>
                        <span class="error-message" id="phoneError"></span>
                    </div>
                    <button type="submit" class="button">Enviar</button>
                </form>
            `;
            document.getElementById('paymentForm').addEventListener('submit', handleFormSubmit);
            break;
    }
}

function drawWheel(rotation = 0) {
    const centerX = wheelCanvas.width / 2;
    const centerY = wheelCanvas.height / 2;
    const radius = wheelCanvas.width / 2 - 10;

    wheelCtx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);
    wheelCtx.save();
    wheelCtx.translate(centerX, centerY);
    wheelCtx.rotate(rotation);
    wheelCtx.translate(-centerX, -centerY);

    let totalWeight = WHEEL_SECTORS.reduce((sum, sector) => sum + sector.weight, 0);
    let currentAngle = 0;

    for (let i = 0; i < WHEEL_SECTORS.length; i++) {
        const sector = WHEEL_SECTORS[i];
        const angle = (sector.weight / totalWeight) * Math.PI * 2;

        wheelCtx.beginPath();
        wheelCtx.moveTo(centerX, centerY);
        wheelCtx.arc(centerX, centerY, radius, currentAngle, currentAngle + angle);
        wheelCtx.lineTo(centerX, centerY);
        wheelCtx.fillStyle = sector.color;
        wheelCtx.fill();

        wheelCtx.save();
        wheelCtx.translate(centerX, centerY);
        wheelCtx.rotate(currentAngle + angle / 2);
        wheelCtx.textAlign = 'right';
        wheelCtx.fillStyle = '#fff';
        wheelCtx.font = 'bold 16px Arial';
        wheelCtx.fillText(sector.label, radius - 10, 5);
        wheelCtx.restore();

        currentAngle += angle;
    }

    wheelCtx.restore();
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
        gameState = 'PAYMENT';
    } else {
        gameState = 'RESULT';
    }
    renderGameContent();
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();

    let isValid = true;

    if (name.length < 3) {
        document.getElementById('nameError').textContent = 'El nombre debe tener al menos 3 caracteres';
        isValid = false;
    } else {
        document.getElementById('nameError').textContent = '';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.getElementById('emailError').textContent = 'Ingrese un correo electrónico válido';
        isValid = false;
    } else {
        document.getElementById('emailError').textContent = '';
    }

    if (!/^\d{10}$/.test(phone)) {
        document.getElementById('phoneError').textContent = 'Ingrese un número de teléfono válido (10 dígitos)';
        isValid = false;
    } else {
        document.getElementById('phoneError').textContent = '';
    }

    if (isValid) {
        const userId = backendSimulation.registerUser({ name, email, phone });
        localStorage.setItem('userId', userId);

        if (participationType === 'DIRECT_PAYMENT') {
            const paymentResult = backendSimulation.processPayment(userId, 1.29);
            if (paymentResult.success) {
                showMessage('Pago procesado correctamente. ¡A jugar!', 'success');
                gameState = 'WHEEL';
                renderGameContent();
            } else {
                showMessage('Error en el pago. Por favor, intenta de nuevo.', 'error');
            }
        } else {
            showMessage('¡Formulario enviado! Recibirás tu pago pronto.', 'success');
            gameState = 'START';
            renderGameContent();
        }
    }
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

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    renderGameContent();
    setupAdSlider();
    setupLogoSlider();
});