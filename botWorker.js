require('log-timestamp');
const { parentPort, workerData } = require('worker_threads');
const axios = require('axios');
const { bot } = require('./app/models');
const { POINT_CONVERSION_COMPRESSED } = require('constants');
const e = require('express');

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
    if (botObj.money_system == 3) {
        if(playData.length == 1){
            return playData[0] * (botObj.init_bet / 2)
        }
        return (playData[0] + playData[playData.length - 1]) * (botObj.init_bet / 2)
    }
    if (botObj.money_system == 4) {
        if(playData.length == 1){
            return playData[0] * botObj.init_bet
        }

        return (playData[0] + playData[playData.length - 1]) * botObj.init_bet
    }
}

function bet(data) {
    if (status == 2) {
        console.log(`bot ${workerData.obj.id} pause`)
    } else if (status == 3) {
        console.log(`bot ${workerData.obj.id} stop`)
    } else if(botObj.bet_side == 2 && data.bot == 'BANKER'){

    } else if(botObj.bet_side == 3 && data.bot == 'PLAYER'){

    }
    else {
        let betVal = getBetVal()
        if (betVal < botObj.init_bet) {
            betVal = botObj.init_bet
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
                current = { bot: data.bot, shoe: data.shoe, round: data.round, table_id: data.table.id, betVal: betVal, playTurn: playTurn, botObj: botObj }
                parentPort.postMessage({ action: 'bet_success', data: { ...data, betVal: betVal, current: current } })
            })
            .catch(error => {
                console.log(`bot ${workerData.id} bet: ${error}`);
                parentPort.postMessage({ action: 'bet_failed' })
            });
    }

}

function processResultBet(status, botTransactionId, botTransaction) {
    if (botObj.money_system == 1) { }
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
            console.log(playData)
            if(playData.length == 0){
                isStop = true
            }
            parentPort.postMessage({
                action: 'process_result',
                status: status,
                wallet: res.data,
                betVal: current.betVal,
                botObj: botObj,
                playData: playData,
                botTransactionId: botTransactionId,
                botTransaction: botTransaction,
                isStop: isStop
            })
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
                processResultBet(result.status, result.botTransactionId, result.botTransaction)
            }
        }
        if (result.action == 'pause') {
            status = 2
        }
        if (result.action == 'start') {
            status = 1
        }
        if (result.action == 'stop') {
            console.log('action stop')
            isStop = true
            status = 3
            process.exit(0)
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