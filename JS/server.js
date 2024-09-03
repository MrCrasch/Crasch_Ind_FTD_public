const http = require('http');
const { LDVS } = require("./LDVS.js");
const url = require('url');
const { pong } = require("./pong.js");

//const { desktopRun } = require('./desktop.js');


const PORT = 3001;
let count = 0;
const imageCache = {};  // Cache to store generated images

// Create an HTTP server
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname.split("/");

    if (path[1] === "data") {
        count++;
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
    console.log(`Server running at http://localhost:${PORT}/`);
});



// Counting Function
const rates = () => {   //In the span of one second, how many requests did we get
    //console.clear()
    console.log("Incoming Data Rate: " + count +"/s")
    count = 0;
}

setInterval(rates, 1000);

//using npm pkg, I used the following command in the cmd to make this an executable. Use this if you want it to compile yourself
//      pkg JS/server.js --targets node16-win-x64

//if you just to run this code without compiling
//      node JS/server

//ofc this requires node js and/or pkg to be already be installed

