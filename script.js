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
let rotation = 0;
let winner = null;
let cashWon = null;

// Simulación de backend
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
        case  'START':
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
                gameState = 'WHEEL';
                renderGameContent();
            });
            break;
        case 'WHEEL':
            gameContent.innerHTML = `
                <div class="wheel-container slide-in">
                    <canvas id="wheelCanvas" width="300" height="300"></canvas>
                    <div class="wheel-pointer"></div>
                </div>
                <button id="spinButton" class="button slide-in">
                    ${participationType === 'VIEWS' ? 'Girar' : 'Girar por $1.29'}
                </button>
            `;
            drawWheel();
            document.getElementById('spinButton').addEventListener('click', () => {
                if (participationType === 'DIRECT_PAYMENT') {
                    handlePayment();
                } else {
                    gameState = 'SPINNING';
                    spinWheel();
                }
            });
            break;
        case 'SPINNING':
            gameContent.innerHTML = `
                <div class="wheel-container slide-in">
                    <canvas id="wheelCanvas" width="300" height="300"></canvas>
                    <div class="wheel-pointer"></div>
                </div>
            `;
            drawWheel();
            spinWheel();
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
            document.getElementById('payToPlayButton').addEventListener('click', handlePayment);
            break;
        case 'PAYMENT':
            gameContent.innerHTML = `
                <h2 class="slide-in">¡Felicidades! Ganaste ${cashWon}</h2>
                <p class="slide-in">Completa el formulario para recibir tu pago:</p>
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

function handlePayment() {
    const userId = localStorage.getItem('userId');
    if (userId) {
        const paymentResult = backendSimulation.processPayment(userId, 1.29);
        if (paymentResult.success) {
            gameState = 'SPINNING';
            spinWheel();
        } else {
            alert('Error en el pago. Por favor, intenta de nuevo.');
        }
    } else {
        alert('Por favor, registra tus datos antes de realizar un pago.');
        gameState = 'PAYMENT';
        renderGameContent();
    }
}

function drawWheel() {
    const canvas = document.getElementById('wheelCanvas');
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let totalWeight = WHEEL_SECTORS.reduce((sum, sector) => sum + sector.weight, 0);
    let currentAngle = 0;

    for (let i = 0; i < WHEEL_SECTORS.length; i++) {
        const sector = WHEEL_SECTORS[i];
        const angle = (sector.weight / totalWeight) * Math.PI * 2;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + angle);
        ctx.lineTo(centerX, centerY);
        ctx.fillStyle = sector.color;
        ctx.fill();

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(currentAngle + angle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(sector.label, radius - 10, 5);
        ctx.restore();

        currentAngle += angle;
    }
}

function spinWheel() {
    const canvas = document.getElementById('wheelCanvas');
    const ctx = canvas.getContext('2d');
    
    let currentRotation = 0;
    const totalRotation = 1440 + Math.random() * 360;
    const duration = 5000; // 5 seconds
    const startTime = performance.now();

    function animate(currentTime) {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        currentRotation = easeOutCubic(progress) * totalRotation;

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(currentRotation * Math.PI / 180);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        drawWheel();
        ctx.restore();

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
    rotation = totalRotation % 360;
    const normalizedRotation = (360 - rotation) % 360;
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
        alert('¡Formulario enviado! Recibirás tu pago pronto.');
        gameState = 'START';
        renderGameContent();
    }
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

document.getElementById('currentYear').textContent = new Date().getFullYear();

// Inicializar la aplicación
renderGameContent();
setupAdSlider();
setupLogoSlider();