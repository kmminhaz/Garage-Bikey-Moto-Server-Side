const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World with heroku!");
});

// Verifying JWT
function verifyJWToken(req, res, next){
  const authorizationHeader = req.headers.authorization;
  if(!authorizationHeader){
    return res.status(401).send({message: "unauthorized access"})
  }
  const token = authorizationHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if(err){
      return res.status(403).send({message: "Request Access Forbidden"});
    }
    req.decoded = decoded;
    console.log(req.decoded);
  })
  next();
}

// Database Connection
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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

    // Creating JWT Access Token { JWT }
    app.post("/login", async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "12h",
      });
      res.send({ accessToken });
    });

    // Loading all the inventories { Load Inventory }
    app.get("/inventory", async (req, res) => {
      const query = {};
      const cursor = productCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    });

    // Loading a particular inventory { Load inventory:id details }
    app.get("/inventory/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const product = await productCollection.findOne(query);
      res.send(product);
    });

    // Updating a Particuler inventory { Update Inventory }
    app.put("/inventory/:id", async (req, res) => {
      const id = req.params.id;
      const updatedQuantity = req.body;
      const query = { _id: ObjectId(id) };
      const options = { upsert: true };
      const value = updatedQuantity.quantity;
      const updateDoc = {
        $set: {
          quantity: value,
        },
      };

      const result = await productCollection.updateOne(
        query,
        updateDoc,
        options
      );
      res.send(result);
    });

    // Deleting a Particuler Inventory { Delete Inventory }
    app.delete("/inventory/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      res.send(result);
    });

    // Inserting a new Inventory { Add Inventory }
    app.post("/inventory", async (req, res) => {
      const newInventory = req.body;
      const result = await productCollection.insertOne(newInventory);
      res.send(result);
    });

    // Showing Individual user Inventory { myInventory }
    app.get("/myInventory", verifyJWToken, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;    
      if(email){
        const query = { email: email };
        const cursor = productCollection.find(query);
        const products = await cursor.toArray();
        res.send(products);
      }
    });
  } finally {
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is Running the port ${port}`);
});
