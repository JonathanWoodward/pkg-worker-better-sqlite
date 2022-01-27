const { Worker } = require('worker_threads');
const WorkerThread = require("./worker.js");

/* Export a function that queues pending work. */
const queue = [];
const MyWorkerTask = (operator, parameters) => {
    queue.push({operator, parameters});
    drainQueue();
};

/* Instruct workers to drain the queue. */
let workers = [];
function drainQueue() {
    for (const worker of workers) {
        worker.takeWork();
    }
}

function spawn() {
    // this requires the file to exist after pkg has built it
    //const worker = new Worker("./worker.js"); // Error: Cannot find module 'worker.js'

    // so instead I tried this
    const thread = WorkerThread.toString();
    const functionBegin = thread.indexOf("{") + 1;
    const worker = new Worker(thread.substring(functionBegin, thread.length-1), { 
        eval: true
    });
    // but running it this way you will get the error in worker.js SyntaxError: Unexpected identifier because it can not find the node module


    let job = null; // Current item from the queue
    let error = null; // Error that caused the worker to crash

    function takeWork() {
        if (!job && queue.length) {
            // If there's a job in the queue, send it to the worker
            job = queue.shift();
            worker.postMessage(job);
        }
    }
    worker.on('online', () => {
        workers.push({ takeWork });
        takeWork();
    }).on('message', (result) => {
        console.log("WORKER task completed task:", job.operator, result);
        job = null;
        takeWork(); // Check if there's more work to do
    }).on('error', (err) => {
        console.error(err);
        error = err;
    }).on('exit', (code) => {
        workers = workers.filter(w => w.takeWork !== takeWork);
        if (code !== 0) {
            console.error(`worker exited with code ${code}`);
            spawn(); // Worker died, so spawn a new one
        }
    }); 
}
spawn();

setInterval(() => {
    console.log(`timeout add MyWorkerTask`);
    MyWorkerTask("TEST", { id: 1 });
}, 1000);
