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
    const receiptPeriod = document.getElementById('receipt-period');
    const receiptAutoSync = document.getElementById('receipt-auto-sync');

    // Elementos de Navegación y Pagos
    const adminNav = document.getElementById('admin-nav');
    const navAlumnos = document.getElementById('nav-alumnos');
    const navPagos = document.getElementById('nav-pagos');
    const paymentsCard = document.getElementById('admin-payments-card');
    const paymentsEmptyState = document.getElementById('payments-empty-state');

    let registrations = [];
    let currentActiveReg = null;

    // --- NAVEGACIÓN ENTRE VISTAS ---
    function switchView(view) {
        if (view === 'alumnos') {
            dashboardCard.style.display = 'block';
            paymentsCard.style.display = 'none';
            navAlumnos.classList.add('active');
            navPagos.classList.remove('active');
        } else if (view === 'pagos') {
            dashboardCard.style.display = 'none';
            paymentsCard.style.display = 'block';
            navAlumnos.classList.remove('active');
            navPagos.classList.add('active');
            renderPaymentsTable();
        }
    }

    navAlumnos.addEventListener('click', () => switchView('alumnos'));
    navPagos.addEventListener('click', () => switchView('pagos'));

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
                            loadPayments();
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
        loadPayments();
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

    // --- EXPORTAR A EXCEL FORMATEADO ---
    btnExportCsv.addEventListener('click', () => {
        if (registrations.length === 0) return;

        // Crear workbook y worksheet
        const wb = XLSX.utils.book_new();

        // --- Construir datos de filas ---
        const wsData = [];

        // Fila 1: Título "Trazos" (se fusionará)
        wsData.push(["", "", "", "", "Trazos", "", "", "", "", "", "", "", "", ""]);

        // Fila 2: Etiquetas "pagado" sobre las columnas de meses
        wsData.push(["", "", "", "pagado", "pagado", "pagado", "pagado", "pagado", "pagado", "pagado", "pagado", "pagado", "pagado", ""]);

        // Fila 3: Encabezados
        wsData.push(["Nombre", "Tutor", "Teléfono", "Inscripción",
                      "30-sep", "30-oct", "30-nov", "30-dic", "30-ene",
                      "28-feb", "30-mar", "30-abr", "30-may", "30-jun"]);

        // Filas de datos
        registrations.forEach(reg => {
            wsData.push([
                reg.studentName,
                reg.tutorName,
                reg.tutorPhone,
                "",  // Inscripción (lo llena el usuario)
                "", "", "", "", "", "", "", "", "", ""  // Meses vacíos
            ]);
        });

        // Crear worksheet desde los datos
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // --- Fusionar celdas para el título ---
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } } // Fila 1: A1:N1
        ];

        // --- Ancho de columnas ---
        ws['!cols'] = [
            { wch: 30 },  // A: Nombre
            { wch: 25 },  // B: Tutor
            { wch: 15 },  // C: Teléfono
            { wch: 12 },  // D: Inscripción
            { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
            { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }
        ];

        // --- Estilos ---
        const greenFill = { fgColor: { rgb: "2E7D32" } };
        const lightGreenFill = { fgColor: { rgb: "4CAF50" } };
        const orangeFill = { fgColor: { rgb: "FF9800" } };
        const whiteFont = { color: { rgb: "FFFFFF" }, bold: true, sz: 10 };
        const titleFont = { bold: true, sz: 14 };
        const centerAlign = { horizontal: "center", vertical: "center" };
        const thinBorder = {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
        };
        const currencyFmt = "$#,##0.00";

        // Estilo del título (Fila 1)
        const titleCell = ws["E1"] || (ws["E1"] = { v: "Trazos", t: "s" });
        titleCell.s = { font: titleFont, alignment: centerAlign };

        // Estilo de "pagado" (Fila 2)
        for (let c = 3; c <= 12; c++) {
            const cellRef = XLSX.utils.encode_cell({ r: 1, c: c });
            if (!ws[cellRef]) ws[cellRef] = { v: "pagado", t: "s" };
            ws[cellRef].s = {
                fill: c >= 3 && c <= 11 ? lightGreenFill : orangeFill,
                font: { color: { rgb: "FFFFFF" }, bold: true, sz: 9 },
                alignment: centerAlign,
                border: thinBorder
            };
        }

        // Estilo de encabezados (Fila 3)
        for (let c = 0; c < 14; c++) {
            const cellRef = XLSX.utils.encode_cell({ r: 2, c: c });
            if (!ws[cellRef]) ws[cellRef] = { v: "", t: "s" };
            ws[cellRef].s = {
                fill: greenFill,
                font: whiteFont,
                alignment: centerAlign,
                border: thinBorder
            };
        }

        // Estilo de filas de datos (Fila 4 en adelante)
        for (let r = 3; r < wsData.length; r++) {
            for (let c = 0; c < 14; c++) {
                const cellRef = XLSX.utils.encode_cell({ r: r, c: c });
                if (!ws[cellRef]) ws[cellRef] = { v: "", t: "s" };
                ws[cellRef].s = { border: thinBorder, alignment: { vertical: "center" } };

                // Formato moneda para columnas D-N (inscripción y meses)
                if (c >= 3) {
                    ws[cellRef].s.alignment = centerAlign;
                    ws[cellRef].z = currencyFmt;
                }
            }
        }

        // Agregar hoja al workbook
        XLSX.utils.book_append_sheet(wb, ws, "Trazos");

        // Descargar
        const fileName = `Trazos_NERAM_ART_${new Date().toISOString().slice(0,10)}.xlsx`;
        XLSX.writeFile(wb, fileName);
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
        receiptAmount.value = '350'; // $350 por defecto
        receiptDate.value = new Date().toISOString().split('T')[0]; // Hoy
        receiptConcept.value = 'Mensualidad Taller de Dibujo';
        if (receiptAutoSync) receiptAutoSync.checked = true;

        autoSelectReceiptPeriod();

        // Limpiar errores anteriores
        receiptAmountGroup.classList.remove('has-error');
        receiptDateGroup.classList.remove('has-error');
        receiptConceptGroup.classList.remove('has-error');

        // Mostrar modal
        receiptModal.style.display = 'flex';
        receiptAmount.focus();
        receiptAmount.select();
    }

    function autoSelectReceiptPeriod() {
        if (!receiptPeriod) return;
        const conceptText = (receiptConcept.value || '').toLowerCase();
        if (conceptText.includes('inscrip')) {
            receiptPeriod.value = 'inscripcion';
            return;
        }
        if (receiptDate.value) {
            const parts = receiptDate.value.split('-');
            const m = parseInt(parts[1], 10);
            const monthMap = {
                9: 'sep', 10: 'oct', 11: 'nov', 12: 'dic',
                1: 'ene', 2: 'feb', 3: 'mar', 4: 'abr', 5: 'may', 6: 'jun'
            };
            if (monthMap[m]) {
                receiptPeriod.value = monthMap[m];
            }
        }
    }

    function syncReceiptPayment(student, amount) {
        if (receiptAutoSync && receiptAutoSync.checked && receiptPeriod) {
            const monthKey = receiptPeriod.value;
            markPayment(student, monthKey, Number(amount));
        }
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
    receiptDate.addEventListener('change', () => {
        receiptDateGroup.classList.remove('has-error');
        autoSelectReceiptPeriod();
    });
    receiptConcept.addEventListener('input', () => {
        receiptConceptGroup.classList.remove('has-error');
        autoSelectReceiptPeriod();
    });

    // Acción: Descargar PDF
    btnPrintReceipt.addEventListener('click', () => {
        if (!validateReceiptForm()) return;

        const student = receiptStudent.value;
        const tutor = receiptTutor.value;
        const amount = receiptAmount.value;
        const date = receiptDate.value;
        const concept = receiptConcept.value;

        // 1. Descargar el recibo en PDF
        downloadPDFReceipt(student, tutor, amount, date, concept);

        // 2. Sincronizar automáticamente con el Control de Pagos
        syncReceiptPayment(student, amount);
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

        // 2. Sincronizar automáticamente con el Control de Pagos
        syncReceiptPayment(student, amount);

        // 3. Generar el enlace dinámico del recibo para el tutor
        const baseUrl = window.location.origin + window.location.pathname.replace('admin.html', 'recibo.html');
        const receiptUrl = `${baseUrl}?alumno=${encodeURIComponent(student)}&tutor=${encodeURIComponent(tutor)}&concepto=${encodeURIComponent(concept)}&cantidad=${encodeURIComponent(amount)}&fecha=${encodeURIComponent(date)}`;

        // 4. Formatear y abrir el mensaje de WhatsApp
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
        doc.text("Contacto: neram1402@gmail.com", 74, 185, { align: "center" });

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
            paymentsCard.style.display = 'none';
            adminNav.style.display = 'flex';
            mainContainer.classList.remove('login-mode');
            loadRegistrations();
        } else {
            loginCard.style.display = 'block';
            dashboardCard.style.display = 'none';
            paymentsCard.style.display = 'none';
            adminNav.style.display = 'none';
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

    // ======================================================================
    //  MÓDULO DE CONTROL DE PAGOS
    // ======================================================================

    const DEFAULT_PAYMENT_AMOUNT = 350;

    const MONTH_KEYS = [
        'inscripcion', 'sep', 'oct', 'nov', 'dic',
        'ene', 'feb', 'mar', 'abr', 'may', 'jun'
    ];

    const MONTH_LABELS = {
        'inscripcion': 'Inscripción',
        'sep': '30 de Septiembre',
        'oct': '30 de Octubre',
        'nov': '30 de Noviembre',
        'dic': '30 de Diciembre',
        'ene': '30 de Enero',
        'feb': '28 de Febrero',
        'mar': '30 de Marzo',
        'abr': '30 de Abril',
        'may': '30 de Mayo',
        'jun': '30 de Junio'
    };

    const paymentsTableBody = document.getElementById('payments-table-body');
    const paymentsTableFoot = document.getElementById('payments-table-foot');
    const paymentsPeriodSelect = document.getElementById('payments-period-select');
    let paymentsData = []; // Array de { student_name, month_key, amount, paid_at }

    if (paymentsPeriodSelect) {
        paymentsPeriodSelect.addEventListener('change', () => {
            updateSummaryCards();
        });
    }

    // --- CARGAR PAGOS DESDE SUPABASE ---
    function loadPayments() {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;

        try {
            const { createClient } = supabase;
            const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

            supabaseClient.from('payments').select('*')
                .then(({ data, error }) => {
                    if (error) {
                        console.error("Error cargando pagos:", error);
                        paymentsData = [];
                    } else {
                        paymentsData = data || [];
                    }
                    renderPaymentsTable();
                })
                .catch(err => {
                    console.error("Excepción al cargar pagos:", err);
                    paymentsData = [];
                    renderPaymentsTable();
                });
        } catch (err) {
            console.error("Fallo de inicialización pagos:", err);
        }
    }

    // --- RENDERIZAR TABLA DE PAGOS Y TOTALES ---
    function renderPaymentsTable() {
        if (!paymentsTableBody) return;

        // Obtener lista única de alumnos desde registrations
        const students = registrations.map(r => r.studentName);
        const uniqueStudents = [...new Set(students)];

        const tableWrapper = paymentsCard ? paymentsCard.querySelector('.payments-table-wrapper') : null;
        const summaryContainer = document.getElementById('payments-summary-container');
        const filterBar = document.querySelector('.payments-filter-bar');

        if (uniqueStudents.length === 0) {
            if (tableWrapper) tableWrapper.style.display = 'none';
            if (summaryContainer) summaryContainer.style.display = 'none';
            if (filterBar) filterBar.style.display = 'none';
            if (paymentsEmptyState) paymentsEmptyState.style.display = 'block';
            return;
        }

        if (tableWrapper) tableWrapper.style.display = 'block';
        if (summaryContainer) summaryContainer.style.display = 'grid';
        if (filterBar) filterBar.style.display = 'flex';
        if (paymentsEmptyState) paymentsEmptyState.style.display = 'none';
        paymentsTableBody.innerHTML = '';

        // Filas de alumnos
        uniqueStudents.forEach(studentName => {
            const row = document.createElement('tr');

            // Celda del nombre del alumno
            const nameCell = document.createElement('td');
            nameCell.textContent = studentName;
            row.appendChild(nameCell);

            // Celdas de cada mes
            MONTH_KEYS.forEach(monthKey => {
                const td = document.createElement('td');
                const payment = paymentsData.find(
                    p => p.student_name === studentName && p.month_key === monthKey
                );

                const cellDiv = document.createElement('div');
                cellDiv.className = 'payment-cell';

                if (payment && payment.amount) {
                    cellDiv.classList.add('paid');
                    cellDiv.textContent = '$' + Number(payment.amount).toLocaleString('es-MX');
                    cellDiv.title = `Pagado: $${payment.amount} — Clic para desmarcar`;

                    // Clic para desmarcar
                    cellDiv.addEventListener('click', () => {
                        const monthLabel = MONTH_LABELS[monthKey] || monthKey;
                        if (confirm(`¿Desmarcar el pago de $${payment.amount} de "${studentName}" en ${monthLabel}?`)) {
                            removePayment(studentName, monthKey);
                        }
                    });
                } else {
                    cellDiv.classList.add('pending');
                    cellDiv.textContent = '—';
                    cellDiv.title = `Registrar pago de "${studentName}" — ${MONTH_LABELS[monthKey] || monthKey}`;

                    // Clic para registrar pago ($350 por defecto)
                    cellDiv.addEventListener('click', () => {
                        const monthLabel = MONTH_LABELS[monthKey] || monthKey;
                        const amount = prompt(
                            `Registrar pago de: "${studentName}"\nPeriodo: ${monthLabel}\n\nPresiona Aceptar para confirmar $${DEFAULT_PAYMENT_AMOUNT} o escribe otro monto:`,
                            String(DEFAULT_PAYMENT_AMOUNT)
                        );
                        if (amount && !isNaN(amount) && Number(amount) > 0) {
                            markPayment(studentName, monthKey, Number(amount));
                        }
                    });
                }

                td.appendChild(cellDiv);
                row.appendChild(td);
            });

            paymentsTableBody.appendChild(row);
        });

        // --- RENDERIZAR PIE DE TABLA (TOTALES POR COLUMNA) ---
        renderTableFooter(uniqueStudents);

        // --- ACTUALIZAR TARJETAS DE RESUMEN ---
        updateSummaryCards(uniqueStudents);
    }

    // --- RENDERIZAR TOTALES Y FALTANTES EN EL FOOTER DE LA TABLA ---
    function renderTableFooter(uniqueStudents) {
        if (!paymentsTableFoot) return;
        paymentsTableFoot.innerHTML = '';

        const totalStudents = uniqueStudents.length;

        // Fila 1: Total Cobrado
        const rowCollected = document.createElement('tr');
        rowCollected.className = 'tfoot-row-collected';

        const labelCollected = document.createElement('td');
        labelCollected.className = 'tfoot-label';
        labelCollected.innerHTML = '<i class="fa-solid fa-circle-check"></i> Total Cobrado';
        rowCollected.appendChild(labelCollected);

        // Fila 2: Falta por Cobrar
        const rowPending = document.createElement('tr');
        rowPending.className = 'tfoot-row-pending';

        const labelPending = document.createElement('td');
        labelPending.className = 'tfoot-label';
        labelPending.innerHTML = '<i class="fa-solid fa-clock-rotate-left"></i> Falta por Cobrar';
        rowPending.appendChild(labelPending);

        MONTH_KEYS.forEach(monthKey => {
            const columnPayments = paymentsData.filter(p => p.month_key === monthKey && Number(p.amount) > 0);
            const totalCollectedCol = columnPayments.reduce((sum, p) => sum + Number(p.amount), 0);
            const paidCount = columnPayments.length;
            const expectedCol = totalStudents * DEFAULT_PAYMENT_AMOUNT;
            const missingCol = Math.max(0, expectedCol - totalCollectedCol);
            const missingCount = Math.max(0, totalStudents - paidCount);

            // Celda Cobrado
            const tdCollected = document.createElement('td');
            tdCollected.className = 'tfoot-cell-collected';
            tdCollected.textContent = '$' + totalCollectedCol.toLocaleString('es-MX');
            tdCollected.title = `${paidCount} de ${totalStudents} alumnos han pagado`;
            rowCollected.appendChild(tdCollected);

            // Celda Falta
            const tdPending = document.createElement('td');
            tdPending.className = 'tfoot-cell-pending';
            if (missingCol === 0) {
                tdPending.className += ' tfoot-cell-complete';
                tdPending.innerHTML = '<span style="color: #2e7d32;">Completo ✅</span>';
                tdPending.title = `Todos los ${totalStudents} alumnos han pagado`;
            } else {
                tdPending.innerHTML = `$${missingCol.toLocaleString('es-MX')}<br><small style="font-weight: normal; opacity: 0.85;">(Faltan ${missingCount})</small>`;
                tdPending.title = `Faltan ${missingCount} alumno(s) por pagar $${DEFAULT_PAYMENT_AMOUNT}`;
            }
            rowPending.appendChild(tdPending);
        });

        paymentsTableFoot.appendChild(rowCollected);
        paymentsTableFoot.appendChild(rowPending);
    }

    // --- ACTUALIZAR TARJETAS DE RESUMEN FINANCIERO ---
    function updateSummaryCards(studentsList) {
        const uniqueStudents = studentsList || [...new Set(registrations.map(r => r.studentName))];
        const totalStudents = uniqueStudents.length;
        if (totalStudents === 0) return;

        const selectedPeriod = paymentsPeriodSelect ? paymentsPeriodSelect.value : 'all';

        let expectedTotal = 0;
        let collectedTotal = 0;
        let collectedCount = 0;
        let pendingTotal = 0;
        let pendingCount = 0;
        let subTextExpected = '';

        if (selectedPeriod === 'all') {
            const numPeriods = MONTH_KEYS.length; // 11
            expectedTotal = totalStudents * numPeriods * DEFAULT_PAYMENT_AMOUNT;
            collectedTotal = paymentsData.reduce((sum, p) => sum + Number(p.amount || 0), 0);
            collectedCount = paymentsData.filter(p => Number(p.amount) > 0).length;
            pendingTotal = Math.max(0, expectedTotal - collectedTotal);
            pendingCount = Math.max(0, (totalStudents * numPeriods) - collectedCount);
            subTextExpected = `${totalStudents} alumnos × ${numPeriods} periodos (${DEFAULT_PAYMENT_AMOUNT} c/u)`;
        } else {
            const monthLabel = MONTH_LABELS[selectedPeriod] || selectedPeriod;
            expectedTotal = totalStudents * DEFAULT_PAYMENT_AMOUNT;
            const periodPayments = paymentsData.filter(p => p.month_key === selectedPeriod && Number(p.amount) > 0);
            collectedTotal = periodPayments.reduce((sum, p) => sum + Number(p.amount), 0);
            collectedCount = periodPayments.length;
            pendingTotal = Math.max(0, expectedTotal - collectedTotal);
            pendingCount = Math.max(0, totalStudents - collectedCount);
            subTextExpected = `${totalStudents} alumnos en ${monthLabel}`;
        }

        const elExpected = document.getElementById('stat-total-expected');
        const elExpectedSub = document.getElementById('stat-total-sub');
        const elCollected = document.getElementById('stat-total-collected');
        const elCollectedSub = document.getElementById('stat-collected-sub');
        const elPending = document.getElementById('stat-total-pending');
        const elPendingSub = document.getElementById('stat-pending-sub');

        if (elExpected) elExpected.textContent = '$' + expectedTotal.toLocaleString('es-MX');
        if (elExpectedSub) elExpectedSub.textContent = subTextExpected;

        if (elCollected) elCollected.textContent = '$' + collectedTotal.toLocaleString('es-MX');
        if (elCollectedSub) elCollectedSub.textContent = `${collectedCount} pago(s) registrado(s)`;

        if (elPending) elPending.textContent = '$' + pendingTotal.toLocaleString('es-MX');
        if (elPendingSub) elPendingSub.textContent = `${pendingCount} pago(s) pendiente(s)`;
    }

    // --- REGISTRAR PAGO EN SUPABASE ---
    function markPayment(studentName, monthKey, amount) {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;

        try {
            const { createClient } = supabase;
            const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

            supabaseClient.from('payments').insert([{
                student_name: studentName,
                month_key: monthKey,
                amount: amount,
                paid_at: new Date().toISOString()
            }]).then(({ error }) => {
                if (error) {
                    console.error("Error al registrar pago:", error);
                    alert("Error al guardar el pago. Revisa tu conexión.");
                } else {
                    console.log("Pago registrado:", studentName, monthKey, amount);
                    loadPayments(); // Recargar tabla
                }
            });
        } catch (err) {
            console.error("Fallo al registrar pago:", err);
        }
    }

    // --- DESMARCAR PAGO EN SUPABASE ---
    function removePayment(studentName, monthKey) {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;

        try {
            const { createClient } = supabase;
            const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

            supabaseClient.from('payments')
                .delete()
                .eq('student_name', studentName)
                .eq('month_key', monthKey)
                .then(({ error }) => {
                    if (error) {
                        console.error("Error al desmarcar pago:", error);
                        alert("Error al desmarcar. Revisa tu conexión.");
                    } else {
                        console.log("Pago desmarcado:", studentName, monthKey);
                        loadPayments(); // Recargar tabla
                    }
                });
        } catch (err) {
            console.error("Fallo al desmarcar pago:", err);
        }
    }
});
