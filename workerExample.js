function createBotWorker(obj, playData, is_mock) {
    let cb = (err, result) => {
        if (err) {
            return console.error(err);
        }
        if (result.action == 'bet_success') {
            result.win_percent = win_percent
            io.emit(`user${result.data.current.botObj.userId}`, result)
            console.log(`bac bot ${result.data.current.botObj.userId} bet success`)
        }
        if (result.action == 'bet_failed') {
            console.log(`bac bot ${result.botObj.userId} bet failed ${result.error}`)
        }
        if (result.action == 'restart_result') {
            io.emit(`user${result.userId}`, result)
        }

        if (result.action == 'info') {
            // console.log('bot info')
            io.emit(`user${result.userId}`, { ...result, isPlay: isBet, win_percent: win_percent, currentBetData: currentBetData })
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
            // console.log(result.action)
            // console.log(result.wallet.myWallet.MAIN_WALLET.chips.cre)
            let userWallet = result.wallet
            let winner_result = result.botTransaction.win_result
            if (result.botTransaction.win_result != 'TIE' && result.bet != result.botTransaction.bet) {
                if (result.botTransaction.win_result == 'WIN') {
                    winner_result = 'LOSE'
                } else if (result.botTransaction.win_result == 'LOSE') {
                    winner_result = 'WIN'
                }
            }
            let userTransactionData = {
                value: result.betVal,
                user_bet: result.bet,
                wallet: result.wallet,
                botId: result.botObj.id,
                result: winner_result,
                botTransactionId: result.botTransactionId
            }

            // console.log(userTransactionData)
            let indexIsStop = result.isStop || (result.botObj.is_infinite == false
                && userWallet >= result.botObj.init_wallet + Math.floor((((result.botObj.profit_threshold - result.botObj.init_wallet) * 94) / 100)))
            // || (userWallet - result.botObj.profit_wallet <= result.botObj.loss_threshold)
            // console.log(`isStop ${result.isStop}`)

            db.userTransaction.create(userTransactionData)
            io.emit(`user${result.botObj.userId}`, {
                action: "bet_result",
                wallet: result.wallet,
                playData: result.playData,
                status: result.status,
                isStop: indexIsStop,
                value: result.betVal,
                botId: result.botObj.id,
                botTransactionId: result.botTransactionId,
                botTransaction: result.botTransaction,
                botObj: result.botObj
            })

            // console.log(indexIsStop,
            //     result.botObj.is_infinite, userWallet,
            //     result.botObj.init_wallet, Math.floor((((result.botObj.profit_threshold - result.botObj.init_wallet) * 94) / 100)),
            //     userWallet - result.botObj.profit_wallet,
            //     result.botObj.loss_threshold)

            if (indexIsStop) {
                db.bot.findOne({
                    where: {
                        id: result.botObj.id
                    }
                }).then((res) => {
                    res.status = 3
                    res.stop_wallet = result.wallet
                    res.turnover = result.turnover
                    res.stop_by = (result.botObj.is_infinite == false && Math.floor(((result.botObj.profit_threshold * 94) / 100)) >= userWallet) ? 2 : result.isStop ? 1 : 4
                    // userWallet - result.botObj.profit_wallet <= result.botObj.loss_threshold ? 3 : 
                    res.save()
                    if (botWorkerDict.hasOwnProperty(res.userId) && botWorkerDict[res.userId] != undefined) {
                        botWorkerDict[res.userId].terminate()
                        delete botWorkerDict[res.userId]
                    } else {
                        delete botWorkerDict[res.userId]
                    }

                })
            }
            
            if (result.is_mock) {
                let paid = result.betVal
                if (winner_result == "WIN") {
                    if (result.bet == 'BANKER') {
                        paid += result.betVal * 0.95
                    } else {
                        paid += result.betVal
                    }

                } else if (winner_result == "LOSE") {
                    paid = 0
                }
                var zerofilled = ('000' + result.botTransaction.round).slice(-3);

                let mock_transaction = {
                    game_info: `${result.botTransaction.table_title} / ${result.botTransaction.shoe}-${zerofilled}`,
                    user_id: result.botObj.userId,
                    bet: result.bet,
                    bet_credit_chip_amount: result.betVal,
                    sum_paid_credit_amount: paid,
                    bet_time: result.bet_time
                }

                db.mockUserTransaction.create(mock_transaction)
            }
        }
    };

    let w = new Worker(__dirname + '/botWorker.js', {
        workerData: {
            obj: obj,
            playData: playData,
            is_mock: is_mock
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