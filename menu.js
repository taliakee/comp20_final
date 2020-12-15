var MongoClient = require('mongodb').MongoClient;
var http = require('http');
var dburl = "mongodb+srv://tkee:varu58Ce@cluster0.egogg.mongodb.net/stock_market?retryWrites=true&w=majority";

async function getDishes()
{
    var output = "";
    // Image links for respective dishes
    var dishPics = {
        "Pad Thai Noodles":"https://www.thespruceeats.com/thmb/AnUIWgCuBMWRDxGAl4Q8UUUWCjY=/960x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/easy-pad-thai-recipe-3217105-hero-01-16f1fbc232a94df0b77feca5659c0919.jpg",
        "Chinese Cold Sesame Noodles":"https://www.thespruceeats.com/thmb/e63utdYL5wfC2lrL8CrPDfByIzQ=/960x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/cold-vegan-chinese-sesame-noodles-recipe-3377147-hero-01-06d18136377c4377ab8221e8a61b769f.jpg",
        "Polish Poppy Seed Noodles":"https://www.thespruceeats.com/thmb/C9slaSzIXGcCCNvbNz_kDYeFpcY=/960x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/polish-noodles-with-poppyseeds-recipe-1136851-hero-01-10567a7f65414187bd6a02ba238bccbb.jpg",
        "Miso Udon Noodle Soup":"https://www.thespruceeats.com/thmb/94-Ic4TPUL49-7BneUusjkJbPBE=/960x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/miso-udon-noodle-soup-miso-nikomi-udon-2031627.23-5b61ccad46e0fb005012502b.jpg",
        "Italian Cacio e Pepe":"https://www.thespruceeats.com/thmb/i9-O-SFa7nx9z10jJdcStAAydIk=/960x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/CacioePepe-spruce-5c51b03946e0fb000167ca76.jpg",
        "South American Green Noodles":"https://www.thespruceeats.com/thmb/cEZCbhuAOYPv_oIg7YrQMLVDaQs=/960x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/Pasta-pesto-GettyImages-71095509-58fd10735f9b581d59a5c335.jpg"
    }
    try {
        client = new MongoClient(dburl, { useUnifiedTopology: true});
        await client.connect();
        var dbo = client.db("noodles");
        var collection = dbo.collection('dishes');
        const curs = collection.find();
        if ((await curs.count()) === 0) {
            console.log("No documents found");
        }
        // add stylesheet and navbar
        output += "<title>Menu - Noods to Go</title>" +
                    "<link rel ='stylesheet' type ='text/css' href='menu.css'>";
        output += "<nav><div class='topnav'><a href='https://comp20-noods-to-go.herokuapp.com/' class='logo'><img src='noods_logo.png'></a><ul>" +
                "<li><a href='https://comp20-noods-to-go.herokuapp.com/'>Home</a></li>" +
                "<li><a href='https://comp20-noods-to-go.herokuapp.com/about_us'>About Us</a></li>" +
                "<li><a href='https://comp20-noods-to-go.herokuapp.com/hoursandlocations'>Hours & Location</a></li>" +
                "<li><a class='active' href='https://comp20-noods-to-go.herokuapp.com/menu'>Menu</a></li>" +
                "<li><a href='https://comp20-noods-to-go.herokuapp.com/order'>Order</a></li>" +
                "<li><a href='https://comp20-noods-to-go.herokuapp.com/reviews'>Reviews</a></li>" +
                "</ul></div></nav>";
        output += "<div class='second-div'>";
        var c = 0;
        await curs.forEach(function(item) {
            if (c > 0) {
                output += " <br/> ";
            }
            c++;
            output += "<img src='" + dishPics[item.name] + "'><br/>" + "<p>Dish " + item.name + " - $" + item.cost + 
                      "</p><p class=description>" + item.description + "</p><p>Allergens: ";
            var aCount = 1;
            var arrLen = item.allergens.length;
            item.allergens.forEach(function(a){
                if (aCount < arrLen){
                    output += (a + ", ")
                }
                else {
                    output += a;
                }
                aCount += 1;
            })
            output += '</p><br/><br/>';
        });
    }
    catch(err) {
        console.log("Database error: " + err);
    }
    finally {
        client.close();
    }
    output += "</div><footer>&#169; Copyright 2020 Noods To Go</footer>";
    return output;
}

// Writes html for menu
async function displayDishes(response){
    var myDishes = await getDishes();
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.write(myDishes);
}

module.exports = {displayDishes};
