function animation () {
  var canvas = document.querySelector('canvas'),
    cx = canvas.getContext('2d');

  var INCREMENT = 12345,
    MULTIPLIER = 1103515245,
    MODULUS = Math.pow(2, 31);

  // Todo esto son inputs del nodo generador
  var stepX = 16,
    stepY = 16,
    sizeX = 1,
    sizeY = 1,
    marginTop = 32,
    marginBottom = 32,
    marginLeft = 32,
    marginRight = 32;

  var frameID = void 0;

  function lcg (x) {
    var c = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : INCREMENT; var a = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : MULTIPLIER; var m = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : MODULUS;
    return (a * x + c) % m;
  }

  function createRandom () {
    var initialSeed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    var seed = initialSeed;
    return {
      get currentSeed () {
        return seed;
      },
      reset: function reset (newSeed) {
        seed = newSeed;
      },
      get: function get () {
        seed = lcg(seed);
        return seed / MODULUS;
      } };
  }

  var random = createRandom();

  function frame (frameTime) {
  // First element
    cx.clearRect(0, 0, cx.canvas.width, cx.canvas.height);
    for (var y = marginTop; y < cx.canvas.height - marginBottom; y += stepY) {
      random.reset(y);
      for (var x = marginLeft; x < cx.canvas.width - marginRight; x += stepX) {
        var randomValue = random.get();
        var distX = randomValue * 16;
        var distY = randomValue * 16;
        var phase = randomValue * Math.PI * 2;
        cx.fillStyle = '#000';
        cx.fillRect(
          x,
          y,
          sizeX + Math.sin(phase + frameTime / 1000) * distX,
          sizeY + Math.cos(phase + frameTime / 1000) * distY);
      }
    }
    frameID = window.requestAnimationFrame(frame);
  }

  function resize () {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }

  function start () {
    window.addEventListener('resize', resize);
    window.dispatchEvent(new Event('resize'));

    frameID = window.requestAnimationFrame(frame);
  }

  start();
}

export default animation;
