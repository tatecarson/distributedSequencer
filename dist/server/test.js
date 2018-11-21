"use strict";

var NS_PER_SEC = 1e9;
var time = process.hrtime();
// [ 1800216, 25 ]

setTimeout(function () {
  var diff = process.hrtime(time);
  // [ 1, 552 ]

  console.log("Benchmark took " + diff[0] + " nanoseconds");
  // benchmark took 1000000552 nanoseconds
}, 1000);