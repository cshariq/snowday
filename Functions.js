// Function to fetch weather data based on user's location
function fetchWeatherData() {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const url = `https://api.weather.com/v1/geocode/${latitude}/${longitude}/aggregate.json?apiKey=e45ff1b7c7bda231216c7ab7c33509b8&products=conditionsshort,fcstdaily10short,fcsthourly24short,nowlinks`;
      console.log("Fetching location done")
      fetchWeather(url);
    },
    (error) => {
      var x = document.getElementById("snackbar");
      document.getElementById("snackbar").innerText = `Error: ${error}`;
      x.className = "show";
      console.log("Fetching location error")
      setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
      const url = `https://api.weather.com/v1/geocode/45.42381580972502/-75.70084317193432/aggregate.json?apiKey=e45ff1b7c7bda231216c7ab7c33509b8&products=conditionsshort,fcstdaily10short,fcsthourly24short,nowlinks`;

      fetchWeather(url);
    }, {enableHighAccuracy: true, timeout: 5000}
  );
}

// Function to fetch weather data from the API
function fetchWeather(url) {
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        console.log(`HTTP error! status: ${response.status}`)
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (!data || !data.fcstdaily10short.forecasts) {
        console.log('No forecast data available');
        throw new Error('No forecast data available');
      }
      processWeatherData(data);
    })
    .catch((error) => console.error('Error fetching weather data:', error));
}

// Function to calculate snow day chance
function calculateSnowDayChance(data) {
  function timeRemaining(currentHour, currentMinute, targetHour) {
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    const targetTotalMinutes = targetHour * 60;
    let remainingMinutes = targetTotalMinutes - currentTotalMinutes;

    if (remainingMinutes < 0) {
      remainingMinutes += 24 * 60; // Add 24 hours worth of minutes
    }

    return Math.round(remainingMinutes / 60);
  }

  const currentHour = 0; // Example: 00:18
  const currentMinute = 18;
  const targetHour = 4; // Target time: 4am
  const timeLeft = timeRemaining(currentHour, currentMinute, targetHour);
  let chance = 0;
  const forecastDay = data.fcstdaily10short.forecasts[1];

  if (!forecastDay.metric.snow_qpf === 0) {
    chance += 15 * Math.min(forecastDay.metric.snow_qpf / 7.6, 1);

    if (forecastDay.metric.max_temp <= 3) {
      chance += 5;
    }

    chance += 5 * Math.min(forecastDay.day.metric.wspd / 16, 1);

    if (forecastDay.day.precip_type === 'snow' || forecastDay.day.precip_type === 'freezing rain') {
      chance += 10;
    }  else {
      chance -= 10;
    }

    const forecast = data.fcsthourly24short.forecasts[timeLeft];
    chance += 20 * Math.min(forecast.pop / 100, 1)
    chance += 15 * Math.min(forecast.metric.snow_qpf / 2.5, 1);
    chance += 10 * Math.min(forecast.clds / 100, 1);
    if (forecast.metric.temp <= 2) {
      chance += 5;
    }

    chance += 5 * Math.min(forecast.metric.wspd / 16, 1);

    if (forecast.precip_type === 'snow' || forecast.precip_type === 'freezing rain') {
      chance += 5;
    }  else {
      chance -= 15;
    }
  }
  if (!chance >= 85) {
    var inputValue = document.getElementById('integerInput').value; 
    if (!inputValue === '') { 
      chance -= inputValue*2
    }
  }
  chance = Math.max(chance, 0)
  return Math.round(chance);
}

// Function to process and display weather data
function processWeatherData(data) {
  console.log("Processing data")
  let snowDayChance = calculateSnowDayChance(data);
  document.getElementById('percentage-text').innerHTML = `<strong>${snowDayChance}%</strong>`;

  if (snowDayChance === 0) {
    snowDayChance = 1;
  }

  document.getElementById('progress-bar').style.setProperty('--meter-value', snowDayChance);

  const forecast = data.fcstdaily10short.forecasts;
  const days = ['day1', 'day2', 'day3', 'day4', 'day5'];

  days.forEach((day, index) => {
    if (!forecast[index]) {
      console.warn(`No data for ${day}`);
      return;
    }
    
    const forecastDay = forecast[index + 1];
    let chance = 0;

    if (forecastDay.day.pop >= 60) {
      chance += 35 * Math.min(forecastDay.metric.snow_qpf / 7.6, 1);
      chance += 35 * Math.min(forecastDay.day.pop / 100, 1);

      if (forecastDay.metric.max_temp <= 3) {
        chance += 10;
      }

      chance += 10 * Math.min(forecastDay.day.metric.wspd / 16, 1);

      if (forecastDay.day.precip_type === 'snow' || forecastDay.day.precip_type === 'freezing rain') {
        chance += 10;
      } else {
        chance -= 10;
      }
      if (!chance >= 85) {
        var inputValue = document.getElementById('integerInput').value; 
        if (!inputValue === '') { 
          chance -= inputValue*2
        }
      }
      chance = Math.max(chance, 0)
      chance = Math.round(chance);
    }

    document.getElementById(`chance-element-${index + 1}`).innerText = `${chance}%`;

    if (chance === 0) {
      chance = 1;
    }

    document.getElementById(`progress-bar-${index + 1}`).style.setProperty('--meter-value', chance);

    createAndAppendElement('dow', 'th', forecastDay.day.daypart_name);
    createAndAppendElement('perciptattion-chance', 'td', `Chance of Precipitation<br><strong>${forecastDay.day.pop}%</strong>`);
    createAndAppendElement('perciptattion', 'td', `Precipitation Type<br><strong>${forecastDay.day.precip_type}</strong>`);
    createAndAppendElement('wind', 'td', `Wind<br><strong>${forecastDay.day.metric.wspd} km/h</strong>`);
    createAndAppendElement('temp', 'td', `Temp<br><strong>${forecastDay.metric.max_temp}°C</strong>`);
    createAndAppendElement('visibility', 'td', `Cloud Cover<br><strong>${forecastDay.day.clds}%</strong>`);
    createAndAppendElement('uv-index', 'td', `UV Index<br><strong>${forecastDay.day.uv_index}</strong>`);
  });
}

