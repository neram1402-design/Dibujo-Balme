/* ==========================================================================
   LÓGICA JAVASCRIPT MINIMALISTA - NERAM - ART
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURACIÓN DE WHATSAPP ---
    // Coloca aquí tu número de WhatsApp con código de país (sin símbolos ni espacios)
    // Ejemplo para México (+52): "524921259387"
    const WHATSAPP_NUMBER = "524921259387"; 

    // --- ELEMENTOS DEL DOM ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const registrationForm = document.getElementById('simple-registration-form');
    const formCardContainer = document.getElementById('form-card-container');
    const successCardContainer = document.getElementById('success-card-container');
    
    // Campos del Formulario
    const studentNameInput = document.getElementById('student-name');
    const tutorNameInput = document.getElementById('tutor-name');
    const tutorPhoneInput = document.getElementById('tutor-phone');
    
    // Campos de Resumen
    const summaryStudent = document.getElementById('summary-student');
    const summaryTutor = document.getElementById('summary-tutor');
    const summaryPhone = document.getElementById('summary-phone');
    const btnResetForm = document.getElementById('btn-reset-form');

    // --- TEMA CLARO / OSCURO ---
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);

    themeToggleBtn.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        let newTheme = (theme === 'dark') ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        const icon = themeToggleBtn.querySelector('i');
        if (theme === 'dark') {
            icon.className = 'fa-solid fa-sun';
        } else {
            icon.className = 'fa-solid fa-moon';
        }
    }

    // --- VALIDACIÓN DE INPUTS EN TIEMPO REAL ---
    const inputs = [studentNameInput, tutorNameInput, tutorPhoneInput];
    
    inputs.forEach(input => {
        // Remover error al escribir
        input.addEventListener('input', () => {
            const formGroup = input.closest('.form-group');
            if (input.checkValidity()) {
                formGroup.classList.remove('has-error');
            }
        });
    });

    // --- ENVÍO DEL FORMULARIO ---
    registrationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        let isFormValid = true;

        // Validar campos
        inputs.forEach(input => {
            const formGroup = input.closest('.form-group');
            if (!input.value.trim() || !input.checkValidity()) {
                formGroup.classList.add('has-error');
                isFormValid = false;
            } else {
                formGroup.classList.remove('has-error');
            }
        });

        if (isFormValid) {
            // Obtener valores
            const studentName = studentNameInput.value.trim();
            const tutorName = tutorNameInput.value.trim();
            const tutorPhone = tutorPhoneInput.value.trim();

            // Guardar en base de datos local (localStorage)
            const registration = {
                studentName,
                tutorName,
                tutorPhone,
                date: new Date().toISOString()
            };
            
            let history = JSON.parse(localStorage.getItem('neram_registrations')) || [];
            history.push(registration);
            localStorage.setItem('neram_registrations', JSON.stringify(history));

            // Rellenar resumen en pantalla
            summaryStudent.textContent = studentName;
            summaryTutor.textContent = tutorName;
            summaryPhone.textContent = tutorPhone;

            // Transición de tarjetas
            formCardContainer.style.display = 'none';
            successCardContainer.style.display = 'block';

            // Lanzar Confetti
            initConfetti();

            // Redirigir a WhatsApp
            sendWhatsAppMessage(studentName, tutorName, tutorPhone);
        }
    });

    // --- ENVIAR MENSAJE DE WHATSAPP ---
    function sendWhatsAppMessage(student, tutor, phone) {
        const text = `¡Hola NERAM - ART! 🎨\n\n` +
                     `Me gustaría inscribir a un alumno al taller de dibujo:\n\n` +
                     `• *Alumno:* ${student}\n` +
                     `• *Tutor:* ${tutor}\n` +
                     `• *Teléfono:* ${phone}`;
        
        const encodedText = encodeURIComponent(text);
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodedText}`;
        
        // Abrir WhatsApp en pestaña nueva
        window.open(whatsappUrl, '_blank');
    }

    // --- RESETEAR / VOLVER A REGISTRAR ---
    btnResetForm.addEventListener('click', () => {
        registrationForm.reset();
        
        // Limpiar estilos de error anteriores
        inputs.forEach(input => {
            const formGroup = input.closest('.form-group');
            formGroup.classList.remove('has-error');
        });

        successCardContainer.style.display = 'none';
        formCardContainer.style.display = 'block';
    });

    // --- ANIMACIÓN DE CONFETTI CON CANVAS ---
    function initConfetti() {
        const canvas = document.getElementById('confetti-canvas');
        const ctx = canvas.getContext('2d');
        
        // Ajustar tamaño del canvas al contenedor
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
        
        const colors = [
            '#9c0738', // Vino / Borgoña (NERAM - ART)
            '#F05082', // Rosa
            '#1ABC9C', // Menta
            '#F1C40F', // Oro
            '#2C3E50'  // Gris Oscuro
        ];
        
        const confettiCount = 80;
        const pieces = [];
        
        class ConfettiPiece {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * -canvas.height - 10;
                this.size = Math.random() * 6 + 5;
                this.color = colors[Math.floor(Math.random() * colors.length)];
                this.speed = Math.random() * 3 + 2;
                this.rotation = Math.random() * 360;
                this.rotationSpeed = Math.random() * 4 - 2;
                this.wobble = Math.random() * 2 - 1;
            }
            
            update() {
                this.y += this.speed;
                this.x += this.wobble;
                this.rotation += this.rotationSpeed;
                
                if (this.y > canvas.height) {
                    this.y = -10;
                    this.x = Math.random() * canvas.width;
                }
            }
            
            draw() {
                ctx.save();
                ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
                ctx.rotate(this.rotation * Math.PI / 180);
                ctx.fillStyle = this.color;
                ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
                ctx.restore();
            }
        }
        
        for (let i = 0; i < confettiCount; i++) {
            pieces.push(new ConfettiPiece());
        }
        
        let animationFrameId;
        const startTime = Date.now();
        const duration = 4000; // 4 segundos
        
        function loop() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            pieces.forEach(p => {
                p.update();
                p.draw();
            });
            
            if (Date.now() - startTime < duration) {
                animationFrameId = requestAnimationFrame(loop);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                cancelAnimationFrame(animationFrameId);
            }
        }
        
        loop();
        
        window.addEventListener('resize', () => {
            if (canvas && canvas.parentElement) {
                canvas.width = canvas.parentElement.offsetWidth;
                canvas.height = canvas.parentElement.offsetHeight;
            }
        });
    }
});
