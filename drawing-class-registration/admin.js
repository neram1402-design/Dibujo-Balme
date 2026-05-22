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
            const cleanPhone = reg.tutorPhone.replace(/\D/g, '');

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

    // Acción: Imprimir / PDF
    btnPrintReceipt.addEventListener('click', () => {
        if (!validateReceiptForm()) return;

        const student = receiptStudent.value;
        const tutor = receiptTutor.value;
        const amount = receiptAmount.value;
        const date = receiptDate.value;
        const concept = receiptConcept.value;

        printReceipt(student, tutor, amount, date, concept);
    });

    // Acción: Enviar por WhatsApp
    receiptForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!validateReceiptForm() || !currentActiveReg) return;

        const student = receiptStudent.value;
        const tutor = receiptTutor.value;
        const amount = receiptAmount.value;
        const date = receiptDate.value;
        const concept = receiptConcept.value;

        // Formatear fecha para el mensaje (ej: 22 de mayo de 2026)
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

        // Abrir en WhatsApp
        window.open(whatsappUrl, '_blank');
        closeReceiptModal();
    });

    // Imprimir el recibo en un formato limpio (HTML Popup para imprimir)
    function printReceipt(student, tutor, amount, date, concept) {
        const printWindow = window.open('', '_blank', 'width=600,height=600');
        const formattedAmount = parseFloat(amount).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        
        const parts = date.split('-');
        const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
        const formattedDate = dateObj.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Recibo de Pago - NERAM - ART</title>
                <style>
                    body {
                        font-family: 'Outfit', sans-serif;
                        color: #1a1a1a;
                        padding: 40px;
                        margin: 0;
                        background: #ffffff;
                    }
                    .receipt-box {
                        max-width: 450px;
                        margin: 0 auto;
                        border: 1px solid #e0e0e0;
                        padding: 30px;
                        border-radius: 12px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.03);
                    }
                    .receipt-header {
                        text-align: center;
                        border-bottom: 2px solid #9c0738;
                        padding-bottom: 15px;
                        margin-bottom: 25px;
                    }
                    .receipt-title {
                        font-size: 1.5rem;
                        font-weight: 700;
                        color: #9c0738;
                        text-transform: uppercase;
                        margin: 5px 0;
                        letter-spacing: 1px;
                    }
                    .receipt-subtitle {
                        font-size: 0.85rem;
                        color: #666;
                        margin: 0;
                    }
                    .receipt-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 15px;
                        font-size: 0.95rem;
                        border-bottom: 1px dashed #f0f0f0;
                        padding-bottom: 8px;
                    }
                    .receipt-row:last-of-type {
                        border-bottom: none;
                    }
                    .label {
                        color: #666;
                        font-weight: 500;
                    }
                    .value {
                        font-weight: 600;
                        text-align: right;
                    }
                    .amount-container {
                        background: #fbf0f3;
                        border: 1px solid #f5d6df;
                        padding: 15px;
                        border-radius: 8px;
                        text-align: center;
                        margin: 25px 0 15px 0;
                    }
                    .amount-label {
                        font-size: 0.8rem;
                        color: #9c0738;
                        font-weight: 600;
                        text-transform: uppercase;
                        margin-bottom: 5px;
                    }
                    .amount-value {
                        font-size: 1.8rem;
                        font-weight: 800;
                        color: #9c0738;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 30px;
                        font-size: 0.85rem;
                        color: #999;
                        line-height: 1.4;
                    }
                    @media print {
                        body { padding: 20px; }
                        .receipt-box { border: none; box-shadow: none; padding: 0; }
                    }
                </style>
                <!-- Google Font -->
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
            </head>
            <body>
                <div class="receipt-box">
                    <div class="receipt-header">
                        <h2 class="receipt-title">Comprobante de Pago</h2>
                        <p class="receipt-subtitle">NERAM - ART • Libera tu creatividad</p>
                    </div>
                    
                    <div class="receipt-row">
                        <span class="label">Fecha de Pago:</span>
                        <span class="value">${formattedDate}</span>
                    </div>
                    <div class="receipt-row">
                        <span class="label">Alumno:</span>
                        <span class="value">${student}</span>
                    </div>
                    <div class="receipt-row">
                        <span class="label">Tutor:</span>
                        <span class="value">${tutor}</span>
                    </div>
                    <div class="receipt-row">
                        <span class="label">Concepto:</span>
                        <span class="value">${concept}</span>
                    </div>
                    
                    <div class="amount-container">
                        <div class="amount-label">Total Recibido</div>
                        <div class="amount-value">$${formattedAmount} MXN</div>
                    </div>
                    
                    <div class="footer">
                        ¡Gracias por tu confianza! 🎨<br>
                        Contacto: neram.art@gmail.com
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 500);
                    }
                <\/script>
            </body>
            </html>
        `);
        printWindow.document.close();
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
