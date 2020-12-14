const express = require("express");
const app = express();
const menu = require("./menu.js");
const path = require("path");


app.listen(process.env.PORT || 3000, function() {
    console.log('server is running')
})


app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
})

app.get('/hoursandlocations', (req, res) => {
    res.sendFile(__dirname + '/hoursandlocations.html');
})

app.get('/menu', async (req, res) => {
    var myDishes = await menu.displayDishes(res);
    res.send(myDishes);
})

app.get('/order', (req, res) => {
    res.sendFile(__dirname + '/order.html');
})