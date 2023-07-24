const express = require('express')
const cors = require('cors')
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
require('dotenv').config();
const port = 5000
app.use(express.json())
app.use(cors());






const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pbafkul.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
// Create a new ObjectID

function verifyJwt(req, res, next) {
  const authHeader = (req.headers.authorization);
  if (!authHeader) {
     return res.status(401).send({ message: 'unauthorized access' })
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
      if (err) {
          res.status(401).send({ message: 'unauthorized access' })
      }
      req.decoded=decoded;
      next();
  })
}

async function run() {
  try {

    const postCollection = client.db('get-social').collection('postCollection');
    const userCollection = client.db('get-social').collection('userCollection');

      // //jwt
      app.post('/jwt', (req, res) => {
        const user = req.body;
        console.log(user);
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "7d" });
        res.send({ token })
    })
    app.get('/user', async (req, res) => {
      const query = {};
      const result = await postCollection.find(query).toArray();
      res.send(result);
    })

    app.get('/post', async (req, res) => {
      const query = {};
      const result = await postCollection.find(query).sort({date:-1}).collation({locale:"en_US",numericOrdering:true}).toArray();
      res.send(result);
    })

    //get my post
    app.get('/myPost/:email', async (req, res) => {
      const email=req.query.email;
      const query = {email:email};
      const result = await postCollection.find(query).sort({date:-1}).collation({locale:"en_US",numericOrdering:true}).toArray();
      res.send(result);
    })

    //get my post
    app.get('/myProfile/:email', async (req, res) => {
      const email=req.params.email;
      const query = {email:email};
      const result = await postCollection.find(query).toArray();
      const result2=await userCollection.findOne(query);
      res.send([result,result2]);
    })


    //get my post
    app.get('/myProfile/post/:id', async (req, res) => {
      const id=req.params.id;
      const query = {_id:new ObjectId(id)};
      const result = await postCollection.findOne(query);
      res.send(result);
    })

     //find user 
     app.get('/search/:text', async (req, res) => {
      const text = req.params.text;
      console.log(text);
      const result= await userCollection.find({
          $or:[
              {name:{$regex:text,$options:'i'}}
          ]
      }).toArray();
      const result2= await postCollection.find({
        $or:[
            {about:{$regex:text,$options:'i'}}
        ]
    }).toArray();
    res.send([result,result2]);
  })

  

    app.get('/getAllUser', async (req, res) => {
      const query = {};
      const result = await userCollection.find(query).toArray();
      res.send(result);
    })

    app.get('/getUser', async (req, res) => {
      // console.log(req.query.email)
      const query = {email:req.query.email};
      const result = await userCollection.findOne(query);
      res.send(result);
    })
    // add signuped user
    app.post('/addUser', async (req, res) => {
      const post = req.body;
      console.log(post)
      const email = req.body.email;
      const name = req.body.name;
      console.log(name)
      const query = { $or: [{ email: email }, { name: name }] }
      const findUser = await userCollection.findOne(query);
      if (findUser) {
        console.log('mached')
        res.send(false);
      } else {
        const result = await userCollection.insertOne(post);
        res.send(result);
      }

    });
    // add signuped user
    app.put('/addGoogleUser', async (req, res) => {
      const post = req.body;
      console.log(post)
      const email = req.body.email;
      const name = req.body.name;
      const photo = req.body.photo;
      const query = { email: post.email }
      const option = { upsert: true }
      const updatedDoc = {
        $set: {
          name: name,
          email: email,
          photo: photo
        }
      }
      const result = await userCollection.updateOne(query, updatedDoc, option);
      res.send(result);

    });


    
    // add user
    app.post('/post', async (req, res) => {
      const post = req.body;
      const result = await postCollection.insertOne(post);
      res.send(result);
    });

    app.get('/getComment', async (req, res) => {
      const id = req.query.id;
      // const query = {
      //   _id:new ObjectId(id)
      // };
      // const result = await postCollection.findOne(query);
      console.log(id);
    })


    app.put('/comment', async (req, res) => {

      const id = req.query.id;
      const body = req.body;
      const filter = {
        _id: new ObjectId(id)
      }
      const option = { upsert: true }
      const updatedDoc = {
        $push: {
          comment: body
        }
      }
      const result = await postCollection.updateOne(filter, updatedDoc, option);
      res.send(result);
    })

    app.put('/like', async (req, res) => {
      const email = req.query.email
      const id = req.query.id;
      console.log(id,email);
      const filter = {
        _id: new ObjectId(id)
      }
      const option = { upsert: true }
      const updatedDoc = {
        $push: {
          liked: email
        }
      }
      const result = await postCollection.updateOne(filter, updatedDoc, option);
      res.send(result);
    })

    //add follower
    app.put('/follower', async (req, res) => {
      const email = req.query.email
      const id = req.query.id;
      // console.log(id,email);
      const filter = {
        _id: new ObjectId(id)
      }
      const option = { upsert: true }
      const updatedDoc = {
        $push: {
          follower: email
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc, option);
      res.send(result);
    })

    app.put('/unFollow', async (req, res) => {
      const email = req.query.email
      const id = req.query.id;
      console.log(email,id)
      const filter = {
        _id: new ObjectId(id)
      }
      const option = { upsert: true }
      const updatedDoc = {
        $pull: {
          follower: email
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc, option);
      res.send(result);
    })

    app.put('/dislike', async (req, res) => {
      const email = req.query.email
      const id = req.query.id;
      const filter = {
        _id: new ObjectId(id)
      }
      const option = { upsert: true }
      const updatedDoc = {
        $pull: {
          liked: email
        }
      }
      const result = await postCollection.updateOne(filter, updatedDoc, option);
      res.send(result);
    })

  } finally {

  }
}
run().catch(console.log);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})