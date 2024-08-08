const http = require('http');
const { LDVS } = require("./LDVS.js");
const url = require('url');
const { Readable } = require('stream');
const { link } = require('fs');
const { hrtime } = require('process');

const PORT = 3001;
let count = 0;
const imageCache = {};  // Cache to store generated images

// Create an HTTP server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname.split("/");

    if (path[1] === "data") {
        count++;
        switch (path[2]) {
            case "LDVS_JS":
                LDVS(path, (filename, imageBuffer) => {
                    imageCache[filename] = imageBuffer;
                });
                //res.writeHead(200, {'Content-Type': 'text/plain'});
                //res.end('Image generated and stored.');
                break;
            case "map_JS": // this will generate a whole ass map. 
                //console.error("Function Map requested")
                break;
            default:
                res.writeHead(404, {'Content-Type': 'text/plain'});
                res.end('Not found');
                break;
        }
    } else if (path[1] === "images") {
        const filename = path[2];
        if (imageCache[filename]) {
            res.writeHead(200, {'Content-Type': 'image/png'});
            res.end(imageCache[filename]);
        } else {
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.end('Image not found');
        }
    } else {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end('Crasch Industries: \nServer active');
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});

const rates = () => {   //In the span of one second, how many requests did we get
    //console.clear()
    console.log("Incoming Data Rate: " + count +"/s")
    count = 0;
}

setInterval(rates, 1000);


//using npm pkg, I used the following command in the cmd to make this an executable. Use this if you want it to compile yourself
//ofc this requires node and pkg to be already be installed   
//      pkg JS/server.js --targets node16-win-x64
