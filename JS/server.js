const http = require('http');
const { LDVS, countLDVS } = require("./LDVS.js");
const { pong, countPong } = require("./pong.js");
const url = require('url');



const PORT = 3001;
let countServer = 0;
const imageCache = {};  // Cache to store generated images

// Create an HTTP server
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname.split("/");

    if (path[1] === "data") {
        countServer++;
        //console.log(path);
        switch (path[2]) {
            case "LDVS_JS":
                try {
                    const { filename, buffer } = await LDVS(path);
                    imageCache[filename] = buffer;
                    res.writeHead(200, {'Content-Type': 'image/png'});
                    res.end(buffer);
                } catch (error) {
                    res.writeHead(500, {'Content-Type': 'text/plain'});
                    res.end('Error generating image');
                }
                break;
            case "pong":
                try {
                    const buffer = await pong(path);
                    const filename = 'pong.png'; // Adjust this as needed
                    imageCache[filename] = buffer;
                    res.writeHead(200, { 'Content-Type': 'image/png' });
                    res.end(buffer);
                } catch (error) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Error generating image');
                    console.error(error)
                }
                break;
            default:
                res.writeHead(404, {'Content-Type': 'text/plain'});
                res.end('Not found');
                break;
        }
    } else {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end('Crasch Industries: \nServer active');
    }
});

// Server Listener
server.listen(PORT, () => {
    console.log("Crasch Industries: Starting Server . . .")
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log("\n")
});



// Counting Function
const rates = () => {   //In the span of one second, how many requests did we get
    //console.clear()
    
    console.log("Incoming Data Rate: " + countServer +"/s")
    console.log("Image Gen Rate (from LDVS): " + countLDVS() + "/s"); // Get count from LDVS.js
    console.log("Image Gen Rate (from Pong): " + countPong() + "/s"); // Get count from LDVS.js
    console.log("\n")

    countServer = 0;
}

setInterval(rates, 1000);

//using npm pkg, I used the following command in the cmd to make this an executable. Use this if you want it to compile yourself
//      pkg JS/server.js --targets node16-win-x64

//if you just to run this code without compiling
//      node JS/server

//ofc this requires node js and/or pkg to be already be installed

