const WHEEL_SECTORS = [
    { label: '$10', type: 'cash', color: '#FF6B6B' },
    { label: 'Sigue participando', type: 'no-cash', color: '#4ECDC4' },
    { label: '$50', type: 'cash', color: '#45B7D1' },
    { label: 'Sigue participando', type: 'no-cash', color: '#F7DC6F' },
    { label: '$100', type: 'cash', color: '#B8E986' },
    { label: 'Sigue participando', type: 'no-cash', color: '#FF8C42' },
    { label: '$500', type: 'cash', color: '#98DDCA' },
    { label: 'Sigue participando', type: 'no-cash', color: '#D198C5' },
];

let gameState = 'START';
let participationType = 'VIEWS';
let rotation = 0;
let winner = null;
let cashWon = null;

function renderGameContent() {
    const gameContent = document.getElementById('gameContent');
    gameContent.innerHTML = '';
    gameContent.className = 'fade-in';

    switch (gameState) {
        case 'START':
            gameContent.innerHTML = `
                <h2 class="slide-in">Elige cómo participar:</h2>
                <div class="participation-options slide-in">
                    <div>
                        <input type="radio" id="views" name="participationType" value="VIEWS" checked>
                        <label for="views">Por visualizaciones</label>
                    </div>
                    <div>
                        <input type="radio" id="direct" name="participationType" value="DIRECT_PAYMENT">
                        <label for="direct">Por pago directo</label>
                    </div>
                </div>
                <button id="participateButton" class="button slide-in">Participar</button>
            `;
            document.querySelectorAll('input[name="participationType"]').forEach(radio => {
                radio.addEventListener('change', (e) => {
                    participationType = e.target.value;
                    updateParticipateButton();
                });
            });
            document.getElementById('participateButton').addEventListener('click', handleParticipate);
            updateParticipateButton();
            break;
        case 'SPINNING':
            gameContent.innerHTML = `
                <div class="wheel-container slide-in">
                    <canvas id="wheelCanvas" width="400" height="400"></canvas>
                    
                    <div class="wheel-pointer"></div>
                </div>
                <button id="stopButton" class="button slide-in">Parar</button>
            `;
            document.getElementById('stopButton').addEventListener('click', () => {
                gameState = 'RESULT';
                renderGameContent();
            });
            drawWheel();
            spinWheel();
            break;
        case 'RESULT':
            const result = WHEEL_SECTORS[winner];
            gameContent.innerHTML = `
                <h2 class="slide-in">${result.type === 'cash' ? `¡Felicidades! Ganaste ${result.label}` : '¡Sigue participando!'}</h2>
                <button id="playAgainButton" class="button slide-in">Volver a jugar</button>
                <button id="payToPlayButton" class="button slide-in">Jugar por $1.99</button>
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
                <button id="goToFormButton" class="button slide-in">Ir al formulario</button>
            `;
            document.getElementById('goToFormButton').addEventListener('click', () => {
                gameState = 'FORM';
                renderGameContent();
            });
            break;
        case 'FORM':
            gameContent.innerHTML = `
                <form id="paymentForm" class="slide-in">
                    <div>
                        <label for="name">Nombre completo</label>
                        <input type="text" id="name" required>
                    </div>
                    <div>
                        <label for="email">Correo electrónico</label>
                        <input type="email" id="email" required>
                    </div>
                    <div>
                        <label for="phone">Teléfono</label>
                        <input type="tel" id="phone" required>
                    </div>
                    <button type="submit" class="button">Enviar</button>
                </form>
            `;
            document.getElementById('paymentForm').addEventListener('submit', handleFormSubmit);
            break;
    }
}

function updateParticipateButton() {
    const button = document.getElementById('participateButton');
    if (participationType === 'DIRECT_PAYMENT') {
        button.textContent = 'Ir a pago';
    } else {
        button.textContent = 'Girar la ruleta';
    }
}

function handleParticipate() {
    if (participationType === 'DIRECT_PAYMENT') {
        handlePayment();
    } else {
        gameState = 'SPINNING';
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

    const arc = Math.PI * 2 / WHEEL_SECTORS.length;

    for (let i = 0; i < WHEEL_SECTORS.length; i++) {
        const angle = i * arc;
        ctx.beginPath();
        ctx.fillStyle = WHEEL_SECTORS[i].color;
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, angle, angle + arc);
        ctx.lineTo(centerX, centerY);
        ctx.fill();

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle + arc / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(WHEEL_SECTORS[i].label, radius - 10, 5);
        ctx.restore();
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
    winner = Math.floor(((360 - rotation) / (360 / WHEEL_SECTORS.length)) % WHEEL_SECTORS.length);
    const result = WHEEL_SECTORS[winner];
    if (result.type === 'cash') {
        cashWon = result.label;
        gameState = 'PAYMENT';
    } else {
        gameState = 'RESULT';
    }
    renderGameContent();
}

function handlePayment() {
    // Simular proceso de pago
    setTimeout(() => {
        gameState = 'FORM';
        renderGameContent();
    }, 1000);
}

function handleFormSubmit(e) {
    e.preventDefault();
    // Procesar envío del formulario
    alert('¡Formulario enviado! Recibirás tu pago pronto.');
    gameState = 'START';
    renderGameContent();
}

document.getElementById('currentYear').textContent = new Date().getFullYear();

renderGameContent();