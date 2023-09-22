const express = require('express')
const mongoose = require('mongoose')
const app = express()
const cors = require('cors')
const bodyParser = require("body-parser")
require('dotenv').config()
app.use(bodyParser.urlencoded({ extended: false }))
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })

const Schema = mongoose.Schema
const usersSchema = new Schema({
  'username': { type: String, required: true },
  'log': [{ description: String, duration: Number, date: Date }]
});
const User = mongoose.model("User", usersSchema);
const exerciseSchema = new Schema({
  'description': { type: String },
  'duration': {type: Number},
  'date': { type: Date },
  'userId': { type: String}
})
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// get route to see all users
app.get('/api/users', async (req, res) => {
    let data = await User.find({}, 'username _id')
    res.json(data)
  } 
)

//post new user from submit button
app.post('/api/users', async (req, res) => {
  let newUser = new User({ 'username': req.body.username });
  try {
    let dataNewUser = await newUser.save()
    res.json({'username': dataNewUser.username, '_id': dataNewUser._id})
  }
  catch(error) {
    console.log(error)
  }
})

//post exercise from submit button with optional date
app.post('/api/users/:_id/exercises', async (req, res) => {
  let { description, duration, date } = req.body
  let id = req.params._id
  duration = Number(duration)
  if (! date) {
    date = new Date()
  }
  else {
    date = new Date(date)
  }
  let userCheck = await User.findOne({_id: id})
  if (!userCheck) {
    res.json({ id: 'invalid id' })
    return
  }
  let newExercise = new Exercise({ description, duration, date, userId: id });
  try {
    newExercise.save()  
    res.json( { '_id': id, 'username': userCheck.username, 'date': date.toDateString(), duration, description } )
  }
  catch(error) {
    console.log(error)
  }
})

// get logs from users id with optional query
 app.get('/api/users/:_id/logs', async (req, res) => {
  let id = req.params._id
  let {from, to, limit } = req.query
  let request = {userId: id}
   let count
   let logs   
  if (! limit) {
    limit = 100
  }
  else {
    limit = Number(limit)
  }
  if (from || to) {
    request["date"] = {}
    if (from) {
      from = new Date(from)
    request.date["$gte"] = from
      from = from.toDateString()
     }
    if (to) {
    to = new Date(to)
    request.date["$lte"] = to
    to = to.toDateString()
    
  }
  }
   try {
  let exerciseLogs = await Exercise.find(request).limit(limit)
  let userName = await User.findOne({_id: id})
  if (!userName) {
      res.json({ id: 'invalid user\'s id' })
      return
  } 
    logs = exerciseLogs.map((e) => 
      ({ description: e.description,
        duration: e.duration,
        date: e.date.toDateString()
      } ))
     count = logs.length
     res.json({_id: id, username: userName.username, count: count, log: logs, from: from, to: to})}
   catch(error) {
     console.log(error)
   }
   
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
