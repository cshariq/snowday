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

function processWeatherData(data) {
  let snowDayChance = 0;
  let chance = 0;
  console.log("Processing data")
  clearElements('dow'); 
  clearElements('snow');
  clearElements('perciptattion-chance'); 
  clearElements('perciptattion'); clearElements('wind'); 
  clearElements('temp'); 
  clearElements('visibility'); 
  clearElements('uv-index');
  function calculateSnowDayChance(data) {
    function hoursUntil4AM() {
      const now = new Date();
      const target = new Date(now);
      target.setHours(4, 0, 0, 0); // Set target time to 4 AM
  
      // If the target time has already passed today, set it to 4 AM the next day
      if (now >= target) {
          target.setDate(target.getDate() + 1);
      }
  
      const diff = target - now; // Difference in milliseconds
      const hours = Math.round(diff / (1000 * 60 * 60)); // Convert milliseconds to hours
      return hours;
    }
    const timeLeft = hoursUntil4AM();
    chance = 0;
    const forecastDay = data.fcstdaily10short.forecasts[1];
    if (forecastDay.metric.snow_qpf !== 0) {
      chance += 15 * Math.min(forecastDay.metric.snow_qpf / 7.6, 1);
      console.log(forecastDay.metric.snow_qpf + "cm of snow added " + chance + " points")
      if (forecastDay.metric.max_temp <= 3) {
        chance += 5;
        console.log(forecastDay.metric.max_temp + "º, low temp added 5 points")
      } else {
        console.log(forecastDay.metric.max_temp + "º, high temp DID NOT add 5 points")
      }
  
      chance += 5 * Math.min(forecastDay.day.metric.wspd / 16, 1);
  
      if (forecastDay.day.precip_type === 'snow' || forecastDay.day.precip_type === 'freezing rain') {
        chance += 10;
        console.log("snow/freezing rain added 5 points")
      }  else {
        chance -= 10;
        console.log("snow/freezing rain removed 10 points")
      }
  
      const forecast = data.fcsthourly24short.forecasts[timeLeft];
      chance += 20 * Math.min(forecast.pop / 100, 1)
      console.log("pop at 4am added " + (20 * Math.min(forecast.pop / 100, 1)) +" points out of 20")
      chance += 20 * Math.min(forecast.metric.snow_qpf / 2, 1);
      console.log("snow at 4am added " + (15 * Math.min(forecast.metric.snow_qpf / 2.5, 1)) +" points out of 15")
      chance += 10 * Math.min(forecast.clds / 100, 1);
      console.log("clouds at 4am added " + (10 * Math.min(forecast.clds / 100, 1)) +" points out of 10")
      if (forecast.metric.temp <= 2) {
        chance += 5;
        console.log("low temp at 4am added 5 points")
      } else {
        console.log("high temp at 4am DID NOT add 5 points")
      }
  
      chance += 5 * Math.min(forecast.metric.wspd / 16, 1);
  
      if (forecast.precip_type === 'snow' || forecast.precip_type === 'freezing rain') {
        chance += 5;
      }  else {
        chance -= 15;
        console.log("no snow or freezing rain at 4am removed 15 points")
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
  snowDayChance = calculateSnowDayChance(data);
  document.getElementById('percentage-text').innerHTML = `<strong>${snowDayChance}%</strong>`;

  if (snowDayChance === 0) {
    snowDayChanceMod = 1;
  } else {
    snowDayChanceMod = snowDayChance;
  }

  document.getElementById('progress-bar').style.setProperty('--meter-value', snowDayChanceMod);

  const forecast = data.fcstdaily10short.forecasts;
  const days = ['day1', 'day2', 'day3', 'day4', 'day5'];

  days.forEach((day, index) => {
    if (!forecast[index]) {
      console.warn(`No data for ${day}`);
      return;
    }
    
    const forecastDay = forecast[index + 1];
    chance = 0;
    if (index == 0) {
      chance = snowDayChance;
    } else {
      if (forecastDay.day.pop >= 50) {
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
    }
    document.getElementById(`chance-element-${index + 1}`).innerText = `${chance}%`;

    if (chance === 0) {
      chance = 1;
    }

    document.getElementById(`progress-bar-${index + 1}`).style.setProperty('--meter-value', chance);
    createAndAppendElement('dow', 'th', forecastDay.day.daypart_name);
    createAndAppendElement('snow', 'td', `Snow Forecasted<br><strong>${forecastDay.day.metric.snow_qpf} cm</strong>`);
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
  clearElements('snow');
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
