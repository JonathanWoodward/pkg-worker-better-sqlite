const { parentPort } = require('worker_threads');
const db = require('better-sqlite3')('foobar.db');

parentPort.on('message', ({ operator, parameters }) => {
    const result = db.prepare('SELECT 1').run();
    parentPort.postMessage(result);
});