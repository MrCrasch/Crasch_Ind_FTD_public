const http = require('http');
const { LDVS } = require("./LDVS.js");

let count = 0;

// Create an HTTP server
const server = http.createServer((req, res) => {
    //console.log(req.url);
    let data = req.url.split("/")
    if (data[1] === "data") {
        count++
        switch (data[2]) {
            case "LDVS_JS":
                LDVS(data);
                break;
        
            default:
                break;
        }
    }
    //console.log(res);
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Crasch Industries`);
    console.log(`Server running at http://localhost:${PORT}/`);
});

const rates = () => {   //In the span of one second, how many request did we get
    console.log("Incoming Data Rate: " + count +"/s")
    count = 0;
}

setInterval(rates,1000)