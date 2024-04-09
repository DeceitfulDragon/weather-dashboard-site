const apiKey = '096ee6295490adc49a581c30734de79c';

$(document).ready(function() {
    loadHistory();

    // Load the weather from the last searched city if it's there
    const lastSearchedCity = localStorage.getItem('lastSearchedCity');
    if (lastSearchedCity) {
        fetchCoordinates(lastSearchedCity);
    }

    // Search button event listener
    $('#search-btn').on('click', function() {

        const cityName = $('#search-input').val().trim();

        if (cityName) {
            addCityToHistory(cityName);
            fetchCoordinates(cityName);
            $('#search-input').val('');
        } else {
            alert('Please enter a city name.');
        }
    });

    // Save history to local storage
    function saveCityToLocalStorage(cityName) {
        let cities = JSON.parse(localStorage.getItem('searchHistory')) || [];

        if (!cities.includes(cityName)) {
            cities.push(cityName);
            localStorage.setItem('searchHistory', JSON.stringify(cities));
        }
    }

    // get local storage, add each city back to the history list
    function loadHistory() {
        const cities = JSON.parse(localStorage.getItem('searchHistory')) || [];
        $('#history-list').empty();

        cities.forEach(function(cityName) {
            addCityToHistory(cityName, false);
        });
    }
    
    // Add a city to the history
    function addCityToHistory(cityName, updateLocalStorage = true) {
        if ($("#history-list").find(`li[data-city='${cityName}']`).length === 0) {
            const listItem = $(`<li data-city='${cityName}' class='list-group-item d-flex justify-content-between align-items-center'>`).text(cityName);
            const removeBtn = $("<span class='badge bg-danger'>X</span>");
            
            removeBtn.on('click', function(event) {
                event.stopPropagation(); // Should stop the click functionality
                $(this).parent().remove();
                removeFromLocalStorage(cityName)
            });
            
            listItem.append(removeBtn);
            listItem.on('click', function() {
                fetchCoordinates(cityName);
            });
            $('#history-list').append(listItem);
        }
    
        if(updateLocalStorage) {
            saveCityToLocalStorage(cityName);
        }
    }
    
    function removeFromLocalStorage(cityName) {
        let cities = JSON.parse(localStorage.getItem('searchHistory')) || [];
        const filteredCities = cities.filter(city => city !== cityName);
        localStorage.setItem('searchHistory', JSON.stringify(filteredCities));
    }

    // Fetch coordinates for the city
    function fetchCoordinates(cityName) {
        const geoURL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${apiKey}&units=imperial`;

        fetch(geoURL)
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    const { lat, lon } = data[0];
                    fetchWeather(lat, lon, cityName);
                } else {
                    alert('City not found. Try again.');
                }
            })
        .catch(error => console.error('Error during coordinates, ', error));
    }

    // Fetch weather using coordinates
    function fetchWeather(lat, lon, cityName) {
        const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;
    
        fetch(weatherUrl)
            .then(response => response.json())
            .then(data => {
                displayCurrentWeather(data, cityName);
                displayForecast(data);
                addCityToHistory(cityName);
                localStorage.setItem('lastSearchedCity', cityName);
            })
            .catch(error => console.error('Error during fetch, ', error));
    }

    function displayCurrentWeather(data, cityName) {
        const currentWeather = data.list[0];
        const weatherEmoji = getWeatherEmoji(currentWeather.weather[0].main);
        // Get date and day
        const currentDate = new Date(currentWeather.dt * 1000);
        const dateString = currentDate.toLocaleDateString();
        const dayString = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
    
        // Setup for current weather
        $('#current-weather-content').html(`
            <h3>${cityName} ${weatherEmoji}</h3>
            <h4>(${dayString}, ${dateString})</h4>
            <p><strong>Temp:</strong> ${currentWeather.main.temp} °F</p>
            <p><strong>Wind:</strong> ${currentWeather.wind.speed} mph</p>
            <p><strong>Humidity:</strong> ${currentWeather.main.humidity}%</p>
        `);
    }

    // 5 day forecast
    function displayForecast(data) {
        $('#forecast-row').empty();
    
        // Loop for each day
        for (let i = 0; i < data.list.length; i += 8) {

            const forecast = data.list[i];

            // Get the date and day of the week
            const date = new Date(forecast.dt * 1000);
            const dateString = date.toLocaleDateString();
            const dayString = date.toLocaleDateString('en-US', { weekday: 'long' });

            const weatherEmoji = getWeatherEmoji(forecast.weather[0].main);
            
            // Setup for cards
            $('#forecast-row').append(`
                <div class="col">
                    <div class="forecast-card card">
                        <h5>${dayString}</h5>
                        <p>${dateString}<p
                        <p>Temp: <strong>${forecast.main.temp} °F</strong></p>
                        <p>Wind: <strong>${forecast.wind.speed} mph</strong></p>
                        <p>Humidity: <strong>${forecast.main.humidity}%</strong></p>
                        <h5>${weatherEmoji}</h5>
                    </div>
                </div>
            `);
        }
    }

    // Weather to emojis
    function getWeatherEmoji(weatherDescription) {
        const weatherConditions = {
            Clear: '☀️',
            Clouds: '☁️',
            Rain: '🌧️',
            Snow: '❄️',
            Mist: '🌫️',
            Fog: '🌫️',
        };

        return weatherConditions[weatherDescription] || '🌈';
    }

});
