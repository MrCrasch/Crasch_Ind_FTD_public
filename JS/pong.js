//pong.js
//will be turned into oop (at some point)
const Jimp = require("jimp");
const path = require('path');

const fontPath = "node_modules\\@jimp\\plugin-print\\fonts\\open-sans\\open-sans-16-white\\open-sans-16-white.fnt";

// You can try higher res, but the generation time will suffer 
const width = 310;
const height = 210;
const movementSpeed = 3
let botDebuff = 5;

let scores = [0, 0];

class pongBall {
    constructor(pos_x, pos_y) {
        this.pX = pos_x;
        this.pY = pos_y;
        this.vX = 0;
        this.vY = 0;
    }

    update() {
        // Check for collision with top and bottom walls
        if (this.pY <= 0 || this.pY >= height) {
            this.vY = -this.vY;
        }

        // Update ball position
        this.pX = this.pX + this.vX;
        this.pY = this.pY + this.vY;

        // Check for collision with paddles
        this.checkPaddleCollision();

        // Check if ball is out of bounds (scoring)
        if (Math.abs(this.pX - Math.floor(width / 2)) > Math.floor(width / 2)) {
            this.increaseScore();
            this.vX = -this.vX;

            if (Math.abs(this.vX) < 3) {
                this.vX = this.vX + 1;
            }

            this.pX = Math.floor(width/2);
            this.pY =Math.floor(height/2);
        }
    }

    increaseScore() {
        if (this.pX > width / 2) {
            scores[1] = scores[1] + 1;
        }

        if (this.pX < width / 2) {
            scores[0] = scores[0] + 1;
        }
    }

    checkPaddleCollision() {
        // Check collision with left paddle
        if (this.pX - 3 <= lPaddle.pX + lPaddle.width && 
            this.pY >= lPaddle.pY && this.pY <= lPaddle.pY + lPaddle.height) {
            this.vX = -this.vX;
            this.pX = lPaddle.pX + lPaddle.width + 3; // Prevent ball from getting stuck

            botDebuff = (Math.random()) * 40 -20
        }

        // Check collision with right paddle
        if (this.pX + 3 >= rPaddle.pX && 
            this.pY >= rPaddle.pY && this.pY <= rPaddle.pY + rPaddle.height) {
            this.vX = -this.vX;
            this.pX = rPaddle.pX - 3; // Prevent ball from getting stuck

            botDebuff = (Math.random()) * 40 -20
        }
    }
}

class paddle {
    constructor(pos_x) {
        this.pX = pos_x;
        this.pY = height / 2 - 10;
        this.width = 5;
        this.height = 40;
    }

    // Method to draw the paddle on the image
    draw(image) {
        const color = 0xFFFFFFFF; // White color for the paddle

        for (let x = this.pX; x < this.pX + this.width; x++) {
            for (let y = this.pY; y < this.pY + this.height; y++) {
                if (x >= 0 && x < image.bitmap.width && y >= 0 && y < image.bitmap.height) {
                    image.setPixelColor(color, x, y);
                }
            }
        }
        return image;
    }
}

const ball = new pongBall(width / 2, height / 2);
ball.vY = 3;
ball.vX = 3;

const lPaddle = new paddle(5);
const rPaddle = new paddle(width - 10);

const drawScores = async (scores, image) => {
    // Load the font (await the promise)
    const font = await Jimp.loadFont(fontPath);

    // Create the text to display
    const text = `${scores[1]} - ${scores[0]}`;

    // Measure the width and height of the text
    const textWidth = Jimp.measureText(font, text);
    const textHeight = Jimp.measureTextHeight(font, text, width);

    // Calculate the position for the text
    const x = (width - textWidth) / 2;
    const y = textHeight * 1.1;

    // Print the text on the image
    return image.print(font, x, y, text);
};


const drawBall = (ball, image) => {
    const ballRadius = 3; // This will make a 6x6 square (adjust for larger squares)
    const color = 0xFFFFFFFF; // White color for the ball

    // Loop through the square region to set the pixel colors
    for (let x = Math.round(ball.pX) - ballRadius; x <= Math.round(ball.pX) + ballRadius; x++) {
        for (let y = Math.round(ball.pY) - ballRadius; y <= Math.round(ball.pY) + ballRadius; y++) {
            if (x >= 0 && x < image.bitmap.width && y >= 0 && y < image.bitmap.height) {
                image.setPixelColor(color, x, y);
            }
        }
    }
    return image;
};

const paddleUpdate = (inputLeft) => {
    if (inputLeft == 1) {
        lPaddle.pY = lPaddle.pY - movementSpeed
    }

    if (inputLeft == -1) {
        lPaddle.pY = lPaddle.pY + movementSpeed
    }

    //boundaries
    lPaddle.pY = Math.min(height-45,lPaddle.pY)
    lPaddle.pY = Math.max(5,lPaddle.pY)


    if (ball.pY-botDebuff > rPaddle.pY) {
        rPaddle.pY = rPaddle.pY + movementSpeed
    } 
    //don't make it perfect
    if (ball.pY-botDebuff < rPaddle.pY){
        rPaddle.pY = rPaddle.pY - movementSpeed
    }

    //boundaries
    rPaddle.pY = Math.min(height-45,rPaddle.pY)
    rPaddle.pY = Math.max(5,rPaddle.pY)

};

const pong = async (data) => {
    // Create a new image with a black background
    let pongImage = new Jimp(width, height, 0x000000FF);
    paddleUpdate(data[3])
    // Draw the paddles on the image
    pongImage = lPaddle.draw(pongImage);
    pongImage = rPaddle.draw(pongImage);

    // Draw scores on the image
    pongImage = await drawScores(scores, pongImage);

    // Update the ball position
    ball.update();

    // Draw the ball on the image
    pongImage = drawBall(ball, pongImage);

    // Return the image as a buffer
    const buffer = await pongImage.getBufferAsync(Jimp.MIME_PNG);
    return buffer;
};

module.exports = {
    pong
};
