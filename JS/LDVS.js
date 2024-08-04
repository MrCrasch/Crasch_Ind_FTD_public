const Jimp = require("jimp");

const rows = 20;
const cols = 29;
const defaultValue = 5500;
const scale = 10; // Scale factor for image size

let count = 0;
let imageCount = 0;

let image = Array.from({ length: rows }, () => Array(cols).fill(defaultValue));

function LDVS(data) {
    const id = data[3];
    const colors = JSON.parse(data[4]);
    const row = parseInt(data[5], 10);
    const content = JSON.parse(data[6]);

    image[row] = content;

    const min_max = findMinMaxValues();

    imageCount = row % 2;
    generateImage(min_max.minValue, min_max.maxValue, colors, "output" + imageCount + ".png");
}

const findMinMaxValues = () => {
    let minValue = Infinity;
    let maxValue = -Infinity;

    image.forEach(row => {
        row.forEach(value => {
            if (value !== defaultValue) {
                if (value < minValue) {
                    minValue = value;
                }
                if (value > maxValue) {
                    maxValue = value;
                }
            }
        });
    });

    return { minValue, maxValue };
};

const interpolateColor = (color1, color2, factor) => {
    const result = color1.slice();
    for (let i = 0; i < 3; i++) {
        result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
    }
    return result;
};

const generateImage = async (minValue, maxValue, colors, filename) => {
    const [color1, color2] = colors;

    const width = cols * scale; // Scale width
    const height = rows * scale; // Scale height
    const jimpImage = new Jimp(width, height, 0xFFFFFFFF);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const value = image[Math.floor(y / scale)][Math.floor(x / scale)]; // Map pixel to original image
            let color;
            if (value === defaultValue) {
                color = [0, 0, 0]; // For default values
            } else {
                const factor = (value - minValue) / (maxValue - minValue);
                color = interpolateColor(color1, color2, factor);
            }
            const hexColor = Jimp.rgbaToInt(color[0], color[1], color[2], 255);
            jimpImage.setPixelColor(hexColor, x, y);
        }
    }

    await jimpImage.writeAsync(filename);
    count++;
    // console.log(`Image generated as ${filename}`);
};

const rates = () => {
    // In the span of one second, how many requests did we do
    console.log("Image Gen Rate: " + count + "/s");
    count = 0;
}

setInterval(rates, 1000);

module.exports = {
    LDVS
};
