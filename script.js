// Variables globales
let currentDate = new Date();
let calendarData = {};
let selectedDay = null;
// Fecha actual (se usa para resaltar "hoy")
const today = new Date();
// Task modal state
let currentTaskId = null;

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    loadCalendarData();
    renderCalendar();
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // Modal
    const modal = document.getElementById('dayModal');
    const closeBtn = document.querySelector('.close');
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    document.getElementById('saveDay').addEventListener('click', saveDayData);

    // Task modal close and save handlers
    const taskModalClose = document.getElementById('taskModalClose');
    const taskModal = document.getElementById('taskModal');
    if (taskModalClose && taskModal) {
        taskModalClose.addEventListener('click', () => {
            taskModal.style.display = 'none';
        });
        window.addEventListener('click', (e) => {
            if (e.target === taskModal) taskModal.style.display = 'none';
        });
    }

    const saveTaskBtn = document.getElementById('saveTaskDetails');
    if (saveTaskBtn) saveTaskBtn.addEventListener('click', saveTaskDetails);

    // Añadir listeners a los botones 'Más detalles' en las tareas
    const detailBtns = document.querySelectorAll('.details-btn');
    detailBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            showTaskDetailsPopup(btn);
        });
    });
}

// Renderizar calendario
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Actualizar título
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;
    
    // Limpiar calendario
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';
    
    // Añadir encabezados de días
    const dayHeaders = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        calendar.appendChild(header);
    });
    
    // Calcular primer día del mes
    const firstDay = new Date(year, month, 1);
    let dayOfWeek = firstDay.getDay();
    dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Ajustar para que lunes sea 0
    
    // Días del mes anterior
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = dayOfWeek - 1; i >= 0; i--) {
        const day = prevMonthDays - i;
        createDayCell(day, month - 1, year, true);
    }
    
    // Días del mes actual
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
        createDayCell(day, month, year, false);
    }
    
    // Días del mes siguiente
    const remainingCells = 42 - (dayOfWeek + daysInMonth);
    for (let day = 1; day <= remainingCells; day++) {
        createDayCell(day, month + 1, year, true);
    }
}

// Crear celda de día
function createDayCell(day, month, year, isOtherMonth) {
    const cell = document.createElement('div');
    cell.className = 'calendar-day';
    if (isOtherMonth) cell.classList.add('other-month');
    
    const dateKey = `${year}-${month}-${day}`;
    
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    cell.appendChild(dayNumber);
    
    const dayTasks = document.createElement('div');
    dayTasks.className = 'day-tasks';
    
    if (calendarData[dateKey]) {
        const data = calendarData[dateKey];
        if (data.kitchen) {
            const task = document.createElement('span');
            task.className = 'task-label';
            task.textContent = `🍳 ${data.kitchen}`;
            dayTasks.appendChild(task);
        }
        if (data.bathroom) {
            const task = document.createElement('span');
            task.className = 'task-label';
            task.textContent = `🚿 ${data.bathroom}`;
            dayTasks.appendChild(task);
        }
        if (data.living) {
            const task = document.createElement('span');
            task.className = 'task-label';
            task.textContent = `🛋️ ${data.living}`;
            dayTasks.appendChild(task);
        }
    }
    
    cell.appendChild(dayTasks);
    // Resaltar si esta celda corresponde al día actual (hoy)
    try {
        if (
            year === today.getFullYear() &&
            month === today.getMonth() &&
            day === today.getDate()
        ) {
            cell.classList.add('today');
            const badge = document.createElement('div');
            badge.className = 'today-badge';
            badge.textContent = 'Hoy';
            cell.appendChild(badge);
        }
    } catch (e) {
        // no bloquear si hay algún error en la comparación
        console.error('Error al comparar fecha de hoy:', e);
    }

    cell.addEventListener('click', (e) => onDayClick(e, day, month, year, cell));
    
    document.getElementById('calendar').appendChild(cell);
}

// Abrir modal para editar día
function openDayModal(day, month, year) {
    selectedDay = { day, month, year };
    const dateKey = `${year}-${month}-${day}`;
    
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    document.getElementById('modalTitle').textContent = `${day} de ${monthNames[month]} ${year}`;
    
    const data = calendarData[dateKey] || {};
    document.getElementById('modalKitchen').value = data.kitchen || '';
    document.getElementById('modalBathroom').value = data.bathroom || '';
    document.getElementById('modalLiving').value = data.living || '';
    
    document.getElementById('dayModal').style.display = 'block';
}

