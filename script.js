const API_KEY = "0ecb0708872ccd35c9c134f7bd571151"; // apna OpenWeather API key

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locBtn = document.getElementById("locBtn");
const unitToggle = document.getElementById("unitToggle");
const weatherSection = document.getElementById("weatherSection");
const forecastSection = document.getElementById("forecastSection");
const cityNameEl = document.getElementById("cityName");
const dateTimeEl = document.getElementById("dateTime");
const weatherInfoEl = document.getElementById("weatherInfo");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const favBtn = document.getElementById("favBtn");
const favoritesList = document.getElementById("favoritesList");
const forecastEl = document.getElementById("forecast");
const messageBox = document.getElementById("messageBox");

let unit = "metric"; // default Celsius
let currentCity = null;
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

// Show message
function showMessage(msg, type="info") {
  messageBox.textContent = msg;
  messageBox.style.color = type === "error" ? "red" : type === "success" ? "green" : "#333";
  setTimeout(() => (messageBox.textContent = ""), 2000);
}

// Fetch weather by city
async function fetchWeather(city) {
  try {
    const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`);
    const geoData = await geoRes.json();
    if (!geoData.length) return showMessage("City not found", "error");

    const { lat, lon, name, country } = geoData[0];
    currentCity = { name, lat, lon, country };

    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${unit}&appid=${API_KEY}`);
    const cur = await res.json();

    const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${unit}&appid=${API_KEY}`);
    const fore = await forecastRes.json();

    displayWeather(cur, fore);
  } catch {
    showMessage("Failed to fetch weather", "error");
  }
}

// Display current weather + forecast
function displayWeather(cur, fore) {
  weatherSection.classList.remove("hidden");
  forecastSection.classList.remove("hidden");

  cityNameEl.textContent = `${currentCity.name}, ${currentCity.country}`;
  dateTimeEl.textContent = new Date(cur.dt * 1000).toLocaleString();
  weatherInfoEl.innerHTML = `${cur.weather[0].description}, ${Math.round(cur.main.temp)}°${unit === "metric" ? "C" : "F"}`;
  humidityEl.textContent = cur.main.humidity;
  windEl.textContent = `${cur.wind.speed} ${unit === "metric" ? "m/s" : "mph"}`;
  favBtn.textContent = isFavorite(currentCity.name) ? "Remove from Favorites" : "Add to Favorites";

  renderForecast(fore.list);
}

// Render 5-day forecast
function renderForecast(list) {
  forecastEl.innerHTML = "";
  const daily = {};

  list.forEach(item => {
    const date = item.dt_txt.split(" ")[0];
    if (!daily[date]) daily[date] = [];
    daily[date].push(item);
  });

  const days = Object.keys(daily).slice(0, 5);
  days.forEach(day => {
    const arr = daily[day];
    const avgTemp = Math.round(arr.reduce((sum, i) => sum + i.main.temp, 0) / arr.length);
    const icon = arr[0].weather[0].icon;
    const desc = arr[0].weather[0].description;

    const card = document.createElement("div");
    card.className = "forecast-day";
    card.innerHTML = `
      <div>${new Date(day).toDateString().slice(0, 10)}</div>
      <img src="https://openweathermap.org/img/wn/${icon}.png" alt="">
      <div>${avgTemp}°${unit === "metric" ? "C" : "F"}</div>
      <div>${desc}</div>
    `;
    forecastEl.appendChild(card);
  });
}

// Favorites handling
function isFavorite(name) {
  return favorites.some(f => f.name === name);
}

favBtn.addEventListener("click", () => {
  if (!currentCity) return showMessage("Search a city first", "error");

  if (isFavorite(currentCity.name)) {
    favorites = favorites.filter(f => f.name !== currentCity.name);
    showMessage("Removed from favorites", "info");
  } else {
    favorites.push(currentCity);
    showMessage("Added to favorites", "success");
  }

  localStorage.setItem("favorites", JSON.stringify(favorites));
  renderFavorites();
  favBtn.textContent = isFavorite(currentCity.name) ? "Remove from Favorites" : "Add to Favorites";
});

// Render favorites list
function renderFavorites() {
  favoritesList.innerHTML = "";
  favorites.forEach(city => {
    const li = document.createElement("li");
    li.textContent = city.name;

    const delBtn = document.createElement("button");
    delBtn.textContent = "X";
    delBtn.onclick = (e) => {
      e.stopPropagation(); // prevent triggering fetchWeather
      favorites = favorites.filter(f => f.name !== city.name);
      localStorage.setItem("favorites", JSON.stringify(favorites));
      renderFavorites();
    };

    li.onclick = () => fetchWeather(city.name);
    li.appendChild(delBtn);
    favoritesList.appendChild(li);
  });
}

// Geolocation
locBtn.addEventListener("click", () => {
  if (!navigator.geolocation) return showMessage("Geolocation not supported", "error");

  navigator.geolocation.getCurrentPosition(async pos => {
    const lat = pos.coords.latitude, lon = pos.coords.longitude;
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${unit}&appid=${API_KEY}`);
    const cur = await res.json();
    currentCity = { name: cur.name, lat, lon, country: cur.sys.country };

    const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${unit}&appid=${API_KEY}`);
    const fore = await forecastRes.json();

    displayWeather(cur, fore);
  }, () => showMessage("Location denied", "error"));
});

// Unit toggle
unitToggle.addEventListener("click", () => {
  unit = unit === "metric" ? "imperial" : "metric";
  unitToggle.textContent = unit === "metric" ? "Switch to °F" : "Switch to °C";
  if (currentCity) fetchWeather(currentCity.name);
});

// Search
searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city) fetchWeather(city);
});

renderFavorites();
