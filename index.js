import { CacheTimingChannel } from "./cache-timing.js";
import { delay } from "./utils.js";

var sidechannel = CacheTimingChannel;

async function main() {
  for (var trial = 1; ; trial++) {
    console.log("run trial #" + trial);
    await delay(500);
    try {
      for (var i = 0; i < 16; i++) {
        var m = await sidechannel.measure(i);
        console.log(m);
        await delay(200);
      }
      break;
    } catch (e) {
      if (trial >= 5) throw e;
    }
  }
  console.log("done");
}

function _main() {
  main().catch(console.error);
}
setTimeout(_main, 100);

