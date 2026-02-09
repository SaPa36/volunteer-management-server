require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.deftcj8.mongodb.net/?appName=Cluster0`;

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

    const userCollection = client.db('volunteerManagementDB').collection('user');
    const volunteerCollection = client.db('volunteerManagementDB').collection('volunteer');

    //volunteer related API

    //read volunteer
    app.get('/volunteers-posts', async (req, res) => {
      const cursor = volunteerCollection.find();
      const volunteers = await cursor.toArray();
      res.send(volunteers);
    });

    //add volunteer
    app.post('/volunteers-posts', async (req, res) => {
      const volunteer = req.body;
      const result = await volunteerCollection.insertOne(volunteer);
      res.send(result);
    });

    //users related API
    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Volunteer Management Server is running');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});