const calendar = document.getElementById('calendar');
const summary = document.getElementById('selected-time');
const monthSelect = document.getElementById('month-select');
let daySelections = {};
const saved = localStorage.getItem('daySelections');
if (saved) {
  daySelections = JSON.parse(saved);
}
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

// Визначає кількість днів у місяці
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// Створює клітинку дня
function createDayCell(day) {
  const cell = document.createElement('div');
  cell.className = 'day';
  cell.textContent = day;

  if (daySelections[`${currentYear}-${currentMonth}-${day}`]) {
    cell.classList.add('selected');
    cell.textContent = `${day} (${daySelections[`${currentYear}-${currentMonth}-${day}`]}г)`;
  }

  cell.onclick = () => {
    const key = `${currentYear}-${currentMonth}-${day}`;
    const current = daySelections[key] || 0;
    if (current === 0) daySelections[key] = 10;
    else if (current === 10) daySelections[key] = 20;
    else delete daySelections[key];

// ⬇️ Ось цей рядок зберігає все
localStorage.setItem('daySelections', JSON.stringify(daySelections));

    updateCalendar();
  };

  return cell;
}

// Генерує календар на обраний місяць
function generateCalendar() {
  calendar.innerHTML = '';
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  let firstDay = new Date(currentYear, currentMonth, 1).getDay();
  firstDay = firstDay === 0 ? 7 : firstDay;

  let currentDay = 1;
  let weekNumber = 1;

  while (currentDay <= daysInMonth) {
    const weekRow = document.createElement('div');
    weekRow.classList.add('week-row');

    if (weekNumber === 1) {
      for (let i = 1; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'day empty';
        weekRow.appendChild(empty);
      }
    }

    for (let i = weekRow.children.length; i < 7 && currentDay <= daysInMonth; i++) {
      const cell = createDayCell(currentDay);
      weekRow.appendChild(cell);
      currentDay++;
    }

    const summaryCell = document.createElement('div');
    summaryCell.className = 'week-summary';
    summaryCell.id = `week-${weekNumber}-total`;
    summaryCell.textContent = 'Підсумок: 0г';
    weekRow.appendChild(summaryCell);

    calendar.appendChild(weekRow);
    weekNumber++;
  }

  updateCalendar();
}

// Оновлює календар і підсумки
function updateCalendar() {
  const rows = document.querySelectorAll('.week-row');
  let total = 0;

  rows.forEach((row, i) => {
    let weekTotal = 0;
    const dayCells = row.querySelectorAll('.day');
    dayCells.forEach(cell => {
      const day = parseInt(cell.textContent);
      if (!isNaN(day)) {
        const key = `${currentYear}-${currentMonth}-${day}`;
        const hours = daySelections[key] || 0;
        weekTotal += hours;
        cell.classList.toggle('selected', !!hours);
        cell.textContent = hours ? `${day} (${hours}г)` : day;
      }
    });

    const summaryCell = row.querySelector('.week-summary');
    if (summaryCell) summaryCell.textContent = `${weekTotal} годин`;
    total += weekTotal;
    
/// підсумки червоними, якщо за тиждень вийшло більше 40 годин///
    summaryCell.classList.toggle('overload', weekTotal > 40);

  });

  summary.textContent = total;
}

// Вибір місяця
monthSelect.value = currentMonth;
monthSelect.addEventListener('change', () => {
  currentMonth = parseInt(monthSelect.value);
  generateCalendar();
});

// Запуск
generateCalendar();

////////////////////////////////////////////////////////
/////////////Функція для експорту даних в Excel/////////
////////////////////////////////////////////////////////
function exportCalendarLikeView() {
  const wb = XLSX.utils.book_new();
  const sheetData = [];

  const monthNames = [
    'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
    'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
  ];

  // Додати заголовок місяця і року
  sheetData.push([`${monthNames[currentMonth]} ${currentYear}`]);
  sheetData.push([]); // порожній рядок

  // Дні тижня
  const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд', 'Підсумок:'];
  sheetData.push(daysOfWeek);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  let firstDay = new Date(currentYear, currentMonth, 1).getDay();
  firstDay = firstDay === 0 ? 7 : firstDay;

  let currentDay = 1;
  let totalMonthHours = 0;

  while (currentDay <= daysInMonth) {
    const weekRow = new Array(8).fill('');
    let weekTotal = 0;

  // Проходимо по всіх вибраних днях і додаємо їх у дані
    for (let i = firstDay - 1; i < 7 && currentDay <= daysInMonth; i++) {
      const key = `${currentYear}-${currentMonth}-${currentDay}`;
      const hours = daySelections[key] || 0;

      weekRow[i] = hours ? `${currentDay} (${hours}г)` : `${currentDay}`;
      weekTotal += hours;
      totalMonthHours += hours;

      currentDay++;
    }

    weekRow[7] = `${weekTotal} годин`;
    sheetData.push(weekRow);
    firstDay = 1;
  }

  // Додаємо загальний підсумок за місяць
  sheetData.push([]);
  sheetData.push(['Загальний підсумок за місяць:', `${totalMonthHours}г`]);

  // Створюємо лист з даними
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  XLSX.utils.book_append_sheet(wb, ws, 'Календар');

  // Експортуємо в Excel
  XLSX.writeFile(wb, `Календар_${monthNames[currentMonth]}_${currentYear}.xlsx`);
}

///////Кнопка «Скинути все»///////////
function resetCalendar() {
  if (confirm("Очистити всі дані календаря?")) {
    localStorage.removeItem('daySelections');
    daySelections = {};
    updateCalendar();
  }
}
