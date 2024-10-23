const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://penyoksabiri:<sFkbLYrKJLWMMbxK>@cluster0.zfvdm.mongodb.net/";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        console.log("Connected successfully to MongoDB");
    } catch (err) {
        console.log("Connection error:", err.message);
    } finally {
        await client.close();
    }
}
run().catch(console.dir);
