// ==================== DOM ELEMENTS ====================
const calendar = document.getElementById('calendar');
const monthSelect = document.getElementById('monthSelect');
const btnSeller = document.getElementById('btnSeller');
const btnLoader = document.getElementById('btnLoader');
const hourButtons = document.querySelectorAll('.btnHour');
const customHoursInput = document.getElementById('customHours');
const birzhaCheckbox = document.getElementById('birzhaCheckbox');
const clearMonthBtn = document.getElementById('clearMonth');
const exportExcelBtn = document.getElementById('exportExcel');

// ==================== GLOBAL VARIABLES ====================
let selectedRole = null;
let selectedHours = null;
let birzhaActive = false;
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

const monthNames = ["Січень","Лютий","Березень","Квітень","Травень","Червень","Липень","Серпень","Вересень","Жовтень","Листопад","Грудень"];

// Збереження у форматі: { "YYYY-MM-DD": { role, hours, birzha } }
let savedData = JSON.parse(localStorage.getItem('workSchedule') || '{}');

// ==================== UTILITY FUNCTIONS ====================
function formatKey(y, m, d) { 
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function persist() { 
  localStorage.setItem('workSchedule', JSON.stringify(savedData)); 
}

function clearHourButtons() { 
  hourButtons.forEach(b => b.classList.remove('active')); 
}

// Значення за замовчуванням
const DEFAULT_ROLE = 'loader', DEFAULT_HOURS = 9.5;
function applyDefaults() {
  selectedRole = DEFAULT_ROLE;
  btnLoader.classList.add('active');

  selectedHours = DEFAULT_HOURS;
  hourButtons.forEach(b => {
    if (Number(b.dataset.hours) === DEFAULT_HOURS) b.classList.add('active');
  });
}
applyDefaults();

// ==================== EVENT LISTENERS ====================
btnSeller.addEventListener('click', () => {
  selectedRole = 'seller'; 
  btnSeller.classList.add('active'); 
  btnLoader.classList.remove('active'); 
});

btnLoader.addEventListener('click', () => {
  selectedRole = 'loader'; 
  btnLoader.classList.add('active'); 
  btnSeller.classList.remove('active'); 
});

hourButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    selectedHours = Number(btn.dataset.hours);
    clearHourButtons(); 
    btn.classList.add('active'); 
    customHoursInput.value = '';
  });
});

customHoursInput.addEventListener('input', () => {
  const v = parseFloat(customHoursInput.value); 
  selectedHours = isNaN(v) ? null : v; 
  clearHourButtons(); 
});

birzhaCheckbox.addEventListener('change', () => { 
  birzhaActive = birzhaCheckbox.checked; 
});

// Очистити місяць
clearMonthBtn.addEventListener('click', () => {
  const mm = String(currentMonth + 1).padStart(2, '0');
  const prefix = `${currentYear}-${mm}-`;
  const keys = Object.keys(savedData).filter(k => k.startsWith(prefix));
  
  if (keys.length === 0) { alert('Записів для цього місяця немає.'); return; }
  if (!confirm(`Видалити всі записи за ${monthNames[currentMonth]} ${currentYear}?`)) return;
  
  keys.forEach(k => delete savedData[k]);
  persist(); 
  buildCalendar(currentYear, currentMonth);
});

// Експорт в Excel
exportExcelBtn.addEventListener('click', exportToExcel);

// ==================== MONTHLY SUMMARY ====================
function updateMonthlySummary() {
  const mm = String(currentMonth + 1).padStart(2, '0');
  const prefix = `${currentYear}-${mm}-`;

  let sumSeller = { base: 0, birzha: 0 };
  let sumLoader = { base: 0, birzha: 0 };

  for (const k in savedData) {
    if (!k.startsWith(prefix)) continue;
    const e = savedData[k];
    const hours = Number(e.hours) || 0;
    
    if (e.role === 'seller') { 
      e.birzha ? sumSeller.birzha += hours : sumSeller.base += hours; 
    } else if (e.role === 'loader') { 
      e.birzha ? sumLoader.birzha += hours : sumLoader.base += hours; 
    }
  }

  document.getElementById('sumSeller').textContent = `${sumSeller.base} / ${sumSeller.birzha} / ${sumSeller.base + sumSeller.birzha}`;
  document.getElementById('sumLoader').textContent = `${sumLoader.base} / ${sumLoader.birzha} / ${sumLoader.base + sumLoader.birzha}`;
  document.getElementById('sumTotal').textContent = `${sumSeller.base + sumLoader.base} / ${sumSeller.birzha + sumLoader.birzha} / ${sumSeller.base + sumSeller.birzha + sumLoader.base + sumLoader.birzha}`;
}

