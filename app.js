/* Some initialization boilerplate. Also, we include the code from
   routes/routes.js, so we can have access to the routes. Note that
   we get back the object that is defined at the end of routes.js,
   and that we use the fields of that object (e.g., routes.get_main)
   to access the routes. */
   var app = require('express')();
   var http = require('http').Server(app);
   var io = require('socket.io')(http);
   var moment = require('moment'); 
   var express = require('express');
   var routes = require('./routes/routes.js');
   var session = require('express-session');
   var bodyParser = require('body-parser');

   app.use(session({ secret: 'supersecret'}))
   app.use(express.urlencoded());
   app.use(express.static("public"));
   app.use(express.json({limit: '100mb'}));
   app.use(express.urlencoded({limit: '100mb', extended: true, parameterLimit:50000}));  

   //USER REGISTRATION
   app.get('/register', function(req, res) {
      res.render("userRegistration.ejs", {message: ""});
   });
   app.post('/register', routes.create_account);
   app.get("/check", routes.check_logged_in);
   app.get('/home', routes.home);
   app.get('/login', function(req, res) {
      res.render('login.ejs');
   });
   app.get('/register', function(req, res) {
      res.render("userRegistration.ejs", {message: ""});
   });
   app.get('/wall', function(req, res) {
      if (!req.session.username) {
         res.redirect("/login")
      } else {
         res.render("wall.ejs");
      }
   });

   app.get('/', function(req, res) {
      if (req.session.username) {
         res.redirect('/home');
      } else {
         res.redirect('/login');
      }
      
   });

   //USER REGISTRATION
   app.get('/register', function(req, res) {
      res.render("userRegistration.ejs", {message: ""});
   });
   app.post('/register', routes.create_account);


   app.get("/check", routes.check_logged_in);

   app.get('/home', routes.home);
   app.get('/login', function(req, res) {
      res.render('login.ejs');
   });
   app.get('/register', function(req, res) {
      res.render("userRegistration.ejs", {message: ""});
   });
   
   app.get('/wall', function(req, res) {
      if (!req.session.username) {
         res.redirect('/login');
      } else {
         res.render("wall.ejs");
      }
   });

   app.get('/wall/:username', function(req, res) {
      if (!req.session.username) {
         res.redirect("/login")
      } else {
         res.render("user-wall.ejs", {username: req.params.username});
      }
   });

   app.get('/chat', function(req,res) {
      res.render("chat.ejs");
   })
   app.post('/addChatMessage', routes.addChatMessage);
   app.get('/getChat/:chatID', routes.get_chat);
   app.post('/chatDataHelper', routes.chatDataHelper);
   app.get('/chatList', routes.getListOfChats);
   app.post('/createChat', routes.create_chat);
   app.post('/addToChatList', routes.addChatToUserList);
   app.post('/removeChatToUserList', routes.removeChatToUserList);
   app.post('/addChatToRequestList', routes.addChatToRequestList);
   app.get('/chatInviteList', routes.getListOfChatInvites);
   app.get('/getFriends', routes.getFriends);

   app.get('/logout', routes.logout);

   // ADDED
   app.get('/getChatUsers', routes.getChatUsers);
   app.post('/removeChatFromUser', routes.removeChatFromUser);

   //END ADDED
   app.get('/posts', routes.get_posts);
   app.post('/register', routes.create_account);

   //POSTS
   app.get('/posts', routes.get_posts);
   app.post("/comment", routes.post_comment);
   app.get("/comments/:post_id", routes.get_comments);
   app.get("/likes/:table/:post_id", routes.get_likes);
   app.post("/like", routes.post_like);
   app.get('/newPost', routes.newPost);

   //USERS
   app.get("/requests", routes.get_requests);
   app.post("/accept-request", routes.accept_request);
   app.post("/delete-request", routes.delete_request);
   app.post('/fileUpload', routes.fileUpload);
   app.post('/loginCheck', routes.loginCheck);
   app.post('/newPost', routes.newPost);
   app.post('/userInfo', routes.get_info);
   app.post('/updateProfile', routes.update_profile);
   app.post('/uploadProfilePic', routes.upload_profile);
   app.get("/user", routes.get_user);  
   app.post('/getFriends', routes.get_friends);
   app.post('/userList', routes.user_list);
   app.post('/getUsername', routes.get_username);
   app.get('/getWall', routes.get_wall);
   app.post('/getWall', routes.get_wall);
   app.get("/getNewFriends", routes.get_new_friends);
   app.get("/getCurrentUsername", routes.get_current_username);
   app.get('/profilePicture/:username', routes.get_profile_pic);
   app.post('/getName', routes.get_full_name);

   //SEARCHING
   app.get('/newsfeed', function(req, res) {
      if (!req.session.username) {
         res.redirect("/login");
      } else {
         res.render("search.ejs");
      }
      
   });
   app.post('/search', routes.execute_search);
   app.post('/checkLogin', routes.loginCheck);
   app.get("/getTime", routes.getTime);
   app.get("/chatNameFromID/:chatID", routes.chatNameFromID);

   app.post('/friendsInfo', routes.friends_info);
   app.post('/post_id', routes.post_id);
   app.post('/otherUserInfo', routes.other_user_info);
   app.post('/checkFriend', routes.check_friend);
   app.post('/requestFriend', routes.request_friend);

//VISUALIZER STUFF
   app.get('/getFriends/:user', routes.get_filtered_friends);
   app.get('/visualizer', function(req, res) {
      if (!req.session.username) {
         res.redirect('/login');
      } else {
         res.render('friendvisualizer.ejs');
      }
   });

   app.get('/friendvisualization', routes.get_friends_json);
   

   app.get('/getArticles/:timeElapsed', routes.get_news_rec);
   io.on('connection', socket=> {
      // Is called when someone loads the page (not always a "new" user)
      socket.on('person-joined-the-chat', username => {
         socket.broadcast.emit('joined-recieved', username);
      })

      // Is called when a user sends a message with the submit button
      socket.on('send-message-backend', message => {
         socket.broadcast.emit('message', { message: message.mess, name: message.username, mm: message.date, chatid: message.chatID});
      })  
   });

   http.listen(8080, function(){  
      console.log('listening on *:80');
   });

   console.log('Author: Stephanie Cao (caosteph)');
   console.log('Server running on port 8080. Now open http://localhost:8080/ in your browser!');
   
