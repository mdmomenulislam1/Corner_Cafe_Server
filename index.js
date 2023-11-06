const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

//Middle
app.use(cors());
app.use(express.json());

//mdmomenulislam1
//gHipeueyVkcrH9y7


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.itfatud.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const foodCollection = client.db('foodItem').collection('foods');


        app.post("/foods", async (req, res) => {
            const food = req.body;
            console.log("food", food);
            const result = await foodCollection.insertOne(food);
            console.log(result);
            res.send(result);
        });

        app.get("/foods", async (req, res) => {
            const result = await foodCollection.find().toArray();
            console.log(result);
            res.send(result);
        })

        app.get('/foods/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }

            const options = {
                // Include only the `title` and `imdb` fields in the returned document
                // foodName, foodImage, foodQuantity, foodType, foodMakerName, foodMakerEmail, foodOrigin, foodPrice, foodDescription 
                projection: { foodName: 1, foodImage: 1, foodQuantity: 1, foodType:1, foodMakerName:1, foodMakerEmail:1, foodOrigin:1, foodPrice:1, foodDescription:1  },
            };

            const result = await foodCollection.findOne(query, options);
            res.send(result);
        })



        const orderCollection = client.db('orderItem').collection('orders');

        app.post("/orderedFoods", async (req, res) => {
            const order = req.body;
            console.log("order", order);
            const result = await orderCollection.insertOne(order);
            console.log(result);
            res.send(result);
        });


        app.get("/orderedFoods", async (req, res) =>{
            const result = await orderCollection.find().toArray();
            console.log(result);
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Food is coming')
})

app.listen(port, () => {
    console.log(`Food is running on port ${port}`);
})
