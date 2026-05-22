/* ==========================================================================
   LÓGICA JAVASCRIPT PANEL ADMIN - NERAM - ART
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- CONTRASEÑA DE ADMINISTRADOR ---
    // Cambia aquí tu contraseña para entrar al panel
    const ADMIN_PASSWORD = "neram2026";

    // --- ELEMENTOS DEL DOM ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const tableBody = document.getElementById('registrations-table-body');
    const searchInput = document.getElementById('admin-search');
    const totalCount = document.getElementById('total-registrations-count');
    const emptyState = document.getElementById('admin-empty-state');
    const btnExportCsv = document.getElementById('btn-export-csv');
    const btnClearAll = document.getElementById('btn-clear-all');

    // Elementos de Login
    const mainContainer = document.getElementById('admin-main-container');
    const loginCard = document.getElementById('admin-login-card');
    const dashboardCard = document.getElementById('admin-dashboard-card');
    const loginForm = document.getElementById('admin-login-form');
    const passwordInput = document.getElementById('admin-password');
    const loginGroup = document.getElementById('login-group');

    // Elementos de Recibo de Pago
    const receiptModal = document.getElementById('receipt-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const receiptForm = document.getElementById('receipt-form');
    const receiptStudent = document.getElementById('receipt-student');
    const receiptTutor = document.getElementById('receipt-tutor');
    const receiptAmount = document.getElementById('receipt-amount');
    const receiptDate = document.getElementById('receipt-date');
    const receiptConcept = document.getElementById('receipt-concept');
    const btnPrintReceipt = document.getElementById('btn-print-receipt');
    const receiptAmountGroup = document.getElementById('receipt-amount-group');
    const receiptDateGroup = document.getElementById('receipt-date-group');
    const receiptConceptGroup = document.getElementById('receipt-concept-group');

    let registrations = [];
    let currentActiveReg = null;

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

    // --- CARGAR DATOS DE LOCALSTORAGE ---
    function loadRegistrations() {
        registrations = JSON.parse(localStorage.getItem('neram_registrations')) || [];
        // Ordenar del más nuevo al más antiguo
        registrations.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        renderTable(registrations);
    }

    // --- RENDERIZAR TABLA ---
    function renderTable(dataList) {
        tableBody.innerHTML = '';
        totalCount.textContent = dataList.length;

        if (dataList.length === 0) {
            emptyState.style.display = 'block';
            document.querySelector('.table-responsive').style.display = 'none';
            btnExportCsv.style.display = 'none';
            btnClearAll.style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        document.querySelector('.table-responsive').style.display = 'block';
        btnExportCsv.style.display = 'inline-flex';
        btnClearAll.style.display = 'inline-flex';

        dataList.forEach((reg, index) => {
            const formattedDate = new Date(reg.date).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            // Número limpio para el enlace de WhatsApp
            let cleanPhone = reg.tutorPhone.replace(/\D/g, '');
            if (cleanPhone.length === 10) {
                cleanPhone = '52' + cleanPhone;
            }

            const row = `
                <tr>
                    <td class="cell-date">${formattedDate}</td>
                    <td class="cell-student"><strong>${escapeHtml(reg.studentName)}</strong></td>
                    <td class="cell-tutor">${escapeHtml(reg.tutorName)}</td>
                    <td class="cell-phone">${escapeHtml(reg.tutorPhone)}</td>
                    <td class="cell-actions text-center">
                        <a href="https://wa.me/${cleanPhone}" target="_blank" class="action-btn wa-btn" title="Contactar por WhatsApp">
                            <i class="fa-brands fa-whatsapp"></i>
                        </a>
                        <button class="action-btn receipt-btn" data-date="${reg.date}" title="Generar Recibo de Pago">
                            <i class="fa-solid fa-file-invoice-dollar"></i>
                        </button>
                        <button class="action-btn delete-btn" data-date="${reg.date}" title="Eliminar registro">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });

        // Registrar eventos de eliminar individuales
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const targetDate = this.getAttribute('data-date');
                deleteRegistration(targetDate);
            });
        });

        // Registrar eventos de recibo individuales
        document.querySelectorAll('.receipt-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const targetDate = this.getAttribute('data-date');
                openReceiptModal(targetDate);
            });
        });
    }

    // --- FILTRAR EN TIEMPO REAL ---
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        const filtered = registrations.filter(reg => {
            return (
                reg.studentName.toLowerCase().includes(query) ||
                reg.tutorName.toLowerCase().includes(query) ||
                reg.tutorPhone.includes(query)
            );
        });
        renderTable(filtered);
    });

    // --- ELIMINAR REGISTRO INDIVIDUAL ---
    function deleteRegistration(dateStr) {
        if (confirm('¿Estás seguro de que deseas eliminar este registro?')) {
            registrations = registrations.filter(reg => reg.date !== dateStr);
            localStorage.setItem('neram_registrations', JSON.stringify(registrations));
            loadRegistrations();
        }
    }

    // --- ELIMINAR TODO ---
    btnClearAll.addEventListener('click', () => {
        if (confirm('¡ATENCIÓN! Esto eliminará de forma permanente todas las inscripciones registradas en este navegador. ¿Deseas continuar?')) {
            localStorage.removeItem('neram_registrations');
            loadRegistrations();
        }
    });

    // --- EXPORTAR A CSV ---
    btnExportCsv.addEventListener('click', () => {
        if (registrations.length === 0) return;

        // Cabecera del CSV
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // \uFEFF para soportar acentos en Excel
        csvContent += "Fecha,Nombre Alumno,Nombre Tutor,Telefono de Contacto\n";

        registrations.forEach(reg => {
            const formattedDate = new Date(reg.date).toLocaleString('es-ES');
            
            // Reemplazar comas por seguridad
            const student = reg.studentName.replace(/,/g, ' ');
            const tutor = reg.tutorName.replace(/,/g, ' ');
            const phone = reg.tutorPhone.replace(/,/g, ' ');

            csvContent += `"${formattedDate}","${student}","${tutor}","${phone}"\n`;
        });

        // Generar descarga
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `inscripciones_neram_art_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // --- AUXILIARES ---
    function escapeHtml(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // --- GESTIÓN DE RECIBOS DE PAGO ---
    function openReceiptModal(dateStr) {
        currentActiveReg = registrations.find(reg => reg.date === dateStr);
        if (!currentActiveReg) return;

        // Rellenar campos
        receiptStudent.value = currentActiveReg.studentName;
        receiptTutor.value = currentActiveReg.tutorName;
        receiptAmount.value = '';
        receiptDate.value = new Date().toISOString().split('T')[0]; // Hoy
        receiptConcept.value = 'Mensualidad Taller de Dibujo';

        // Limpiar errores anteriores
        receiptAmountGroup.classList.remove('has-error');
        receiptDateGroup.classList.remove('has-error');
        receiptConceptGroup.classList.remove('has-error');

        // Mostrar modal
        receiptModal.style.display = 'flex';
        receiptAmount.focus();
    }

    function closeReceiptModal() {
        receiptModal.style.display = 'none';
        currentActiveReg = null;
    }

    closeModalBtn.addEventListener('click', closeReceiptModal);
    
    // Cerrar al hacer clic fuera de la tarjeta modal
    receiptModal.addEventListener('click', (e) => {
        if (e.target === receiptModal) {
            closeReceiptModal();
        }
    });

    // Validar formulario de recibo
    function validateReceiptForm() {
        let isValid = true;

        if (!receiptAmount.value || parseFloat(receiptAmount.value) <= 0) {
            receiptAmountGroup.classList.add('has-error');
            isValid = false;
        } else {
            receiptAmountGroup.classList.remove('has-error');
        }

        if (!receiptDate.value) {
            receiptDateGroup.classList.add('has-error');
            isValid = false;
        } else {
            receiptDateGroup.classList.remove('has-error');
        }

        if (!receiptConcept.value.trim()) {
            receiptConceptGroup.classList.add('has-error');
            isValid = false;
        } else {
            receiptConceptGroup.classList.remove('has-error');
        }

        return isValid;
    }

    // Quitar errores al escribir/cambiar
    receiptAmount.addEventListener('input', () => receiptAmountGroup.classList.remove('has-error'));
    receiptDate.addEventListener('change', () => receiptDateGroup.classList.remove('has-error'));
    receiptConcept.addEventListener('input', () => receiptConceptGroup.classList.remove('has-error'));

    // Acción: Descargar PDF
    btnPrintReceipt.addEventListener('click', () => {
        if (!validateReceiptForm()) return;

        const student = receiptStudent.value;
        const tutor = receiptTutor.value;
        const amount = receiptAmount.value;
        const date = receiptDate.value;
        const concept = receiptConcept.value;

        downloadPDFReceipt(student, tutor, amount, date, concept);
    });

    // Acción: Enviar por WhatsApp (También descarga el PDF)
    receiptForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!validateReceiptForm() || !currentActiveReg) return;

        const student = receiptStudent.value;
        const tutor = receiptTutor.value;
        const amount = receiptAmount.value;
        const date = receiptDate.value;
        const concept = receiptConcept.value;

        // 1. Descargar el recibo en PDF automáticamente
        downloadPDFReceipt(student, tutor, amount, date, concept);

        // 2. Formatear y abrir el mensaje de WhatsApp
        const parts = date.split('-');
        const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
        const formattedDate = dateObj.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        const text = `¡Hola ${tutor}! 🎨\n\n` +
                     `Confirmamos la recepción de tu pago:\n\n` +
                     `• *Alumno:* ${student}\n` +
                     `• *Concepto:* ${concept}\n` +
                     `• *Fecha de Pago:* ${formattedDate}\n` +
                     `• *Cantidad:* $${parseFloat(amount).toFixed(2)} MXN\n\n` +
                     `¡Muchas gracias por tu confianza! ✨`;

        const encodedText = encodeURIComponent(text);
        const cleanPhone = currentActiveReg.tutorPhone.replace(/\D/g, '');
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;

        // 3. Abrir en WhatsApp (para arrastrar/adjuntar el archivo PDF descargado)
        window.open(whatsappUrl, '_blank');
        closeReceiptModal();
    });

    // Generar y descargar el recibo en PDF usando html2pdf.js
    function downloadPDFReceipt(student, tutor, amount, date, concept) {
        const formattedAmount = parseFloat(amount).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        
        const parts = date.split('-');
        const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
        const formattedDate = dateObj.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        // Crear elemento temporal para html2pdf
        const element = document.createElement('div');
        element.style.padding = '15px';
        element.style.width = '140mm'; // Tamaño para A5
        element.style.backgroundColor = '#ffffff';
        element.style.fontFamily = "'Outfit', sans-serif";

        element.innerHTML = `
            <div style="border: 1px solid #e0e0e0; padding: 25px; border-radius: 12px; background: #ffffff;">
                <div style="text-align: center; border-bottom: 2px solid #9c0738; padding-bottom: 12px; margin-bottom: 20px;">
                    <h2 style="font-size: 1.4rem; font-weight: 700; color: #9c0738; text-transform: uppercase; margin: 5px 0; letter-spacing: 0.5px; font-family: 'Outfit', sans-serif;">Comprobante de Pago</h2>
                    <p style="font-size: 0.8rem; color: #666; margin: 0; font-weight: 500; font-family: 'Outfit', sans-serif;">NERAM - ART • Libera tu creatividad</p>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 0.9rem; font-family: 'Outfit', sans-serif;">
                    <tr style="border-bottom: 1px dashed #f0f0f0;">
                        <td style="padding: 8px 0; color: #666; font-weight: 500;">Fecha de Pago:</td>
                        <td style="padding: 8px 0; font-weight: 600; text-align: right; color: #1a1a1a;">${formattedDate}</td>
                    </tr>
                    <tr style="border-bottom: 1px dashed #f0f0f0;">
                        <td style="padding: 8px 0; color: #666; font-weight: 500;">Alumno:</td>
                        <td style="padding: 8px 0; font-weight: 600; text-align: right; color: #1a1a1a;">${student}</td>
                    </tr>
                    <tr style="border-bottom: 1px dashed #f0f0f0;">
                        <td style="padding: 8px 0; color: #666; font-weight: 500;">Tutor:</td>
                        <td style="padding: 8px 0; font-weight: 600; text-align: right; color: #1a1a1a;">${tutor}</td>
                    </tr>
                    <tr style="border-bottom: 1px dashed #f0f0f0;">
                        <td style="padding: 8px 0; color: #666; font-weight: 500;">Concepto:</td>
                        <td style="padding: 8px 0; font-weight: 600; text-align: right; color: #1a1a1a;">${concept}</td>
                    </tr>
                </table>
                
                <div style="background: #fbf0f3; border: 1px solid #f5d6df; padding: 12px; border-radius: 8px; text-align: center; margin: 20px 0 10px 0; font-family: 'Outfit', sans-serif;">
                    <div style="font-size: 0.75rem; color: #9c0738; font-weight: 600; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">Total Recibido</div>
                    <div style="font-size: 1.6rem; font-weight: 800; color: #9c0738;">$${formattedAmount} MXN</div>
                </div>
                
                <div style="text-align: center; margin-top: 25px; font-size: 0.78rem; color: #999; line-height: 1.4; border-top: 1px solid #f0f0f0; padding-top: 15px; font-family: 'Outfit', sans-serif;">
                    ¡Gracias por tu confianza! 🎨<br>
                    Contacto: neram.art@gmail.com
                </div>
            </div>
        `;

        const cleanStudentName = student.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const opt = {
            margin:       10,
            filename:     `recibo_${cleanStudentName}_${date}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'mm', format: 'a5', orientation: 'portrait' }
        };

        // Descargar PDF
        html2pdf().set(opt).from(element).save();
    }

    // --- CONTROL DE ACCESO (AUTENTICACIÓN) ---
    function checkAuthentication() {
        const isAuthenticated = sessionStorage.getItem('neram_admin_logged_in') === 'true';
        
        if (isAuthenticated) {
            loginCard.style.display = 'none';
            dashboardCard.style.display = 'block';
            mainContainer.classList.remove('login-mode');
            loadRegistrations();
        } else {
            loginCard.style.display = 'block';
            dashboardCard.style.display = 'none';
            mainContainer.classList.add('login-mode');
        }
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const password = passwordInput.value;

        if (password === ADMIN_PASSWORD) {
            loginGroup.classList.remove('has-error');
            sessionStorage.setItem('neram_admin_logged_in', 'true');
            checkAuthentication();
        } else {
            loginGroup.classList.add('has-error');
            passwordInput.value = '';
            passwordInput.focus();
        }
    });

    // Quitar error al escribir
    passwordInput.addEventListener('input', () => {
        loginGroup.classList.remove('has-error');
    });

    // Inicializar
    checkAuthentication();
});
