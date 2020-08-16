// parentPort for registering to events from main thread
// workerData for receiving data clone
require('log-timestamp');
const { parentPort, workerData } = require('worker_threads');
const axios = require('axios');

// let interval;
// let index = -1;
// let tableObj;
// let tableStats = [];
let info = [];
let shoe;
let round;
// let stats;
let predictStats = { shoe: '', correct: 0, wrong: 0, tie: 0, info: {}, predict: [] };
// let predictStatsHistory = [];
let statsCount;
let bot = null;
let playRound = null;
let token = null
let isPlay = false;
var date = new Date();
// var resultStats = ''
// var threeCutPlay = {}
// var fourCutPlay = {}

var last_pull_timestamp = date.getTime();
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjp7InVpZCI6NDI4MjE5fSwiaWF0IjoxNTk1ODM2ODUzfQ.1YDXUwVIg7kIiYpxYlRPrn06jLtdQ6nG9dufe6MhIIM
registerForEventListening();

function getCurrent() {
    // console.log(current)
    let sum = predictStats.correct + predictStats.wrong + predictStats.tie
    let winner_percent = 0
    if (sum != 0) {
        winner_percent = ((predictStats.correct + predictStats.tie) / sum) * 100
    }

    if (bot != null && round != 0) {
        parentPort.postMessage({
            error: false,
            action: 'getCurrent',
            table_id: workerData.id,
            info: info,
            predictStats: predictStats,
            round: round,
            bot: bot,
            winner_percent: winner_percent,
            bot: bot,
            table_title: workerData.title
        })
    } else {
        parentPort.postMessage({
            table_id: workerData.id,
            table_title: workerData.title,
            action: 'getCurrent',
            error: true,
            winner_percent: 0,
            bot: null
        })
    }


}

function betting(betCurrent) {
    // console.log(betCurrent.round, round)
    // if (betCurrent.round == round && betCurrent.remaining > 5) {
    //     let payload = { table_id: workerData.id, game_id: betCurrent.id }
    //     if (bot == 'PLAYER') {
    //         payload.chip = { credit: { PLAYER: 50 } }
    //     } else if (bot == 'BANKER') {
    //         payload.chip = { credit: { BANKER: 50 } }
    //     } else {
    //         return
    //     }
    //     console.log('bet')
    //     axios.post(`https://truthbet.com/api/bet/baccarat`, payload,
    //         {
    //             headers: {
    //                 Authorization: `Bearer ${token}`,
    //                 'content-type': 'application/json'
    //             }
    //         })
    //         .then(response => {
    //             console.log(response.data);
    //         })
    //         .catch(error => {
    //             console.log(`${workerData.id} play bet error: ${error}`);
    //         });
    // }

}

function registerForEventListening() {
    token = workerData.token
    inititalInfo()
    // callback method is defined to receive data from main thread
    let cb = (err, result) => {
        if (err) return console.error(err);
        // console.log("Thread id ")

        if (result.action == 'getCurrent') {
            getCurrent()
        } else if (result.action == 'play') {
            console.log(`Thred id ${workerData.id} action ${result.action}`)
            isPlay = true
            playRound = round + 1
            // betting(result.current)
        }


        // //  setting up interval to call method to multiple with factor
        setInterval(predictPlay, 5000);
    };

    // registering to events to receive messages from the main thread
    parentPort.on('error', cb);
    parentPort.on('message', (msg) => {
        cb(null, msg);
    });
}

