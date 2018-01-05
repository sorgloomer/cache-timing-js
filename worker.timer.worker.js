self.onmessage = function(e) {
  var b = e.data;
  while (Atomics.load(b, 1)) {
    Atomics.add(b, 0, 1);
  }
};