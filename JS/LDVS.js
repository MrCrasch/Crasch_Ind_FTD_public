const Jimp = require("jimp");

const rows = 20;
const cols = 29;
const defaultValue = 5500;
const scale = 11; // Scale factor for image size

let count = 0;
let imageCount = 0;

let image = Array.from({ length: rows }, () => Array(cols).fill(defaultValue));

function LDVS(data, callback) {
    const id = data[3];
    const colors = JSON.parse(data[4]);
    const row = parseInt(data[5], 10);
    const content = JSON.parse(data[6]);

    image[row] = content;

    const min_max = findMinMaxValues();

    imageCount = row % 2;
    generateImage(min_max.minValue, min_max.maxValue, colors, id + "_LDVS_" + imageCount + ".png", callback);
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

const generateImage = async (minValue, maxValue, colors, filename, callback) => {
    const [color1, color2] = colors;

    const width = cols * scale; // Scale width
    const height = rows * scale; // Scale height
    const jimpImage = new Jimp(width, height, 0xFFFFFFFF); // Initialize with white background

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

    // Set the first pixel to red
    //jimpImage.setPixelColor(Jimp.rgbaToInt(255, 0, 0, 255), 0, 0);

    const buffer = await jimpImage.getBufferAsync(Jimp.MIME_PNG);
    callback(filename, buffer);
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
