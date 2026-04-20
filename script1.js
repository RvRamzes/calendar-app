// ==================== DOM ELEMENTS ====================
const calendar = document.getElementById('calendar');
const monthLabel = document.getElementById('monthLabel');
const btnSeller = document.getElementById('btnSeller');
const btnLoader = document.getElementById('btnLoader');
const hourButtons = document.querySelectorAll('.btnHour');
const customHoursInput = document.getElementById('customHours');
const birzhaCheckbox = document.getElementById('birzhaCheckbox');
const clearMonthBtn = document.getElementById('clearMonth');

// ==================== GLOBAL VARIABLES ====================
let selectedRole = null;       // поточний тип зміни
let selectedHours = null;      // поточні години
let birzhaActive = false;      // прапорець біржі
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

const monthNames = ["Січень","Лютий","Березень","Квітень","Травень","Червень","Липень","Серпень","Вересень","Жовтень","Листопад","Грудень"];

// Формат збереження даних: { "YYYY-MM-DD": { role, hours, birzha } }
let savedData = JSON.parse(localStorage.getItem('workSchedule') || '{}');

// ==================== UTILITY FUNCTIONS ====================
function formatKey(y,m,d){ 
  return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
function persist(){ 
  localStorage.setItem('workSchedule',JSON.stringify(savedData)); 
}
function clearRoleButtons(){ 
  btnSeller.classList.remove('active'); 
  btnLoader.classList.remove('active'); 
}
function clearHourButtons(){ 
  hourButtons.forEach(b=>b.classList.remove('active')); 
}

// ==================== DEFAULT VALUES ====================
const DEFAULT_ROLE='loader', DEFAULT_HOURS=9.5;
function applyDefaults(){
  selectedRole = DEFAULT_ROLE;
  if(DEFAULT_ROLE==='seller'){ btnSeller.classList.add('active'); btnLoader.classList.remove('active'); }
  else{ btnLoader.classList.add('active'); btnSeller.classList.remove('active'); }

  selectedHours = DEFAULT_HOURS;
  let matched=false;
  hourButtons.forEach(b=>{
    if(Number(b.dataset.hours)===DEFAULT_HOURS){ b.classList.add('active'); matched=true; }
    else b.classList.remove('active');
  });
  if(!matched) customHoursInput.value=DEFAULT_HOURS;
  else customHoursInput.value='';
}
applyDefaults();

// ==================== EVENT LISTENERS ====================

// --- Вибір ролі ---
btnSeller.addEventListener('click',()=>{
  selectedRole='seller'; 
  btnSeller.classList.add('active'); 
  btnLoader.classList.remove('active'); 
});
btnLoader.addEventListener('click',()=>{
  selectedRole='loader'; 
  btnLoader.classList.add('active'); 
  btnSeller.classList.remove('active'); 
});

// --- Вибір годин ---
hourButtons.forEach(btn=>{
  btn.addEventListener('click',()=>{
    selectedHours=Number(btn.dataset.hours);
    clearHourButtons(); 
    btn.classList.add('active'); 
    customHoursInput.value='';
  });
});
customHoursInput.addEventListener('input',()=>{
  const v=parseFloat(customHoursInput.value); 
  selectedHours=isNaN(v)?null:v; 
  clearHourButtons(); 
});

// --- Біржа ---
birzhaCheckbox.addEventListener('change',()=>{ birzhaActive=birzhaCheckbox.checked; });

// --- Очистка місяця ---
clearMonthBtn.addEventListener('click',()=>{
  const mm=String(currentMonth+1).padStart(2,'0');
  const prefix=`${currentYear}-${mm}-`;
  const keys=Object.keys(savedData).filter(k=>k.startsWith(prefix));
  if(keys.length===0){ alert('Записів для цього місяця немає.'); return; }
  if(!confirm(`Видалити ${keys.length} записів для ${monthNames[currentMonth]} ${currentYear}?`)) return;
  keys.forEach(k=>delete savedData[k]);
  persist(); buildCalendar(currentYear,currentMonth); updateMonthlySummary();
});

// ==================== MONTHLY SUMMARY ====================
function updateMonthlySummary(){
  const mm=String(currentMonth+1).padStart(2,'0');
  const prefix=`${currentYear}-${mm}-`;

  // Підрахунок годин по типу зміни та біржі
  let sumSeller={base:0,birzha:0}, sumLoader={base:0,birzha:0};
  for(const k in savedData){
    if(!k.startsWith(prefix)) continue;
    const e=savedData[k];
    const hours=Number(e.hours)||0;
    if(e.role==='seller'){ e.birzha? sumSeller.birzha+=hours: sumSeller.base+=hours; }
    else if(e.role==='loader'){ e.birzha? sumLoader.birzha+=hours: sumLoader.base+=hours; }
  }

  // Оновлення таблиці підсумків
  document.getElementById('sumSeller').textContent=`${sumSeller.base} / ${sumSeller.birzha} / ${sumSeller.base+sumSeller.birzha}`;
  document.getElementById('sumLoader').textContent=`${sumLoader.base} / ${sumLoader.birzha} / ${sumLoader.base+sumLoader.birzha}`;
  document.getElementById('sumTotal').textContent=`${sumSeller.base+sumLoader.base} / ${sumSeller.birzha+sumLoader.birzha} / ${sumSeller.base+sumSeller.birzha+sumLoader.base+sumLoader.birzha}`;
}

// ==================== CALENDAR BUILDING ====================
function buildCalendar(y,m){
  // --- Заголовок місяця ---
  monthLabel.textContent=`${monthNames[m]} ${y}`;

  // --- Очищення старих днів ---
  const dayNamesCount=7;
  while(calendar.children.length>dayNamesCount) calendar.removeChild(calendar.lastChild);

  const daysInMonth=new Date(y,m+1,0).getDate();
  let startDay=new Date(y,m,1).getDay(); 
  if(startDay===0) startDay=7; // неділя в кінець

  // --- Порожні клітинки перед першим числом ---
  for(let i=1;i<startDay;i++){ 
    const emptyCell=document.createElement('div'); 
    emptyCell.className='day empty'; 
    calendar.appendChild(emptyCell);
  }

  // --- Створення днів ---
  for(let day=1;day<=daysInMonth;day++){
    const dayDiv=document.createElement('div'); 
    dayDiv.className='day';

    // --- Номер дня ---
    const num=document.createElement('div'); 
    num.className='date-num'; 
    num.textContent=day; 
    dayDiv.appendChild(num);

    const key=formatKey(y,m,day);

    // --- Відновлення збережених даних ---
    if(savedData[key]){
      dayDiv.classList.add(savedData[key].role);
      if(savedData[key].birzha){
        const birzhaBadge=document.createElement('div'); 
        birzhaBadge.className='birzha-badge'; 
        birzhaBadge.textContent='Біржа'; 
        dayDiv.appendChild(birzhaBadge);
      }
      if(savedData[key].hours!==null){ 
        const badge=document.createElement('div'); 
        badge.className='hours-badge'; 
        badge.textContent=`${savedData[key].hours} год`; 
        dayDiv.appendChild(badge);
      }
    }

    // --- Клік по дню ---
    dayDiv.addEventListener('click',()=>{
      if(!selectedRole||selectedHours===null) return;
      const existing=savedData[key];

      // Видалення запису, якщо обидва параметри (role+hours+birzha) збігаються
      if(existing && existing.role===selectedRole && Number(existing.hours)===Number(selectedHours) && existing.birzha===birzhaActive){
        delete savedData[key]; 
        persist(); 
        dayDiv.classList.remove('seller','loader');
        dayDiv.querySelectorAll('.hours-badge,.birzha-badge').forEach(b=>b.remove());
        updateMonthlySummary(); 
        return;
      }

      // --- Додавання / редагування запису ---
      savedData[key]={role:selectedRole,hours:Number(selectedHours),birzha:birzhaActive};
      persist();

      dayDiv.classList.remove('seller','loader'); 
      dayDiv.classList.add(selectedRole);

      dayDiv.querySelectorAll('.hours-badge,.birzha-badge').forEach(b=>b.remove());
      if(birzhaActive){ 
        const birzhaBadge=document.createElement('div'); 
        birzhaBadge.className='birzha-badge'; 
        birzhaBadge.textContent='Біржа'; 
        dayDiv.appendChild(birzhaBadge);
      }
      const hoursBadge=document.createElement('div'); 
      hoursBadge.className='hours-badge'; 
      hoursBadge.textContent=`${selectedHours} год`; 
      dayDiv.appendChild(hoursBadge);

      updateMonthlySummary();
    });

    calendar.appendChild(dayDiv);
  }

  // --- Оновлення підсумків після побудови ---
  updateMonthlySummary();
}

// ==================== MONTH NAVIGATION ====================
document.getElementById('prevMonth').addEventListener('click',()=>{
  currentMonth--; 
  if(currentMonth<0){ currentMonth=11; currentYear--; } 
  buildCalendar(currentYear,currentMonth); 
});
document.getElementById('nextMonth').addEventListener('click',()=>{
  currentMonth++; 
  if(currentMonth>11){ currentMonth=0; currentYear++; } 
  buildCalendar(currentYear,currentMonth); 
});

// ==================== INITIAL BUILD ====================
buildCalendar(currentYear,currentMonth);
