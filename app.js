//NPM Packages

const http = require('http');
const request = require("request-promise");
var schedule = require('node-schedule');
var pg = require('pg');
const promise = require('promise');
const moment = require('moment');

//Config File Load

var config = require('./config');

//Database Connection

const {Pool, Client} = require('pg');
const connectionString = 'postgres://' + config.databaseUserName + ':' + config.databasePassword + '@'
    + config.databaseHost + '/' + config.databaseName;
const client = new Client({connectionString: connectionString});
client.connect();


async function init() {
    let insertQuery = '';
    const res = await client.query('SELECT * FROM location');

    for (let i = 0; i < res.rows.length; i++) {
        let a = res.rows[i].latitude;
        let b = res.rows[i].longitude;

        const apiUrl = 'https://api.darksky.net/forecast/' + config.darkSkyApiToken + '/' + a + ',' + b + '?units=si';

        const body = await request({url: apiUrl, method: 'GET'});
        const data = JSON.parse(body);

        let location_name = res.rows[i].location_name;
        let temperature = data.currently.temperature;
        let windSpeed = data.currently.windSpeed;
        let humidity = data.currently.humidity;
        let uvIndex = data.currently.uvIndex;
        let date = moment.unix(data.currently.time).format('YYYY-MM-DD HH:mm:ss');
        insertQuery += 'INSERT INTO forecast_data (location_name,temperature,wind_speed,humidity,uv_index,date) VALUES ( \'' + location_name + '\',' + temperature + ',' + windSpeed + ',' + humidity + ',' + uvIndex + ',\'' + date + '\');';
        console.log("Inserting to database: " + insertQuery)
    }

    const insertRes = await client.query(insertQuery);
    //client.end();  //Terminate database connection
    return res;
}

var interval = schedule.scheduleJob('*/1 * * * * *', init);
 // var interval = schedule.scheduleJob('00 * * * *', init);  //Execute the init function every 1 hour