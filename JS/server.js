const http = require('http');
const { LDVS } = require("./LDVS.js");
const url = require('url');
const { Readable } = require('stream');

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
                res.writeHead(200, {'Content-Type': 'text/plain'});
                res.end('Image generated and stored.');
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
        res.end('Not found');
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});

const rates = () => {   //In the span of one second, how many requests did we get
    console.log("Incoming Data Rate: " + count +"/s")
    count = 0;
}

setInterval(rates, 1000);

//pkg JS/server.js --targets node10-win-x64
