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

    let registrations = [];

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
