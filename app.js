const express = require('express')
const bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient
const fs = require('fs')
const Transform = require('stream').Transform
const parser = new Transform()
const newLineStream = require('new-line')

const app = express();
const menu = require("./menu.js");
const path = require("path");

app.use(bodyParser.urlencoded({ extended: true }))

app.listen(process.env.PORT || 3000, function() {
    console.log('server is running')
})


app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
})

app.get('/about_us', (req, res) => {
    res.sendFile(__dirname + '/about_us.html');
})

app.get('/hoursandlocations', (req, res) => {
    res.sendFile(__dirname + '/hoursandlocations.html');
})

app.get('/menu', async (req, res) => {
    var myDishes = await menu.displayDishes(res);
    res.send(myDishes);
})

const url = "mongodb+srv://tkee:varu58Ce@cluster0.egogg.mongodb.net/noodles?retryWrites=true&w=majority"

MongoClient.connect(url, { useUnifiedTopology: true }, function(err, client) {
    if (err) {
        console.log("Connection err: " + err)
        return
    }

    console.log("Connected!")

    const db = client.db("noodles")
    const history = db.collection("order_histories")

    app.get('/order', (req, res) => {
        res.sendFile(__dirname + '/order.html')
    })

    app.post('/order', (req, res) => {
        var query = req.body
        console.log(query);
        query.phone = query.phone.replace(/\D/g,'')

        console.log("Query: " + query)

        history.find(query).toArray(function(err, result) {
            if (err) console.log("Query err: " + err)
            console.log("Order query success")

            var html = "<!DOCTYPE html>\n" +
                       "<html><head><title>Query Results</title></head>\n<body>"
            if (result.length == 0) {
                html += "<h1>Order Noods!</h1>\n<h2>Sorry, " + query.fname + ", our query didn't return any results! Please go back and make sure your information is correct and try again, or continue without lookup.</h2>\n"
            }
            else {
                html += "<h1>Order Noods!</h1>\n<h2>Welcome back, " + query.fname + "! Here are your past orders:</h2>\n"
                const past_orders = result[0].past_orders
                console.log(past_orders)
                past_orders.forEach((order, i) => {
                    html += "<div>Order #" + i + ":<br><div style='margin-left:20px'>\n"
                    for (const [key, value] of Object.entries(order)) {
                        console.log(key, value)
                        html += value + " " + key + "<br>"
                    }
                    html += "<button type='button' onclick='order(" + i + ", " + JSON.stringify(order) + ")'>Reorder</button></p></div>\n"
                })
            }
            html += "</body>\n<script>function order(i, order) {" +
                    "console.log(i + order)\n" +
                    "window.localStorage.setItem('fname', '" + query.fname + "')\n" +
                    "window.localStorage.setItem('lname', '" + query.lname + "')\n" +
                    "window.localStorage.setItem('phone', '" + query.phone + "')\n"
            if (result.length > 0) {
                    "window.localStorage.setItem('email', '" + result[0].email + "')\n"
            }
            html += "window.localStorage.setItem('order', JSON.stringify(order))\n" +
                    "window.location.href = '/place'" +
                    "}</script>\n<footer>" +
                    "&#169; Copyright 2020 Noods To Go"
                    "</footer></html>"
            res.write(html, function(err) {
                if (err) console.log("Write err: " + err)
                res.end()
            })
        })
    })

    const dishesdb = db.collection("dishes")

    var dishes

    await dishesdb.find().toArray(function(err, result) {
        if (err) console.log("Query err: " + err)
        console.log("Dishes query success")
        dishes = result
    })

    parser._transform = function(data, encoding, done) {
      const str = data.toString().replace("var dishes", "var dishes = " + JSON.stringify(dishes) + "")
      this.push(str)
      done()
    }

    app.get('/place', (req, res) => {
        console.log("start");
        res.write('<!-- Begin stream -->\n')
        fs
        .createReadStream(__dirname + '/place_order.html')
        .pipe(newLineStream())
        .pipe(parser)
        .on('end', () => {
            res.write('\n<!-- End stream -->')
            console.log("end");
        }).pipe(res)
        .on('end', () => {
            res.end()
        })
    })

    app.post('/place', (req, res) => {
        console.log(req.body)
        const order = req.body

        var str = "<!DOCTYPE html>\n" +
                  "<html><head><title>Order Placed</title></head>\n<body>" +
                  "<h1>Thank you for your order!</h1>\n" +
                  "<p>You got:<br>\n"

        dishes.forEach((dish, i) => {
            if (order.dish[i] > 0) {
                str += order.dish[i] + " " + dish.name + "<br>\n"
            }
        })
        str += "</p>"

        res.write(str)

        res.write("<p>Your total was: $" + order.total + "</p>")
        res.write("</body><footer>&#169; Copyright 2020 Noods To Go</footer></html>", function(err) {
            res.end()
        })

        var query = { fname: order.fname, lname: order.lname, phone: order.phone }
        history.find(query).toArray(function(err, result) {
            if (err) console.log("Query err: " + err)
            console.log(result);

            var newOrder = {}
            dishes.forEach((dish, i) => {
                if (order.dish[i] > 0) {
                    newOrder[dish.name] = parseInt(order.dish[i])
                }
            })
            console.log(newOrder);

            if (result.length == 0) {
                query["email"] = order.email
                query["past_orders"] = [newOrder]
                history.insertOne(query)
                console.log(query);
            }
            else {
                history.updateOne({ _id: result[0]._id }, { $addToSet: { past_orders: newOrder } })
            }
        })
    })
})
