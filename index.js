require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

// Middleware
app.use(cors(
  {
    origin: [
      'https://volunteer-management-1de8f.web.app',
      'https://volunteer-management-1de8f.firebaseapp.com',
      'http://localhost:5173'

    ]
  }
));
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
    //await client.connect();

    const userCollection = client.db('volunteerManagementDB').collection('user');
    const volunteerCollection = client.db('volunteerManagementDB').collection('volunteer');
    const requestCollection = client.db('volunteerManagementDB').collection('request');

    //volunteer related API

    //read volunteer
    // app.get('/volunteers-posts', async (req, res) => {
    //   const cursor = volunteerCollection.find();
    //   const volunteers = await cursor.toArray();
    //   res.send(volunteers);
    // });

    //search volunteer
    app.get('/volunteers-posts', async (req, res) => {
      const search = req.query.search;
      let query = {};

      if (search) {
        query = {
          title: {
            $regex: search,
            $options: 'i' // case-insensitive
          }
        };
      }

      try {
        const cursor = volunteerCollection.find(query);
        const volunteers = await cursor.toArray();
        res.send(volunteers);
      } catch (error) {
        res.status(500).send({ message: "Search failed" });
      }
    });

    app.get('/volunteers-posts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const volunteer = await volunteerCollection.findOne(query);
      res.send(volunteer);
    });

    //volunteer request related API
    app.post('/volunteer-requests', async (req, res) => {
      const request = req.body;

      // 1. Save the volunteer request to your 'requestCollection'
      const result = await requestCollection.insertOne(request);

      // 2. Update the main post in 'volunteerCollection' (Decrease slots)
      // Ensure "request.postId" is passed correctly from frontend
      const filter = { _id: new ObjectId(request.postId) };

      const updateDoc = {
        $inc: { volunteersNeeded: -1 }
      };

      // Use the correct collection variable name here:
      const updateResult = await volunteerCollection.updateOne(filter, updateDoc);

      res.send(result);
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
    //await client.db("admin").command({ ping: 1 });
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