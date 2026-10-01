/* ==========================================================================
   LÓGICA JAVASCRIPT MINIMALISTA - NERAM - ART
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURACIÓN DE SUPABASE (BASE DE DATOS) ---
    // Completa esto con las claves de tu proyecto en Supabase.com
    // Una vez configurado, los registros de todos los celulares se guardarán en la nube.
    const SUPABASE_URL = "https://nnvsenwzckgmfwfgkxbf.supabase.co"; 
    const SUPABASE_ANON_KEY = "sb_publishable_pt4F0QVSU4kHqCMP4cw01g_yR5JXbNX";

    // --- CONFIGURACIÓN DE WHATSAPP ---
    // Coloca aquí tu número de WhatsApp con código de país (sin símbolos ni espacios)
    // Ejemplo para México (+52): "524921259387"
    const WHATSAPP_NUMBER = "524921259387"; 

    // --- CONFIGURACIÓN DE GOOGLE SHEETS ---
    // URL del script de Google Apps que recibe los datos y los agrega a tu hoja de cálculo.
    const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbzafPJDGZ7KGVVZCb3hC8R_Hd25R3foKw0M6w01QyK_N8U2e-v5jzNwkca-wo2ZzZ6zaQ/exec";

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
            const tutorPhoneRaw = tutorPhoneInput.value.trim();
            
            // Limpiar número y agregar prefijo 52 de México si son 10 dígitos
            let cleanPhone = tutorPhoneRaw.replace(/\D/g, '');
            if (cleanPhone.length === 10) {
                cleanPhone = '52' + cleanPhone;
            } else if (cleanPhone.length === 12 && cleanPhone.startsWith('52')) {
                // Ya tiene el 52
            } else {
                // Por si acaso, si es otro número, lo dejamos tal cual
                cleanPhone = cleanPhone || tutorPhoneRaw;
            }

            // Guardar en base de datos local (localStorage) como respaldo
            const registration = {
                studentName,
                tutorName,
                tutorPhone: cleanPhone,
                date: new Date().toISOString()
            };
            
            let history = JSON.parse(localStorage.getItem('neram_registrations')) || [];
            history.push(registration);
            localStorage.setItem('neram_registrations', JSON.stringify(history));

            // Guardar en base de datos en la nube (Supabase) si está configurado
            if (SUPABASE_URL && SUPABASE_ANON_KEY) {
                try {
                    const { createClient } = supabase;
                    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                    supabaseClient.from('registrations').insert([
                        {
                            student_name: studentName,
                            tutor_name: tutorName,
                            tutor_phone: cleanPhone,
                            date: registration.date
                        }
                    ]).then(({ error }) => {
                        if (error) console.error("Error guardando en Supabase:", error);
                        else console.log("Guardado exitoso en Supabase");
                    });
                } catch (err) {
                    console.error("Fallo al conectar o guardar en Supabase:", err);
                }
            }

            // Enviar datos a Google Sheets automáticamente
            if (GOOGLE_SHEETS_URL) {
                try {
                    fetch(GOOGLE_SHEETS_URL, {
                        method: 'POST',
                        mode: 'no-cors',
                        body: new URLSearchParams({
                            studentName: studentName,
                            tutorName: tutorName,
                            tutorPhone: cleanPhone,
                            date: registration.date
                        })
                    }).then(() => {
                        console.log("Datos enviados a Google Sheets");
                    }).catch(err => {
                        console.error("Error enviando a Google Sheets:", err);
                    });
                } catch (err) {
                    console.error("Fallo al enviar a Google Sheets:", err);
                }
            }

            // Rellenar resumen en pantalla
            summaryStudent.textContent = studentName;
            summaryTutor.textContent = tutorName;
            summaryPhone.textContent = cleanPhone;

            // Transición de tarjetas
            formCardContainer.style.display = 'none';
            successCardContainer.style.display = 'block';

            // Lanzar Confetti
            initConfetti();

            // Redirigir a WhatsApp
            sendWhatsAppMessage(studentName, tutorName, cleanPhone);
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

    // --- VERIFICAR CONEXIÓN A BASE DE DATOS EN TIEMPO REAL ---
    const dbStatusBadge = document.getElementById('db-status-badge');
    const dbStatusText = document.getElementById('db-status-text');

    function checkDatabaseConnection() {
        if (SUPABASE_URL && SUPABASE_ANON_KEY) {
            try {
                const { createClient } = supabase;
                const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                
                supabaseClient.from('registrations').select('id').limit(1)
                    .then(({ error }) => {
                        if (error) {
                            console.error("Error al consultar Supabase:", error);
                            setConnectionStatus('disconnected', 'Error de conexión');
                        } else {
                            setConnectionStatus('connected', 'Base de datos conectada');
                        }
                    })
                    .catch(err => {
                        console.error("Excepción en conexión Supabase:", err);
                        setConnectionStatus('disconnected', 'Sin conexión');
                    });
            } catch (err) {
                console.error("Fallo al inicializar cliente Supabase:", err);
                setConnectionStatus('disconnected', 'Error');
            }
        } else {
            setConnectionStatus('local', 'Modo local (Sin base de datos)');
        }
    }

    function setConnectionStatus(status, text) {
        if (!dbStatusBadge || !dbStatusText) return;
        
        // Limpiar clases anteriores
        dbStatusBadge.className = 'status-badge';
        
        // Agregar nueva clase según estado
        if (status === 'connected') {
            dbStatusBadge.classList.add('connected');
            enableFormInputs(true);
        } else {
            if (status === 'disconnected') {
                dbStatusBadge.classList.add('disconnected');
            } else if (status === 'local') {
                dbStatusBadge.classList.add('local');
            }
            enableFormInputs(false);
        }
        
        dbStatusText.textContent = text;
    }

    function enableFormInputs(enable) {
        if (!registrationForm) return;
        const formInputs = registrationForm.querySelectorAll('input, button[type="submit"]');
        formInputs.forEach(input => {
            if (enable) {
                input.removeAttribute('disabled');
            } else {
                input.setAttribute('disabled', 'true');
            }
        });
    }

    // Ejecutar verificación al cargar
    checkDatabaseConnection();
});
