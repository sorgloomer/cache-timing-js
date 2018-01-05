
function getClock() {
  if (typeof performance === "object") {
    return performance.now.bind(performance);
  }
  return Date.now.bind(Date);
}

/*
  regression equation:
  t = a*x_idx + b*x_1 + c*x_stage
  
 (t0)   (0 1 0)T        
 (t1)   (1 1 0)    (a)
 (t2) = (2 1 0)  * (b)
 (t3)   (0 1 1)    (c)
 (t4)   (1 1 1)    
 (t5)   (2 1 1)
 
*/

/*

// SAGE SCRIPT
SAMPLE_COUNT = 5
m = Matrix(RR, [[i,1,[0,1][i>=SAMPLE_COUNT]] for i in range(2 * SAMPLE_COUNT)])
k = ((m.T*m).inverse()*m.T)

print("const COEFF = [" + ", ".join("{:.3f}".format(float(x)) for x in k[2]) + "];")

*/

// const COEFF = [0.1727, 0.1121, 0.0515, -0.0091, -0.0697, -0.1303, -0.1909, -0.2515, -0.3121, -0.3727, 0.3727, 0.3121, 0.2515, 0.1909, 0.1303, 0.0697, 0.0091, -0.0515, -0.1121, -0.1727];
// const COEFF = [0.0197, 0.0191, 0.0185, 0.0179, 0.0173, 0.0167, 0.0161, 0.0155, 0.0149, 0.0143, 0.0137, 0.0131, 0.0125, 0.0119, 0.0113, 0.0107, 0.0101, 0.0095, 0.0089, 0.0083, 0.0077, 0.0071, 0.0065, 0.0059, 0.0053, 0.0047, 0.0041, 0.0035, 0.0029, 0.0023, 0.0017, 0.0011, 0.0005, -0.0001, -0.0007, -0.0013, -0.0019, -0.0025, -0.0031, -0.0037, -0.0043, -0.0049, -0.0055, -0.0061, -0.0067, -0.0073, -0.0079, -0.0085, -0.0091, -0.0097, -0.0103, -0.0109, -0.0115, -0.0121, -0.0127, -0.0133, -0.0139, -0.0145, -0.0151, -0.0157, -0.0163, -0.0169, -0.0175, -0.0181, -0.0187, -0.0193, -0.0199, -0.0205, -0.0211, -0.0217, -0.0223, -0.0229, -0.0235, -0.0241, -0.0247, -0.0253, -0.0259, -0.0265, -0.0271, -0.0277, -0.0283, -0.0289, -0.0295, -0.0301, -0.0307, -0.0313, -0.0319, -0.0325, -0.0331, -0.0337, -0.0343, -0.0349, -0.0355, -0.0361, -0.0367, -0.0373, -0.0379, -0.0385, -0.0391, -0.0397, 0.0397, 0.0391, 0.0385, 0.0379, 0.0373, 0.0367, 0.0361, 0.0355, 0.0349, 0.0343, 0.0337, 0.0331, 0.0325, 0.0319, 0.0313, 0.0307, 0.0301, 0.0295, 0.0289, 0.0283, 0.0277, 0.0271, 0.0265, 0.0259, 0.0253, 0.0247, 0.0241, 0.0235, 0.0229, 0.0223, 0.0217, 0.0211, 0.0205, 0.0199, 0.0193, 0.0187, 0.0181, 0.0175, 0.0169, 0.0163, 0.0157, 0.0151, 0.0145, 0.0139, 0.0133, 0.0127, 0.0121, 0.0115, 0.0109, 0.0103, 0.0097, 0.0091, 0.0085, 0.0079, 0.0073, 0.0067, 0.0061, 0.0055, 0.0049, 0.0043, 0.0037, 0.0031, 0.0025, 0.0019, 0.0013, 0.0007, 0.0001, -0.0005, -0.0011, -0.0017, -0.0023, -0.0029, -0.0035, -0.0041, -0.0047, -0.0053, -0.0059, -0.0065, -0.0071, -0.0077, -0.0083, -0.0089, -0.0095, -0.0101, -0.0107, -0.0113, -0.0119, -0.0125, -0.0131, -0.0137, -0.0143, -0.0149, -0.0155, -0.0161, -0.0167, -0.0173, -0.0179, -0.0185, -0.0191, -0.0197];
const COEFF = [0.5000, -1.5000, 1.5000, -0.5000];

const SAMPLE_COUNT = (COEFF.length / 2)|0;


export class RegressionTimer {
  constructor(clock=getClock()) {
    this.clock = clock;
    this.tick_iterations = 2;
    this.data = new Float64Array(SAMPLE_COUNT * 2);
    this.calibrate();
    this._junk = 0;
  }
  calibrate() {
    // force JIT
    for (var i = 0; i < 50; i++) {
      this._calibrate();
    }
  }
  _calibrate() {
    var confidence = 0;
    for (;;) {
      let acc = 0, ticks = this.tick_iterations;
      var start = this.clock();
      for (var i = 0; i < ticks; i++) {
        acc ^= i ^ (i >> 6) ^ (i << 6);
      }
      var delta = this.clock() - start;
      this._junk ^= acc;
      if (delta > 0.008) {
        confidence++;
        if (confidence > 20) {
          return;
        }
      } else {
        confidence = 0;
        this.tick_iterations = (this.tick_iterations * 1.5) |0;
      }
    }
  }
  sample(stage) {
    const index = stage * SAMPLE_COUNT;
    const m = this.data;
    const ticks = this.tick_iterations;
    var acc = 0;
    
    for (var j = 0; j < SAMPLE_COUNT; j++) {
      for (var i = 0; i < ticks; i++) {
        acc ^= i ^ (i >> 6) ^ (i << 6);
      }
      m[index + j] = this.clock();
    }
    this._junk ^= acc;
  }
  start() {
    this.sample(0);
  }
  stop() {
    this.sample(1);
    const pivot = this.data[0];
    for (var j = 0; j < this.data.length; j++) {
      this.data[j] -= pivot;
    }
  }
  elapsed() {
    var time_in_gap = 0;
    for (var j = 0; j < COEFF.length; j++) {
      time_in_gap += (this.data[j] - this.data[0]) * COEFF[j];
    }
    return time_in_gap;
  }
};
