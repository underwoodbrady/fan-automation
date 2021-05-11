let express = require('express'),
    app = express(),
    serv = require('http').Server(app),
    path = require('path');

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client/index.html');
});

app.use('/client', express.static(__dirname + '/client'));

app.use(express.static(path.join(__dirname, 'public')));

let port = process.env.PORT;

if (port == null || port == "") {
    port = 2020;
}
serv.listen(port);

let io = require('socket.io')(serv, {});

/*
npm install node, express, socket.io, tplink-smarthome-api, axios, node-dht-sensor (once on pi***)
*/

let insideTemp = 65;

/* Gets the sensor (Can only run on PI***)

const sensor = require("node-dht-sensor");

sensor.read(22, 23, function (err, temperature, humidity) {
    if (!err) {
        insideTemp = (temperature * 9 / 5) + 32; //Converts from c to f
    } else {
        console.log(err);
    }
});

*/

let outsideTemp = null;

const axios = require('axios');

axios.get('http://api.openweathermap.org/data/2.5/weather?id=5802340&units=imperial&appid=80e9f3ae5074805d4788ec25275ff8a0&units=imperial').then((res) => {
    outsideTemp = (res.data.main.temp);
})

/* Gets the Plugs */

const {
    Client
} = require('tplink-smarthome-api');

const client = new Client();

const plug = client.getDevice({
    host: '192.168.50.8'
});

const plug2 = client.getDevice({
    host: '192.168.50.28'
});

const updateFans = function (state) {
    plug.then((device) => {
        device.setPowerState(state);
    });

    plug2.then((device) => {
        device.setPowerState(state);
    });
}

/*Initial Variables*/

let fansOn = false;

let turnOffTemp = 60;

let autoUpdates = true;

let log = []; //Keeps log from last 144 changes

let date = new Date();

let time = date.toLocaleTimeString();

let CLIENT_LIST = [];

io.sockets.on('connection', function (socket) {

    socket.id = CLIENT_LIST.length + 1;

    CLIENT_LIST.push(socket);

    //if data is previously available send update to new client upon connection
    if (outsideTemp != null && outsideTemp != undefined && insideTemp != null && insideTemp != undefined){
        socket.emit("updateClient", {
            outTemp: outsideTemp,
            inTemp: insideTemp,
            fans: fansOn,
            log: log,
            time: time,
            autoUp: autoUpdates,
            turnOffTemp: turnOffTemp
        });
    }

    socket.on("manualUpdateTemp", function (data) {

        turnOffTemp = data.settemp;

    });

    socket.on("manualUpdateFans", function (data) {

        updateFans(data.setfans);
        
        fansOn =  data.setfans;

    });

    socket.on("manualUpdateUpdates", function (data) {

        autoUpdates = data.setupdates;

    });

    socket.on('disconnect', function () {

        CLIENT_LIST.splice(socket, 1);

    });

});


setInterval(function () {

    if (autoUpdates) {
        /* Remove when on pi ***
                sensor.read(22, 23, function (err, temperature, humidity) { //Updates inside temperature reading
                    if (!err) {
                        insideTemp = (temperature * 9 / 5) + 32;
                    } else {
                        console.log(err);
                    }
                });
        */

        axios.get('http://api.openweathermap.org/data/2.5/weather?id=5802340&units=imperial&appid=80e9f3ae5074805d4788ec25275ff8a0&units=imperial').then((res) => {
            outsideTemp = (res.data.main.temp);
        })

        if (outsideTemp != null && outsideTemp != undefined && insideTemp != null && insideTemp != undefined)
            checkForUpdate();

    }

}, 600000); //once ever 10 minutes



const checkForUpdate = function () {

    date = new Date();

    time = date.toLocaleTimeString();
    
    if (insideTemp < turnOffTemp) {

        if (fansOn === true) {
            updateFans(false);
            log.push('<div id="logupdate">' + date.toLocaleTimeString() + ' | Fans turned off | insideTemp<' + turnOffTemp + ' | update sent | ' + outsideTemp + ' ' + insideTemp + '</div>');
        } else {
            log.push('<div id="logupdate">' + date.toLocaleTimeString() + ' | Fans kept off | insideTemp<' + turnOffTemp + ' | no update sent | ' + outsideTemp + ' ' + insideTemp + '</div>');
        }

        fansOn = false;

    } else {

        if (outsideTemp >= insideTemp) {

            if (fansOn === true) {
                updateFans(false);
                log.push('<div id="logupdate">' + date.toLocaleTimeString() + ' | Fans turned off | outsideTemp > inside | update sent | ' + outsideTemp + ' ' + insideTemp + '</div>');
            } else {
                log.push('<div id="logupdate">' + date.toLocaleTimeString() + ' | Fans kept off | outsideTemp > inside | no update sent | ' + outsideTemp + ' ' + insideTemp + '</div>');
            }

            fansOn = false;

        } else if (insideTemp > outsideTemp) {

            if (fansOn === true) {
                log.push('<div id="logupdate">' + date.toLocaleTimeString() + ' | Fans kept on | outsideTemp < inside | no update sent | ' + outsideTemp + ' ' + insideTemp + '</div>');
            } else {
                updateFans(true);
                log.push('<div id="logupdate">' + date.toLocaleTimeString() + ' | Fans turned on | outsideTemp < inside | update sent | ' + outsideTemp + ' ' + insideTemp + '</div>');
            }

            fansOn = true;

        }
    }

    if (log.length > 144) {

        log.splice(0, 1);

    }

    for (let i in CLIENT_LIST) { //Sends out update to everyone connected to server

        CLIENT_LIST[i].emit("updateClient", {
            outTemp: outsideTemp,
            inTemp: insideTemp,
            fans: fansOn,
            log: log,
            time: time,
            autoUp: autoUpdates,
            turnOffTemp: turnOffTemp
        });

    }
}
