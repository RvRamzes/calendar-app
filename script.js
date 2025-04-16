const calendar = document.getElementById('calendar');
const summary = document.getElementById('selected-time');
const monthSelect = document.getElementById('month-select');
let daySelections = {};
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
    if (current === 0) daySelections[key] = 8;
    else if (current === 8) daySelections[key] = 10;
    else delete daySelections[key];

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
    if (summaryCell) summaryCell.textContent = `Підсумок: ${weekTotal}г`;
    total += weekTotal;
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
function exportToExcel() {
  const wb = XLSX.utils.book_new(); // Створення нового файлу
  const sheetData = [];

  // Додаємо заголовки
  sheetData.push(['Рік', 'Місяць', 'День', 'Години']);

  // Проходимо по всіх вибраних днях і додаємо їх у дані
  for (const key in daySelections) {
    if (daySelections.hasOwnProperty(key)) {
      const [year, month, day] = key.split('-');
      const hours = daySelections[key];
      sheetData.push([year, parseInt(month) + 1, parseInt(day), hours]);
    }
  }

  // Створюємо лист з даними
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  XLSX.utils.book_append_sheet(wb, ws, 'Дані');

  // Експортуємо в Excel
  XLSX.writeFile(wb, 'calendar_data.xlsx');
}