// Guardar datos del día
function saveDayData() {
    if (!selectedDay) return;
    
    const dateKey = `${selectedDay.year}-${selectedDay.month}-${selectedDay.day}`;
    
    calendarData[dateKey] = {
        kitchen: document.getElementById('modalKitchen').value,
        bathroom: document.getElementById('modalBathroom').value,
        living: document.getElementById('modalLiving').value
    };
    
    saveCalendarData();
    renderCalendar();
    document.getElementById('dayModal').style.display = 'none';
}

// Guardar datos en memoria
function saveCalendarData() {
    // Guardar en localStorage para persistencia entre sesiones
    try {
        localStorage.setItem('calendarData', JSON.stringify(calendarData));
        console.log('Datos guardados en localStorage:', calendarData);
    } catch (e) {
        console.error('No se pudo guardar en localStorage', e);
    }
}

// Cargar datos
function loadCalendarData() {
    // Intentar cargar desde localStorage
    try {
        const raw = localStorage.getItem('calendarData');
        calendarData = raw ? JSON.parse(raw) : {};
    } catch (e) {
        console.error('Error al cargar calendarData desde localStorage', e);
        calendarData = {};
    }
}

// Handler general al clicar un día
function onDayClick(event, day, month, year, cellElement) {
    // Mostrar popup especial para 1, 8 y 15 de Noviembre (mes 10 porque enero = 0)
    if (month === 10 && (day === 1 || day === 8 || day === 15 || day === 22)) {
        const dateKey = `${year}-${month}-${day}`;

        // Si no hay datos guardados para ese día, crear valores por defecto y guardar
        if (!calendarData[dateKey]) {
            if (day === 1) {
                // Justin: Baño, Benjamin: Sala, Dylan: Cocina
                calendarData[dateKey] = {
                    kitchen: 'Dylan',
                    bathroom: 'Justin',
                    living: 'Benjamin'
                };
            } else if (day === 8) {
                // Justin: Cocina, Benjamin: Baños, Dylan: Sala
                calendarData[dateKey] = {
                    kitchen: 'Justin',
                    bathroom: 'Benjamin',
                    living: 'Dylan'
                };
            } else if (day === 15) {
                // Justin: Sala, Benjamin: Cocina, Dylan: Baño
                calendarData[dateKey] = {
                    kitchen: 'Benjamin',
                    bathroom: 'Dylan',
                    living: 'Justin'
                };
            } else if (day === 22) {
                // Justin: Sala, Benjamin: Cocina, Dylan: Baño
                calendarData[dateKey] = {
                    living: 'Benjamin',
                    kitchen: 'Dylan',
                    bathroom: 'Justin'
                };
            saveCalendarData();
        }

        // Labels para mostrar (usar 'Baños' para el día 8 si el usuario lo pidió así)
        const labels = {
            kitchen: 'Cocina',
            bathroom: day === 8 ? 'Baños' : 'Baño',
            living: 'Sala'
        };

        showAssignmentsPopup(cellElement, calendarData[dateKey], labels);
        return;
    }

    // Resto de días: estáticos (no editables) — no abrir modal
    return;
}

// Mostrar popup con asignaciones junto a la celda clicada
function showAssignmentsPopup(cellElement, assignments, labels = {kitchen: 'Cocina', bathroom: 'Baño', living: 'Sala'}) {
    hideAssignmentsPopup(); // cerrar si hay otro abierto

    const popup = document.createElement('div');
    popup.id = 'assignPopup';
    popup.className = 'assign-popup';

    const closeBtn = document.createElement('span');
    closeBtn.className = 'assign-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', hideAssignmentsPopup);
    popup.appendChild(closeBtn);

    const title = document.createElement('div');
    title.className = 'assign-title';
    title.textContent = 'Asignaciones';
    popup.appendChild(title);

    const list = document.createElement('div');
    list.className = 'assign-list';

    // assignments expected in shape {kitchen: name, bathroom: name, living: name}
    const mapping = [
        ['kitchen', labels.kitchen || 'Cocina'],
        ['bathroom', labels.bathroom || 'Baño'],
        ['living', labels.living || 'Sala']
    ];

    mapping.forEach(([key, placeLabel]) => {
        if (assignments && assignments[key]) {
            const row = document.createElement('div');
            row.className = 'assign-row';
            row.textContent = `${assignments[key]}: ${placeLabel}`;
            list.appendChild(row);
        }
    });
    popup.appendChild(list);

    document.body.appendChild(popup);

    // Forzar reflow and open class for animation
    // Posicionar el popup cerca de la celda (do before measuring)
    const rect = cellElement.getBoundingClientRect();
    // default left/top while hidden
    popup.style.left = '0px';
    popup.style.top = '0px';

    const popupRect = popup.getBoundingClientRect();
    const topPos = window.scrollY + rect.top - popupRect.height - 8; // arriba de la celda
    const leftPos = window.scrollX + rect.left + Math.max(0, (rect.width - popupRect.width) / 2);

    // Si no cabe arriba, poner debajo
    if (topPos < window.scrollY + 10) {
        popup.style.top = (window.scrollY + rect.bottom + 8) + 'px';
    } else {
        popup.style.top = topPos + 'px';
    }

    popup.style.left = Math.max(8, leftPos) + 'px';

    // Abrir con animación
    requestAnimationFrame(() => {
        popup.classList.add('open');
    });

    // Cerrar al clicar fuera
    setTimeout(() => {
        window.addEventListener('click', outsideClickListener);
    }, 0);

    function outsideClickListener(e) {
        if (!popup.contains(e.target) && !cellElement.contains(e.target)) {
            hideAssignmentsPopup();
        }
    }

    // Guardar la referencia para poder quitar el listener
    popup._outsideClickListener = outsideClickListener;
}
    // Guardar la referencia para poder quitar el listener
    popup._outsideClickListener = outsideClickListener;
}

