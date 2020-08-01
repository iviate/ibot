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

const db = require("./app/models");
const { Op } = require("sequelize");
const e = require('express');
const {
    syncBuiltinESMExports
} = require('module');
// const { USE } = require('sequelize/types/lib/index-hints');
db.sequelize.sync({
    alter: true
});
//db.sequelize.sync();
let botNumber = 0;
let botWorkerDict = {};
let token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjp7InVpZCI6NTY1MTg2fSwiaWF0IjoxNTk2MjM2ODc3fQ.bkL7nPjdWt2_zU2jbuZnYz_QLYLQjWKNLTYlZCKU494"

var myApp = require('express')();
myApp.use(bodyParser.json())
var http = require('http').Server(myApp);
var io = require('socket.io')(http);

io.on('connection', (socket) => {
    console.log('socket connection')
    socket.on('chat message', (msg) => {
        console.log(msg)
        io.emit('chat message', msg);
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
            if (result) {
                db.bot.findOne({
                    status: {
                        [Op.ne]: 3
                    }
                }).then((res2) => {
                    let hasBot = null
                    if(res2){
                        hasBot = res2
                    }
                    response.json({
                        success: true,
                        data: {user_id: user.id, has_bot: true}
                    });
                })
                
            } else {
                response.json({
                    success: false,
                    message: 'ข้อมูลไม่ถูกต้องกรุณาลองใหม่อีกครั้ง'
                });
            }
        });
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
                    bcrypt.hash(PASSWORD, 12, function (err, hash) {
                        db.user.create({
                            username: USERNAME,
                            password: hash,
                            truthbet_token: data.jwtToken,
                            truthbet_token_at: db.sequelize.fn('NOW')
                        }).then((result) => {
                            db.user.findOne({
                                where:{
                                    username: USERNAME
                                }
                            }).then((res) => {
                                response.json({
                                    success: true,
                                    data: {user_id: res.id}
                                });
                            })
                        })
                        
                    });

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
        while (turn < 20 && (profit / turn / 25 >= 1)) {
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
        let turn = Math.ceil(profit / half_bet)
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
            db.bot.update({ status : 3 },{ where : { userId : user.id }}); 
            botData = {
                userId: user.id,
                token: user.truthbet_token,
                token_at: user.truthbet_token_at,
                status: 1,
                bot_type: request.body.bot_type,
                money_system: request.body.money_system,
                profit_threshold: request.body.profit_threshold,
                loss_threshold: request.body.loss_threshold,
                init_wallet: request.body.init_wallet,
                init_bet: request.body.init_bet,
                max_turn: 0,
            }

            let playData = processBotMoneySystem(botData.money_system, botData.init_wallet, botData.profit_threshold, botData.init_bet)
            botData.data = JSON.stringify(playData)

            let botObj = db.bot.create(botData)
            db.bot.findOne({
                where: {
                    userId: user.id,
                },
                order: [
                    ['id', 'DESC']
                ]
            }).then((res) => {
                // console.log(res)
                if(res){
                    botData.id = res.id
                    console.log(botData)
                    createBotWorker(botData, playData)
                }
            })

            
            response.json({
                success: true,
                error_code: 0,
                data: botObj
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
                    user_id: user.id,
                    status: 2
                },
            }).then((botObj) => {
                if(botObj){
                    botObj.status = 2
                    botObj.save()
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
                if(botObj){
                    botObj.status = 2
                    botWorkerDict[user.id].postMessage({ action: 'pause'})
                    botObj.save()
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

myApp.post('/stop', async function (request, response) {
    const USERNAME = request.body.username
    db.user.findOne({
        where: {
            username: USERNAME,
            status: {
                [Op.or]: [1, 2]
              }
        },
    }).then((user) => {
        if (user) {
            db.bot.findOne({
                where: {
                    userId: user.id,
                    status: 1
                },
            }).then((botObj) => {
                if(botObj){
                    botObj.status = 3
                    botObj.save()
                    botWorkerDict[user.id].terminate()
                    delete botWorkerDict[user.id]
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

myApp.get('/user_bot_transaction/:bot_id', function(request, response){
    db.userTransaction.findAll({
        limit: 50,
        where: {
            botId: request.params.bot_id
        },
        order: [
            ['id', 'ASC']
        ],
        
        include: [ {
            model: db.bot,
            as: 'bot'
          }, {
            model: db.botTransction,
            as: 'bot_transaction'
          } ]
    }).then((res) => {
        response.json({
            success: true,
            error_code: null,
            data: res
        })
    })  
})

myApp.get('/bot_transaction', function(request, response){
    db.botTransction.findAll({
        limit: 100,
        order: [
            ['id', 'DESC']
        ],
    }).then((res) => {
        response.json({
            success: true,
            error_code: null,
            data: res
        })
    })  
})

myApp.get('/wallet/id', function (request, response) {
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
                    response.json({
                        success: true,
                        error_code: null,
                        data: res.data
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

http.listen(3000, function () {
    console.log('listening *.3000');
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

mainBody();

function createBotWorker(obj, playData) {
    let cb = (err, result) => {
        if (err) {
            return console.error(err);
        }
        if (result.action == 'bet_success') {
            io.emit(result.username, { data: {}})
            console.log(`bot ${result.id} bet success`)
        }
        if (result.action == 'bet_failed') {
            console.log(`bot ${result.id} bet failed`)
        }
        if (result.action == 'process_result') {
            // console.log(result.wallet.myWallet.MAIN_WALLET.chips.cre)

            let userTransactionData = {
                value: result.betVal,
                wallet: result.wallet.myWallet.MAIN_WALLET.chips.credit,
                botId: result.botObj.id,
                botTransactionId: result.botTransactionId
            }

            // console.log(userTransactionData)

            userTransactionObj = db.userTransaction.create(userTransactionData)
            
            io.emit(`user${result.botObj.userId}`, {
                wallet: result.wallet, 
                playData: result.playData, 
                status: result.status
            })

            
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
    }, 10000);

    // filling array with 100 items

}

function playCasinoRandom(){
    if (isPlay == true) return;
}

function playCasino() {
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
            console.log(`table: ${current.table_id} percent: ${current.winner_percent} bot: ${current.bot}`)
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
            botTransactionData = {
                bot_type: result.bot_type,
                table_id: result.table.id,
                table_title: result.table.title,
                shoe: result.shoe,
                round: result.stats.round,
                bet: result.stats.bot,
                result: JSON.stringify(result.stats),
                win_result: result.status,
                user_count: 0
            }

            let botTransactionObj = db.botTransction.create(botTransactionData)
            db.botTransction.findOne({
                where: {
                    bot_type: 1,
                },
                order: [
                    ['id', 'DESC']
                ]
            }).then((res) => {
                // console.log(res)
                if(res){
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
                                botTransactionId: res.id
                            })
                        });
                    }
                }
            })
            

            isPlay = false
            currentList = []
        }
        if (result.action == 'bet') {
            if (Object.keys(botWorkerDict).length > 0) {
                Object.keys(botWorkerDict).forEach(function (key) {
                    var val = botWorkerDict[key];
                    // console.log(key, val)
                    val.postMessage({
                        action: 'bet',
                        data: result.data
                    })
                });
            }
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

    if(myWorker != null){
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
    if(table.token == ''){
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