// Helper function to create and append elements
function createAndAppendElement(parentId, tag, content) {
  const parent = document.getElementById(parentId);
  const newElement = document.createElement(tag);
  newElement.innerHTML = content;
  parent.appendChild(newElement);
}

// Example variable
var total_sessions = 0;

// Example function to switch sessions
const locations = {
  1: { city: 'Ottawa', latitude: 45.42381580972502, longitude: -75.70084317193432 },
  2: { city: 'Montreal', latitude: 45.57033839445598, longitude: -73.75116670328264 },
  3: { city: 'Toronto', latitude: 43.642636047265256, longitude: -79.38704607385121 },
  4: { city: 'New York', latitude: 40.74861108501115, longitude: -73.98541765439792 },
  5: { city: 'Boston', latitude: 42.37492421787936, longitude: -71.11827026040476 },
  6: { city: 'San Francisco', latitude: 37.82290114151289, longitude: -122.47474701281506 },
  7: { city: 'Los Angeles', latitude: 34.15992747939338, longitude: -118.32526286103236 },
};
function clearElements(parentId) { 
  const parent = document.getElementById(parentId); 
  while (parent.firstChild) {
     parent.removeChild(parent.firstChild); 
  }
}
async function switchSession() {
  clearElements('dow'); 
  clearElements('perciptattion-chance'); 
  clearElements('perciptattion'); clearElements('wind'); 
  clearElements('temp'); 
  clearElements('visibility'); 
  clearElements('uv-index');
  const selectedValue = document.getElementById('sessions').value;
  if (selectedValue === '0') {
    // Use browser's location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const url = `https://api.weather.com/v1/geocode/${latitude}/${longitude}/aggregate.json?apiKey=e45ff1b7c7bda231216c7ab7c33509b8&products=conditionsshort,fcstdaily10short,fcsthourly24short,nowlinks`;
        console.log("Fetching location done")
        fetchWeather(url);
      },
      (error) => {
        var x = document.getElementById("snackbar");
        document.getElementById("snackbar").innerText = `Error: Using Ottawa as default location`;
        x.className = "show";
        setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
        const url = `https://api.weather.com/v1/geocode/45.42381580972502/-75.70084317193432/aggregate.json?apiKey=e45ff1b7c7bda231216c7ab7c33509b8&products=conditionsshort,fcstdaily10short,fcsthourly24short,nowlinks`;
        console.log("Fetching location error")
        fetchWeather(url);
      }, {enableHighAccuracy: true, timeout: 5000}
    );
  } else {
    const location = locations[selectedValue];
    const url = `https://api.weather.com/v1/geocode/${location.latitude}/${location.longitude}/aggregate.json?apiKey=e45ff1b7c7bda231216c7ab7c33509b8&products=conditionsshort,fcstdaily10short,fcsthourly24short,nowlinks`;
    fetchWeather(url);
  }
}

function checkEnter(event) {
  if (event.key === 'Enter' && document.querySelector('.textbox').value.trim() !== '') {
    switchSession()
  }
  if (document.querySelector('.textbox').value.trim() == '') {
      document.getElementById('chat-button').style.display = 'none';
  } else {
      document.getElementById('chat-button').style.display = 'flex';
  }
  const textbox = document.querySelector('.textbox');

  textbox.addEventListener('input', () => {
      if (textbox.value.trim() === '') {
          document.getElementById('chat-button').style.display = 'none';
      } else {
          document.getElementById('chat-button').style.display = 'flex';
      }
  });
}

function enter() { 
  switchSession()
}

function clearInput() { 
  document.getElementById('integerInput').value = ''; 
  document.getElementById('chat-button').style.display = 'none';
}

function myFunction() {
  var element = document.body;
  element.classList.toggle("dark-modes");
  // document.body.classList.toggle("dark-modes");
}

fetchWeatherData();
