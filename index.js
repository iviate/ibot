// import * as http from 'http';


require('log-timestamp');
// module included to create worker threads
const {
    Worker
} = require('worker_threads');
const botConfig = require("./config/bot.config.js");
const axios = require('axios');
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
const puppeteer = require("puppeteer");
var cors = require('cors')

const db = require("./app/models");
const {
    Op
} = require("sequelize");
const e = require('express');
const {
    syncBuiltinESMExports
} = require('module');
// const { USE } = require('sequelize/types/lib/index-hints');
db.sequelize.sync({
    alter: true
});


let botTransactionObj = {
    'DEFAULT': null,
    'BANKER': null,
    'PLAYER': null
}

let win_percent;
//db.sequelize.sync();
let botNumber = 0;
let botWorkerDict = {};
let token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjp7InVpZCI6NTcwMzA2fSwiaWF0IjoxNTk2Mjc1MjI2fQ.BlrzYvm7RKTjyK2vxoPWzlvZaTnifZVyB47JYblWM2A"

var myApp = require('express')();
myApp.use(bodyParser.json())
myApp.use(cors())

var http = require('http').Server(myApp);
var io = require('socket.io')(http);

io.on('connection', (socket) => {
    console.log('socket connection')
    socket.on('restart', (msg) => {
        let userId = msg.userId
        let type = msg.type
        if(botWorkerDict.hasOwnProperty(userId) && botWorkerDict != undefined){
            botWorkerDict[userId].postMessage({action: 'restart', type: type, userId: userId})
        }else{
            io.emit(`user${userId}`, {action: 'restart_result', success: false, message: 'ยังไม่ได้สร้างบอท', data: null})
        }
    });
});

