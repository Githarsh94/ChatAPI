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

client.connect();
client.db("admin").command({ ping: 1 });
console.log("Pinged your deployment. You successfully connected to MongoDB!");

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
    const isReciever = data.isReciever;
    try {
        const result = await Check('XP7', UID, isReciever);
        res.send(result);
    } catch (error) {
        console.log("Error ocurred while checking messages.");
    }
});

async function send(DBName, CollectionName, data) {
    var result;
    const database = client.db(DBName);
    const collection = database.collection(CollectionName);

    result = await collection.insertOne(data);
    if (result) {
        console.log(`Message sent with _id: ${result.insertedId}`);
    } else {
        console.log("Message not sent.");
    }
    return result;
}

async function Check(DBName, CollectionName, isReciever) {
    var result;

    const database = client.db(DBName);
    const collection = database.collection(CollectionName);

    result = await collection.find({ Delivered: false }).toArray();
    if (isReciever) await collection.updateMany({ Delivered: false }, { $set: { Delivered: true } });
    if (result) {
        console.log(`Number of new messages found: ${result.length}`);
    }
    if (result.length > 0) return { messages: result, found: true };
    return { messages: result, found: false };
}

app.listen(PORT, (err) => {
    if (err) {
        console.log(err);
        client.close();
    }
    console.log(`Server is running on port ${PORT}`);
});
