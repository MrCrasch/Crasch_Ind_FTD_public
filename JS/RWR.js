const Jimp = require("jimp");

// Define image dimensions
const width = 250;
const height = 250;
const centerX = Math.floor(width / 2);
const centerY = Math.floor(height / 2);

// Conversion factor: 250 pixels = 2500 meters => 1 pixel = 10 meters
const SCALE_FACTOR = 20; // Each pixel represents 20 meters

// Helper function to convert polar coordinates to Cartesian
const polarToCartesian = (theta, r) => {
    const rad = theta * (Math.PI / 180); // Convert degrees to radians
    
    // Adjust to Cartesian: forward (0°) is along the y-axis
    const x = Math.floor((r / SCALE_FACTOR) * Math.sin(rad)); // Use sin for x (since left/right is 90°/−90°)
    const y = Math.floor((r / SCALE_FACTOR) * Math.cos(rad)); // Use cos for y (forward/backward)
    
    return [x, y];
};

// Function to clean and convert the string to a valid JSON array
const convertToArray = (str) => {
    // Replace "][" with "],[" to separate coordinate pairs, and wrap the entire string with brackets
    const formattedStr = "[" + str.replaceAll("][", "],[") + "]";
    return JSON.parse(formattedStr);
};

const drawPositions = async (data) => {
    // Use the conversion function to properly parse the string
    const missiles = convertToArray(data[4]); // Array of missile coordinates
    const enemies = convertToArray(data[5]);  // Array of enemy coordinates

    // Create a transparent PNG
    let image = new Jimp(width, height, 0x00000000); // Transparent background

    const drawDot = (x, y, color, size = 3) => {
        // Loop through a square of size*size around the (x, y) center point
        for (let dx = -Math.floor(size / 2); dx <= Math.floor(size / 2); dx++) {
            for (let dy = -Math.floor(size / 2); dy <= Math.floor(size / 2); dy++) {
                // Make sure we don't go out of bounds
                const newX = centerX + x + dx;
                const newY = centerY - y + dy; // Invert y-axis for Cartesian coordinates
                if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
                    image.setPixelColor(color, newX, newY);
                }
            }
        }
    };

    // Draw missiles in red
    missiles.forEach(([theta, r]) => {
        const [x, y] = polarToCartesian(theta, r);
        drawDot(x, y, 0xFF0000FF); // Red color
    });

    // Draw enemies in blue
    enemies.forEach(([theta, r]) => {
        const [x, y] = polarToCartesian(theta, r);
        drawDot(x, y, 0x0000FFFF); // Blue color
    });

    // Return the image as a buffer
    const buffer = await image.getBufferAsync(Jimp.MIME_PNG);
    return buffer;
};

const RWR = async (data) => {
    try {
        const imageBuffer = await drawPositions(data);
        return imageBuffer;
    } catch (error) {
        console.error("Error generating RWR image:", error);
    }
};

module.exports = {
    RWR,
    countRWR: () => {
        const currentCount = count; // Store the current count
        count = 0; // Reset count to 0
        return currentCount; // Return the stored count
    }
};
