function getWindowSize(parent_div) {
    const canvasDiv = document.getElementById(parent_div);
    const width = canvasDiv.offsetWidth;
    const height = canvasDiv.offsetHeight;

    return { "width": width, "height": height }
}

function isNegative(num) {
    if (Math.sign(num) === -1) {
        return true;
    }

    return false;
}

let sketchPixelate = function (p) {

    p.preload = function () {
        source = p.loadImage(img);
    }

    p.setup = function () {
    };

    p.draw = function () {
        let pixelation_level = 10;

        const windowSize = getWindowSize(parent_div);
        p.createCanvas(windowSize.width, windowSize.height);

        p.pixelDensity(1);
        p.image(source, 0, 0, windowSize.width, windowSize.height);
        p.loadPixels();
        p.noStroke();

        challenge_value = challenge

        if ((challenge_value == "") || (challenge_value == 0) || isNegative(challenge_value) == true) {
            p.fill("#006fad");
            p.rect(0, 0, windowSize.width, windowSize.height);
        } else if (challenge_value != 1) {
            challenge_value = Math.trunc((1 - challenge_value) * 50 + 2);
            if (challenge_value == 0) {
                challenge_value = 1;
            }

            pixelation_level = challenge_value;

            width = p.width
            height = p.height
            pixels = p.pixels

            for (let x = 0; x < width; x += pixelation_level) {
                for (let y = 0; y < height; y += pixelation_level) {

                    let i = (x + y * width) * 4;

                    let r = pixels[i + 0];
                    let g = pixels[i + 1];
                    let b = pixels[i + 2];
                    let a = pixels[i + 3];

                    p.fill(r, g, b, a);

                    p.square(x, y, pixelation_level);
                }
            }
        }

        p.noLoop();

    }

    p.windowResized = function () {
        newWindowSize = getWindowSize(parent_div);
        p.resizeCanvas(newWindowSize.width, newWindowSize.height);
        p.redraw();
    }
}

function initPixelate(model) {
    parent_div = model["div"]
    img = model["file"]
    challenge = model["progress"]
    user = model["user"]
    let pixelate = new p5(sketchPixelate, parent_div);
}

// model = { "div": "app", "user": 1, "progress": 1, "file": "prague_og.jpg" }
// initPixelate(model)