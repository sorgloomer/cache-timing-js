export function delay(x, v=undefined) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(v);
    }, x);
  });
}

export function rnd(seed1, seed2) {
  var j = seed1;
  j = j ^ (j >> 13);
  j = j ^ (j << 17);
  j = j ^ (j >> 13);
  j = j ^ (j << 17);
  j ^= seed2;
  j = j ^ (j >> 13);
  j = j ^ (j << 17);
  j = j ^ (j >> 13);
  j = j ^ (j << 17);
  return j;
}
