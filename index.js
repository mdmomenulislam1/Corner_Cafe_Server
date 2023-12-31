const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://corner-cafe.netlify.app',
        'https://assignment-11-810e3.web.app',
        'https://assignment-11-810e3.firebaseapp.com'
    ],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.itfatud.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const logger = (req, res, next) => {
    console.log('Log: Info', req.method, req.url);
    next();
};

const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;

    if (!token) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }
        req.user = decoded;
        next();
    })
}


async function run() {
    try {

        app.post('/jwt', logger, async (req, res) => {
            console.log('Request Body:', req.body);
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            }).send({ success: true });
        });

        app.post('/logout', async (req, res) => {
            const user = req.body;
            res.clearCookie('token', { maxAge: 0 }).send({ success: true });
        })

        const foodCollection = client.db('foodItem').collection('foods');

        app.post("/foods", async (req, res) => {
            const food = req.body;
            const result = await foodCollection.insertOne(food);
            res.send(result);
        });

        app.get("/foods", async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            const result = await foodCollection.find()
                .skip(page * size)
                .limit(size)
                .toArray();
            res.send(result);
        });


        app.patch('/foods/:id', async (req, res) => {
                const data = req.body;
                const id = req.params.id;
                const filter = { _id: new ObjectId(id) };
                const updatedFields = {
                    $set: {
                    foodName: data.foodName,
                    foodImage: data.foodImage,
                    foodType: data.foodType,
                    foodQuantity: data.foodQuantity,
                    foodPrice: data.foodPrice,
                    foodMakerName: data.foodMakerName,
                    foodMakerEmail: data.foodMakerEmail,
                    foodOrigin: data.foodOrigin,
                    foodDescription: data.foodDescription,
                }
            };
        
                const result = await foodCollection.updateOne(filter, updatedFields);
                res.send(result);
        });
        



        app.get("/foodsOrder", async (req, res) => {
            console.log('Pagination ', req.query);
            const result = await orderCollection.find()
                .toArray();
            res.send(result);
        });

        app.get('/foodsOrder/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const options = {
                projection: { orderedFoodName: 1 },
            };
            const result = await orderCollection.findOne(query, options);
            res.send(result);
        })

        app.get('/foodsCount', async (req, res) => {
            const count = await foodCollection.estimatedDocumentCount();
            res.send({ count });
        });

        app.get('/foods/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const options = {
                projection: { foodName: 1, foodImage: 1, foodQuantity: 1, foodType: 1, foodMakerName: 1, foodMakerEmail: 1, foodOrigin: 1, foodPrice: 1, foodDescription: 1 },
            };
            const result = await foodCollection.findOne(query, options);
            res.send(result);
        })

        app.get('/orderFoods/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const options = {
                projection: { foodName: 1, foodImage: 1, foodQuantity: 1, foodType: 1, foodMakerName: 1, foodMakerEmail: 1, foodOrigin: 1, foodPrice: 1, foodDescription: 1 },
            };
            const result = await foodCollection.findOne(query, options);
            res.send(result);
        })

        app.put("/foods/:id", async (req, res) => {
            const id = req.params.id;
            const data = req.body;
            const filter = {
                _id: new ObjectId(id),
            };
            const options = { upsert: true };
            const updatedData = {
                $set: {
                    foodName: data.foodName,
                    foodImage: data.foodImage,
                    foodQuantity: data.foodQuantity,
                    foodType: data.foodType,
                    foodMakerName: data.foodMakerName,
                    foodMakerEmail: data.foodMakerEmail,
                    foodOrigin: data.foodOrigin,
                    foodPrice: data.foodPrice,
                    foodDescription: data.foodDescription
                },
            };
            const result = await foodCollection.updateOne(filter, updatedData, options);
            res.send(result);
        })

        const orderCollection = client.db('orderItem').collection('orders');

        app.post("/orderedfoods", async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        });


        app.get("/orderedFoods", logger, verifyToken, async (req, res) => {
            if (req.user.email !== req.query.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await orderCollection.find().toArray();
            res.send(result)
        })

        app.delete('/foodsOrder/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await orderCollection.deleteOne(query);
            res.send(result);
        })

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Food is coming')
})

app.listen(port, () => {
    console.log(`Food is running on port ${port}`);
})
