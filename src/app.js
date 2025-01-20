import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import axios from "axios";
import pg from "pg";

dotenv.config();

const db = new pg.Client({
    connectionString: process.env.DATABASE_URL, 
    ssl: {
        rejectUnauthorized: false 
    }
});


db.connect();

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", "views");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

let countries = [];
let defaultCity = "Amman";

app.get("/", async (req, res) => {
    try {
        const city = req.query.city || defaultCity;
        const weatherApiKey = process.env.WEATHER_API_KEY;
        const weatherURL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weatherApiKey}&units=metric`;

        const timeApiKey = process.env.TIME_API_KEY;
        const zone = "Asia/Amman"; // Example timezone, dynamically fetch based on the city
        const timeURL = `http://api.timezonedb.com/v2.1/get-time-zone?key=${timeApiKey}&format=json&by=zone&zone=${zone}`;

        const countriesQuery = await db.query("SELECT * FROM capital_timezones");
        countries = countriesQuery.rows;

        // Fetch 
        const weatherResponse = await axios.get(weatherURL);
        const timeResponse = await axios.get(timeURL);

        // Extract 
        const weatherData = weatherResponse.data;
        const timeData = timeResponse.data;

        const mainWeather = weatherData.weather[0].main; // 'Clouds', 'Clear', etc.
        const backgroundImage = GetMainWeatherImage(mainWeather);
        const weatherIcon = GetSubWeatherImage(mainWeather);

        const weatherDetails = {
            temp: weatherData.main.temp,
            feelsLike: weatherData.main.feels_like,
            humidity: weatherData.main.humidity,
            pressure: weatherData.main.pressure,
            visibility: weatherData.visibility / 1000, // Convert to km
            windSpeed: weatherData.wind.speed,
            description: weatherData.weather[0].description,
            city: weatherData.name,
            country: weatherData.sys.country,
        };

        const timeDetails = {
            formattedTime: timeData.formatted || "N/A",
        };

        const currentYear = GetYear();

        res.render("index", {
            weatherDetails,
            timeDetails,
            countries,
            currentYear,
            backgroundImage,
            weatherIcon,
        });
    } catch (error) {
        console.error(error);
        res.render("error", { message: "Unable to fetch weather or time data" });
    }
});

app.post("/search", async (req, res) => {
    try {
        const city = req.body.city.trim(); // Get city 
        if (!city) {
            return res.render("error", { message: "City name cannot be empty" });
        }

        const dbResult = await db.query("SELECT timezone FROM capital_timezones WHERE city = $1", [city]);

        if (dbResult.rowCount === 0) {
            return res.render("error", { message: "City not found in the database" });
        }
        
        let timezone = dbResult.rows[0].timezone;
        

        const parts = timezone.split("/");
        if (parts.length === 2) {
            timezone = `${parts[1]}/${parts[0]}`; // Swap 
        }
        

        // Fetch 
        const weatherApiKey = process.env.WEATHER_API_KEY;
        const timeApiKey = process.env.TIME_API_KEY;

        const weatherURL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weatherApiKey}&units=metric`;
        const timeURL = `http://api.timezonedb.com/v2.1/get-time-zone?key=${timeApiKey}&format=json&by=zone&zone=${timezone}`;

        const weatherResponse = await axios.get(weatherURL);
        const timeResponse = await axios.get(timeURL);

        const weatherData = weatherResponse.data;
        const timeData = timeResponse.data;

        //Extract
        const mainWeather = weatherData.weather[0].main; 
        const backgroundImage = GetMainWeatherImage(mainWeather);
        const weatherIcon = GetSubWeatherImage(mainWeather);

        const weatherDetails = {
            temp: weatherData.main.temp,
            feelsLike: weatherData.main.feels_like,
            humidity: weatherData.main.humidity,
            pressure: weatherData.main.pressure,
            visibility: weatherData.visibility / 1000, 
            windSpeed: weatherData.wind.speed,
            description: weatherData.weather[0].description,
            city: weatherData.name,
            country: weatherData.sys.country,
        };

        const timeDetails = {
            formattedTime: timeData.formatted || "N/A",
        };

        const currentYear = GetYear();

  
        res.render("index", {
            weatherDetails,
            timeDetails,
            countries,
            currentYear,
            backgroundImage,
            weatherIcon,
        });
    } catch (error) {
        console.error(error);
        res.render("error", { message: "Error fetching data. Please try again." });
    }
});


app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});


function GetYear() {
    return new Date().getFullYear();
}

function GetMainWeatherImage(mainWeather) {
    switch (mainWeather) {
        case "Clouds":
            return "./images/cloudy.jpg";
        case "Clear":
            return "./images/sunny.jpg";
        case "Rain":
            return "./images/rainy.jpg";
        case "Haze": 
        return "./images/haze.jpg"
        default:
            return "./images/snowy.jpg";
    }


}
function GetSubWeatherImage(mainWeather) {
    switch (mainWeather) {
        case "Clouds":
            return "./images/overcast.png";
        case "Clear":
            return "./images/sun.png";
        case "Rain":
            return "./images/rainy.png";
        case "Haze": 
        return "./images/haze.png"
        default:
            return "./images/snowy.png";
    }
}