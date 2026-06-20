const childProcess = require('child_process');
const { EventEmitter } = require('events');

const originalExec = childProcess.exec;

childProcess.exec = function patchedExec(command, options, callback) {
  let cb = callback;
  if (typeof options === 'function') {
    cb = options;
  }

  if (typeof command === 'string' && command.trim().toLowerCase() === 'net use') {
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.kill = () => true;
    child.pid = 0;
    child.killed = false;

    process.nextTick(() => {
      if (cb) cb(new Error('net use disabled in verification sandbox'), '', '');
      child.emit('exit', 1, null);
      child.emit('close', 1, null);
    });

    return child;
  }

  return originalExec.apply(this, arguments);
};
