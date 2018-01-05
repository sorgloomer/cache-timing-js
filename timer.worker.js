export class WorkerTimer {
  constructor() {
    this.worker = new Worker("worker.timer.worker.js");
    this.buffer = new Int32Array(new SharedArrayBuffer(16));
    this.stamp_start = 0;
    this.stamp_end = 0;
    this.warmup();
  }
  warmup() {
    try {
      Atomics.store(this.buffer, 0, 0);
      Atomics.store(this.buffer, 1, 0);
      this.worker.postMessage(this.buffer);
    } catch (e) {}
  }
  start() {
    var buf = this.buffer;
    Atomics.store(buf, 1, 1);
    this.worker.postMessage(this.buffer);
    this.reset();
    this.stamp_start = Atomics.load(buf, 0);
  }
  
  reset() {
    var buf = this.buffer;
    Atomics.store(buf, 0, 0);
    var watchdog = Date.now() + 1000;
    while (Atomics.load(buf, 0) < 20) {
      if (watchdog < Date.now()) {
        throw new Error("Timer timeout");
      }
    }      
  }
  sample() {
    return Atomics.load(this.buffer, 0);
  }
  
  stop() {
    this.stamp_end = Atomics.load(this.buffer, 0);
    Atomics.store(this.buffer, 1, 0);
    return this.elapsed();
  }
  elapsed() {
    return this.stamp_end - this.stamp_start;    
  }
};
