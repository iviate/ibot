require('log-timestamp');
const { parentPort, workerData } = require('worker_threads');

let interval;

registerForEventListening();

async function registerForEventListening() {
    console.log(`${workerData} hello`)
    // callback method is defined to receive data from main thread
    let cb = (err, result) => {
        if (err) return console.error(err);

        console.log(`${workerData} ${result}`)
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