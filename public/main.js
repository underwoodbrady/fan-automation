let socket = io();

const header = document.getElementById("outsideData"),
    header2 = document.getElementById("insideData"),
    header3 = document.getElementById("threshold"),
    header4 = document.getElementById("fans"),
    log = document.getElementById("log"),
    time = document.getElementById("time"),
    fansInfo = document.getElementById("fansInfo"),
    fansOnOff = document.getElementById("fansOnOff"),
    updatesInfo = document.getElementById("updatesInfo");

/*Buttons and Inputs*/

const turnOffTemp = document.getElementById('turnOffTemp'),
    setTurnOffTemp = document.getElementById('setTurnOffTemp'),
    turnFansOff = document.getElementById('turnFansOff'),
    turnFansOn = document.getElementById('turnFansOn'),
    stopUpdates = document.getElementById('stopUpdates'),
    startUpdates = document.getElementById('startUpdates');

let setTemp, setFans, setUpdates;

socket.on("updateClient", function (data) {

    header.innerHTML = "<p><span class='bold'>Outside Temp: </span>" + Math.round(data.outTemp) + "</p>";

    header2.innerHTML = "<p><span class='bold'>Inside Temp: </span>" + data.inTemp + "</p>";

    header3.innerHTML = "<p><span class='bold'>Low Temp Threshold: </span>" + data.turnOffTemp + "</p>";

    header4.innerHTML = "<p><span class='bold'>Fans on? </span>" + data.fans + "</p>";

    if (data.fans) {

        header4.innerHTML = "<p><span class='bold'>Fans on? </span>Yes</p>";

        turnFansOn.className = "style-button green";

        turnFansOff.className = "style-button"

    } else {

        header4.innerHTML = "<p><span class='bold'>Fans on? </span>No</p>";

        turnFansOn.className = "style-button";

        turnFansOff.className = "style-button red"
    }

    if (data.autoUp) {

        startUpdates.className = "style-button green";

        stopUpdates.className = "style-button";

    } else {

        startUpdates.className = "style-button";

        stopUpdates.className = "style-button red";

    }

    log.innerHTML = data.log;

    time.innerHTML = data.time;

});

setTurnOffTemp.onclick = function () {

    setTemp = turnOffTemp.value;

    socket.emit('manualUpdateTemp', {
        settemp: setTemp
    });

    header3.innerHTML = "<p><span class='bold'>Low Temp Threshold: </span>" + setTemp + "</p>";

}

turnFansOff.onclick = function () {

    setFans = false;

    socket.emit('manualUpdateFans', {
        setfans: setFans
    });

    header4.innerHTML = "<p><span class='bold'>Fans on? </span>No</p>";

    turnFansOn.className = "style-button";

    turnFansOff.className = "style-button red";

}

turnFansOn.onclick = function () {

    setFans = true;

    socket.emit('manualUpdateFans', {
        setfans: setFans
    });

    header4.innerHTML = "<p><span class='bold'>Fans on? </span>Yes</p>";

    turnFansOn.className = "style-button green";

    turnFansOff.className = "style-button";
}

stopUpdates.onclick = function () {

    setUpdates = false;

    socket.emit('manualUpdateUpdates', {
        setupdates: setUpdates
    });

    startUpdates.className = "style-button";

    stopUpdates.className = "style-button red";

}

startUpdates.onclick = function () {

    setUpdates = true;

    socket.emit('manualUpdateUpdates', {
        setupdates: setUpdates
    });

    startUpdates.className = "style-button green";

    stopUpdates.className = "style-button";

}
