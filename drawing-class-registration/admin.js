/* ==========================================================================
   LÓGICA JAVASCRIPT PANEL ADMIN - NERAM - ART
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURACIÓN DE SUPABASE (BASE DE DATOS) ---
    // Completa esto con las claves de tu proyecto en Supabase.com
    // Una vez configurado, los registros se cargarán desde la nube en tiempo real.
    const SUPABASE_URL = "https://nnvsenwzckgmfwfgkxbf.supabase.co"; 
    const SUPABASE_ANON_KEY = "sb_publishable_pt4F0QVSU4kHqCMP4cw01g_yR5JXbNX";

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

    // --- CARGAR DATOS (DESDE SUPABASE O LOCALSTORAGE COMO RESPALDO) ---
    function loadRegistrations() {
        if (SUPABASE_URL && SUPABASE_ANON_KEY) {
            try {
                const { createClient } = supabase;
                const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                
                // Mostrar spinner de carga
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding: 30px; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin" style="margin-right: 8px;"></i> Cargando registros desde la base de datos...</td></tr>';
                
                supabaseClient
                    .from('registrations')
                    .select('*')
                    .order('date', { ascending: false })
                    .then(({ data, error }) => {
                        if (error) {
                            console.error("Error al leer Supabase, cargando respaldo local:", error);
                            loadLocalStorageFallback();
                        } else {
                            // Mapear de base de datos a formato de la app
                            registrations = data.map(row => ({
                                studentName: row.student_name,
                                tutorName: row.tutor_name,
                                tutorPhone: row.tutor_phone,
                                date: row.date
                            }));
                            renderTable(registrations);
                        }
                    })
                    .catch(err => {
                        console.error("Excepción al conectar con Supabase:", err);
                        loadLocalStorageFallback();
                    });
            } catch (err) {
                console.error("Fallo de inicialización de Supabase:", err);
                loadLocalStorageFallback();
            }
        } else {
            loadLocalStorageFallback();
        }
    }

    function loadLocalStorageFallback() {
        registrations = JSON.parse(localStorage.getItem('neram_registrations')) || [];
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
            // Eliminar de LocalStorage (como respaldo)
            let localList = JSON.parse(localStorage.getItem('neram_registrations')) || [];
            localList = localList.filter(reg => reg.date !== dateStr);
            localStorage.setItem('neram_registrations', JSON.stringify(localList));

            // Eliminar de Supabase
            if (SUPABASE_URL && SUPABASE_ANON_KEY) {
                try {
                    const { createClient } = supabase;
                    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                    supabaseClient
                        .from('registrations')
                        .delete()
                        .eq('date', dateStr)
                        .then(({ error }) => {
                            if (error) console.error("Error al borrar en Supabase:", error);
                            loadRegistrations();
                        });
                } catch (err) {
                    console.error("Fallo de conexión con Supabase:", err);
                    loadRegistrations();
                }
            } else {
                loadRegistrations();
            }
        }
    }

    // --- ELIMINAR TODO ---
    btnClearAll.addEventListener('click', () => {
        if (confirm('¡ATENCIÓN! Esto eliminará de forma permanente todas las inscripciones. ¿Deseas continuar?')) {
            // Borrar LocalStorage
            localStorage.removeItem('neram_registrations');

            // Borrar Supabase
            if (SUPABASE_URL && SUPABASE_ANON_KEY) {
                try {
                    const { createClient } = supabase;
                    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                    supabaseClient
                        .from('registrations')
                        .delete()
                        .neq('student_name', '')
                        .then(({ error }) => {
                            if (error) console.error("Error al vaciar Supabase:", error);
                            loadRegistrations();
                        });
                } catch (err) {
                    console.error("Fallo al conectar con Supabase:", err);
                    loadRegistrations();
                }
            } else {
                loadRegistrations();
            }
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

        // 2. Generar el enlace dinámico del recibo para el tutor
        const baseUrl = window.location.origin + window.location.pathname.replace('admin.html', 'recibo.html');
        const receiptUrl = `${baseUrl}?alumno=${encodeURIComponent(student)}&tutor=${encodeURIComponent(tutor)}&concepto=${encodeURIComponent(concept)}&cantidad=${encodeURIComponent(amount)}&fecha=${encodeURIComponent(date)}`;

        // 3. Formatear y abrir el mensaje de WhatsApp
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
                     `Puedes ver y descargar tu recibo en PDF aquí:\n` +
                     `${receiptUrl}\n\n` +
                     `¡Muchas gracias por tu confianza! ✨`;

        const encodedText = encodeURIComponent(text);
        const cleanPhone = currentActiveReg.tutorPhone.replace(/\D/g, '');
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;

        // 4. Abrir en WhatsApp (para arrastrar/adjuntar el archivo PDF descargado o simplemente enviar el enlace)
        window.open(whatsappUrl, '_blank');
        closeReceiptModal();
    });

    // Generar y descargar el recibo en PDF de forma nativa con jsPDF (vectorial, estable y nítido)
    function downloadPDFReceipt(student, tutor, amount, date, concept) {
        const formattedAmount = parseFloat(amount).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        
        const parts = date.split('-');
        const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
        const formattedDate = dateObj.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        // Crear instancia de jsPDF (A5 vertical, unidad en mm)
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a5'
        });

        // --- DIBUJAR MARCOS ---
        // Marco exterior burgundy (#9c0738)
        doc.setDrawColor(156, 7, 56);
        doc.setLineWidth(1);
        doc.rect(8, 8, 132, 194);
        
        // Marco interior gris claro
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.5);
        doc.rect(10, 10, 128, 190);

        // --- CABECERA ---
        // Barra de color vino arriba
        doc.setFillColor(156, 7, 56);
        doc.rect(10, 10, 128, 8, 'F');

        // Logotipo / Nombre
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(156, 7, 56);
        doc.text("NERAM - ART", 74, 34, { align: "center" });

        // Eslogan
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(110, 110, 110);
        doc.text("L I B E R A   T U   C R E A T I V I D A D", 74, 40, { align: "center" });

        // Línea divisora
        doc.setDrawColor(227, 228, 230);
        doc.setLineWidth(0.5);
        doc.line(20, 48, 128, 48);

        // --- TÍTULO ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(32, 34, 38);
        doc.text("COMPROBANTE DE PAGO", 74, 58, { align: "center" });

        // --- DETALLES DEL PAGO (TABLA) ---
        const details = [
            { label: "Fecha de Pago:", value: formattedDate },
            { label: "Alumno:", value: student },
            { label: "Tutor:", value: tutor },
            { label: "Concepto:", value: concept }
        ];

        let currentY = 72;
        details.forEach(item => {
            // Etiqueta (Izquierda)
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9.5);
            doc.setTextColor(103, 107, 115);
            doc.text(item.label, 22, currentY + 6);
            
            // Valor (Derecha)
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(32, 34, 38);
            doc.text(String(item.value), 126, currentY + 6, { align: "right" });
            
            // Línea divisora
            doc.setDrawColor(242, 242, 242);
            doc.line(22, currentY + 11, 126, currentY + 11);
            
            currentY += 14;
        });

        // --- CAJA DE TOTAL ---
        doc.setFillColor(251, 240, 243);
        doc.setDrawColor(245, 214, 223);
        doc.roundedRect(22, 134, 104, 26, 4, 4, 'FD');

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(156, 7, 56);
        doc.text("TOTAL RECIBIDO", 74, 142, { align: "center" });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(17);
        doc.setTextColor(156, 7, 56);
        doc.text(`$${formattedAmount} MXN`, 74, 152, { align: "center" });

        // --- PIE DE PÁGINA ---
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text("¡Muchas gracias por tu confianza! 🎨", 74, 178, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(140, 140, 140);
        doc.text("Contacto: neram.art@gmail.com", 74, 185, { align: "center" });

        // Descargar PDF
        const cleanStudentName = student.toLowerCase().replace(/[^a-z0-9]/g, '_');
        doc.save(`recibo_${cleanStudentName}_${date}.pdf`);
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
