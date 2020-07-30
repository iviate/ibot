require('log-timestamp');
const { parentPort, workerData } = require('worker_threads');
const axios = require('axios');

let interval;
let systemData = { id: 2, initial: 50, max_turn: 4, current_bet: 50 }
let current = {}
let token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjp7InVpZCI6NTY1MTg2fSwiaWF0IjoxNTk2MDk3NDMyfQ.rRenAnBa92k4xSuRPf5sor3c1v-3fx8EIBB75HV55jM'
registerForEventListening();

function bet(data) {

    let payload = { table_id: data.table_id, game_id: data.game_id }
    if (data.bot == 'PLAYER') {
        payload.chip = { credit: { PLAYER: systemData.current_bet } }
    } else if (data.bot == 'BANKER') {
        payload.chip = { credit: { BANKER: systemData.current_bet } }
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
            console.log(response.data);
            current = { round: data.round, table: data.table_id }
            parentPort.postMessage({action: 'bet_success'})
        })
        .catch(error => {
            console.log(`bot ${workerData.id} bet: ${error}`);
            parentPort.postMessage({action: 'bet_failed'})
        });
}


function registerForEventListening() {
    console.log(`${workerData.id} hello`)
    // callback method is defined to receive data from main thread
    let cb = (err, result) => {
        if (err) return console.error(err);
        if (result.action == 'bet') {
            bet(result.data)
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