function inititalInfo() {
    axios.get(`https://truthbet.com/api/table/${workerData.id}?include=dealer,info`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        .then(response => {
            // console.log(response.data);
            let detail = response.data.info.detail
            if (shoe != detail.shoe) {
                shoe = detail.shoe
                round = detail.round
                // predictStatsHistory.push({ ...predictStats })
                predictStats = { shoe: shoe, correct: 0, wrong: 0, tie: 0, info: {}, predict: [] }
                
                if (predictStats.predict.length != detail.statistic.length) {
                    let i = 1
                    for (roundStat of detail.statistic) {
                        // console.log(roundStat)
                        predictStats.predict.push({ ...roundStat, round: i, bot: null, isResult: true })
                        i++
                        
                    }
                }

                if (detail.round > detail.statistic.length) {
                    predictStats.predict.push({ round: detail.round, bot: null, isResult: false })
                }
            }

        })
        .catch(error => {
            console.log(error);
        });
}


async function predictPlay() {
    
    let current = new Date().getTime()
    if(current - last_pull_timestamp < 4500){
        // console.log(`${workerData.title} not pull`)
        return
    }else{
        // console.log(`${workerData.title}`)
        last_pull_timestamp = current
    }
    axios.get(`https://truthbet.com/api/table/${workerData.id}?include=dealer,info`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        .then((response) => {
            // console.log(response.data);
            // console.log(`round = ${response.data.info.detail.round}`)
            info = response.data.info.detail
            botplay(response.data.info.detail)

        })
        .catch((error) => {
            console.log(`table error ${workerData.id} ${error}`);
        });
}

function botplay(currentInfo) {
    if (shoe != currentInfo.shoe) {
        shoe = currentInfo.shoe
        round = currentInfo.round
        // predictStatsHistory.push({ ...predictStats })
        predictStats = { shoe: shoe, correct: 0, wrong: 0, tie: 0, info: {}, predict: [] }
        return
    }
    round = currentInfo.round
    let botChoice = ["BANKER", "PLAYER"]
    let statsCount = currentInfo.statistic.length
    let playCount = predictStats.predict.length
    let currentRound = currentInfo.round
    if (currentInfo.round == 0) {
        if (isPlay == true) {
            isPlay = false
            parentPort.postMessage({ action: 'played', status: null })
        }
        return;

    }

    // console.log(shoe, round, currentInfo.round, currentInfo.statistic.length, bot)
    let lastPlay = { ...predictStats.predict[playCount - 1] }
    let lastStat = { ...currentInfo.statistic[statsCount - 1] }
    if (playCount == statsCount && lastPlay.isResult == false) {
        // cal correct wrong and collect stats
        predictStats.predict[playCount - 1] = { ...lastPlay, isResult: true, ...lastStat }
        if (bot != null) {
            let status = ''
            if (lastStat.winner == 'TIE') {
                predictStats.tie++;
                status = 'TIE'
                
            }
            else if (lastPlay.bot == lastStat.winner) {
                predictStats.correct++;
                status = 'WIN'
            } else {
                predictStats.wrong++;
                status = 'LOSE'
            }

            if (isPlay && playRound == statsCount) {
                isPlay = false
                parentPort.postMessage({
                    action: 'played',
                    status: status, 
                    stats: predictStats.predict[playCount - 1], 
                    shoe: shoe, 
                    table: workerData,
                    bot_type: 1 
                })
            }
            bot = null
        }
    }


    if (currentInfo.round > playCount) {
        if (currentInfo.round < 5) {
            bot = null
            predictStats.predict.push({ round: currentInfo.round, bot: null, isResult: false })
        } else {
            bot = botChoice[Math.floor(Math.random() * botChoice.length)]
            predictStats.predict.push({ round: currentInfo.round, bot: bot, isResult: false })
            if (isPlay && playRound == currentInfo.round) {
                axios.get(`https://truthbet.com/api/baccarat/${workerData.id}/current`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    })
                    .then(response => {
                        // console.log(response.data);
                        // console.log(`round = ${response.data.info.detail.round}`)
                        let current = response.data.game
                        console.log(current)
                        let sum = predictStats.correct + predictStats.wrong + predictStats.tie
                        let win_percent = 0
                        if (sum != 0) {
                            win_percent = ((predictStats.correct + predictStats.tie) / sum) * 100
                        }

                        if (win_percent < 50) {
                            win_percent = 100 - win_percent
                        } else {
                            win_percent = win_percent
                        }
            
                        if( win_percent == 100){
                            win_percent = 92
                        }

                        if (current.round == currentInfo.round && current.remaining > 10) {
                            parentPort.postMessage({ action: 'bet', data: { 
                                bot: bot, 
                                table: workerData, 
                                shoe: shoe, 
                                round: current.round, 
                                game_id: current.id, 
                                remaining: current.remaining,
                                win_percent: win_percent
                            } })
                        }else{
                            parentPort.postMessage({ action: 'played', status: 'FAILED' })
                        }

                    })
                    .catch(error => {
                        console.log(`current: ${error}`);
                        isPlay = false
                        parentPort.postMessage({ action: 'played', status: 'FAILED' })
                    });
            }


        }
    }

    predictStats.info = { ...currentInfo }
    round = currentInfo.round
    // console.log(predictStats.predict)
    // console.log( `table: ${workerData.id} ${predictStats.correct}, ${predictStats.wrong}, ${predictStats.tie}`)
    // if(round == currentInfo.round) return;

    // if(currentInfo.statistic.length != currentInfo.round - 1) return;
    // round = currentInfo.round

    // if(bot == null && round > predictStats.predict.length){
    //     bot = botChoice[Math.floor(Math.random() * botChoice.length)]

    // }

    // if(currentInfo.statistic.length < 5){
    //     predictStats.predict.push({...lastStat, bot: null})
    // }else{
    //     predictStats.predict.push({...lastStat, bot: botChoice[Math.floor(Math.random() * botChoice.length)]})
    //     console.log(predictStats.predict)
    // }
    return
}


// item of list will be multiplied with a factor as per index
function processDataAndSendData(multipleFactor) {

    // updating index
    index++;
    // // now check first length
    // if( workerData.length > index) {
    //     // update value
    //     workerData[index] = workerData[index] * multipleFactor;
    //     // send updated value as notification along with in progress flag as true
    //     parentPort.postMessage({ index, val: workerData[index], isInProgress:true });
    // } else {
    //     // send complete updated list as notification, when processing is done
    //     parentPort.postMessage({ val: workerData, isInProgress:false });
    //     clearInterval(interval);
    // }
}