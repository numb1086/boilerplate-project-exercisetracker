const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

let userSchema = new mongoose.Schema({
  username: String,
  logs: [Object]
});
let user = mongoose.model('User', userSchema);

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }));
// Get
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get("/api/users", (req, res) => {
  user.find({}).select({logs:0}).then((users) => {
    //console.log(users);
    res.send(users);
  });
});

app.get("/api/users/:_id/logs", (req, res) => {
  let id = req.params["_id"];
  let from = req.query.from;
  let to = req.query.to;
  let limit = req.query.limit;
  user.findById(id).then((userInfo) => {
    let username = userInfo.username;
    let logs = userInfo.logs;
    // Log with from and to
    if(Boolean(from) && Boolean(to)) {
      let fromDate = new Date(from).getTime();
      let toDate = new Date(to).getTime();
      logs = logs.filter((item) => { 
        let date = new Date(item.date);
        return date.getTime() >= fromDate && date.getTime() <= toDate
      });
    }
    // Log with limit
    if(Boolean(limit)) {
      logs = logs.slice(0, limit);
    }
    let ret = {
      username: username,
      count: logs.length,
      _id: id,
      log: logs
    };
    res.json(ret);
  });
});

// Post
app.post("/api/users", (req, res) => {
  let username = req.body.username;
  let newUser = new user({
    username: username
  });
  newUser.save().then((data) => {
    console.log(data);
  }).catch((err) => {
    console.log(err);
  })
  res.json({ username: newUser.username, _id: newUser._id });
});

app.post("/api/users/:_id/exercises", (req, res) => {
  let id = req.params["_id"];
  let postId = req.body[":_id"];
  let description = req.body["description"];
  let duration = req.body["duration"];
  let dateString = req.body["date"];
  let dateFormat = "";
  
  if(Boolean(postId)) id = postId;
  if(Boolean(dateString) === false) {
    dateFormat = new Date().toDateString();
  } else {
    dateFormat = new Date(dateString).toDateString();
  }
  // Find user by Id
  user.findById(id).then((userinfo) => {
    userinfo.logs.push({
      description: description,
      duration: parseInt(duration),
      date: dateFormat
    });
    userinfo.save().then((data) =>{
      res.json({
        username: data.username,
        description: description,
        duration: parseInt(duration),
        date: dateFormat,
        _id: id
      });
    }).catch((err) => {
      console.log(err);
    })
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
