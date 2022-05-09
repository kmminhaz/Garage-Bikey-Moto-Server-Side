const express = require("express");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World with heroku!");
});

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.xoxwb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
async function run() {
  try {
    await client.connect();
    const productCollection = client.db("warehouse").collection("inventory");

    app.get("/inventory", async (req, res) => {
      const query = {};
      const cursor = productCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    });
  } finally {
    //   await client.close();
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
