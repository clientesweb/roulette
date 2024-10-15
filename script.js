const wheel = document.getElementById('wheel');
const spinButton = document.getElementById('spin-button');
const resultDiv = document.getElementById('result');
const paymentForm = document.getElementById('payment-form');
const paymentResult = document.getElementById('payment-result');

let isSpinning = false;

spinButton.addEventListener('click', () => {
    if (!isSpinning) {
        isSpinning = true;
        const randomDegree = Math.floor(Math.random() * 360 + 720);
        wheel.style.transform = `rotate(${randomDegree}deg)`;

        setTimeout(() => {
            isSpinning = false;
            const winningSection = getWinningSection(randomDegree);
            resultDiv.textContent = `¡Has ganado: ${winningSection} !`;
            // Mostrar el formulario de pago
            paymentForm.style.display = 'block';
        }, 4000);
    }
});

function getWinningSection(degrees) {
    const normalizedDegrees = degrees % 360;
    const sectionAngle = 360 / 6; // Número de secciones
    const sectionIndex = Math.floor(normalizedDegrees / sectionAngle);
    return `Premio ${sectionIndex + 1}`;
}

// Inicial
