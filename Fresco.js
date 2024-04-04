const express = require('express');
const PORT = 3000;
const CORS = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');

require('dotenv').config();

const uri = process.env.MongoURL;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


const app = express();

app.use(express.json());

app.use(CORS());

app.get('/', (req, res) => {
    res.send('Pinged Succesfully');
});

app.post('/SendMessages', async (req, res) => {
    const data = await req.body;
    const RUID = data.RUID;
    const Message = data.Message;
    try {
        const result = await send('XP7', RUID, data);
        res.status(200).send({ status: "ok" });
    } catch (error) {
        res.send(error);
    }
});

app.post('/CheckMessages', async (req, res) => {
    const data = await req.body;
    const UID = data.SUID;
    const isSender = data.isSender;
    try {
        const result = await Check('XP7', UID, isSender);
        res.send(result);
    } catch (error) {
        console.log("Error ocurred while checking messages.");
    }
});

async function send(DBName, CollectionName, data) {
    var result;
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        const database = client.db(DBName);
        const collection = database.collection(CollectionName);

        result = await collection.insertOne(data);
        if (result) {
            console.log(`Message sent with _id: ${result.insertedId}`);
        } else {
            console.log("Message not sent.");
        }
    } finally {
        await client.close();
    }
    return result;
}

async function Check(DBName, CollectionName, isSender) {
    var result;
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        const database = client.db(DBName);
        const collection = database.collection(CollectionName);

        result = await collection.find({ Delivered: false }).toArray();
        if (isSender) await collection.updateMany({ Delivered: false }, { $set: { Delivered: true } });
        if (result) {
            console.log(`Number of new messages found: ${result.length}`);
        }
    } finally {
        await client.close();
    }
    if (result.length > 0) return { messages: result, found: true };
    return { messages: result, found: false };
}

app.listen(PORT, (err) => {
    console.log(`Server is running on port ${PORT}`);
});
