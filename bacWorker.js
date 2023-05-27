// parentPort for registering to events from main thread
// workerData for receiving data clone
require('log-timestamp');
const { parentPort, workerData } = require('worker_threads');
const axios = require('axios');
const moment = require('moment-timezone');
const Pusher = require("pusher-js")

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
let threecutBot = null;
let fourcutBot = null;
let playRound = null;
let token = null
let isPlay = false;
var date = new Date();
var threecutResult = []
var isThreeCutPlay = false;
var fourcutResult = []
var isFourCutPlay = false;
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

function registerForEventListening() {
    token = workerData.token
    // token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2ODQ3NDEwNTIsInBheWxvYWQiOnsiZGF0YSI6eyJjYXNpbm9faWQiOiIwZjIwYTVlYS1lZmM5LTQwZWMtYjcxOS02OThlOWQ3ZmRiYTYifSwidWlkIjoyMzgzNTl9fQ.HlbAeeVbNDZ1aEy1s7BOfmrSH8uZkNqjaQKRuZKJkM8"
    inititalInfo()
    // callback method is defined to receive data from main thread
    let cb = (err, result) => {
        if (err) return console.error(err);
        // console.log("Thread id ")

        if (result.action == 'getCurrent') {
            getCurrent()
        } else if (result.action == 'play') {
            // console.log(`Thred id ${workerData.id} action ${result.action}`)
            isPlay = true
            playRound = round + 1
            // betting(result.current)
        }


        // //  setting up interval to call method to multiple with factor
        
    };
    livePlaying(workerData.id, workerData.title)
    // setInterval(predictPlay, 7000);

    // registering to events to receive messages from the main thread
    parentPort.on('error', cb);
    parentPort.on('message', (msg) => {
        cb(null, msg);
    });
}

