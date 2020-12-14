const express = require("express");
const app = express();
const port = process.env.PORT || 3000;


app.listen(process.env.PORT || 3000, function() {
    console.log('server is running')
})

app.get('/', (req, res) => {
    res.send("This will have our index page");
})

app.get('/hoursandlocations', (req, res) => {
    res.sendFile(__dirname + '/hoursandlocations.html');
})

