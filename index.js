require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: [
        'https://volunteer-management-1de8f.web.app',
        'https://volunteer-management-1de8f.firebaseapp.com',
        'http://localhost:5173'
    ]
}));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.deftcj8.mongodb.net/?appName=Cluster0`;
const client = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
});

async function run() {
    try {
        const volunteerCollection = client.db('volunteerManagementDB').collection('volunteer');
        const userCollection = client.db('volunteerManagementDB').collection('user');
        const requestCollection = client.db('volunteerManagementDB').collection('request');

        // 1. Unified Search & Read Route
        app.get('/volunteers-posts', async (req, res) => {
            const search = req.query.search;
            let query = {};
            if (search) {
                query = { title: { $regex: search, $options: 'i' } };
            }
            const result = await volunteerCollection.find(query).toArray();
            res.send(result);
        });

        // 2. Get Specific Post by ID
        app.get('/volunteers-posts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await volunteerCollection.findOne(query);
            res.send(result);
        });

        // 3. Get Posts by User Email (For Manage Page)

        app.get('/my-volunteer-posts/:email', async (req, res) => {
            const email = req.params.email;

            // This query checks for both naming conventions
            const query = {
                $or: [
                    { organizerEmail: email }, // Matches your AddVolunteerPost code
                    { email: email }            // Matches your previous backend code
                ]
            };

            try {
                const result = await volunteerCollection.find(query).toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send({ message: "Error fetching posts" });
            }
        });

        //update post
        // 6. Update Post Route
        app.put('/volunteers-posts/:id', async (req, res) => {
            const id = req.params.id;
            const updatedPost = req.body;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };


            const updatePost = {
                $set: {
                    thumbnail: updatedPost.thumbnail,
                    title: updatedPost.title,
                    description: updatedPost.description,
                    category: updatedPost.category,
                    location: updatedPost.location,
                    volunteersNeeded: updatedPost.volunteersNeeded,
                    deadline: updatedPost.deadline,
                    organizerName: updatedPost.organizerName,
                    organizerEmail: updatedPost.organizerEmail
                },
            };
            const result = await volunteerCollection.updateOne(filter, updatePost, options);
            res.send(result);
        });


        // 4. Delete Post
        app.delete('/volunteers-posts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await volunteerCollection.deleteOne(query);
            res.send(result);
        });

        // 5. Add Post
        app.post('/volunteers-posts', async (req, res) => {
            const post = req.body;
            const result = await volunteerCollection.insertOne(post);
            res.send(result);
        });

        //requests related API
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


        //users related API
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            res.send(result);
        });

        console.log("Connected to MongoDB!");
    } finally { }
}
run().catch(console.dir);

app.get('/', (req, res) => res.send('Server Running'));
app.listen(port, () => console.log(`Listening on ${port}`));