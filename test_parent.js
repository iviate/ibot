require('log-timestamp');
const { Worker } = require('worker_threads');



let workerDict = {}

mainBody()
function mainBody(){

    let cb = (err, result) => {
        if (err) { return console.error(err); }
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

    for(let i = 0; i < 1000; i++)
    {
        let w = new Worker(__dirname + '/test_worker.js', { workerData: i });
        
        // registering events in main thread to perform actions after receiving data/error/exit events
        w.on('message', (msg) => {
            // data will be passed into callback
            cb(null, msg);
        });
        workerDict[i] = w

        // for error handling
        w.on('error', cb);

        // for exit
        w.on('exit', (code) => {
            if (code !== 0) {
                console.error(new Error(`Worker stopped Code ${code}`))
            }
        });
    }

    setInterval(function () { test(); }, 60000);
}

function test(){
    console.log('post message')
    if(Object.keys(workerDict).length == 1000){
        Object.keys(workerDict).forEach(function (key) {
            var val = workerDict[key];
            // console.log(key, val)
            val.postMessage('working')
        });
        console.log('finish 1000 thread working')
    }
    
}