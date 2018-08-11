const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const ObjectId = require('mongodb').ObjectID;
const mongodb = require('mongodb').MongoClient;
const passport = require('passport')

const cors = require('cors')

const mongoose = require('mongoose')
//mongoose.connect(process.env.MLAB_URI)

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use(express.static('public'))


mongodb.connect(process.env.MLAB_URI, (err, db)=> {
  if(err){
    console.log(err);
  }
  else {
  app.post('/api/exercise/new-user', function(req, res) {
           var name = req.body.username;
           db.collection('exercise').findOne({"username": name},function(err,doc){
           if(err){
             res.send("error")
           }
           else if(doc != null){
             res.send('username already taken')
           }
           else{
             
             db.collection('exercise').insert({username: name, instance: []},function(err, sum){
               res.json({username: sum.ops[0].username, _id: sum.ops[0]._id});

             })
                                      
           }
           
           })
                        
          
            }
          )
  
  app.post('/api/exercise/add', function(req, res){
            try {
              new Date(req.date);
            }
            catch (err){
              res.send(`Cast to Date failed for value ${req.date} at path "date"`)
            }
            try {
              Number(req.duration);
            }
            catch (err) {
              res.send(`Cast to Number failed for value ${req.duration} at path "duration"`)
            }
            db.collection('exercise').findOne({_id: new ObjectId(req.body.userId)}, function(err, doc){
              if(!doc){
                res.send('id no match')
              }
            
            })
          
            db.collection('exercise').findAndModify({_id: new ObjectId(req.body.userId)}, [['_id','asc']],{$push : {instance: {description: req.body.description, duration: req.body.duration, date: new Date(req.body.date).getTime()}}}, {new: true, upsert: false},
                                                   function(err,doc){
                        console.log(doc)
                        res.json({"username": doc.value.username, "description": req.body.description, "duration": req.body.duration, "_id": req.body.userId, "date": new Date(req.body.date)})         
            })
  })
    
  app.get('/api/exercise/log', function(req, res){
      db.collection('exercise').findOne({_id: new ObjectId(req.query.userId)}, function(err, doc){
        if(err){
        res.send("can't find user")
        }
        else if(!doc) {
        res.send("can't find user")
        }
        else{
          
          var from = new Date(req.query.from).getTime() || 0; 
          var to = new Date(req.query.to).getTime() || Number.MAX_SAFE_INTEGER;
          var limit = req.query.limit || Number.MAX_SAFE_INTEGER;
          var log = [];
          for(var i = 0; i < doc.instance.length; i++){
            if((doc.instance[i].date) >= from && (doc.instance[i].date) <= to){
              log.push(doc.instance[i])
            }
            if (log.length >= limit) {
              break;
            }
          }
          res.json({"_id": doc._id, "username": doc.username, "count": log.length, "log": log});
        
        }
      
      
      });

  })
    
  }
  app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
  
  // Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})
app.listen(3000);
  
})


