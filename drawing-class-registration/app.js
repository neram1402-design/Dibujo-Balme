/* ==========================================================================
   LÓGICA JAVASCRIPT - PINCELADAS MÁGICAS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- ESTADO GLOBAL DE LA APLICACIÓN ---
    let currentStep = 1;
    let childCount = 1;
    let registeredKids = []; // Datos de niños ingresados en paso 2
    
    // Horarios disponibles predefinidos por programa
    const scheduleCatalog = {
        'Pequeños Artistas': [
            { id: 'pa-1', days: 'Lunes y Miércoles', time: '4:00 PM - 5:00 PM', spots: 5, price: 45 },
            { id: 'pa-2', days: 'Sábados', time: '9:30 AM - 10:30 AM', spots: 2, price: 45 }
        ],
        'Creadores Jóvenes': [
            { id: 'cj-1', days: 'Martes y Jueves', time: '4:30 PM - 6:00 PM', spots: 4, price: 50 },
            { id: 'cj-2', days: 'Sábados', time: '10:45 AM - 12:15 PM', spots: 8, price: 50 }
        ],
        'Ilustradores en Crecimiento': [
            { id: 'ic-1', days: 'Lunes y Miércoles', time: '5:30 PM - 7:30 PM', spots: 3, price: 55 },
            { id: 'ic-2', days: 'Sábados', time: '12:30 PM - 2:30 PM', spots: 6, price: 55 }
        ]
    };

    // --- ELEMENTOS DEL DOM ---
    // Navegación
    const navLinks = document.querySelectorAll('.nav-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    const mainNav = document.querySelector('.main-nav');
    const themeToggleBtn = document.getElementById('theme-toggle');
    
    // Botones de flujo rápido
    const btnGoRegisterList = document.querySelectorAll('.btn-go-register');
    const navLogoBtn = document.getElementById('nav-logo-btn');
    
    // Wizard
    const wizardSteps = document.querySelectorAll('.wizard-step');
    const wizardFormSteps = document.querySelectorAll('.wizard-form-step');
    const registrationForm = document.getElementById('registration-form');
    const btnAddChild = document.getElementById('btn-add-child');
    const childrenContainer = document.getElementById('children-cards-container');
    const scheduleSelectorsContainer = document.getElementById('schedule-selectors-container');
    
    // Resumen & Precios
    const summaryTutorInfo = document.getElementById('summary-tutor-info');
    const summaryChildrenList = document.getElementById('summary-children-list');
    const paymentSubtotalLabel = document.getElementById('payment-subtotal-label');
    const paymentSubtotal = document.getElementById('payment-subtotal');
    const discountRow = document.getElementById('discount-row');
    const paymentDiscount = document.getElementById('payment-discount');
    const paymentTotal = document.getElementById('payment-total');
    
    // Éxito
    const successTicketId = document.getElementById('success-ticket-id');
    const successTutorName = document.getElementById('success-tutor-name');
    const successDate = document.getElementById('success-date');
    const successStudentsList = document.getElementById('success-students-list');
    const successAmount = document.getElementById('success-amount');
    const btnSuccessDashboard = document.getElementById('btn-success-dashboard');
    const btnSuccessHome = document.getElementById('btn-success-home');
    
    // Dashboard
    const navDashboardLink = document.getElementById('nav-dashboard-link');
    const dashTutorName = document.getElementById('dash-tutor-name');
    const dashTutorEmail = document.getElementById('dash-tutor-email');
    const dashActiveCount = document.getElementById('dash-active-count');
    const dashEmptyState = document.getElementById('dash-empty-state');
    const dashStudentsGrid = document.getElementById('dash-students-grid');
    const btnDashNewEnroll = document.getElementById('btn-dash-new-enroll');
    const btnDashClearData = document.getElementById('btn-dash-clear-data');

    // --- TEMA CLARO / OSCURO ---
    // Cargar preferencia del tema
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

    // --- NAVEGACIÓN ENTRE SECCIONES ---
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            switchTab(targetId);
            
            // Cerrar menú móvil si está abierto
            mainNav.classList.remove('active');
            mobileNavToggle.querySelector('i').className = 'fa-solid fa-bars';
        });
    });

    mobileNavToggle.addEventListener('click', () => {
        mainNav.classList.toggle('active');
        const icon = mobileNavToggle.querySelector('i');
        if (mainNav.classList.contains('active')) {
            icon.className = 'fa-solid fa-xmark';
        } else {
            icon.className = 'fa-solid fa-bars';
        }
    });

    // Enlace de Inicio en Logo
    navLogoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('home-section');
    });

    // Botones rápidos para ir al formulario de registro
    btnGoRegisterList.forEach(btn => {
        btn.addEventListener('click', () => {
            resetWizard();
            switchTab('registration-section');
        });
    });

    function switchTab(targetId) {
        tabContents.forEach(tab => {
            tab.classList.remove('active');
        });
        const targetTab = document.getElementById(targetId);
        if (targetTab) {
            targetTab.classList.add('active');
            // Hacer scroll hacia arriba
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Actualizar estado de los enlaces de navegación
        navLinks.forEach(link => {
            if (link.getAttribute('data-target') === targetId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Carga dinámica del Portal si se navega a esa sección
        if (targetId === 'dashboard-section') {
            loadDashboardData();
        }
    }

    // --- MANEJO DEL FORMULARIO WIZARD ---
    
    // Botones de Siguiente y Atrás en el formulario
    document.querySelectorAll('.btn-next').forEach(btn => {
        btn.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                if (currentStep === 1) {
                    currentStep++;
                    updateWizardUI();
                } else if (currentStep === 2) {
                    // Extraer los alumnos cargados y generar el Paso 3
                    extractChildrenData();
                    generateScheduleSelectors();
                    currentStep++;
                    updateWizardUI();
                } else if (currentStep === 3) {
                    // Validar selección de horarios en Paso 3
                    if (validateSchedules()) {
                        generateSummary();
                        currentStep++;
                        updateWizardUI();
                    }
                }
            }
        });
    });

    document.querySelectorAll('.btn-prev').forEach(btn => {
        btn.addEventListener('click', () => {
            currentStep--;
            updateWizardUI();
        });
    });

    function updateWizardUI() {
        // Mostrar / Ocultar los pasos del formulario
        wizardFormSteps.forEach(step => {
            step.classList.remove('active');
            if (parseInt(step.getAttribute('data-step')) === currentStep) {
                step.classList.add('active');
            }
        });

        // Actualizar header de progreso
        wizardSteps.forEach(step => {
            const stepNum = parseInt(step.getAttribute('data-step'));
            step.classList.remove('active', 'completed');
            
            if (stepNum === currentStep) {
                step.classList.add('active');
            } else if (stepNum < currentStep) {
                step.classList.add('completed');
            }
        });

        window.scrollTo({ top: 120, behavior: 'smooth' });
    }

    // --- AGREGAR / ELIMINAR NIÑOS DINÁMICAMENTE ---
    btnAddChild.addEventListener('click', () => {
        addChildCard();
    });

    function addChildCard() {
        const newIndex = childCount;
        childCount++;

        const cardHtml = `
            <div class="child-card" data-child-index="${newIndex}">
                <div class="child-card-header">
                    <h3><i class="fa-solid fa-child"></i> Alumno #${newIndex + 1}</h3>
                    <button type="button" class="btn-remove-child" title="Remover este alumno">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label for="child-name-${newIndex}">Nombre Completo *</label>
                        <input type="text" id="child-name-${newIndex}" name="childName_${newIndex}" placeholder="Nombre del niño/a" required class="input-child-name">
                        <span class="error-msg">Ingresa el nombre del alumno.</span>
                    </div>
                    
                    <div class="form-group">
                        <label for="child-age-${newIndex}">Edad *</label>
                        <input type="number" id="child-age-${newIndex}" name="childAge_${newIndex}" min="4" max="16" placeholder="Edad (4 a 16 años)" required class="input-child-age">
                        <span class="error-msg">La edad debe estar entre 4 y 16 años.</span>
                    </div>
                    
                    <div class="form-group">
                        <label for="child-level-${newIndex}">Nivel de Experiencia *</label>
                        <select id="child-level-${newIndex}" name="childLevel_${newIndex}" required class="input-child-level">
                            <option value="" disabled selected>Selecciona nivel</option>
                            <option value="Principiante">Principiante (Primera vez)</option>
                            <option value="Intermedio">Intermedio (Ya ha dibujado antes)</option>
                            <option value="Avanzado">Avanzado (Domina trazo y formas)</option>
                        </select>
                        <span class="error-msg">Selecciona un nivel de experiencia.</span>
                    </div>
                    
                    <div class="form-group full-width">
                        <label for="child-notes-${newIndex}">Notas médicas, alergias o comentarios especiales (Opcional)</label>
                        <textarea id="child-notes-${newIndex}" name="childNotes_${newIndex}" rows="2" placeholder="Ej. Alergias, TDAH, o temas que el profesor deba tener en cuenta para su aprendizaje..."></textarea>
                    </div>
                </div>
            </div>
        `;

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cardHtml.trim();
        const cardElement = tempDiv.firstChild;
        childrenContainer.appendChild(cardElement);

        // Añadir manejador de evento para eliminar el alumno
        cardElement.querySelector('.btn-remove-child').addEventListener('click', () => {
            cardElement.classList.add('removing');
            cardElement.addEventListener('animationend', () => {
                cardElement.remove();
                reindexChildCards();
            });
        });

        // Asegurar que el primer niño tenga botón de eliminar si hay más de uno
        updateTrashButtonsVisibility();
    }

    function reindexChildCards() {
        const cards = childrenContainer.querySelectorAll('.child-card');
        childCount = cards.length;

        cards.forEach((card, index) => {
            card.setAttribute('data-child-index', index);
            card.querySelector('h3').innerHTML = `<i class="fa-solid fa-child"></i> Alumno #${index + 1}`;
            
            // Reindexar inputs para mantener la coherencia
            const nameInput = card.querySelector('.input-child-name');
            nameInput.id = `child-name-${index}`;
            nameInput.name = `childName_${index}`;

            const ageInput = card.querySelector('.input-child-age');
            ageInput.id = `child-age-${index}`;
            ageInput.name = `childAge_${index}`;

            const levelSelect = card.querySelector('.input-child-level');
            levelSelect.id = `child-level-${index}`;
            levelSelect.name = `childLevel_${index}`;
            
            const notesTextarea = card.querySelector('textarea');
            notesTextarea.id = `child-notes-${index}`;
            notesTextarea.name = `childNotes_${index}`;
        });

        updateTrashButtonsVisibility();
    }

    function updateTrashButtonsVisibility() {
        const cards = childrenContainer.querySelectorAll('.child-card');
        cards.forEach((card, index) => {
            const trashBtn = card.querySelector('.btn-remove-child');
            if (cards.length > 1) {
                trashBtn.style.display = 'block';
            } else {
                trashBtn.style.display = 'none';
            }
        });
    }

    // Inicializar evento para remover en la primera tarjeta (por si acaso se agrega otro luego)
    const firstCardRemoveBtn = childrenContainer.querySelector('.child-card [class="btn-remove-child"]');
    if (firstCardRemoveBtn) {
        firstCardRemoveBtn.addEventListener('click', (e) => {
            const card = e.target.closest('.child-card');
            card.remove();
            reindexChildCards();
        });
    }

    // --- OBTENER PROGRAMA SEGÚN LA EDAD ---
    function getProgramByAge(age) {
        if (age >= 4 && age <= 7) {
            return { name: 'Pequeños Artistas', basePrice: 45 };
        } else if (age >= 8 && age <= 12) {
            return { name: 'Creadores Jóvenes', basePrice: 50 };
        } else if (age >= 13 && age <= 16) {
            return { name: 'Ilustradores en Crecimiento', basePrice: 55 };
        }
        return { name: 'Pequeños Artistas', basePrice: 45 }; // Fallback
    }

    // --- EXTRACCIÓN DE DATOS DE ALUMNOS (DEL PASO 2 AL ESTADO) ---
    function extractChildrenData() {
        registeredKids = [];
        const cards = childrenContainer.querySelectorAll('.child-card');
        
        cards.forEach(card => {
            const index = card.getAttribute('data-child-index');
            const name = card.querySelector('.input-child-name').value.trim();
            const age = parseInt(card.querySelector('.input-child-age').value);
            const level = card.querySelector('.input-child-level').value;
            const notes = card.querySelector('textarea').value.trim();
            const programInfo = getProgramByAge(age);
            
            registeredKids.push({
                index: index,
                name: name,
                age: age,
                level: level,
                notes: notes,
                programName: programInfo.name,
                price: programInfo.basePrice,
                selectedScheduleId: null, // Se llenará en paso 3
                selectedScheduleText: ''   // Se llenará en paso 3
            });
        });
    }

    // --- GENERAR SELECTORES DE HORARIOS DINÁMICOS (PASO 3) ---
    function generateScheduleSelectors() {
        scheduleSelectorsContainer.innerHTML = '';
        
        registeredKids.forEach((kid, idx) => {
            const catalogOptions = scheduleCatalog[kid.programName] || [];
            
            let optionsHtml = '';
            catalogOptions.forEach((option, optIdx) => {
                const spotsText = option.spots <= 3 ? 
                    `<span class="schedule-spots spots-critical"><i class="fa-solid fa-triangle-exclamation"></i> ¡Últimos ${option.spots} cupos!</span>` : 
                    `<span class="schedule-spots spots-left"><i class="fa-solid fa-circle-check"></i> ${option.spots} cupos libres</span>`;

                optionsHtml += `
                    <div class="schedule-option-card ${optIdx === 0 ? 'selected' : ''}" data-schedule-id="${option.id}" data-schedule-text="${option.days} - ${option.time}">
                        <input type="radio" name="schedule_${idx}" value="${option.id}" ${optIdx === 0 ? 'checked' : ''}>
                        <span class="schedule-time">${option.time}</span>
                        <span class="schedule-days">${option.days}</span>
                        ${spotsText}
                    </div>
                `;
            });

            const selectorHtml = `
                <div class="schedule-child-group" data-kid-index="${idx}">
                    <h3><i class="fa-solid fa-user-graduate"></i> Horario para: ${kid.name}</h3>
                    <span class="schedule-age-badge">${kid.programName} (Edades ${kid.age} años) - $${kid.price} USD/mes</span>
                    <div class="schedule-options-grid">
                        ${optionsHtml}
                    </div>
                    <span class="error-msg text-center" style="display:none; margin-top:12px;">Por favor selecciona un horario para este alumno.</span>
                </div>
            `;

            scheduleSelectorsContainer.insertAdjacentHTML('beforeend', selectorHtml);
        });

        // Registrar los eventos de clic en las tarjetas de horarios
        document.querySelectorAll('.schedule-option-card').forEach(card => {
            card.addEventListener('click', function() {
                const parentGroup = this.closest('.schedule-options-grid');
                // Deseleccionar todas las opciones dentro de este grupo de niño
                parentGroup.querySelectorAll('.schedule-option-card').forEach(c => {
                    c.classList.remove('selected');
                    c.querySelector('input[type="radio"]').checked = false;
                });
                
                // Seleccionar esta tarjeta
                this.classList.add('selected');
                const radio = this.querySelector('input[type="radio"]');
                radio.checked = true;
            });
        });
    }

    // --- VALIDACIONES DE FORMULARIO ---
    function validateStep(step) {
        let isValid = true;
        const currentStepEl = document.querySelector(`.wizard-form-step[data-step="${step}"]`);
        
        // Buscar inputs requeridos en el paso actual
        const requiredInputs = currentStepEl.querySelectorAll('[required]');
        
        requiredInputs.forEach(input => {
            const formGroup = input.closest('.form-group');
            if (!input.value || !input.checkValidity()) {
                formGroup.classList.add('has-error');
                isValid = false;
            } else {
                formGroup.classList.remove('has-error');
            }

            // Validar números específicos (Edad)
            if (input.type === 'number') {
                const val = parseInt(input.value);
                const min = parseInt(input.getAttribute('min'));
                const max = parseInt(input.getAttribute('max'));
                if (val < min || val > max || isNaN(val)) {
                    formGroup.classList.add('has-error');
                    isValid = false;
                }
            }
        });

        // Limpiar errores en tiempo de entrada de texto
        currentStepEl.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('input', () => {
                const formGroup = input.closest('.form-group');
                if (formGroup && input.checkValidity()) {
                    formGroup.classList.remove('has-error');
                }
            });
            input.addEventListener('change', () => {
                const formGroup = input.closest('.form-group');
                if (formGroup && input.checkValidity()) {
                    formGroup.classList.remove('has-error');
                }
            });
        });

        return isValid;
    }

    function validateSchedules() {
        let allSelected = true;
        registeredKids.forEach((kid, idx) => {
            const group = document.querySelector(`.schedule-child-group[data-kid-index="${idx}"]`);
            const selectedCard = group.querySelector('.schedule-option-card.selected');
            
            if (!selectedCard) {
                group.querySelector('.error-msg').style.display = 'block';
                allSelected = false;
            } else {
                group.querySelector('.error-msg').style.display = 'none';
                
                // Guardar horario seleccionado
                kid.selectedScheduleId = selectedCard.getAttribute('data-schedule-id');
                kid.selectedScheduleText = selectedCard.getAttribute('data-schedule-text');
            }
        });
        return allSelected;
    }

    // --- GENERAR RESUMEN (PASO 4) ---
    function generateSummary() {
        // Datos de Tutor
        const name = document.getElementById('tutor-name').value.trim();
        const email = document.getElementById('tutor-email').value.trim();
        const phone = document.getElementById('tutor-phone').value.trim();
        const relation = document.getElementById('tutor-relation').value;
        
        summaryTutorInfo.innerHTML = `
            <p><strong>Nombre del Tutor:</strong> ${name}</p>
            <p><strong>Relación:</strong> ${relation.charAt(0).toUpperCase() + relation.slice(1)}</p>
            <p><strong>Contacto:</strong> ${email} | Cel: ${phone}</p>
        `;

        // Datos de Niños
        summaryChildrenList.innerHTML = '';
        let subtotal = 0;

        registeredKids.forEach(kid => {
            subtotal += kid.price;
            
            const kidHtml = `
                <div class="summary-child-item">
                    <div class="summary-child-info">
                        <h4>${kid.name} (${kid.age} años) - Nivel ${kid.level}</h4>
                        <p><i class="fa-solid fa-clock"></i> Horario: ${kid.selectedScheduleText} (${kid.programName})</p>
                    </div>
                    <span class="summary-child-price">$${kid.price}.00 USD</span>
                </div>
            `;
            summaryChildrenList.insertAdjacentHTML('beforeend', kidHtml);
        });

        // Cálculo de Precios
        const totalAlumnos = registeredKids.length;
        paymentSubtotalLabel.textContent = `Subtotal (${totalAlumnos} alumno${totalAlumnos > 1 ? 's' : ''}):`;
        paymentSubtotal.textContent = `$${subtotal.toFixed(2)} USD`;
        
        let discount = 0;
        if (totalAlumnos >= 2) {
            discount = subtotal * 0.10; // 10% Descuento familiar
            discountRow.style.display = 'flex';
            paymentDiscount.textContent = `-$${discount.toFixed(2)} USD`;
        } else {
            discountRow.style.display = 'none';
        }

        const total = subtotal - discount;
        paymentTotal.textContent = `$${total.toFixed(2)} USD`;
    }

    // --- SUBMIT REGISTRO (CONFIRMACIÓN FINAL) ---
    registrationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Generar los datos finales del registro
        const tutorName = document.getElementById('tutor-name').value.trim();
        const tutorEmail = document.getElementById('tutor-email').value.trim();
        const tutorPhone = document.getElementById('tutor-phone').value.trim();
        const tutorRelation = document.getElementById('tutor-relation').value;
        
        const tutorInfo = {
            name: tutorName,
            email: tutorEmail,
            phone: tutorPhone,
            relation: tutorRelation
        };

        const codeRandom = Math.floor(100000 + Math.random() * 900000);
        const ticketId = `PM-${codeRandom}`;
        const todayStr = getFormattedDate();

        // Calcular costo total
        let subtotal = 0;
        registeredKids.forEach(kid => { subtotal += kid.price; });
        const discount = registeredKids.length >= 2 ? subtotal * 0.10 : 0;
        const totalPaid = subtotal - discount;

        // Estructura final del registro a guardar
        const registrationData = {
            ticketId: ticketId,
            date: todayStr,
            tutor: tutorInfo,
            children: registeredKids,
            totalAmount: `$${totalPaid.toFixed(2)} USD`
        };

        // Guardar en LocalStorage
        saveRegistrationToLocalStorage(registrationData);

        // Mostrar pantalla de éxito
        successTicketId.textContent = ticketId;
        successTutorName.textContent = tutorName;
        successDate.textContent = todayStr;
        successAmount.textContent = `$${totalPaid.toFixed(2)} USD`;
        
        successStudentsList.innerHTML = '';
        registeredKids.forEach(kid => {
            const studentRow = `
                <div class="ticket-student-row">
                    <span>${kid.name} - <strong>${kid.programName}</strong></span>
                    <span>${kid.selectedScheduleText.split(' - ')[0]}</span>
                </div>
            `;
            successStudentsList.insertAdjacentHTML('beforeend', studentRow);
        });

        // Alternar a pantalla de éxito
        switchTab('success-section');
        
        // Iniciar Confetti!
        initConfetti();
    });

    function getFormattedDate() {
        const date = new Date();
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('es-ES', options);
    }

    // --- ACCIONES DE LA PANTALLA DE ÉXITO ---
    btnSuccessDashboard.addEventListener('click', () => {
        switchTab('dashboard-section');
    });

    btnSuccessHome.addEventListener('click', () => {
        switchTab('home-section');
    });

    // --- PERSISTENCIA LOCALSTORAGE ---
    function saveRegistrationToLocalStorage(newRegistration) {
        // Obtener historial previo
        let history = JSON.parse(localStorage.getItem('pinceladas_registrations')) || [];
        
        // Dado que un tutor puede inscribir múltiples veces, agrupamos por tutor y agregamos niños
        // O agregamos la inscripción completa al arreglo de inscripciones.
        history.push(newRegistration);
        
        localStorage.setItem('pinceladas_registrations', JSON.stringify(history));
        
        // Guardar tutor activo
        localStorage.setItem('pinceladas_tutor', JSON.stringify(newRegistration.tutor));
    }

    // --- PORTAL DE PADRES (DASHBOARD) ---
    function loadDashboardData() {
        const registrations = JSON.parse(localStorage.getItem('pinceladas_registrations')) || [];
        const tutor = JSON.parse(localStorage.getItem('pinceladas_tutor')) || null;

        if (registrations.length === 0 || !tutor) {
            // Mostrar estado vacío
            dashTutorName.textContent = 'Invitado';
            dashTutorEmail.textContent = 'Sin registro activo';
            dashActiveCount.textContent = '0';
            dashEmptyState.style.display = 'block';
            dashStudentsGrid.style.display = 'none';
            return;
        }

        // Cargar tutor
        dashTutorName.textContent = tutor.name;
        dashTutorEmail.textContent = tutor.email;

        // Recolectar todos los niños inscritos de todas las inscripciones históricas
        let enrolledChildrenList = [];
        registrations.forEach(reg => {
            reg.children.forEach(child => {
                enrolledChildrenList.push({
                    ticketId: reg.ticketId,
                    date: reg.date,
                    ...child
                });
            });
        });

        dashActiveCount.textContent = enrolledChildrenList.length;

        if (enrolledChildrenList.length === 0) {
            dashEmptyState.style.display = 'block';
            dashStudentsGrid.style.display = 'none';
            return;
        }

        // Ocultar estado vacío y mostrar grid de niños
        dashEmptyState.style.display = 'none';
        dashStudentsGrid.style.display = 'grid';
        dashStudentsGrid.innerHTML = '';

        enrolledChildrenList.forEach((child, index) => {
            const childCardHtml = `
                <div class="dash-student-card">
                    <div class="dash-student-card-header">
                        <div class="student-info-main">
                            <h3>${child.name}</h3>
                            <span class="student-age">${child.age} años | Nivel ${child.level}</span>
                        </div>
                        <span class="enroll-status-badge">Inscrito</span>
                    </div>
                    <div class="dash-student-card-body">
                        <div class="dash-class-detail">
                            <div class="detail-row">
                                <i class="fa-solid fa-paintbrush"></i>
                                <div>
                                    <span class="detail-label">Taller / Programa</span>
                                    <span class="detail-val">${child.programName}</span>
                                </div>
                            </div>
                            <div class="detail-row">
                                <i class="fa-solid fa-calendar-days"></i>
                                <div>
                                    <span class="detail-label">Horario Asignado</span>
                                    <span class="detail-val">${child.selectedScheduleText}</span>
                                </div>
                            </div>
                            <div class="detail-row">
                                <i class="fa-solid fa-file-invoice"></i>
                                <div>
                                    <span class="detail-label">Comprobante y Fecha</span>
                                    <span class="detail-val">Ref: ${child.ticketId} (${child.date})</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="dash-student-card-footer">
                        <button class="btn btn-outline btn-small btn-cancel-enroll" data-ticket="${child.ticketId}" data-child-name="${child.name}" data-index="${index}">
                            Cancelar Taller
                        </button>
                    </div>
                </div>
            `;
            dashStudentsGrid.insertAdjacentHTML('beforeend', childCardHtml);
        });

        // Registrar eventos de cancelación individuales
        document.querySelectorAll('.btn-cancel-enroll').forEach(btn => {
            btn.addEventListener('click', function() {
                const childName = this.getAttribute('data-child-name');
                const ticketId = this.getAttribute('data-ticket');
                cancelEnrollment(ticketId, childName);
            });
        });
    }

    function cancelEnrollment(ticketId, childName) {
        if (confirm(`¿Estás seguro de que deseas cancelar la inscripción al taller de dibujo para ${childName}?`)) {
            let registrations = JSON.parse(localStorage.getItem('pinceladas_registrations')) || [];
            
            // Recorrer y eliminar de la inscripción respectiva
            registrations.forEach((reg, regIdx) => {
                if (reg.ticketId === ticketId) {
                    // Remover al niño
                    reg.children = reg.children.filter(child => child.name !== childName);
                }
            });

            // Eliminar registros que ya no tengan niños asociados
            registrations = registrations.filter(reg => reg.children.length > 0);

            // Guardar cambios
            if (registrations.length === 0) {
                localStorage.removeItem('pinceladas_registrations');
                localStorage.removeItem('pinceladas_tutor');
            } else {
                localStorage.setItem('pinceladas_registrations', JSON.stringify(registrations));
            }

            alert(`La inscripción de ${childName} ha sido cancelada exitosamente.`);
            loadDashboardData();
        }
    }

    btnDashNewEnroll.addEventListener('click', (e) => {
        e.preventDefault();
        resetWizard();
        switchTab('registration-section');
    });

    btnDashClearData.addEventListener('click', () => {
        if (confirm('¿Deseas eliminar todo el historial de inscripciones guardado en este navegador?')) {
            localStorage.removeItem('pinceladas_registrations');
            localStorage.removeItem('pinceladas_tutor');
            alert('Datos eliminados correctamente.');
            loadDashboardData();
        }
    });

    // --- RESETEO DE FORMULARIO WIZARD ---
    function resetWizard() {
        currentStep = 1;
        childCount = 1;
        registeredKids = [];
        registrationForm.reset();
        
        // Limpiar contenedor dinámico de niños y dejar solo el primero
        childrenContainer.innerHTML = `
            <div class="child-card" data-child-index="0">
                <div class="child-card-header">
                    <h3><i class="fa-solid fa-child"></i> Alumno #1</h3>
                    <button type="button" class="btn-remove-child" style="display:none;" title="Remover este alumno">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label for="child-name-0">Nombre Completo *</label>
                        <input type="text" id="child-name-0" name="childName_0" placeholder="Nombre del niño/a" required class="input-child-name">
                        <span class="error-msg">Ingresa el nombre del alumno.</span>
                    </div>
                    
                    <div class="form-group">
                        <label for="child-age-0">Edad *</label>
                        <input type="number" id="child-age-0" name="childAge_0" min="4" max="16" placeholder="Edad (4 a 16 años)" required class="input-child-age">
                        <span class="error-msg">La edad debe estar entre 4 y 16 años.</span>
                    </div>
                    
                    <div class="form-group">
                        <label for="child-level-0">Nivel de Experiencia *</label>
                        <select id="child-level-0" name="childLevel_0" required class="input-child-level">
                            <option value="" disabled selected>Selecciona nivel</option>
                            <option value="Principiante">Principiante (Primera vez)</option>
                            <option value="Intermedio">Intermedio (Ya ha dibujado antes)</option>
                            <option value="Avanzado">Avanzado (Domina trazo y formas)</option>
                        </select>
                        <span class="error-msg">Selecciona un nivel de experiencia.</span>
                    </div>
                    
                    <div class="form-group full-width">
                        <label for="child-notes-0">Notas médicas, alergias o comentarios especiales (Opcional)</label>
                        <textarea id="child-notes-0" name="childNotes_0" rows="2" placeholder="Ej. Alergias, TDAH, o temas que el profesor deba tener en cuenta para su aprendizaje..."></textarea>
                    </div>
                </div>
            </div>
        `;
        
        // Remover clases de error
        document.querySelectorAll('.form-group').forEach(fg => fg.classList.remove('has-error'));
        
        // Re-asignar evento de remover en tarjeta inicial
        const firstCardRemoveBtn = childrenContainer.querySelector('.child-card [class="btn-remove-child"]');
        if (firstCardRemoveBtn) {
            firstCardRemoveBtn.addEventListener('click', (e) => {
                const card = e.target.closest('.child-card');
                card.remove();
                reindexChildCards();
            });
        }
        
        updateWizardUI();
    }

    // --- ANIMACIÓN DE CONFETTI CON CANVAS ---
    function initConfetti() {
        const canvas = document.getElementById('confetti-canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
        
        const colors = [
            '#8A4BEE', // Violeta
            '#F05082', // Rosa
            '#1ABC9C', // Menta
            '#F1C40F', // Oro
            '#3498DB'  // Azul
        ];
        
        const confettiCount = 120;
        const pieces = [];
        
        class ConfettiPiece {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * -canvas.height - 20;
                this.size = Math.random() * 8 + 6;
                this.color = colors[Math.floor(Math.random() * colors.length)];
                this.speed = Math.random() * 3 + 3;
                this.rotation = Math.random() * 360;
                this.rotationSpeed = Math.random() * 4 - 2;
                this.wobble = Math.random() * 2 - 1;
            }
            
            update() {
                this.y += this.speed;
                this.x += this.wobble;
                this.rotation += this.rotationSpeed;
                
                // Reset si sale del canvas
                if (this.y > canvas.height) {
                    this.y = -20;
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
        
        // Crear confetti
        for (let i = 0; i < confettiCount; i++) {
            pieces.push(new ConfettiPiece());
        }
        
        let animationFrameId;
        let animationDuration = 5000; // 5 segundos
        const startTime = Date.now();
        
        function loop() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            pieces.forEach(p => {
                p.update();
                p.draw();
            });
            
            if (Date.now() - startTime < animationDuration) {
                animationFrameId = requestAnimationFrame(loop);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                cancelAnimationFrame(animationFrameId);
            }
        }
        
        loop();
        
        // Manejar redimensionado de canvas al cambiar tamaño de pantalla
        window.addEventListener('resize', () => {
            if (canvas && canvas.parentElement) {
                canvas.width = canvas.parentElement.offsetWidth;
                canvas.height = canvas.parentElement.offsetHeight;
            }
        });
    }
});
