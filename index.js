// import * as http from 'http';



// module included to create worker threads
const { Worker } = require('worker_threads');
const axios = require('axios');
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')

const db = require("./app/models");
const e = require('express');
const { syncBuiltinESMExports } = require('module');
db.sequelize.sync();

var myApp = require('express')();
myApp.use(bodyParser.json())
var http = require('http').Server(myApp);
var socketIO = require('socket.io')(http);

myApp.post('/login', async function (request, response) {
    const USERNAME = request.body.username;
    const PASSWORD = request.body.password;

    const user = await db.user.findOne({
        where: {
            username: USERNAME,
        },
    });
    if(user){
        console.log('found')
        console.log(user.password)
        bcrypt.compare(PASSWORD, user.password).then(function(result) {
            if(result){
                response.json({ success: true });
            }else{
                response.json({ success: false, message: 'ข้อมูลไม่ถูกต้องกรุณาลองใหม่อีกครั้ง' });
            }
        });
    }else{
        const puppeteer = require("puppeteer");
    // require("dotenv").config();
        (async (USERNAME, PASSWORD) => {

            const browser = await puppeteer.launch({ headless: true, devtools: false });
            const page = await browser.newPage();
            await page.goto("https://truthbet.com/login?redirect=/m", { waitUntil: "networkidle2" });

            await page.evaluate((USERNAME, PASSWORD) => {
                document.querySelector('[name="username"]').value = USERNAME;
                document.querySelector('[name="password"]').value = PASSWORD;
                document.querySelector('[name="remember_username"]').checked = true;
            }, USERNAME, PASSWORD);

            // login
            await page.evaluate(() => {
                document.querySelector("form").submit();
            });


            try {
                await page.waitForSelector('.fa-coins', { visible: false, timeout: 5000 })
                let data = await page.evaluate(() => window.App);

                if(data.jwtToken != ''){
                    bcrypt.hash(PASSWORD, 12, function(err, hash) {
                        console.log(hash)
                        // db.user.create({username: USERNAME, password: hash})
                        response.json({ success: true });
                    });
                    
                }else{
                    response.json({ success: false, message: 'ข้อมูลไม่ถูกต้องกรุณาลองใหม่อีกครั้ง' });
                }
            }
            catch (e) {
                response.json({ success: false, message: 'ข้อมูลไม่ถูกต้องกรุณาลองใหม่อีกครั้ง' });
            }



            
            //   response.json(data);
            
            
            // access baccarat room 2
            // await page.goto("https://truthbet.com/g/live/baccarat/22", {
            //   waitUntil: "networkidle2",
            // });
            // await browser.close();
        })(USERNAME, PASSWORD);
    }

    
    // return w;

});

myApp.post('/login', async function (request, response) {

});

http.listen(3000, function () {
    console.log('listening *.3000');
});

// main attributes
let lst;    // list will be populated from 0 to n
let index = -1; // index will be used to traverse list
let myWorker; // worker reference
let interval;
let tables = [];
let workerDict = {};
let isPlay = false;
let playTable;
let currentList = [];

// mainBody();

function compare(a, b) {
    // console.log(compare)
    if (a.winner_percent < b.winner_percent) {
        return 1;
    }

    if (a.winner_percent >= b.winner_percent) {
        return -1;
    }

    return 0;
}

function mainBody() {
    var token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjp7InVpZCI6NDI4MjE5fSwiaWF0IjoxNTk1ODE2Njc0fQ.xGTblTjSj_5Aej9De_lOqPLkL_-9k7qbQGNxdix9d9c'
    console.log("Main Thread Started");


    axios.get('https://truthbet.com/api/m/games',
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        .then(response => {
            // console.log(response.data);
            tables = response.data.tables
            for (let table of tables) {
                if (table.game.id == 1) {
                    lst = Array(1e2).fill().map((v, i) => i);

                    // initiating worker process


                    // traversing list in main method with specific interval

                    initiateWorker(table);
                }
            }
            playCasino()
        })
        .catch(error => {
            console.log(error);
        });


    interval = setInterval(function () { playCasino(); }, 12000);

    // filling array with 100 items

}

function playCasino() {
    console.log(`play ${currentList.length} ${Object.keys(workerDict).length}`)
    if (isPlay == true) return;
    if (isPlay == false && currentList.length == 0) {
        Object.keys(workerDict).forEach(function (key) {
            var val = workerDict[key];
            // console.log(key, val)
            val.worker.postMessage({ 'action': 'getCurrent' })
        });
        return
    }

    if (isPlay == false && currentList.length != Object.keys(workerDict).length) return;


    currentList.sort(compare)
    let found = true
    for (current of currentList) {
        console.log(`table: ${current.table_id} percent: ${current.winner_percent} remaining: ${current.current.remaining} bot: ${current.bot}`)
        console.log(current.winner_percent != 0, current.current.remaining >= 10, current.bot != null)
        if (current.winner_percent != 0 && current.current.remaining >= 10 && current.bot != null) {

            isPlay = true
            workerDict[current.table_id].worker.postMessage({ action: 'play' })
            break;
        }
    }
    if (isPlay == false) {
        currentList = []
    }



}

// index and value of list will be consoled
function processDataInMainThread() {
    // update index
    index++;
    // // check first length
    // if (lst.length > index) {
    //     console.log("Message from Main Thread at Index: ", index, " and value is: ", lst[index]);
    // }
    // // no further calling if all items are traversed
    // else {
    //     clearInterval(interval);
    // }
}

// Defining callback method for receiving data or error on worker thread
function initiateWorker(table) {

    // define callback
    let cb = (err, result) => {
        if (err) { return console.error(err); }
        if (result.action == 'getCurrent') {
            // console.log(result)
            currentList.push(result)
        } if (result.action == 'played') {
            isPlay = false
            currentList = []
        }
        // // if worker thread is still working on list then write index and updated value
        // if (result.isInProgress) {
        //     console.log("Message from worker at Index: ", result.index, " and updated value: ", result.val);
        // }
        // // when worker thread complete process then console original list from main and updated list from worker thread
        // else {
        //     console.log("Original List Data: ", lst);
        //     console.log("Updated List From worker: ", result.val);
        // }
    };

    // start worker
    myWorker = startWorker(table, __dirname + '/workerCode.js', cb);

    workerDict[table.id] = { worker: myWorker }
    // post a multiple factor to worker thread
    // myWorker.postMessage({ multipleFactor: table });
}

function startWorker(table, path, cb) {
    // sending path and data to worker thread constructor
    let w = new Worker(path, { workerData: table });

    // registering events in main thread to perform actions after receiving data/error/exit events
    w.on('message', (msg) => {
        // data will be passed into callback
        cb(null, msg);
    });

    // for error handling
    w.on('error', cb);

    // for exit
    w.on('exit', (code) => {
        if (code !== 0) {
            console.error(new Error(`Worker stopped Code ${code}`))
        }
    });
    return w;
}

// for generating a random number between min and max
function getRandomArbitrary(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}