function hideAssignmentsPopup() {
    const existing = document.getElementById('assignPopup');
    if (existing) {
        if (existing._outsideClickListener) {
            window.removeEventListener('click', existing._outsideClickListener);
        }
        // Añadir clase de cierre para animación y eliminar tras la transición
        existing.classList.remove('open');
        existing.classList.add('closing');
        const timeout = 220; // ms (coincide con la transición CSS)
        setTimeout(() => {
            const el = document.getElementById('assignPopup');
            if (el) el.remove();
        }, timeout);
    }
}

/* Popup de detalles de tarea (botón 'Más detalles') */
function showTaskDetailsPopup(buttonElement) {
    // Open the task modal (HTML) and populate editable textarea
    const taskLabelEl = buttonElement.parentElement.querySelector('label');
    const taskText = taskLabelEl ? taskLabelEl.textContent.trim() : 'Tarea';
    const checkbox = buttonElement.parentElement.querySelector('input[type="checkbox"]');
    const taskId = checkbox && checkbox.id ? checkbox.id : ('task-' + Math.random().toString(36).slice(2,8));
    currentTaskId = taskId;

    // Determine section for default instructions
    const card = buttonElement.closest('.cleaning-card');
    let section = '';
    if (card) {
        const header = card.querySelector('.card-header h2');
        if (header) section = header.textContent.trim();
    }

    let key = 'other';
    if (/cocina/i.test(section)) key = 'kitchen';
    else if (/bañ/i.test(section) || /bano/i.test(section)) key = 'bathroom';
    else if (/sala/i.test(section)) key = 'living';

    const instructionsMap = {
        kitchen: 'Instrucciones: Limpiar encimeras, fregar el suelo, revisar electrodomésticos y vaciar la papelera. Usar guantes y productos adecuados.',
        bathroom: 'Instrucciones: Desinfectar inodoro, limpiar ducha/bañera, limpiar espejo y cambiar toallas si procede.',
        living: 'Instrucciones: Pasar la aspiradora, quitar el polvo de muebles, ordenar cojines y ventilar la sala.',
        other: 'Instrucciones: Seguir las indicaciones generales de limpieza.'
    };

    // Load saved task details from localStorage
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem('taskDetails') || '{}'); } catch(e) { saved = {}; }

    const modal = document.getElementById('taskModal');
    const titleEl = document.getElementById('taskModalTitle');
    const textEl = document.getElementById('taskDetailsText');

    if (titleEl) titleEl.textContent = taskText;
    if (textEl) textEl.value = (saved[taskId] !== undefined && saved[taskId] !== null) ? saved[taskId] : instructionsMap[key];
    if (modal) modal.style.display = 'block';
}

function hideTaskDetailsPopup() {
    // Close HTML task modal if present
    const modal = document.getElementById('taskModal');
    if (modal) modal.style.display = 'none';
}

function saveTaskDetails() {
    if (!currentTaskId) return;
    const textEl = document.getElementById('taskDetailsText');
    const value = textEl ? textEl.value : '';
    try {
        const saved = JSON.parse(localStorage.getItem('taskDetails') || '{}');
        saved[currentTaskId] = value;
        localStorage.setItem('taskDetails', JSON.stringify(saved));
    } catch (e) {
        console.error('Error saving task details', e);
    }
    // close modal
    const modal = document.getElementById('taskModal');
    if (modal) modal.style.display = 'none';
}