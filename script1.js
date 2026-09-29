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

const monthNames = [
  "Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень",
  "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"
];

// Структура збереження: { "YYYY-MM-DD": { firstAdded: 'seller'|'loader', seller: {...}, loader: {...} } }
let savedData = JSON.parse(localStorage.getItem('workSchedule') || '{}');

// Migrator: перетворення старого формату у новий з підтримкою firstAdded
Object.keys(savedData).forEach(key => {
  if (savedData[key] && savedData[key].role) {
    const old = savedData[key];
    savedData[key] = {
      firstAdded: old.role,
      [old.role]: { hours: old.hours, birzha: old.birzha }
    };
  }
});

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

function setSafeText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// Значення за замовчуванням
const DEFAULT_ROLE = 'seller';
const DEFAULT_HOURS = 11;

function applyDefaults() {
  selectedRole = DEFAULT_ROLE;
  if (btnSeller) btnSeller.classList.add('active');

  selectedHours = DEFAULT_HOURS;
  hourButtons.forEach(b => {
    if (Number(b.dataset.hours) === DEFAULT_HOURS) b.classList.add('active');
  });
}
applyDefaults();

// ==================== EVENT LISTENERS ====================
if (btnSeller) {
  btnSeller.addEventListener('click', () => {
    selectedRole = 'seller'; 
    btnSeller.classList.add('active'); 
    if (btnLoader) btnLoader.classList.remove('active'); 
  });
}

if (btnLoader) {
  btnLoader.addEventListener('click', () => {
    selectedRole = 'loader'; 
    btnLoader.classList.add('active'); 
    if (btnSeller) btnSeller.classList.remove('active'); 
  });
}

hourButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    selectedHours = Number(btn.dataset.hours);
    clearHourButtons(); 
    btn.classList.add('active'); 
    if (customHoursInput) customHoursInput.value = '';
  });
});

if (customHoursInput) {
  customHoursInput.addEventListener('input', () => {
    const v = parseFloat(customHoursInput.value); 
    selectedHours = isNaN(v) ? null : v; 
    clearHourButtons(); 
  });
}

if (birzhaCheckbox) {
  birzhaCheckbox.addEventListener('change', () => { 
    birzhaActive = birzhaCheckbox.checked; 
  });
}

// Очистити місяць
if (clearMonthBtn) {
  clearMonthBtn.addEventListener('click', () => {
    const mm = String(currentMonth + 1).padStart(2, '0');
    const prefix = `${currentYear}-${mm}-`;
    const keys = Object.keys(savedData).filter(k => k.startsWith(prefix));
    
    if (keys.length === 0) { 
      alert('Записів для цього місяця немає.'); 
      return; 
    }
    
    if (!confirm(`Видалити всі записи за ${monthNames[currentMonth]} ${currentYear}?`)) return;
    
    keys.forEach(k => delete savedData[k]);
    persist(); 
    buildCalendar(currentYear, currentMonth);
  });
}

if (exportExcelBtn) {
  exportExcelBtn.addEventListener('click', exportToExcel);
}

// ==================== MONTHLY SUMMARY ====================
function updateMonthlySummary() {
  const mm = String(currentMonth + 1).padStart(2, '0');
  const prefix = `${currentYear}-${mm}-`;

  let sellerDays = 0, sellerBase = 0, sellerBirzha = 0;
  let loaderDays = 0, loaderBase = 0, loaderBirzha = 0;

  for (const k in savedData) {
    if (!k.startsWith(prefix)) continue;
    const dayEntry = savedData[k];
    if (!dayEntry) continue;

    if (dayEntry.seller) {
      sellerDays++;
      const h = Number(dayEntry.seller.hours) || 0;
      dayEntry.seller.birzha ? sellerBirzha += h : sellerBase += h;
    }

    if (dayEntry.loader) {
      loaderDays++;
      const h = Number(dayEntry.loader.hours) || 0;
      dayEntry.loader.birzha ? loaderBirzha += h : loaderBase += h;
    }
  }

  // R. V. (seller)
  setSafeText('sellerDays', sellerDays);
  setSafeText('sellerBaseHours', `${sellerBase}г`);
  setSafeText('sellerBirzhaHours', `${sellerBirzha}г`);
  setSafeText('sellerTotalHours', `${sellerBase + sellerBirzha}г`);

  // D SkV (loader)
  setSafeText('loaderDays', loaderDays);
  setSafeText('loaderBaseHours', `${loaderBase}г`);
  setSafeText('loaderBirzhaHours', `${loaderBirzha}г`);
  setSafeText('loaderTotalHours', `${loaderBase + loaderBirzha}г`);

  // Усього
  setSafeText('grandTotalDays', sellerDays + loaderDays);
  setSafeText('grandBaseHours', `${sellerBase + loaderBase}г`);
  setSafeText('grandBirzhaHours', `${sellerBirzha + loaderBirzha}г`);
  setSafeText('grandTotalHours', `${sellerBase + sellerBirzha + loaderBase + loaderBirzha}г`);
}

