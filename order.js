const express = require('express')
const bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient

const app = express()

app.listen(process.env.PORT || 3000, function() {
    console.log('server is running')
})
app.use(bodyParser.urlencoded({ extended: true }))

var url = "mongodb+srv://tkee:varu58Ce@cluster0.egogg.mongodb.net/noodles?retryWrites=true&w=majority"

MongoClient.connect(url, { useUnifiedTopology: true }, function(err, client) {
    if (err) {
        console.log("Connection err: " + err)
        return
    }

    console.log("Connected!")

    const db = client.db("noodles")
    const history = db.collection("order_histories")

    app.get('/', (req, res) => {
        res.sendFile(__dirname + '/order.html')
    })

    app.post('/order.html', (req, res) => {
        var query = req.body
        query.phone = query.phone.replace(/\D/g,'')

        console.log("Query: " + query)

        history.find(query).toArray(function(err, result) {
            if (err) console.log("Query err: " + err)
            console.log("Result: " + result)

            var html = "<!DOCTYPE html>" +
                       "<html><head><title>Query Results</title></head><body>"
            if (result.length == 0) {
                html += "<h1>Order Noods!</h1><h2>Sorry, " + query.fname + ", our query didn't return any results! Please make sure your information is correct and try again, or continue without lookup.</h2>"
            }
            else {
                html += "<h1>Order Noods!</h1><h2>Welcome back, " + query.fname + "! Here are your past orders:</h2>"
                const past_orders = result[0].past_orders
                console.log(past_orders)
                past_orders.forEach((order, i) => {
                    html += "<div>Order #" + i + ":<br>Dishes ordered: <div style='margin-left:20px'>"
                    for (const [key, value] of Object.entries(order)) {
                        console.log(key, value);
                        html += value + " " + key + "<br>"
                    }
                    html += "</p></div>"
                })
            }
            html += "</body><footer>" +
                    "&#169; Copyright 2020 Noods To Go"
                    "</footer></html>"
            res.write(html)
            res.end()
        })
    })
})