myApp.post('/login', async function (request, response) {
    const USERNAME = request.body.username;
    const PASSWORD = request.body.password;

    const user = await db.user.findOne({
        where: {
            username: USERNAME,
        },
    });
    if (user) {
        bcrypt.compare(PASSWORD, user.password).then(function (result) {
            console.log(result)
            if (result) {
                db.bot.findOne({
                    where: {
                        status: {
                            [Op.ne]: 3
                        },
                        userId: user.id
                    }

                }).then((res2) => {
                    // console.log(res2)

                    axios.get('https://truthbet.com/api/m/account/edit', {
                        headers: {
                            Authorization: `Bearer ${user.truthbet_token}`
                        }
                    }).then((res3) => {
                        console.log(res3.data.user.advisor_user_id, res3.data.user.agent_user_id, res3.data.user.supervisor_user_id)
                        if ((res3.data.user.advisor_user_id != 570306 || res3.data.user.agent_user_id != 26054 || res3.data.user.supervisor_user_id != 521727) && 
                            (USERNAME != 'haoshaman' && USERNAME != 'testf111')) {
                            response.json({
                                success: false,
                                message: "ยูสเซอร์ไม่ได้เป็นสมาชิก"
                            });
                        } else {
                            if (botWorkerDict.hasOwnProperty(user.id) && botWorkerDict[user.id] != undefined) {
                                let hasBot = null
                                if (res2) {
                                    hasBot = res2
                                }
                                response.json({
                                    success: true,
                                    data: {
                                        user_id: user.id,
                                        bot: hasBot,
                                        username: USERNAME
                                    }
                                });
                            }else{
                                response.json({
                                    success: true,
                                    data: {
                                        user_id: user.id,
                                        bot: null,
                                        username: USERNAME
                                    }
                                });
                            }
                        }
                    })
                })
            }})
    } else {
        // require("dotenv").config();
        (async (USERNAME, PASSWORD) => {

            const browser = await puppeteer.launch({
                headless: true,
                devtools: false,
                args: ['--no-sandbox']
            });
            const page = await browser.newPage();
            await page.goto("https://truthbet.com/login?redirect=/m", {
                waitUntil: "networkidle2"
            });

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
                await page.waitForSelector('.fa-coins', {
                    visible: false,
                    timeout: 5000
                })
                let data = await page.evaluate(() => window.App);

                if (data.jwtToken != '') {
                    axios.get('https://truthbet.com/api/m/account/edit', {
                        headers: {
                            Authorization: `Bearer ${data.jwtToken}`
                        }
                    }).then((res2) => {
                        console.log(res2.data.user.advisor_user_id, res2.data.user.agent_user_id, res2.data.user.supervisor_user_id)
                        if ((res2.data.user.advisor_user_id != 570306 || res2.data.user.agent_user_id != 26054 || res2.data.user.supervisor_user_id != 521727) 
                                && USERNAME != "testf111") {
                            response.json({
                                success: false,
                                message: "ยูสเซอร์ไม่ได้เป็นสมาชิก"
                            });
                        } else {
                            bcrypt.hash(PASSWORD, 12, function (err, hash) {
                                db.user.create({
                                    username: USERNAME,
                                    password: hash,
                                    truthbet_token: data.jwtToken,
                                    truthbet_token_at: db.sequelize.fn('NOW')
                                }).then((result) => {
                                    db.user.findOne({
                                        where: {
                                            username: USERNAME
                                        }
                                    }).then((res) => {
                                        response.json({
                                            success: true,
                                            data: {
                                                user_id: res.id,
                                                bot: null,
                                                username: USERNAME
                                            }
                                        });
                                    })
                                })

                            });
                        }

                    })



                } else {
                    response.json({
                        success: false,
                        message: 'ข้อมูลไม่ถูกต้องกรุณาลองใหม่อีกครั้ง'
                    });
                }
            } catch (e) {
                response.json({
                    success: false,
                    message: 'ข้อมูลไม่ถูกต้องกรุณาลองใหม่อีกครั้ง'
                });
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

function processBotMoneySystem(money_system, init_wallet, profit_threshold, init_bet) {
    let half_bet = init_bet / 2
    if (money_system == 1) {
        return [init_bet]
    } else if (money_system == 2) {
        return [50, 100, 250, 600, 1500]
    } else if (money_system == 3) {
        let profit = profit_threshold - init_wallet
        let turn = 6
        let money = profit / turn / half_bet
        while (turn < 20 && (profit / turn / half_bet >= 1)) {
            money = profit / turn / half_bet
            turn++
        }
        turn -= 1
        money = Math.ceil(money * 10) / 10
        let ret = []
        // console.log(`turn = ${turn} money = ${money * init_bet}`)
        for (let i = 0; i < turn; i++) {
            ret.push(money)
        }

        return ret
    } else if (money_system == 4) {
        let s = 1

        let profit = profit_threshold - init_wallet
        let turn = Math.ceil(profit / init_bet)
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

        return ret
    }
}

myApp.post('/bot', async function (request, response) {

    const USERNAME = request.body.username
    db.user.findOne({
        where: {
            username: USERNAME,
        },
    }).then((user) => {
        if (user) {

            botData = {
                userId: user.id,
                token: user.truthbet_token,
                token_at: user.truthbet_token_at,
                status: 2,
                bot_type: request.body.bot_type,
                money_system: request.body.money_system,
                profit_threshold: request.body.profit_threshold,
                loss_threshold: request.body.loss_threshold,
                profit_percent: request.body.profit_percent,
                loss_percent: request.body.loss_percent,
                init_wallet: request.body.init_wallet,
                init_bet: request.body.init_bet,
                bet_side: request.body.bet_side,
                max_turn: 0,
            }

            let playData = processBotMoneySystem(botData.money_system, botData.init_wallet, botData.profit_threshold, botData.init_bet)
            botData.data = JSON.stringify(playData)

            db.bot.create(botData).then((created) => {
                // console.log(created)
                db.bot.findOne({
                    where: {
                        userId: user.id,
                    },
                    order: [
                        ['id', 'DESC']
                    ]
                }).then((res) => {
                    // console.log(res)

                    db.bot.update({
                        status: 3
                    }, {
                        where: {
                            userId: user.id,
                            id: {
                                [Op.ne]: res.id
                            }

                        }
                    }).then((b) = {

                    });
                    if (res) {
                        botData.id = res.id
                        // console.log(botData)
                        createBotWorker(botData, playData)

                        response.json({
                            success: true,
                            error_code: 0,
                            data: botData
                        })
                    }
                })
            })




        } else {
            response.json({
                success: false,
                error_code: 404,
                message: 'user not found'
            })
        }

    });

});

myApp.post('/start', async function (request, response) {
    const USERNAME = request.body.username
    db.user.findOne({
        where: {
            username: USERNAME,
        },
    }).then((user) => {
        if (user) {
            db.bot.findOne({
                where: {
                    userId: user.id,
                    status: 2
                },
            }).then((botObj) => {
                if (botObj) {
                    botObj.status = 1
                    botObj.save()
                    botWorkerDict[user.id].postMessage({
                        action: 'start'
                    })
                    response.json({
                        success: true,
                        error_code: null
                    })
                } else {
                    response.json({
                        success: false,
                        error_code: null
                    })
                }
            })
        } else {
            response.json({
                success: false,
                error_code: 404,
                message: 'user not found'
            })
        }

    });

});

myApp.post('/pause', async function (request, response) {
    const USERNAME = request.body.username
    db.user.findOne({
        where: {
            username: USERNAME,
        },
    }).then((user) => {
        if (user) {
            db.bot.findOne({
                where: {
                    userId: user.id,
                    status: 1
                },
            }).then((botObj) => {
                if (botObj) {
                    botObj.status = 2
                    botWorkerDict[user.id].postMessage({
                        action: 'pause'
                    })
                    botObj.save()
                    response.json({
                        success: true,
                        error_code: null
                    })
                } else {
                    response.json({
                        success: true,
                        error_code: null
                    })
                }
            })
        } else {
            response.json({
                success: false,
                error_code: 404,
                message: 'user not found'
            })
        }

    });

});

myApp.get('/user_bot/:id', async function (request, response) {
    db.user.findOne({
        where: {
            id: request.params.id,
        },
    }).then((user) => {
        if (user) {
            db.bot.findOne({
                where: {
                    status: {
                        [Op.ne]: 3

                    },
                    userId: user.id
                }

            }).then((res2) => {
                if (res2 && botWorkerDict.hasOwnProperty(user.id) && botWorkerDict[user.id] != undefined) {
                    hasBot = res2
                    response.json({
                        success: true,
                        data: {
                            bot: res2
                        }
                    });
                } else {
                    delete botWorkerDict[user.id]
                    response.json({
                        success: true,
                        data: {
                            bot: null
                        }
                    });
                }

            })
        } else {
            response.json({
                success: false,
                error_code: 404,
                message: 'user not found'
            })
        }

    });

});

myApp.get('/user_transaction/:id', async function (request, response) {
    let page = request.query.page || 1
    db.user.findOne({
        where: {
            id: request.params.id,
        },
    }).then((user) => {
        if (user) {
            axios.get(`https://truthbet.com/api/m/reports/stakes?report_type=1&game_id=&table_id=&page=${page}`, {
                    headers: {
                        Authorization: `Bearer ${user.truthbet_token}`
                    }
                })
                .then(res => {
                    response.json({
                        success: true,
                        error_code: null,
                        data: res.data
                    })
                })
        } else {
            response.json({
                success: false,
                error_code: 404,
                message: 'user not found'
            })
        }

    });

});

myApp.post('/stop', function (request, response) {
    const USERNAME = request.body.username
    db.user.findOne({
        where: {
            username: USERNAME
        },
    }).then((user) => {
        if (user) {
            db.bot.findOne({
                where: {
                    userId: user.id,
                    status: {
                        [Op.or]: [1, 2]
                    }
                },
            }).then((botObj) => {
                if (botObj) {
                    botObj.status = 3
                    botObj.stop_by = 1
                    botObj.stop_wallet = request.body.wallet
                    botObj.save()
                    if (botWorkerDict[user.id] != undefined) {
                        botWorkerDict[user.id].postMessage({
                            action: 'stop'
                        })
                        delete botWorkerDict[user.id]
                    }

                    response.json({
                        success: true,
                        error_code: null
                    })
                } else {
                    response.json({
                        success: true,
                        error_code: null
                    })
                }
            })
        } else {
            response.json({
                success: false,
                error_code: 404,
                message: 'user not found'
            })
        }

    });

});

myApp.get('/user_bot_transaction/:bot_id', function (request, response) {
    db.userTransaction.findAll({
        limit: 25,
        where: {
            botId: request.params.bot_id
        },
        order: [
            ['id', 'desc']
        ],

        include: [{
            model: db.bot,
            as: 'bot'
        }, {
            model: db.botTransction,
            as: 'bot_transaction'
        }]
    }).then((res) => {
        response.json({
            success: true,
            error_code: null,
            data: res
        })
    })
})

myApp.get('/bot_transaction', function (request, response) {
    let BET = (request.query.type || 'DEFAULT').toUpperCase()
    if (botTransactionObj[BET] == null) {
        if (BET == 'DEFAULT') {
            db.botTransction.findAll({
                limit: 100,
                order: [
                    ['id', 'DESC']
                ],
            }).then((res) => {
                botTransactionObj[BET] = res
                response.json({
                    success: true,
                    error_code: null,
                    data: res
                })
            })
        } else {
            db.botTransction.findAll({
                limit: 100,
                where: {
                    bet: BET
                },
                order: [
                    ['id', 'DESC']
                ],
            }).then((res) => {
                botTransactionObj[BET] = res
                response.json({
                    success: true,
                    error_code: null,
                    data: res
                })
            })
        }

    } else {
        // console.log('cache bot trasaction')
        response.json({
            success: true,
            error_code: null,
            data: botTransactionObj[BET]
        })
    }
})

myApp.get('/wallet/:id', function (request, response) {
    const user_id = request.params.id
    db.user.findOne({
        where: {
            id: user_id,
        },
    }).then((user) => {
        if (user) {
            axios.get(`https://truthbet.com/api/wallet`, {
                    headers: {
                        Authorization: `Bearer ${user.truthbet_token}`
                    }
                })
                .then(res => {
                    let profit_wallet = user.profit_wallet
                    let all_wallet = res.data.wallet.myWallet.MAIN_WALLET.chips.credit
                    let play_wallet = all_wallet - profit_wallet

                    response.json({
                        success: true,
                        error_code: null,
                        data: {
                            profit_wallet: profit_wallet,
                            all_wallet: all_wallet,
                            play_wallet: play_wallet,
                            myWallet: res.myWallet
                        }
                    })
                })
            // .catch(error => {
            //     response.json({
            //         success: false,
            //         error_code: 500,
            //         message: 'internal error'
            //     })
            // });
        } else {
            response.json({
                success: false,
                error_code: 404,
                message: 'user not found'
            })
        }

    });

});

http.listen(80, function () {
    console.log('listening *.80');
});

// main attributes
let lst; // list will be populated from 0 to n
let index = -1; // index will be used to traverse list
let myWorker; // worker reference
let interval;
let tables = [];
let workerDict = {};
let isPlay = false;
let playTable;
let currentList = [];
let botList = {}
var startBet;
var remainingBet;
var betInt;
var currentBetData;
var latestBotTransactionId;

mainBody();

function createBotWorker(obj, playData) {
    let cb = (err, result) => {
        if (err) {
            return console.error(err);
        }
        if (result.action == 'bet_success') {
            result.win_percent = win_percent
            io.emit(`user${result.data.current.botObj.userId}`, result)
            console.log(`bot ${result.data.current.botObj.userId} bet success`)
        }
        if (result.action == 'bet_failed') {
            console.log(`bot ${result.botObj.userId} bet failed ${result.error}`)
        }
        if(result.action == 'restart_result'){
            io.emit(`user${result.userId}`, result)
        }
        // if (result.action == 'stop') {

        //     db.bot.findOne({
        //         where: {
        //             id: result.botObj.id
        //         }
        //     }).then((res) => {
        //         res.status = 3
        //         res.save()
        //         if(botWorkerDict.hasOwnProperty(res.userId) && botWorkerDict[res.userId]){
        //             botWorkerDict[res.userId].terminate()
        //             delete botWorkerDict[res.userId]
        //         }

        //     })
        //     console.log(`bot ${result.user_id} stop`)
        //     if(botWorkerDict.hasOwnProperty(res.userId) && botWorkerDict[res.userId]){
        //         botWorkerDict[res.userId].terminate()
        //         delete botWorkerDict[res.userId]
        //     }
        // }
        if (result.action == 'process_result') {
            // console.log(result.wallet.myWallet.MAIN_WALLET.chips.cre)
            let userWallet = result.wallet.myWallet.MAIN_WALLET.chips.credit
            let userTransactionData = {
                value: result.betVal,
                wallet: result.wallet.myWallet.MAIN_WALLET.chips.credit,
                botId: result.botObj.id,
                botTransactionId: result.botTransactionId
            }

            // console.log(userTransactionData)

            db.userTransaction.create(userTransactionData)
            io.emit(`user${result.botObj.userId}`, {
                action: "bet_result",
                wallet: result.wallet,
                playData: result.playData,
                status: result.status,
                isStop: userWallet <= result.botObj.loss_threshold || userWallet >= result.botObj.profit_threshold || result.isStop,
                value: result.betVal,
                wallet: result.wallet.myWallet.MAIN_WALLET.chips.credit,
                botId: result.botObj.id,
                botTransactionId: result.botTransactionId,
                botTransaction: result.botTransaction
            })

            // console.log(`isStop ${result.isStop}`)

            if (userWallet <= result.botObj.loss_threshold || userWallet >= result.botObj.profit_threshold || result.isStop) {
                db.bot.findOne({
                    where: {
                        id: result.botObj.id
                    }
                }).then((res) => {
                    res.status = 3
                    res.stop_wallet = result.wallet.myWallet.MAIN_WALLET.chips.credit
                    res.stop_by = userWallet <= result.botObj.loss_threshold ? 3 : userWallet >= result.botObj.profit_threshold ? 2 : result.isStop ? 1 : 4
                    res.save()
                    if (botWorkerDict.hasOwnProperty(res.userId) && botWorkerDict[res.userId] != undefined) {
                        botWorkerDict[res.userId].terminate()
                        delete botWorkerDict[res.userId]
                    } else {
                        delete botWorkerDict[res.userId]
                    }

                })
            }
        }
    };

    let w = new Worker(__dirname + '/botWorker.js', {
        workerData: {
            obj: obj,
            playData: playData
        }
    });

    // registering events in main thread to perform actions after receiving data/error/exit events
    w.on('message', (msg) => {
        // data will be passed into callback
        cb(null, msg);
    });
    botWorkerDict[obj.userId] = w
    // console.log(botWorkerDict)

    // for error handling
    w.on('error', cb);

    // for exit
    w.on('exit', (code) => {
        // console.log(botWorkerDict)
        if (code !== 0) {
            console.error(new Error(`Worker stopped Code ${code}`))
        }
    });
}


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
    console.log("Main Thread Started");
    axios.get('https://truthbet.com/api/m/games', {
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


    interval = setInterval(function () {
        playCasino();
    }, 7000);

    // filling array with 100 items

}

function playCasinoRandom() {
    if (isPlay == true) return;
}

function betInterval() {
    let n = new Date().getTime()
    console.log(n, n - startBet, (remainingBet - 2) * 1000)
    if (n - startBet > (remainingBet - 2) * 1000) {
        clearInterval(betInt)
    } else {
        // console.log('betting')
        if (Object.keys(botWorkerDict).length > 0) {
            Object.keys(botWorkerDict).forEach(function (key) {
                var val = botWorkerDict[key];
                // console.log(key, val)
                val.postMessage({
                    action: 'bet',
                    data: currentBetData
                })
            });
        }
    }
}

function playCasino() {
    console.log(Object.keys(botWorkerDict))
    // console.log(`play ${currentList.length} ${Object.keys(workerDict).length}`)
    if (isPlay == true) return;
    if (isPlay == false && currentList.length == 0) {
        Object.keys(workerDict).forEach(function (key) {
            var val = workerDict[key];
            // console.log(key, val)
            val.worker.postMessage({
                'action': 'getCurrent'
            })
        });
        return
    }

    if (isPlay == false && currentList.length != Object.keys(workerDict).length) return;

    currentList.sort(compare)
    let found = true
    for (current of currentList) {
        // console.log(`table: ${current.table_id} percent: ${current.winner_percent} bot: ${current.bot}`)
        // console.log(current.winner_percent != 0, current.current.remaining >= 10, current.bot != null)
        if (current.winner_percent != 0 && current.bot != null) {
            if (current.winner_percent < 50) {
                win_percent = 100 - current.winner_percent
            } else {
                win_percent = current.winner_percent
            }

            if( win_percent == 100){
                win_percent = 92
            }

            console.log(`table: ${current.table_id} percent: ${win_percent} bot: ${current.bot}`)
            isPlay = true
            console.log('post play')
            workerDict[current.table_id].worker.postMessage({
                action: 'play',
            })
            // io.emit('bot_play', {
            //     current
            // });
            break;
        }
    }
    if (isPlay == false) {
        currentList = []
    }
}

// Defining callback method for receiving data or error on worker thread
function initiateWorker(table) {

    // define callback
    let cb = (err, result) => {
        if (err) {
            return console.error(err);
        }
        if (result.action == 'getCurrent') {
            // console.log(result)
            currentList.push(result)
        }
        if (result.action == 'played') {
            if (result.status == 'FAILED' || result.status == null) {
                isPlay = false
                currentList = []
                return
            }

            db.botTransction.findOne({
                where: {
                    bot_type: 1,
                },
                order: [
                    ['id', 'DESC']
                ]
            }).then((latest) => {
                let point = latest.point
                botTransactionObj['DEFAULT'] = null
                botTransactionObj[result.stats.bot] = null
                if (result.status == 'WIN') {
                    point += 1
                } else if (result.status == 'LOSE') {
                    point -= 1
                }
                botTransactionData = {
                    bot_type: result.bot_type,
                    table_id: result.table.id,
                    table_title: result.table.title,
                    shoe: result.shoe,
                    round: result.stats.round,
                    bet: result.stats.bot,
                    result: JSON.stringify(result.stats),
                    win_result: result.status,
                    user_count: 0,
                    point: point
                }

                db.botTransction.create(botTransactionData).then((created) => {
                    db.botTransction.findOne({
                        where: {
                            bot_type: 1,
                        },
                        order: [
                            ['id', 'DESC']
                        ]
                    }).then((res) => {


                        // console.log(res)
                        if (res) {

                            if (latestBotTransactionId != res.id) {
                                io.emit('all', {
                                    bet: res.bet
                                })
                                latestBotTransactionId = res.id
                            }

                            botTransactionData.id = res.id

                            if (Object.keys(botWorkerDict).length > 0) {
                                Object.keys(botWorkerDict).forEach(function (key) {
                                    var val = botWorkerDict[key];
                                    // console.log(key, val)
                                    val.postMessage({
                                        action: 'result_bet',
                                        bot_type: result.bot_type,
                                        table_id: result.table.id,
                                        table_title: result.table.title,
                                        shoe: result.shoe,
                                        round: result.stats.round,
                                        bet: result.stats.bot,
                                        result: JSON.stringify(result.stats),
                                        status: result.status,
                                        user_count: 0,
                                        botTransactionId: res.id,
                                        botTransaction: botTransactionData

                                    })
                                });
                            }
                        }
                    })
                })
            })

            isPlay = false
            currentList = []
        }
        if (result.action == 'bet') {
            startBet = new Date().getTime()
            betInt = setInterval(function () {
                betInterval();
            }, 3500);
            remainingBet = result.data.remaining
            currentBetData = result.data
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

    if (myWorker != null) {
        workerDict[table.id] = {
            worker: myWorker
        }
    }

    // post a multiple factor to worker thread
    // myWorker.postMessage({ multipleFactor: table });
}

function startWorker(table, path, cb) {
    // sending path and data to worker thread constructor
    // console.log(botConfig.user[table.id])
    table.token = botConfig.user[table.id]
    if (table.token == '') {
        return null
    }
    let w = new Worker(path, {
        workerData: table
    });

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