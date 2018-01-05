import { RegressionTimer } from "./timer.regression.js";
import { WorkerTimer } from "./timer.worker.js";

var t = new RegressionTimer();
self._junk = 0;

function measure() {
  t.start();
  for (var i = 1,a=0; a < 12; i++) a += 1/i;
  t.stop();
  self._junk ^= a;
}
function main() {
  var data = [];
  for (var k = 0; k < 20; k++) {
    measure();
  }
  
  for (var k = 0; k < 100; k++) {
    measure();
    data.push(t.elapsed());
  }
  
  var mean = 0;
  var sq_mean = 0;
  for (var x of data) {
    mean += x;
    sq_mean += x*x;
  }
  mean /= data.length;
  sq_mean /= data.length;
  var variance = sq_mean - mean*mean;
  var sigma = Math.sqrt(variance);
  console.log("sigma:", sigma, "mean:", mean, "sigma/mean:", sigma/mean);
  
  const DEBUG = 0;
  if (DEBUG) {
    console.log(
      Array.from(t.data).map((d,i) => "" + i + " " + d).join("\n")
    );
  }
  
  
}
setTimeout(main, 100);