// ==================== CALENDAR BUILDING ====================
function buildCalendar(y, m) {
  if (!calendar) return;
  if (monthSelect) monthSelect.value = m;

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
  firstDay = (firstDay === 0) ? 7 : firstDay;

  let currentDay = 1;

  while (currentDay <= daysInMonth) {
    let sellerWeekHours = 0;
    let loaderWeekHours = 0;

    for (let i = 1; i <= 7; i++) {
      if ((currentDay === 1 && i < firstDay) || currentDay > daysInMonth) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'day empty';
        calendar.appendChild(emptyCell);
      } else {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'day';

        // Перевірка, чи є цей день сьогоднішнім
        const today = new Date();
        const isToday = (currentDay === today.getDate() && 
                         m === today.getMonth() && 
                         y === today.getFullYear());

        if (isToday) {
          dayDiv.classList.add('today');
        }

        const num = document.createElement('div');
        num.className = 'date-num';
        num.textContent = currentDay;
        dayDiv.appendChild(num);

        const key = formatKey(y, m, currentDay);
        const dayData = savedData[key];

        if (dayData) {
          // --- ОБВОДКА: Задаємо клас обводки першого доданого працівника ---
          if (dayData.firstAdded === 'seller' && dayData.seller) {
            dayDiv.classList.add('has-seller');
          } else if (dayData.firstAdded === 'loader' && dayData.loader) {
            dayDiv.classList.add('has-loader');
          } else if (dayData.seller) {
            dayDiv.classList.add('has-seller');
          } else if (dayData.loader) {
            dayDiv.classList.add('has-loader');
          }

          const hoursContainer = document.createElement('div');
          hoursContainer.className = 'hours-container';

          let hasBirzha = false;

          // Плашка для R. V. (Синя)
          if (dayData.seller) {
            sellerWeekHours += Number(dayData.seller.hours) || 0;
            if (dayData.seller.birzha) hasBirzha = true;

            const badge = document.createElement('div');
            badge.className = 'hours-badge seller';
            badge.textContent = `${dayData.seller.hours}г`;
            hoursContainer.appendChild(badge);
          }

          // Плашка для D SkV (Оранжева)
          if (dayData.loader) {
            loaderWeekHours += Number(dayData.loader.hours) || 0;
            if (dayData.loader.birzha) hasBirzha = true;

            const loaderBadge = document.createElement('div');
            loaderBadge.className = 'hours-badge loader';
            loaderBadge.textContent = `${dayData.loader.hours}г`;
            hoursContainer.appendChild(loaderBadge);
          }

          if (hasBirzha) {
            const bBadge = document.createElement('div');
            bBadge.className = 'birzha-badge';
            bBadge.textContent = 'Біржа';
            dayDiv.appendChild(bBadge);
          }

          dayDiv.appendChild(hoursContainer);
        }

        const dayNum = currentDay;
        dayDiv.addEventListener('click', () => handleDayClick(key, dayNum));

        calendar.appendChild(dayDiv);
        currentDay++;
      }
    }

    // --- ПІДСУМОК ЗА ТИЖДЕНЬ (РОЗДІЛЬНИЙ) ---
    const weekSummaryCell = document.createElement('div');
    weekSummaryCell.className = 'week-summary';

    // Підсвічування червоним, якщо ХТОСЬ ОДИН перевищив норму (40 годин)
    if (sellerWeekHours > 40 || loaderWeekHours > 40) {
      weekSummaryCell.classList.add('overload');
    }

    if (sellerWeekHours === 0 && loaderWeekHours === 0) {
      weekSummaryCell.innerHTML = `<span class="val-empty">0г</span>`;
    } else {
      weekSummaryCell.innerHTML = `
        <span class="val-seller">${sellerWeekHours}г</span>
        <span class="val-loader">${loaderWeekHours}г</span>
      `;
    }

    calendar.appendChild(weekSummaryCell);
  }

  updateMonthlySummary();
}

