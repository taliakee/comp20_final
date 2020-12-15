const express = require('express')
const bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient
const fs = require('fs')
const Transform = require('stream').Transform
const parser = new Transform()
const newLineStream = require('new-line')

const app = express()

app.listen(process.env.PORT || 3000, function() {
    console.log('server is running')
})
app.use(bodyParser.urlencoded({ extended: true }))

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
        query.phone = query.phone.replace(/\D/g,'')

        console.log("Query: " + query)

        history.find(query).toArray(function(err, result) {
            if (err) console.log("Query err: " + err)
            console.log("Order query success")

            var html = "<!DOCTYPE html>\n" +
                       "<html><head><title>Query Results</title>" + 
                       "<link rel ='stylesheet' type ='text/css' href='order.css'></head>\n<body>" +
                       "<nav><div class='topnav'><a href='index.html' class='logo'><img src='noods_logo.png'></a><ul>" +
                       "<li><a href='https://comp20-noods-to-go.herokuapp.com/'>Home</a></li>" +
                       "<li><a href='https://comp20-noods-to-go.herokuapp.com/about_us'>About Us</a></li>" +
                       "<li><a href='https://comp20-noods-to-go.herokuapp.com/hoursandlocations'>Hours & Location</a></li>" +
                       "<li><a href='https://comp20-noods-to-go.herokuapp.com/menu'>Menu</a></li>" +
                       "<li><a class='active' href='https://comp20-noods-to-go.herokuapp.com/order'>Order</a></li>" +
                       "<li><a href='https://comp20-noods-to-go.herokuapp.com/reviews'>Reviews</a></li>" +
                       "</ul></div></nav><div class='second-div'"
            if (result.length == 0) {
                html += "<h1>Order Noods!</h1>\n<h2>Sorry, " + query.fname + ", our query didn't return any results! Please make sure your information is correct and try again, or continue without lookup.</h2>\n"
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
                    html += "<button type='button' onclick='order(" + i + ", " + JSON.stringify(order) + ")'>Reorder</button></p></div></div>\n"
                })
            }
            html += "</body>\n<script>function order(i, order) {" +
                    "console.log(i + order)\n" +
                    "window.localStorage.setItem('fname', '" + query.fname + "')\n" +
                    "window.localStorage.setItem('lname', '" + query.lname + "')\n" +
                    "window.localStorage.setItem('phone', '" + query.phone + "')\n" +
                    "window.localStorage.setItem('email', '" + result[0].email + "')\n" +
                    "window.localStorage.setItem('order', JSON.stringify(order))\n" +
                    "window.location.href = '/place'" +
                    "}</script>\n<footer>" +
                    "&#169; Copyright 2020 Noods To Go"
                    "</div></footer></html>"
            res.write(html, function(err) {
                if (err) console.log("Write err: " + err)
                res.end()
            })
        })
    })

    const dishesdb = db.collection("dishes")

    var dishes

    dishesdb.find().toArray(function(err, result) {
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
        res.write('<!-- Begin stream -->\n')
        fs
        .createReadStream(__dirname + '/place_order.html')
        .pipe(newLineStream())
        .pipe(parser)
        .on('end', () => {
            res.write('\n<!-- End stream -->')
        }).pipe(res)
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
