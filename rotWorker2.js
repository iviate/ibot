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
let HalfRB = ['HALFxBLACK', 'HALFxRED']
let HalfED = ['HALFxEVEN', 'HALFxODD']
let HalfSB = ['HALFxSMALL', 'HALFxBIG']
let Dozen = ['DOZENx1st', 'DOZENx2nd', 'DOZENx3rd']

let botType = null

let isPlayHalfRB = false
let isPlayHalfED = false
let isPlayHalfSB = false
let isPlayZone = false

let statCount = {
    rbCorrect: 0,
    rbWrong: 0,
    edCorrect: 0,
    edWrong: 0,
    sbCorrect: 0,
    sbWrong: 0,
    twoZoneCorrect: 0,
    twoZoneWrong: 0,
    oneZoneCorrect: 0,
    oneZoneWrong: 0
}

let info = [];
let shoe;
let round;
// let stats;
let predictStats = { shoe: '', correct: 0, wrong: 0, tie: 0, info: {}, predict: [] };
// let predictStatsHistory = [];
// let statsCount;
let bot = null;
let playRound = null;
let token = null
let isPlay = false;
var date = new Date();
var playList = []

let isStaticPlayed = false

let statsLen = null
// var resultStats = ''
// var threeCutPlay = {}
// var fourCutPlay = {}

var last_pull_timestamp = date.getTime();
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjp7InVpZCI6NDI4MjE5fSwiaWF0IjoxNTk1ODM2ODUzfQ.1YDXUwVIg7kIiYpxYlRPrn06jLtdQ6nG9dufe6MhIIM
registerForEventListening();

function getCurrent() {
    // console.log(current)
    let sumRB = statCount.rbCorrect + statCount.rbWrong
    let percentRB = 0
    if (sumRB != 0) {
        percentRB = ((statCount.rbCorrect) / sumRB) * 100
    }

    let sumED = statCount.edCorrect + statCount.edWrong
    let percentED = 0
    if (sumED != 0) {
        percentED = ((statCount.edCorrect) / sumED) * 100
    }

    let sumSB = statCount.sbCorrect + statCount.sbWrong
    let percentSB = 0
    if (sumSB != 0) {
        percentSB = ((statCount.sbCorrect) / sumSB) * 100
    }

    let sumTwoZone = statCount.twoZoneCorrect + statCount.twoZoneWrong
    let percentTwoZone = 0
    if (sumTwoZone != 0) {
        percentTwoZone = ((statCount.twoZoneCorrect) / sumTwoZone) * 100
    }

    let sumOneZone = statCount.oneZoneCorrect + statCount.oneZoneWrong
    let percentOneZone = 0
    if (sumOneZone != 0) {
        percentOneZone = ((statCount.oneZoneCorrect) / sumOneZone) * 100
    }

    if (!isPlay) {
        parentPort.postMessage({
            error: false,
            action: 'getCurrent',
            table_id: workerData.id,
            info: info,
            predictStats: predictStats,
            round: round,
            stats: statCount,
            winner_percent: {
                RB: percentRB,
                ED: percentED,
                SB: percentSB,
                TWOZONE: percentTwoZone,
                ONEZONE: percentOneZone
            },
            table_title: workerData.title
        })
    } else {
        parentPort.postMessage({
            table_id: workerData.id,
            table_title: workerData.title,
            action: 'getCurrent',
            error: true,
            stats: statCount,
            winner_percent: {
                RB: 0,
                SB: 0,
                ED: 0,
                TWOZONE: 0,
                ONEZONE: 0
            },
            bot: null
        })
    }


}

function registerForEventListening() {
    // console.log('start rot')
    if (workerData.id == 14) {
        botType = 210
    }
    else if (workerData.id == 21) {
        botType = 220
    }


    token = workerData.token
    inititalInfo()
    // callback method is defined to receive data from main thread
    let cb = (err, result) => {
        if (err) return console.error(err);
        // console.log("Thread id ")

        if (result.action == 'getCurrent') {
            // console.log(getCurrent)
            getCurrent()
        } else if (result.action == 'play') {
            if (isPlay == false) {
                playList = []
            }
            // console.log(`Thred id ${workerData.id} action ${result.action}`)
            isPlay = true
            playRound = round + 1
            playList.push(result.type)
            // console.log(playList)
            // betting(result.current)
        }


        // //  setting up interval to call method to multiple with factor

    };
    livePlaying(workerData.id, workerData.title)
    // setInterval(rotPredictPlay, 5000);
    // registering to events to receive messages from the main thread
    parentPort.on('error', cb);
    parentPort.on('message', (msg) => {
        cb(null, msg);
    });
}

