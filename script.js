const defaultState = {
  workouts: [
    { type: "Kuvvet", minutes: 45, calories: 360, date: "Pazartesi" },
    { type: "Kardiyo", minutes: 30, calories: 290, date: "Çarşamba" },
  ],
  water: 1.8,
  meals: ["Yulaf + meyve", "Tavuklu salata"],
};

const state = JSON.parse(localStorage.getItem("fittrack-state")) || defaultState;

const workoutForm = document.querySelector("#workoutForm");
const activityList = document.querySelector("#activityList");
const weeklyChart = document.querySelector("#weeklyChart");
const mealLog = document.querySelector("#mealLog");
const waterValue = document.querySelector("#waterValue");
const workoutValue = document.querySelector("#workoutValue");
const calorieValue = document.querySelector("#calorieValue");
const streakBadge = document.querySelector("#streakBadge");
const resetButton = document.querySelector("#resetButton");

function saveState() {
  localStorage.setItem("fittrack-state", JSON.stringify(state));
}

function renderDate() {
  const date = new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  document.querySelector("#todayLabel").textContent = date;
}

function renderMetrics() {
  const totalMinutes = state.workouts.reduce((sum, item) => sum + Number(item.minutes), 0);
  const totalCalories = state.workouts.reduce((sum, item) => sum + Number(item.calories), 0);
  workoutValue.textContent = `${totalMinutes} dk`;
  calorieValue.textContent = totalCalories.toLocaleString("tr-TR");
  waterValue.textContent = `${state.water.toFixed(2).replace(".", ",")} L`;
  streakBadge.textContent = `${Math.min(state.workouts.length, 7)} gün seri`;
}

function renderActivities() {
  activityList.innerHTML = "";

  state.workouts
    .slice()
    .reverse()
    .forEach((workout) => {
      const item = document.createElement("li");
      item.className = "activity-item";
      item.innerHTML = `
        <div>
          <strong>${workout.type}</strong>
          <span>${workout.date} · ${workout.minutes} dk</span>
        </div>
        <strong>${Number(workout.calories).toLocaleString("tr-TR")} kcal</strong>
      `;
      activityList.appendChild(item);
    });
}

function renderChart() {
  const days = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  const values = [45, 15, 30, 0, 35, 20, 0];
  const recentMinutes = state.workouts.slice(-3).map((item) => Number(item.minutes));

  recentMinutes.forEach((minutes, index) => {
    values[index] = minutes;
  });

  weeklyChart.innerHTML = "";
  days.forEach((day, index) => {
    const wrap = document.createElement("div");
    wrap.className = "bar-wrap";
    wrap.innerHTML = `
      <div class="bar" style="height: ${Math.max(values[index] * 2.2, 14)}px"></div>
      <span>${day}</span>
    `;
    weeklyChart.appendChild(wrap);
  });
}

function renderMeals() {
  mealLog.textContent = state.meals.length ? state.meals.join(" · ") : "Henüz öğün eklenmedi.";
}

function render() {
  renderMetrics();
  renderActivities();
  renderChart();
  renderMeals();
  saveState();
}

workoutForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const today = new Intl.DateTimeFormat("tr-TR", { weekday: "long" }).format(new Date());

  state.workouts.push({
    type: document.querySelector("#workoutType").value,
    minutes: Number(document.querySelector("#workoutMinutes").value),
    calories: Number(document.querySelector("#workoutCalories").value),
    date: today,
  });

  workoutForm.reset();
  document.querySelector("#workoutMinutes").value = 30;
  document.querySelector("#workoutCalories").value = 240;
  render();
});

document.querySelectorAll("[data-water]").forEach((button) => {
  button.addEventListener("click", () => {
    state.water += Number(button.dataset.water);
    render();
  });
});

document.querySelectorAll("[data-meal]").forEach((button) => {
  button.addEventListener("click", () => {
    state.meals.push(button.dataset.meal);
    render();
  });
});

resetButton.addEventListener("click", () => {
  localStorage.removeItem("fittrack-state");
  window.location.reload();
});

renderDate();
render();
