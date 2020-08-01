require('log-timestamp');
const { parentPort, workerData } = require('worker_threads');
const axios = require('axios');
const { bot } = require('./app/models');

let interval;
let systemData;
let current = {}
let playData;
let botObj;
let token = null
let playTurn = 1
let status = 1
var isStop = false;
registerForEventListening();

function getBetVal() {
    if (botObj.money_system == 1) {
        return botObj.init_bet
    }
    if (botObj.money_system == 2) {
        return playData[playTurn - 1]
    }
    if (botObj.money_system == 3 || botObj.money_system == 4) {
        return (playData[0] + playData[playData.length - 1]) * 25
    }
}

function bet(data) {
    if (status == 2) {
        console.log(`bot ${workerData.obj.id} pause`)
        return
    }
    let betVal = getBetVal()
    if (betVal < 50) {
        betVal = 50
    }
    let payload = { table_id: data.table.id, game_id: data.game_id }
    if (data.bot == 'PLAYER') {
        payload.chip = { credit: { PLAYER: betVal } }
    } else if (data.bot == 'BANKER') {
        payload.chip = { credit: { BANKER: betVal } }
    } else {
        return
    }

    axios.post(`https://truthbet.com/api/bet/baccarat`, payload,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                'content-type': 'application/json'
            }
        })
        .then(response => {
            // console.log(response.data);
            current = { shoe: data.shoe, round: data.round, table_id: data.table.id, betVal: betVal, playTurn: playTurn }
            parentPort.postMessage({ action: 'bet_success', data: { ...data, betVal: betVal } })
        })
        .catch(error => {
            console.log(`bot ${workerData.id} bet: ${error}`);
            parentPort.postMessage({ action: 'bet_failed' })
        });
}

function processResultBet(status, botTransactionId) {
    if (botObj.money_system == 1){}
    if (botObj.money_system == 2) {
        if (status == 'WIN') {
            playTurn = 1
        } else if (status == 'LOSE') {
            playTurn++
            if (playTurn > 5) {
                playTurn = 1
            }
        }
    }
    if (botObj.money_system == 3 || botObj.money_system == 4) {
        if (status == 'WIN') {
            playData = playData.splice(1, playData.length - 2)
        } else if (status == 'LOSE') {
            playData.push(playData[0] + playData[playData.length - 1])
        }
    }

    axios.get(`https://truthbet.com/api/wallet`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
        .then(res => {
            parentPort.postMessage({action: 'process_result', 
                                    status: status, 
                                    wallet: res.data, 
                                    betVal: current.betVal, 
                                    botObj: botObj,
                                    playData: playData,
                                    botTransactionId: botTransactionId,
                                    isStop: isStop})
        })
        .catch(error => {
            console.log(error)
        })
}

function registerForEventListening() {
    playData = workerData.playData
    botObj = workerData.obj
    token = workerData.obj.token
    console.log(`${workerData.obj.id} hello`)
    // callback method is defined to receive data from main thread
    let cb = (err, result) => {
        if (err) return console.error(err);
        if (result.action == 'bet') {
            bet(result.data)
        }
        if (result.action == 'result_bet') {
            if (result.table_id == current.table_id && result.round == current.round && result.shoe == current.shoe) {
                processResultBet(result.status, result.botTransactionId)
            }
        }
        if (result.action == 'pause') {
            status = 2
        }
        if (result.action == 'start') {
            status = 1
        }
        if (result.action == 'stop') {
            isStop = true
        }
        // console.log("Thread id ")
        // //  setting up interval to call method to multiple with factor
        // interval = setInterval(predictPlay, 5000);
    };

    // registering to events to receive messages from the main thread
    parentPort.on('error', cb);
    parentPort.on('message', (msg) => {
        cb(null, msg);
    });
}
// function predictPlay()
// {
//     console.log(`${workerData} is working`)
// }