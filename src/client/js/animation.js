import interpolate from 'color-interpolate';

export function animation () {
  var canvas = document.querySelector('canvas');
  var cx = canvas.getContext('2d');

  var INCREMENT = 12345;
  var MULTIPLIER = 1103515245;
  var MODULUS = Math.pow(2, 31);

  // Todo esto son inputs del nodo generador
  var stepX = 8;
  var stepY = 8;
  var sizeX = 2;
  var sizeY = 2;
  var marginTop = 32;
  var marginBottom = 32;
  var marginLeft = 32;
  var marginRight = 32;

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

    if (frameTime % 25 === 0) {
      cx.clearRect(0, 0, cx.canvas.width, cx.canvas.height);
    }
    for (var y = marginTop; y < cx.canvas.height - marginBottom; y += stepY) {
      random.reset(y);
      for (var x = marginLeft; x < cx.canvas.width - marginRight; x += stepX) {
        var randomValue = random.get();
        var distX = randomValue * 6;
        var distY = randomValue * 4;
        var phase = randomValue * Math.PI * 2;
        cx.fillStyle = '#FC9D9A';
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

export function bgAnimate (h) {
  let heading = h.toFixed(3);
  let colormap = interpolate(['#FE4365', '#FC9D9A', '#F9CDAD', '#FE4365', '#FC9D9A', '#F9CDAD', '#FE4365']);
  // let colormap = interpolate(['#FE4365', '#FC9D9A', '#F9CDAD', '#FE4365']);
  const position = document.querySelector('#d');
  const hitColor = '#C8C8A9';
  document.querySelector('body').style.background = colormap(heading);
  if (heading > 0.000 && heading < 0.009) {
    position.innerHTML = `<p>
    Position 1
    </p>`;
    document.querySelector('body').style.background = hitColor;
  } else if (heading > 0.250 && heading < 0.260) {
    position.innerHTML = `<p>
    Position 2
    </p>`;
    document.querySelector('body').style.background = hitColor;
  } else if (heading > 0.500 && heading < 0.510) {
    position.innerHTML = `<p>
    Position 3
    </p>`;
    document.querySelector('body').style.background = hitColor;
  } else if (heading > 0.750 && heading < 0.760) {
    position.innerHTML = `<p>
    Position 4
    </p>`;
    document.querySelector('body').style.background = hitColor;
  }
}
