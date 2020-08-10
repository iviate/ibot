require('log-timestamp');
const { parentPort, workerData } = require('worker_threads');
const axios = require('axios');
const { bot } = require('./app/models');
const { POINT_CONVERSION_COMPRESSED } = require('constants');
const e = require('express');
const db = require('./app/models');

let interval;
let systemData;
let current = {}
let playData;
let botObj;
let token = null
let betFailed = false;
let playTurn = 1
let status = 2
var isStop = false;
registerForEventListening();

function restartOnlyProfit(){
    axios.get(`https://truthbet.com/api/wallet`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
        .then(res => {
            
            let wallet = res.data.chips.credit
            if(wallet <= botObj.init_wallet){
                playData = JSON.parse(botObj.data)
                parentPort.postMessage({action: 'restart_result', data: {success: true, data: {playData: playData}}, userId: botObj.userId})
            }else{
                let s = 1
                let profit = botObj.profit_threshold - wallet
                let turn = Math.ceil(profit / botObj.init_bet)
                let left = turn
                let ret = []
                let state = 1
                while (left > s) {
                    ret.push(s)
                    left -= s
                    state = 1
                    if (left < s) break;
                    ret.push(s)
                    left -= s
                    state = 2
                    if (left < s) break;
                    ret.push(s)
                    left -= s
                    state = 3
                    if (left < s) break;
                    s++
                }
                if (left > 0) {
                    ret.push(left)
                }

                if (ret.length > 21) {
                    let turn_left = 0
                    while (ret.length > 21) {
                        if (state == 3) {
                            s++
                            state = 0
                        }
                        turn_left = ret.shift()
                        if (turn_left + ret[ret.length - 1] > s) {
                            let ses = turn_left + ret[ret.length - 1] - s
                            ret[ret.length - 1] = s
                            ret.push(ses)
                            state++
                        } else {
                            ret[ret.length - 1] += turn_left
                        }
                    }
                }

                playData = ret
                console.log(playData)
                parentPort.postMessage({action: 'restart_result', data: {success: true, data: {playData: playData}}, userId: botObj.userId})
            }

        })
        .catch(error => {
            console.log(error)
            parentPort.postMessage({action: 'restart_result', data: {success: false, message: error}, userId: botObj.userId})
        })
}

function restartAll(){
    let s = 1
    let turn = 0
    for(let i = 0; i < playData.length; i++){
        turn += playData[i]
    }
    // let turn = sum(playData)
    let left = turn
    let ret = []
    while (left > s) {
        ret.push(s)
        left -= s
        state = 1
        if (left < s) break;
        ret.push(s)
        left -= s
        state = 2
        if (left < s) break;
        ret.push(s)
        left -= s
        state = 3
        if (left < s) break;
        s++
    }
    if (left > 0) {
        ret.push(left)
    }

    if (ret.length > 21) {
        let turn_left = 0
        while (ret.length > 21) {
            if (state == 3) {
                s++
                state = 0
            }
            turn_left = ret.shift()
            if (turn_left + ret[ret.length - 1] > s) {
                let ses = turn_left + ret[ret.length - 1] - s
                ret[ret.length - 1] = s
                ret.push(ses)
                state++
            } else {
                ret[ret.length - 1] += turn_left
            }
        }
    }
    playData = ret
    console.log(playData)
    parentPort.postMessage({action: 'restart_result', data: {success: true, data: {playData: playData}}, userId: botObj.userId})
}


function restartXSystem(type){
    if(type == 1){
        restartOnlyProfit()
    }else if(type == 2){
        restartAll()
    }
}   

function getBetVal() {
    let betval = 0
    if (botObj.money_system == 1) {
        betval = botObj.init_bet
    }
    if (botObj.money_system == 2) {
        betval = playData[playTurn - 1]
    }
    if (botObj.money_system == 3) {
        if(playData.length == 1){
            
            betval = playData[0] * (botObj.init_bet / 2)
        }
        betval = (playData[0] + playData[playData.length - 1]) * (botObj.init_bet / 2)
    }
    if (botObj.money_system == 4) {
        if(playData.length == 1){
            betval = playData[0] * botObj.init_bet
        }
        betval = (playData[0] + playData[playData.length - 1]) * botObj.init_bet
    }

    let mod = ~~(betval % 10)
    // console.log(mod, betval)
    if(mod != 0 && mod != 5){
        if(mod < 5){
            betval = (Math.floor((betval / 10)) * 10) + 5 
        }else if(mod > 5){
            betval = Math.ceil(betval / 10) * 10
        }
    }

    return ~~betval
}

function bet(data) {
    // console.log(status, betFailed, botObj.bet_side, botObj.is_infinite)
    if(betFailed){
        return
    }

    if (status == 2) {
        console.log(`bot ${workerData.obj.userId} pause`)
    } else if (status == 3) {
        console.log(`bot ${workerData.obj.userId} stop`)
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
                parentPort.postMessage({ action: 'bet_success', data: { ...data, betVal: betVal, current: current, botObj: botObj } })
                betFailed = true
            })
            .catch(error => {
                if(error.response.data.code != 500){
                    betFailed = true
                }else{
                    betFailed = false
                }
                parentPort.postMessage({ action: 'bet_failed', botObj: botObj, error: error.response.data.error})
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
            if(playData.length == 1){
                playData.push(Math.ceil(playData[0] * 10) / 10)
            }else{
                playData.push(Math.ceil((playData[0] + playData[playData.length - 1]) * 10) / 10)
            }
            
                
        }
    }

    axios.get(`https://truthbet.com/api/users/owner`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
        .then(res => {
            console.log(playData)
            if(botObj.is_infinite == false && playData.length == 0){
                isStop = true
            }
            let currentWallet = res.data.chips.credit
            let cutProfit = botObj.init_wallet + Math.floor(((botObj.profit_threshold - botObj.init_wallet) *  94) / 100)
            console.log(currentWallet, cutProfit)
            if(botObj.is_infinite && currentWallet - botObj.profit_wallet >= cutProfit){
                db.bot.findOne({
                    where: {
                        id: botObj.id
                    }
                }).then((b) => {
                    let amount = currentWallet - botObj.profit_wallet - botObj.init_wallet
                    console.log(amount)
                    b.profit_wallet += amount
                    b.deposite_count += 1
                    b.save()
                    botObj.profit_wallet += b.profit_wallet
                    botObj.deposite_count += 1
                    playData = JSON.parse(botObj.data)
                    playTurn = 1
                    console.log(botObj.profit_wallet, b.profit_wallet)

                    db.wallet_transfer.create({botId: botObj.id, amount: amount}).then((created) => {
                        
                    })
                    
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
            }else{
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
            }
           
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
                betFailed = false
            }
        }
        if (result.action == 'pause') {
            botObj.status = 2
            status = 2
        }
        if (result.action == 'start') {
            botObj.status = 1
            status = 1
            betFailed = false
        }
        if (result.action == 'stop') {
            console.log('action stop')
            isStop = true
            status = 3
            botObj.status = 3
            process.exit(0)
        }
        if (result.action == 'restart'){
            if( botObj.money_system != 4){
                parentPort.postMessage({action: 'restart_result', data: {success: false, message: "บอทไม่ใด้เดินเงินแบบ X System"}, userId: botObj.userId})
            }
            else if( status != 2){
                parentPort.postMessage({action: 'restart_result', data: {success: false, message: "โปรดหยุดบอทก่อนรีสตาร์ท"}, userId: botObj.userId})
            }else{
                restartXSystem(result.type)
            }
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