// ==================== CALENDAR BUILDING (8 COLUMNS) ====================
function buildCalendar(y, m) {
  monthSelect.value = m;

  // Очищення та створення заголовків сітки (8 колонок)
  calendar.innerHTML = `
    <div class="day-name">Пн</div>
    <div class="day-name">Вт</div>
    <div class="day-name">Ср</div>
    <div class="day-name">Чт</div>
    <div class="day-name">Пт</div>
    <div class="day-name">Сб</div>
    <div class="day-name">Нд</div>
    <div class="day-name week-summary-head">За тиждень</div>
  `;

  const daysInMonth = new Date(y, m + 1, 0).getDate();
  let firstDay = new Date(y, m, 1).getDay(); 
  firstDay = (firstDay === 0) ? 7 : firstDay; // Неділя -> 7

  let currentDay = 1;

  while (currentDay <= daysInMonth) {
    let weekHours = 0;

    // Створення 7 днів тижня
    for (let i = 1; i <= 7; i++) {
      if ((currentDay === 1 && i < firstDay) || currentDay > daysInMonth) {
        // Порожня клітинка
        const emptyCell = document.createElement('div');
        emptyCell.className = 'day empty';
        calendar.appendChild(emptyCell);
      } else {
        // Клітинка з днем
        const dayDiv = document.createElement('div');
        dayDiv.className = 'day';

        const num = document.createElement('div');
        num.className = 'date-num';
        num.textContent = currentDay;
        dayDiv.appendChild(num);

        const key = formatKey(y, m, currentDay);
        const dayData = savedData[key];

        if (dayData) {
          dayDiv.classList.add(dayData.role);
          weekHours += Number(dayData.hours) || 0;

          if (dayData.birzha) {
            const bBadge = document.createElement('div');
            bBadge.className = 'birzha-badge';
            bBadge.textContent = 'Біржа';
            dayDiv.appendChild(bBadge);
          }
          if (dayData.hours !== null) {
            const hBadge = document.createElement('div');
            hBadge.className = 'hours-badge';
            hBadge.textContent = `${dayData.hours} год`;
            dayDiv.appendChild(hBadge);
          }
        }

        // Обробка кліку по дню
        const dayNum = currentDay;
        dayDiv.addEventListener('click', () => handleDayClick(key, dayNum));

        calendar.appendChild(dayDiv);
        currentDay++;
      }
    }

    // 8-ма колонка: Підсумок за тиждень
    const weekSummaryCell = document.createElement('div');
    weekSummaryCell.className = 'week-summary';
    if (weekHours > 40) weekSummaryCell.classList.add('overload');
    weekSummaryCell.textContent = `${weekHours}г`;
    calendar.appendChild(weekSummaryCell);
  }

  updateMonthlySummary();
}

// Клік по дню (додавання / редагування / видалення)
function handleDayClick(key, day) {
  if (!selectedRole || selectedHours === null) return;

  const existing = savedData[key];

  // Якщо дані збігаються — видаляємо
  if (existing && existing.role === selectedRole && Number(existing.hours) === Number(selectedHours) && existing.birzha === birzhaActive) {
    delete savedData[key];
  } else {
    // Інакше — записуємо нові
    savedData[key] = { role: selectedRole, hours: Number(selectedHours), birzha: birzhaActive };
  }

  persist();
  buildCalendar(currentYear, currentMonth);
}

// ==================== NAV LISTENERS ====================
document.getElementById('prevMonth').addEventListener('click', () => {
  currentMonth--; 
  if (currentMonth < 0) { currentMonth = 11; currentYear--; } 
  buildCalendar(currentYear, currentMonth); 
});

document.getElementById('nextMonth').addEventListener('click', () => {
  currentMonth++; 
  if (currentMonth > 11) { currentMonth = 0; currentYear++; } 
  buildCalendar(currentYear, currentMonth); 
});

monthSelect.addEventListener('change', () => {
  currentMonth = parseInt(monthSelect.value);
  buildCalendar(currentYear, currentMonth);
});

// ==================== EXPORT TO EXCEL ====================
function exportToExcel() {
  const wb = XLSX.utils.book_new();
  const sheetData = [];

  sheetData.push([`${monthNames[currentMonth]} ${currentYear}`]);
  sheetData.push([]);
  sheetData.push(['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд', 'За тиждень']);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  let firstDay = new Date(currentYear, currentMonth, 1).getDay();
  firstDay = (firstDay === 0) ? 7 : firstDay;

  let currentDay = 1;
  let totalMonthHours = 0;

  while (currentDay <= daysInMonth) {
    const weekRow = new Array(8).fill('');
    let weekTotal = 0;

    for (let i = firstDay - 1; i < 7 && currentDay <= daysInMonth; i++) {
      const key = formatKey(currentYear, currentMonth, currentDay);
      const entry = savedData[key];

      if (entry) {
        const roleName = entry.role === 'seller' ? 'Фр' : 'Рух';
        const birzhaText = entry.birzha ? ' (Б)' : '';
        weekRow[i] = `${currentDay} [${roleName}${birzhaText} - ${entry.hours}г]`;
        weekTotal += Number(entry.hours);
      } else {
        weekRow[i] = `${currentDay}`;
      }

      currentDay++;
    }

    weekRow[7] = `${weekTotal} год`;
    totalMonthHours += weekTotal;
    sheetData.push(weekRow);
    firstDay = 1;
  }

  sheetData.push([]);
  sheetData.push(['Всього за місяць:', `${totalMonthHours} год`]);

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  XLSX.utils.book_append_sheet(wb, ws, 'Графік');
  XLSX.writeFile(wb, `График_${monthNames[currentMonth]}_${currentYear}.xlsx`);
}

// Запуск
buildCalendar(currentYear, currentMonth);
