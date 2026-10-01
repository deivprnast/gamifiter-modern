class Tile {
  constructor(index, x, y) {
    this.index = index;
    this.x = x;
    this.y = y;
  }
}

function getWindowSize(parent_div) {
    const canvasDiv = parent_div;
    const width = canvasDiv.offsetWidth;
    const height = canvasDiv.offsetHeight;
    console.debug(width, height);
    return { "width": width, "height": height }
}

function shuffleArray(array, seed) {
  const generator = new Math.seedrandom(seed);
  randomNumber = generator();
  for (let i = array.length - 1; i > 0; i--) {
    randomNumber = generator();
    const j = Math.floor(randomNumber * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }

  return array
}

let sketchPuzzle = function (p) {

  p.preload = function () {
    source = p.loadImage(img);
  }

  p.setup = function () {
  };

  p.draw = function () {
    let tiles = [];
    let indexes = [];
    let w, h;
    const cols = 12;
    const rows = 8;
    const n = cols * rows;
    const toFill = Math.round((challenge * 100 * n) / 100);

    const windowSize = getWindowSize(parent_div);
    p.createCanvas(windowSize.width, windowSize.height);
    w = windowSize.width / cols;
    h = windowSize.height / rows;

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        let x = i * w;
        let y = j * h;
        let index = i + j * cols;
        let tile = new Tile(index, x, y);
        tiles.push(tile);
        indexes.push(index);
      }
    }

    shuffledTiles = shuffleArray(indexes, user);
    toFillArray = shuffledTiles.slice(0, toFill);

    p.image(source, 0, 0, windowSize.width, windowSize.height);

    const fillColor = "#006fad";
    const strokeColor = "##F8F8F8";
    const strokeBold = 1;

    for (let i = 0; i < tiles.length; i++) {
      if (toFillArray.includes(tiles[i].index)) {
        p.noFill();
      } else {
        p.fill(fillColor)
      }
      if (challenge != 1) {
        p.stroke(strokeColor);
        p.strokeWeight(strokeBold);
      } else {
        p.stroke(0);
        p.strokeWeight(0);
      }
      p.rect(tiles[i].x, tiles[i].y, w, h);
    }

    p.noLoop();

  }

  p.windowResized = function () {
    newWindowSize = getWindowSize(parent_div);
    p.resizeCanvas(newWindowSize.width, newWindowSize.height);
    p.redraw();
  }
}

function initPuzzle(model) {
  parent_div = model["div"]
  img = model["file"]
  challenge = model["progress"]
  user = model["user"]
  let puzzle = new p5(sketchPuzzle, parent_div);
}

// model = { "div": "app", "user": 1, "progress": 0.1, "image": "img.jpg" }
// initPuzzle(model)