function inititalInfo() {
    api = `https://wapi.betworld.international/game-service/v-games/${workerData.vid}`
    // api = 'https://wapi.betworld.international/game-service/v-games/b17c60a8-9ab0-499f-b69d-c06d164990d1'
    // console.log(api)
    axios.get(api,
        {
            headers: {
                'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            // console.log(response.data);
            let detail = response.data.data.game_table.game_data
            // console.log(detail)
            if (shoe != detail.shoe) {
                shoe = detail.shoe
                round = detail.round
                // predictStatsHistory.push({ ...predictStats })
                predictStats = { shoe: shoe, correct: 0, wrong: 0, tie: 0, info: {}, predict: [] }
                
                if (predictStats.predict.length != detail.stat_data.length) {
                    let i = 1
                    for (roundStat of detail.stat_data) {
                        // console.log(roundStat)
                        predictStats.predict.push({ ...roundStat, round: i, bot: null, isResult: true })
                        i++
                        
                    }
                }

                if (detail.round > detail.stat_data.length) {
                    predictStats.predict.push({ round: detail.round, bot: null, isResult: false })
                }
            }

        })
        .catch(error => {
            console.log(error);
        });
}

async function livePlaying(tableId, tableTitle = null){
    // console.log("LivePlaying")
    const APP_KEY = '3a4a7b0bd61472bd24df'
    const pusher = new Pusher(APP_KEY, {
        cluster: 'ap1'
    });
    const channel = pusher.subscribe(`game.${tableId}`);
    console.log("start", `game.${tableId}`);

    const io = global['io'];

    const WAITNG_TIME = 24;

    let liveData = {
        status: "",
        remaining: 0,
        score: {
            player: 0,
            banker: 0,
        },
        cards: {
            player: [],
            banker: [],
        },
        gameId: null,
        predict: null,
        round: null,
        winner: "-",
    }
    let previousGameStartAt = moment();
    let botChoice = ["BANKER", "PLAYER"]
    channel.bind('start', async (data) => {
        // console.log(data.table_id, data.status)
        // console.log(typeof(data))
        round = data.round
        //console.log(`${tableId}-baccarat-start`)
        //console.log(data)
        previousGameStartAt = data.started_at

        if (shoe != data.shoe_id) {
            threecutResult = []
            fourcutResult = []
            shoe = data.shoe_id
            round = data.round
            // predictStatsHistory.push({ ...predictStats })
            predictStats = { shoe: shoe, correct: 0, wrong: 0, tie: 0, info: {}, predict: [] }
            if(isPlay){
                isPlay = false
                bot = null
                parentPort.postMessage({ action: 'played', status: 'FAILED' })
            }

            if(isThreeCutPlay){
                isThreeCutPlay = false
                threecutBot = null
                parentPort.postMessage({ action: 'three_cut_played', status: 'FAILED' })
            }

            if(isFourCutPlay){
                isFourCutPlay = false
                fourcutBot = null
                parentPort.postMessage({ action: 'four_cut_played', status: 'FAILED' })
            }
            return
        }
        let remainBet = Math.max(WAITNG_TIME - Math.round((moment() - previousGameStartAt) / 1000), 0)
        if(isThreeCutPlay){
            isThreeCutPlay = false
            threecutBot = null
            parentPort.postMessage({ action: 'three_cut_played', status: 'FAILED' })
        }

        if(isFourCutPlay){
            isFourCutPlay = false
            fourcutBot = null
            parentPort.postMessage({ action: 'four_cut_played', status: 'FAILED' })
        }


        if(threecutResult.length == 4){
            if(threecutResult[0] == 'BANKER' && threecutResult[1] == 'PLAYER' && threecutResult[2] == 'PLAYER' && threecutResult[3] == 'PLAYER'){
                isThreeCutPlay = true
                threecutBot = 'BANKER'
                parentPort.postMessage({ action: 'three_cut_bet', data: { 
                    bot: threecutBot, 
                    table: workerData, 
                    shoe: shoe, 
                    round: data.round, 
                    game_id: data.id, 
                    remaining: remainBet,
                    win_percent: Math.floor(Math.random() * 32) + 55
                } })
            }else if(threecutResult[0] == 'PLAYER' && threecutResult[1] == 'BANKER' && threecutResult[2] == 'BANKER' && threecutResult[3] == 'BANKER'){
                isThreeCutPlay = true
                threecutBot = 'PLAYER'
                parentPort.postMessage({ action: 'three_cut_bet', data: { 
                    bot: threecutBot, 
                    table: workerData, 
                    shoe: shoe, 
                    round: data.round, 
                    game_id: data.id, 
                    remaining: remainBet,
                    win_percent: Math.floor(Math.random() * 32) + 55
                } })
            }
        }

        if(fourcutResult.length == 5){
            if(fourcutResult[0] == 'BANKER' && fourcutResult[1] == 'PLAYER' && fourcutResult[2] == 'PLAYER' && fourcutResult[3] == 'PLAYER' && fourcutResult[4] == 'PLAYER'){
                isFourCutPlay = true
                fourcutBot = 'BANKER'
                parentPort.postMessage({ action: 'four_cut_bet', data: { 
                    bot: fourcutBot, 
                    table: workerData, 
                    shoe: shoe, 
                    round: data.round, 
                    game_id: data.id, 
                    remaining: remainBet,
                    win_percent: Math.floor(Math.random() * 32) + 55
                } })
            }else if(fourcutResult[0] == 'PLAYER' && fourcutResult[1] == 'BANKER' && fourcutResult[2] == 'BANKER' && fourcutResult[3] == 'BANKER' && fourcutResult[4] == 'BANKER'){
                isFourCutPlay = true
                fourcutBot = 'PLAYER'
                parentPort.postMessage({ action: 'four_cut_bet', data: { 
                    bot: fourcutBot, 
                    table: workerData, 
                    shoe: shoe, 
                    round: data.round, 
                    game_id: data.id, 
                    remaining: remainBet,
                    win_percent: Math.floor(Math.random() * 32) + 55
                } })
            }
        }
        

        if(isPlay && playRound < data.round){
            isPlay = false
            parentPort.postMessage({ action: 'played', status: 'FAILED' })
            return
        }

        if (data.round < 2) {
            bot = null
            predictStats.predict.push({ round: data.round, bot: null, isResult: false })
            if (isPlay && playRound < 4) {
                isPlay = false
                parentPort.postMessage({ action: 'played', status: 'FAILED' })
            }
        } else {
            bot = botChoice[Math.floor(Math.random() * botChoice.length)]
            predictStats.predict.push({ round: data.round, bot: bot, isResult: false })
            if (isPlay && playRound == data.round) {
                // console.log(response.data);
                // console.log(`round = ${response.data.info.detail.round}`)
                // let current = response.data.game
                // console.log(current)
                
                
                if (remainBet > 10) {

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
                    
                    parentPort.postMessage({ action: 'bet', data: { 
                        bot: bot, 
                        table: workerData, 
                        shoe: shoe, 
                        round: data.round, 
                        game_id: data.id, 
                        remaining: remainBet,
                        win_percent: win_percent
                    } })
                }else{
                    isPlay = false
                    
                    parentPort.postMessage({ action: 'played', status: 'FAILED' })
                }

                    
            }


        }

        
        // let gameId = data.id;
        // liveData.round = round;
        // liveData.gameId = gameId;
        // liveData.winner = "-";

        // await this.predictBaccarat(tableId, gameId)

        // let predict = await this.getPredictBaccarat(tableId, gameId, round)
        // liveData.predict = predict;
        // liveData.status = "START";

        // liveData.score = {
        //     player: 0,
        //     banker: 0,
        // }
        // liveData.cards = {
        //     player: [],
        //     banker: [],
        // }
        // setTimeout(() => {
        //     liveData.status = "BETTING"
        // }, 2000);
    });

    channel.bind('result', async (data) => {
        //console.log(`${tableId}-baccarat-result`)
        //console.log(data)
        let winner = data.winner;
        let playCount = predictStats.predict.length
        let lastPlay = { ...predictStats.predict[playCount - 1] }
        predictStats.predict[playCount - 1] = { ...lastPlay, isResult: true, data }
        // console.log(bot, winner, lastPlay.bot, isPlay, playRound, round)
        if(threecutResult.length < 4){
            threecutResult.push(winner)
        }else if(threecutResult.length == 4){
            threecutResult[0] = threecutResult[1]
            threecutResult[1] = threecutResult[2]
            threecutResult[2] = threecutResult[3]
            threecutResult[3] = winner
        }

        if(fourcutResult.length < 5){
            fourcutResult.push(winner)
        }else if(fourcutResult.length == 5){
            fourcutResult[0] = fourcutResult[1]
            fourcutResult[1] = fourcutResult[2]
            fourcutResult[2] = fourcutResult[3]
            fourcutResult[3] = fourcutResult[4]
            fourcutResult[4] = winner
        }

        // console.log(`table ${tableId} three cut`, threecutResult)
        // console.log(`table ${tableId} four cut`, fourcutResult)
        // console.log('tree cut', isThreeCutPlay, threecutBot)
        if(isThreeCutPlay && threecutBot != null){
            
            let status = ''
            if (winner == 'TIE') {
                status = 'TIE'
            }else if (threecutBot == winner) {
                status = 'WIN'
            } else {
                status = 'LOSE'
            }

            setTimeout(function () {
                parentPort.postMessage({
                    action: 'three_cut_played',
                    status: status, 
                    stats: predictStats.predict[playCount - 1], 
                    shoe: shoe, 
                    table: workerData,
                    bot_type: 4
                })
              }, 5000)
            
            isThreeCutPlay = false
            threecutBot = null
        }

        if(isFourCutPlay && fourcutBot != null){
            let status = ''
            if (winner == 'TIE') {
                status = 'TIE'
            }else if (fourcutBot == winner) {
                status = 'WIN'
            } else {
                status = 'LOSE'
            }

            setTimeout(function () {
                parentPort.postMessage({
                    action: 'four_cut_played',
                    status: status, 
                    stats: predictStats.predict[playCount - 1], 
                    shoe: shoe, 
                    table: workerData,
                    bot_type: 5
                })
              }, 5000)
            
            isFourCutPlay = false
            fourcutBot = null
        }

        if (bot != null) {
            let status = ''
            if (winner == 'TIE') {
                predictStats.tie++;
                status = 'TIE'
                
            }
            else if (lastPlay.bot == winner) {
                predictStats.correct++;
                status = 'WIN'
            } else {
                predictStats.wrong++;
                status = 'LOSE'
            }

            if (isPlay && playRound == round) {
                playRound = null
                isPlay = false
                setTimeout(function () {
                    parentPort.postMessage({
                        action: 'played',
                        status: status, 
                        stats: predictStats.predict[playCount - 1], 
                        shoe: shoe, 
                        table: workerData,
                        bot_type: 1 
                    })
                  }, 5000)
                
            }
            bot = null
        }
        // liveData.winner = winner;
        // liveData.status = "END";
        // await this.calStatBaccarat(tableId, liveData.gameId, winner)
        // await this.updateBetHistory(tableId, liveData.gameId, winner)
        // await this.updateBaccaratStat(tableId, tableTitle)
        // await this.broadcastStat(tableId)
        // setTimeout(() => {
        //     liveData.status = "WAITING"
        // }, 2000);
    });

    channel.bind('deal', async (data) => {
        // console.log(`${tableId}-baccarat-deal`)

        // liveData.status = "OPEN";

        // liveData.score.player = data.score.total.p % 10;
        // liveData.score.banker = data.score.total.b % 10;

        // liveData.cards.player = data.histories.p.card;
        // liveData.cards.banker = data.histories.b.card;
    });

    // setInterval(async () => {
    //     if (liveData.status == "BETTING") {
    //         liveData.remaining = Math.max(WAITNG_TIME - Math.round((moment() - previousGameStartAt) / 1000), 0)
    //     } else {
    //         liveData.remaining = "-"
    //     }
    //     io.emit(`baccarat-live-${tableId}`, liveData)
    // }, 1000)
}

// async function predictPlay() {
    
//     let current = new Date().getTime()
//     if(current - last_pull_timestamp < 6500){
//         // console.log(`${workerData.title} not pull`)
//         return
//     }else{
//         // console.log(`${workerData.title}`)
//         last_pull_timestamp = current
//     }
//     axios.get(`https://truthbet.com/api/table/${workerData.id}?include=dealer,info`,
//         {
//             headers: {
//                 Authorization: `Bearer ${token}`
//             }
//         })
//         .then((response) => {
//             // console.log(response.data);
//             // console.log(`round = ${response.data.info.detail.round}`)
//             info = response.data.info.detail
//             botplay(response.data.info.detail)

//         })
//         .catch((error) => {
//             console.log(`table error ${workerData.id} ${error}`);
//             if (isPlay == true) {
//                 isPlay = false
//                 parentPort.postMessage({ action: 'played', status: null })
//             }
//         });
// }

// function botplay(currentInfo) {
//     if (shoe != currentInfo.shoe) {
//         shoe = currentInfo.shoe
//         round = currentInfo.round
//         // predictStatsHistory.push({ ...predictStats })
//         predictStats = { shoe: shoe, correct: 0, wrong: 0, tie: 0, info: {}, predict: [] }
//         return
//     }
//     round = currentInfo.round
//     let botChoice = ["BANKER", "PLAYER"]
//     let statsCount = currentInfo.stat_data.length
//     let playCount = predictStats.predict.length
//     let currentRound = currentInfo.round
//     if (currentInfo.round == 0) {
//         if (isPlay == true) {
//             isPlay = false
//             parentPort.postMessage({ action: 'played', status: null })
//         }
//         return;

//     }

//     // console.log(shoe, round, currentInfo.round, currentInfo.stat_data.length, bot)
//     let lastPlay = { ...predictStats.predict[playCount - 1] }
//     let lastStat = { ...currentInfo.stat_data[statsCount - 1] }
//     if (playCount == statsCount && lastPlay.isResult == false) {
//         // cal correct wrong and collect stats
//         predictStats.predict[playCount - 1] = { ...lastPlay, isResult: true, ...lastStat }
//         if (bot != null) {
//             let status = ''
//             if (lastStat.winner == 'TIE') {
//                 predictStats.tie++;
//                 status = 'TIE'
                
//             }
//             else if (lastPlay.bot == lastStat.winner) {
//                 predictStats.correct++;
//                 status = 'WIN'
//             } else {
//                 predictStats.wrong++;
//                 status = 'LOSE'
//             }

//             if (isPlay && playRound == statsCount) {
//                 isPlay = false
//                 parentPort.postMessage({
//                     action: 'played',
//                     status: status, 
//                     stats: predictStats.predict[playCount - 1], 
//                     shoe: predictStats.shoe, 
//                     table: workerData,
//                     bot_type: 1 
//                 })
//             }
//             bot = null
//         }
//     }


//     if (currentInfo.round > playCount) {
//         if (currentInfo.round < 2) {
//             bot = null
//             predictStats.predict.push({ round: currentInfo.round, bot: null, isResult: false })
//         } else {
//             bot = botChoice[Math.floor(Math.random() * botChoice.length)]
//             predictStats.predict.push({ round: currentInfo.round, bot: bot, isResult: false })
//             if (isPlay && playRound == currentInfo.round) {
//                 axios.get(`https://truthbet.com/api/baccarat/${workerData.id}/current`,
//                     {
//                         headers: {
//                             Authorization: `Bearer ${token}`
//                         }
//                     })
//                     .then(response => {
//                         // console.log(response.data);
//                         // console.log(`round = ${response.data.info.detail.round}`)
//                         let current = response.data.game
//                         // console.log(current)
//                         let sum = predictStats.correct + predictStats.wrong + predictStats.tie
//                         let win_percent = 0
//                         if (sum != 0) {
//                             win_percent = ((predictStats.correct + predictStats.tie) / sum) * 100
//                         }

//                         if (win_percent < 50) {
//                             win_percent = 100 - win_percent
//                         } else {
//                             win_percent = win_percent
//                         }
            
//                         if( win_percent == 100){
//                             win_percent = 92
//                         }

//                         if (current.round == currentInfo.round && current.remaining > 10) {
//                             parentPort.postMessage({ action: 'bet', data: { 
//                                 bot: bot, 
//                                 table: workerData, 
//                                 shoe: shoe, 
//                                 round: current.round, 
//                                 game_id: current.id, 
//                                 remaining: current.remaining,
//                                 win_percent: win_percent
//                             } })
//                         }else{
//                             parentPort.postMessage({ action: 'played', status: 'FAILED' })
//                         }

//                     })
//                     .catch(error => {
//                         console.log(`current: ${error}`);
//                         isPlay = false
//                         parentPort.postMessage({ action: 'played', status: 'FAILED' })
//                     });
//             }


//         }
//     }

//     predictStats.info = { ...currentInfo }
//     round = currentInfo.round
//     // console.log(predictStats.predict)
//     // console.log( `table: ${workerData.id} ${predictStats.correct}, ${predictStats.wrong}, ${predictStats.tie}`)
//     // if(round == currentInfo.round) return;

//     // if(currentInfo.stat_data.length != currentInfo.round - 1) return;
//     // round = currentInfo.round

//     // if(bot == null && round > predictStats.predict.length){
//     //     bot = botChoice[Math.floor(Math.random() * botChoice.length)]

//     // }

//     // if(currentInfo.stat_data.length < 5){
//     //     predictStats.predict.push({...lastStat, bot: null})
//     // }else{
//     //     predictStats.predict.push({...lastStat, bot: botChoice[Math.floor(Math.random() * botChoice.length)]})
//     //     console.log(predictStats.predict)
//     // }
//     return
// }


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