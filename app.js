//NPM Packages

const request = require("request-promise");
const moment = require('moment');
const pg = require('pg');

//Config File Load

const config = require('./config');

//Database Connection

const {Client} = pg;
const connectionString = 'postgres://' + config.databaseUserName + ':' + config.databasePassword + '@'
    + config.databaseHost + '/' + config.databaseName;
const client = new Client({connectionString: connectionString});
try {
    client.connect();
} catch (e) {
    console.log("ERROR : Cannot connect to database.")
}


// Initiator Function
async function init() {
    let insertQuery = '';
    const res = await client.query('SELECT * FROM location');


    for (let i = 0; i < res.rows.length; i++) {
        let a = res.rows[i].latitude;
        let b = res.rows[i].longitude;

        const apiUrl = 'https://api.darksky.net/forecast/' + config.darkSkyApiToken + '/' + a + ',' + b + '?units=si';

        //API Request with Request package
        const body = await request({url: apiUrl, method: 'GET', json: true});


        let location_name = res.rows[i].location_name;
        let temperature = body.currently.temperature;
        let windSpeed = body.currently.windSpeed;
        let humidity = body.currently.humidity;
        let uvIndex = body.currently.uvIndex;
        let date = moment.unix(body.currently.time).format(config.timeFormat);

        insertQuery += 'INSERT INTO forecast_data (location_name,temperature,wind_speed,humidity,uv_index,date)' +
            ' VALUES ( \'' + location_name + '\',' + temperature + ',' + windSpeed + ',' + humidity + ',' + uvIndex +
            ',\'' + date + '\');';

        setTimeout(function () {
            process.stdout.write(".");
        }, 1300);

        if (i === 0) {
            console.log("Getting weather data from API for " + res.rows.length + " location(s).")
        }
        if (i === res.rows.length - 1) {
            console.log("Inserting weather data to database...")
        }


    }
    try {
        await client.query(insertQuery);
        await console.log("Insertion finished.");
    } catch (e) {
        console.log("ERROR : Cannot insert to database.");
        console.log(e)
    }

    client.end();  //Terminate database connection
}


init();  //Initiate the program

//schedule.scheduleJob('00 * * * *', init);  //Execute the init function every hour