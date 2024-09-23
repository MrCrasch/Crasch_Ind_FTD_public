const Jimp = require("jimp");
const path = require('path');
const fs = require('fs');

// Get the directory where the executable is running
const baseDir = path.dirname(process.execPath);

// Update paths for external resources
const namesJSONPath = path.join( 'resources', 'abbreviated_volnames.json');
const missileImagePath = path.join( 'resources', 'MissileRWR.png');
const enemyImagePath = path.join( 'resources', 'EnemyRWR.png');
const fontPath = path.join( 'node_modules', '@jimp', 'plugin-print', 'fonts', 'open-sans', 'open-sans-16-white', 'open-sans-16-white.fnt');

// Load the JSON file with the updated path
const namesJSON = JSON.parse(fs.readFileSync(namesJSONPath, 'utf8'));


// Define image dimensions
const width = 500;
const height = 500;
const centerX = Math.floor(width / 2);
const centerY = Math.floor(height / 2);

// Conversion factor: 250 pixels = 2500 meters => 1 pixel = 10 meters
const SCALE_FACTOR = 10; // Each pixel represents 20 meters
const TEXT_OFFSET = 200; // Abbreviation text will be placed 500 meters (scaled) before the enemy

// Global variables to hold the loaded images
let missileImage;
let enemyImage;
let font;

let count = 0;

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
    try {
        // Replace "][" with "],[" to separate coordinate pairs, and wrap the entire string with brackets
        const formattedStr = "[" + str.replaceAll("][", "],[") + "]";
        return JSON.parse(formattedStr);
    } catch (error) {
        // Log the error and the problematic string for debugging
        console.error("Error parsing array string:", error.message);
        console.error("Problematic string:", str);
        
        // Return an empty array or handle the error as necessary
        return [];
    }
};

// Function to draw a dotted line between two points
const drawDottedLine = (image, x1, y1, x2, y2, dotSize = 1, gapSize = 4) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const steps = distance / (dotSize + gapSize); // Calculate number of dots

    for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const x = Math.floor(x1 + t * dx);
        const y = Math.floor(y1 + t * dy);

        // Draw the dot at the current position
        for (let dx = -Math.floor(dotSize / 2); dx <= Math.floor(dotSize / 2); dx++) {
            for (let dy = -Math.floor(dotSize / 2); dy <= Math.floor(dotSize / 2); dy++) {
                const dotX = x + dx;
                const dotY = y + dy;
                if (dotX >= 0 && dotX < width && dotY >= 0 && dotY < height) {
                    image.setPixelColor(0x00FF00FF, dotX, dotY); // Lime dot for the line
                }
            }
        }
    }
};

const drawPositions = async (data) => {
    // Use the conversion function to properly parse the string
    const missiles = convertToArray(data[3]); // Array of missile coordinates
    const enemies = convertToArray(data[4]);  // Array of enemy coordinates
    
    // Create a transparent PNG
    let image = new Jimp(width, height, 0x00000000); // Transparent background

    const placeImage = (x, y, img) => {
        const newX = centerX + x - Math.floor(img.bitmap.width / 2); // Adjust for image width
        const newY = centerY - y - Math.floor(img.bitmap.height / 2); // Adjust for image height and invert y-axis
        if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
            image.composite(img, newX, newY); // Place the image
        }
    };

    // Draw missiles by placing missile images and dotted lines
    missiles.forEach(([theta, r]) => {
        const [x, y] = polarToCartesian(theta, r);
        drawDottedLine(image, centerX, centerY, centerX + x, centerY - y); // Pass the image to drawDottedLine
        placeImage(x, y, missileImage);
    });

    // Draw enemies by placing enemy images and dotted lines
    enemies.forEach(([theta, r, volume]) => {
        const [x, y] = polarToCartesian(theta, r);
        drawDottedLine(image, centerX, centerY, centerX + x, centerY - y); // Pass the image to drawDottedLine
        placeImage(x, y, enemyImage);

        // Log the abbreviation based on the volume
        let abbreviation = namesJSON[volume]?.abbreviation || "?"; // Access abbreviation using the volume as the key

        // Calculate position for text with 500m offset (polar coordinates)
        const [textX, textY] = polarToCartesian(theta, r - TEXT_OFFSET);

        // Adjust the text position based on font size and image size
        const textWidth = Jimp.measureText(font, abbreviation);
        const textHeight = Jimp.measureTextHeight(font, abbreviation, textWidth);

        // Draw the abbreviation text using the preloaded font
        image.print(
            font,
            centerX + textX - Math.floor(textWidth / 2), // Center the text horizontally
            centerY - textY - Math.floor(textHeight / 2),  // Offset vertically to center text
            {
                text: abbreviation,
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
            },
            textWidth,
            textHeight // Ensure the text fits in the calculated area
        );
    });

    // Return the image as a buffer
    const buffer = await image.getBufferAsync(Jimp.MIME_PNG);
    return buffer;
};

// Preload images and font globally
const preloadImages = async () => {
    try {
        missileImage = await Jimp.read(missileImagePath); // Use the updated path
        enemyImage = await Jimp.read(enemyImagePath); // Use the updated path
        font = await Jimp.loadFont(fontPath); // Load the font here using the updated path
    } catch (error) {
        console.error("Error loading resources:", error);
    }
};


// RWR function now ensures images are preloaded before drawing
const RWR = async (data) => {
    count++;
    try {
        if (!missileImage || !enemyImage || !font) {
            // If resources are not yet loaded, preload them
            await preloadImages();
        }
        const imageBuffer = await drawPositions(data);
        return imageBuffer;
    } catch (error) {
        console.error("Error generating RWR image:", error);
    }
};

module.exports = {
    RWR,
    preloadImages, // Export the preload function to be called on initialization
    countRWR: () => {
        const currentCount = count; // Store the current count
        count = 0; // Reset count to 0
        return currentCount; // Return the stored count
    }
};