function inititalInfo() {

    let api = `https://wapi.betworld.international/game-service/v-games/${workerData.vid}`
    axios.get(api,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        .then(response => {
            // console.log(response.data);
            let detail = response.data.data.game_table.game_data
            if (shoe != detail.shoe) {
                shoe = detail.shoe
                round = detail.round
                // playRound = round + 1
                // predictStatsHistory.push({ ...predictStats })
                predictStats = { shoe: shoe, correct: 0, wrong: 0, tie: 0, info: {}, predict: [] }
                statsLen = detail.stat_data.length
                if (predictStats.predict.length != detail.stat_data.length) {
                    for (let j = 1; j <= round; j++) {
                        predictStats.predict.push({ round: j, bot: null, isResult: true })
                    }
                }

            }

        })
        .catch(error => {
            console.log(error);
            if (isPlay == true) {
                isPlay = false
                parentPort.postMessage({ action: 'played', status: null, playList: playList, table: workerData })
            }
        });
}


// async function rotPredictPlay() {
//     // console.log('rotPredictPlay')
//     let current = new Date().getTime()
//     if (current - last_pull_timestamp < 4500) {
//         // console.log(`${workerData.title} not pull`)
//         return
//     } else {
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
//         });
// }

function randomHalfRB() {
    return HalfRB[Math.floor(Math.random() * HalfRB.length)]
}

function randomHalfED() {
    return HalfED[Math.floor(Math.random() * HalfED.length)]
}

function randomHalfSB() {
    return HalfSB[Math.floor(Math.random() * HalfSB.length)]
}

function randomTwoZone() {
    var ret = []
    while (ret.length != 2) {
        let rand = Dozen[Math.floor(Math.random() * Dozen.length)]
        if (ret.indexOf(rand) == -1) {
            ret.push(rand)
        }
    }
    return ret
}

function randomOneZone(twozone) {
    return twozone[Math.floor(Math.random() * twozone.length)]
}

function getRBWinerPercent() {
    let sum = statCount.rbCorrect + statCount.rbWrong
    let win_percent = 0
    if (sum != 0) {
        win_percent = (statCount.rbCorrect / sum) * 100
    }

    if (win_percent < 50) {
        win_percent = 100 - win_percent
    } else {
        win_percent = win_percent
    }

    if (win_percent == 100) {
        win_percent = 92
    }

    return win_percent
}

function getEDWinerPercent() {
    let sum = statCount.edCorrect + statCount.edWrong
    let win_percent = 0
    if (sum != 0) {
        win_percent = (statCount.edCorrect / sum) * 100
    }

    if (win_percent < 50) {
        win_percent = 100 - win_percent
    } else {
        win_percent = win_percent
    }

    if (win_percent == 100) {
        win_percent = 92
    }

    return win_percent
}

function getSBWinerPercent() {
    let sum = statCount.sbCorrect + statCount.sbWrong
    let win_percent = 0
    if (sum != 0) {
        win_percent = (statCount.sbCorrect / sum) * 100
    }

    if (win_percent < 50) {
        win_percent = 100 - win_percent
    } else {
        win_percent = win_percent
    }

    if (win_percent == 100) {
        win_percent = 92
    }

    return win_percent
}

function getTwozoneWinerPercent() {
    let sum = statCount.twoZoneCorrect + statCount.twoZoneWrong
    let win_percent = 0
    if (sum != 0) {
        win_percent = (statCount.twoZoneCorrect / sum) * 100
    }

    if (win_percent < 50) {
        win_percent = 100 - win_percent
    } else {
        win_percent = win_percent
    }

    if (win_percent == 100) {
        win_percent = 92
    }

    return win_percent
}

function getOnezoneWinerPercent() {
    let sum = statCount.oneZoneCorrect + statCount.oneZoneWrong
    let win_percent = 0
    if (sum != 0) {
        win_percent = (statCount.oneZoneCorrect / sum) * 100
    }

    if (win_percent < 50) {
        win_percent = 100 - win_percent
    } else {
        win_percent = win_percent
    }

    if (win_percent == 100) {
        win_percent = 92
    }

    return win_percent
}


async function livePlaying(tableId, tableTitle = null) {
    const APP_KEY = '3a4a7b0bd61472bd24df'
    const pusher = new Pusher(APP_KEY, {
        cluster: 'ap1',
    });
    const channel = pusher.subscribe(`game.${tableId}`);
    console.log("rot start", `game.${tableId}`);

    const io = global['io'];

    const WAITNG_TIME = 24;

    let previousGameStartAt = moment();
    channel.bind('start', async (data) => {
        let playCount = predictStats.predict.length
        let lastPlay = { ...predictStats.predict[playCount - 1] }
        // console.log('lastPlay', lastPlay)
        if (!lastPlay.isResult) {
            let status = {
                RB: 'TIE',
                ED: 'TIE',
                SB: 'TIE',
                TWOZONE: 'TIE',
                ONEZONE: 'TIE'
            }
            statCount.rbCorrect++;
            statCount.edCorrect++;
            statCount.sbCorrect++;
            statCount.twoZoneCorrect++;
            statCount.oneZoneCorrect++;

            if (isPlay && playRound < data.round) {
                isPlay = false
                // console.log(playList)
                parentPort.postMessage({
                    action: 'played',
                    status: status,
                    playList: playList,
                    stats: predictStats.predict[playCount - 1],
                    shoe: shoe,
                    table: workerData,
                    bot_type: 2
                })
            }

            parentPort.postMessage({
                action: 'static_played',
                status: status,
                stats: predictStats.predict[playCount - 1],
                shoe: shoe,
                table: workerData,
                bot_type: 2,
                playList: ['RB', 'ED', 'SB', 'ZONE'],
            })
        }

        round = data.round
        // console.log(`${tableId}-roulette-start round ${data.shoe_id}-${data.round}`)
        //console.log(data)
        previousGameStartAt = data.started_at

        if (shoe != data.shoe_id) {
            shoe = data.shoe_id
            round = data.round
            // predictStatsHistory.push({ ...predictStats })
            predictStats = { shoe: shoe, correct: 0, wrong: 0, tie: 0, info: {}, predict: [] }
            statCount = {
                rbCorrect: 0,
                rbWrong: 0,
                edCorrect: 0,
                edWrong: 0,
                sbCorrect: 0,
                sbWrong: 0,
                twoZoneCorrect: 0,
                twoZoneWrong: 0,
                oneZoneCorrect: 0,
                oneZoneWrong: 0,
                firstZoneCorrect: 0,
                secondZoneCorrect: 0,
                thirdZoneCorrect: 0,
            }
            if (isPlay) {
                isPlay = false
                bot = null
                parentPort.postMessage({ action: 'played', status: 'FAILED', playList: playList, table: workerData })
            }
            return
        }

        // if (isPlay && playRound < data.round) {
        //     isPlay = false
        //     parentPort.postMessage({ action: 'played', status: 'FAILED', playList: playList, table: workerData })
        //     return
        // }

        if (data.round < 1) {
            bot = null
            predictStats.predict.push({ round: data.round, bot: null, isResult: false })
            if (isPlay) {
                isPlay = false
                parentPort.postMessage({ action: 'played', status: 'FAILED', playList: playList, table: workerData })
            }
        } else {
           

            let remainBet = Math.max(WAITNG_TIME - Math.round((moment() - previousGameStartAt) / 1000), 0)
            let twozone = randomTwoZone()
            bot = {
                RB: randomHalfRB(),
                ED: randomHalfED(),
                SB: randomHalfSB(),
                TWOZONE: twozone,
                ONEZONE: randomOneZone(twozone)
            }
            let winPercent = {
                RB: getRBWinerPercent(),
                ED: getEDWinerPercent(),
                SB: getSBWinerPercent(),
                TWOZONE: getTwozoneWinerPercent(),
                ONEZONE: getOnezoneWinerPercent()
            }
            // console.log(`remainBet ${remainBet}`)
            if (remainBet > 10) {

                setTimeout(function () {
                    parentPort.postMessage({
                        action: 'static_bet', data: {
                            bot: bot,
                            table: workerData,
                            shoe: shoe,
                            round: data.round,
                            game_id: data.id,
                            remaining: remainBet,
                            win_percent: winPercent,
                            playList: ['RB', 'ED', 'SB', 'ZONE']
                        }
                    })
                }, 500)

            } else {
                // parentPort.postMessage({ action: 'played', status: 'FAILED', playList: ['RB', 'ED', 'SB', 'ZONE'], table: workerData })
            }



            predictStats.predict.push({ round: data.round, bot: bot, isResult: false })
            if (isPlay && playRound == data.round && playRound < 100) {
                // console.log(response.data);
                // console.log(`round = ${response.data.info.detail.round}`)
                // let current = response.data.game
                // console.log(current)


                if (remainBet > 10) {

                    parentPort.postMessage({
                        action: 'bet', data: {
                            bot: bot,
                            table: workerData,
                            shoe: shoe,
                            round: data.round,
                            game_id: data.id,
                            remaining: remainBet,
                            win_percent: winPercent,
                            playList: playList
                        }
                    })

                } else {
                    isPlay = false

                    parentPort.postMessage({ action: 'played', status: 'FAILED', playList: playList, table: workerData })
                }


            } else if (isPlay && playRound > 99) {
                isPlay = false
                parentPort.postMessage({ action: 'played', status: 'FAILED', playList: playList, table: workerData })
            }
            else if (isPlay && playCount > playRound) {
                isPlay = false
                parentPort.postMessage({ action: 'played', status: 'FAILED', playList: playList, table: workerData })
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
        // console.log(`${tableId}-roulette-result`)
        // console.log(data)
        let winner = data.winner;
        let playCount = predictStats.predict.length
        let lastPlay = { ...predictStats.predict[playCount - 1] }
        predictStats.predict[playCount - 1] = { ...lastPlay, isResult: true, data }
        // console.log(bot, winner, lastPlay.bot, isPlay, playRound, round)
        if (bot != null) {

            // parentPort.postMessage({ action: 'clear_static_bet' })
            let status = {
                RB: 'LOSE',
                ED: 'LOSE',
                SB: 'LOSE',
                TWOZONE: 'LOSE',
                ONEZONE: 'LOSE',
                FIRSTZONE: 'LOSE',
                SECONDZONE: 'LOSE',
                THIRDZONE: 'LOSE'
            }

            let addition = data.addition
            if (addition.findIndex((item) => item == bot.RB) != -1) {
                statCount.rbCorrect++;
                status.RB = 'WIN'
            } else {
                statCount.rbWrong++;
            }

            if (addition.findIndex((item) => item == bot.ED) != -1) {
                statCount.edCorrect++;
                status.ED = 'WIN'
            } else {
                statCount.edWrong++;
            }

            if (addition.findIndex((item) => item == bot.SB) != -1) {
                statCount.sbCorrect++;
                status.SB = 'WIN'
            } else {
                statCount.sbCorrect++;
            }

            if (addition.findIndex((item) => item == bot.TWOZONE[0]) != -1 ||
                addition.findIndex((item) => item == bot.TWOZONE[1]) != -1) {
                statCount.twoZoneCorrect++;
                status.TWOZONE = 'WIN'
            } else {
                statCount.twoZoneWrong++;
            }

            if (addition.findIndex((item) => item == bot.ONEZONE) != -1) {
                statCount.oneZoneCorrect++;
                status.ONEZONE = 'WIN'
            } else {
                statCount.oneZoneWrong++;
            }

            if (addition.findIndex((item) => item == ['DOZENx1st']) != -1) {
                status.FIRSTZONE = 'WIN'
            } else {
            }

            if (addition.findIndex((item) => item == ['DOZENx2nd']) != -1) {
                status.SECONDZONE = 'WIN'
            } else {
            }

            if (addition.findIndex((item) => item == ['DOZENx3rd']) != -1) {
                status.THIRDZONE = 'WIN'
            } else {
            }


            parentPort.postMessage({
                action: 'static_played',
                status: status,
                stats: predictStats.predict[playCount - 1],
                shoe: shoe,
                table: workerData,
                bot_type: 2,
                playList: ['RB', 'ED', 'SB', 'ZONE'],
            })


            if (isPlay && playRound == round) {
                playRound = null
                isPlay = false

                parentPort.postMessage({
                    action: 'played',
                    status: status,
                    stats: predictStats.predict[playCount - 1],
                    shoe: shoe,
                    table: workerData,
                    bot_type: 2,
                    playList: playList,
                })
            } else if (isPlay && playRound > 98) {
                isPlay = false
                parentPort.postMessage({ action: 'played', status: 'FAILED', playList: playList, table: workerData })
            }
            else if (isPlay && playCount > playRound) {
                isPlay = false
                parentPort.postMessage({ action: 'played', status: 'FAILED', playList: playList, table: workerData })
            }
            bot = null
        }
    });

    channel.bind('deal', async (data) => {
    });

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