// Клік по дню (додавання/видалення ролі)
function handleDayClick(key, day) {
  if (!selectedRole || selectedHours === null) return;

  if (!savedData[key]) {
    savedData[key] = {};
  }

  const dayEntry = savedData[key];
  const existingRoleData = dayEntry[selectedRole];

  // Якщо клікаємо повторно на того самого співробітника — видаляємо його зміну
  if (existingRoleData && Number(existingRoleData.hours) === Number(selectedHours) && existingRoleData.birzha === birzhaActive) {
    delete dayEntry[selectedRole];

    // Переключаємо firstAdded на другого працівника, якщо першого видалено
    if (dayEntry.firstAdded === selectedRole) {
      const remainingRole = selectedRole === 'seller' ? 'loader' : 'seller';
      if (dayEntry[remainingRole]) {
        dayEntry.firstAdded = remainingRole;
      } else {
        delete dayEntry.firstAdded;
      }
    }

    // Якщо день повністю порожній — видаляємо об'єкт дня
    if (!dayEntry.seller && !dayEntry.loader) {
      delete savedData[key];
    }
  } else {
    // Якщо це перша зміна в день — записуємо ХТО її додав
    if (!dayEntry.seller && !dayEntry.loader) {
      dayEntry.firstAdded = selectedRole;
    }

    // Додаємо або оновлюємо зміну вибраного співробітника
    dayEntry[selectedRole] = { hours: Number(selectedHours), birzha: birzhaActive };
  }

  persist();
  buildCalendar(currentYear, currentMonth);
}

// ==================== NAV LISTENERS ====================
const prevBtn = document.getElementById('prevMonth');
if (prevBtn) {
  prevBtn.addEventListener('click', () => {
    currentMonth--; 
    if (currentMonth < 0) { currentMonth = 11; currentYear--; } 
    buildCalendar(currentYear, currentMonth); 
  });
}

const nextBtn = document.getElementById('nextMonth');
if (nextBtn) {
  nextBtn.addEventListener('click', () => {
    currentMonth++; 
    if (currentMonth > 11) { currentMonth = 0; currentYear++; } 
    buildCalendar(currentYear, currentMonth); 
  });
}

if (monthSelect) {
  monthSelect.addEventListener('change', () => {
    currentMonth = parseInt(monthSelect.value);
    buildCalendar(currentYear, currentMonth);
  });
}

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
    let sellerWeekTotal = 0;
    let loaderWeekTotal = 0;

    for (let i = firstDay - 1; i < 7 && currentDay <= daysInMonth; i++) {
      const key = formatKey(currentYear, currentMonth, currentDay);
      const entry = savedData[key];

      if (entry) {
        let textParts = [];
        if (entry.seller) {
          textParts.push(`R.V.${entry.seller.birzha ? '(Б)' : ''}-${entry.seller.hours}г`);
          sellerWeekTotal += Number(entry.seller.hours);
        }
        if (entry.loader) {
          textParts.push(`D.SkV${entry.loader.birzha ? '(Б)' : ''}-${entry.loader.hours}г`);
          loaderWeekTotal += Number(entry.loader.hours);
        }
        weekRow[i] = `${currentDay} [${textParts.join(' + ')}]`;
      } else {
        weekRow[i] = `${currentDay}`;
      }

      currentDay++;
    }

    weekRow[7] = `R.V: ${sellerWeekTotal}г / D.SkV: ${loaderWeekTotal}г`;
    totalMonthHours += (sellerWeekTotal + loaderWeekTotal);
    sheetData.push(weekRow);
    firstDay = 1;
  }

  sheetData.push([]);
  sheetData.push(['Всього за місяць:', `${totalMonthHours} год`]);

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  XLSX.utils.book_append_sheet(wb, ws, 'Графік');
  XLSX.writeFile(wb, `Графік_${monthNames[currentMonth]}_${currentYear}.xlsx`);
}

// Запуск
buildCalendar(currentYear, currentMonth);
