import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(express.static('public'));

app.get('/', async (req, res) => {
try{
    const city = req.query.city || 'Amman';
    const apiKey = process.env.API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;


    const response = await axios.get(url);
    res.render('index', {weather: response.data});
}
catch(error)
{
    res.render('error', {message: 'Unable to fetch weather data'});
}
});

app.listen(PORT, () => {
    console.log(`Server is linstening on localhost: ${PORT}`);
});


