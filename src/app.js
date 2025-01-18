import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import axios from "axios";
import pg from "pg";

const db = new pg.Client({
    user: "postgres", 
    host: "localhost",
    database:"countries_timezone",
    password: "2262003",
    port: 5432
});

db.connect();

dotenv.config();

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));

let countries = [];
let country = 'Amman';
app.get('/', async (req, res) => {
try{
    const city = req.query.city || country;
    const weatherApiKey = process.env.WEATHER_API_KEY;
    const weatherURL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weatherApiKey}&units=metric`;

    const timeApiKey = process.env.TIME_API_KEY; 
    const zone = "Asia/Amman"; 
    const timeURL = `http://api.timezonedb.com/v2.1/get-time-zone?key=${timeApiKey}&format=json&by=zone&zone=${zone}`;

    const result = await db.query("SELECT * FROM capital_timezones");
    countries = result.rows;

    const firstResponse = await axios.get(weatherURL);
    const secondResponse = await axios.get(timeURL);
    const weather = JSON.stringify(firstResponse.data,null, 2);
    const timeZone = JSON.stringify(secondResponse.data, null, 2);

    res.render('index', {
        weather: weather,
        timeZone: timeZone,
        countries: countries
    });
}
catch(error)
{
    res.render('error', {message: 'Unable to fetch weather data'});
}
});

app.listen(PORT, () => {
    console.log(`Server is linstening on localhost: ${PORT}`);
});


