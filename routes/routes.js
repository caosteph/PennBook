var db = require('../models/database.js');
const crypto = require('crypto');
const AWS = require('aws-sdk');
AWS.config.update({region:'us-east-1'});

const stemmer = require("stemmer");
const JSON5 = require("json5");
const { freemem } = require('os');
const client = new AWS.DynamoDB();
var moment = require('moment'); // Timestamps library
const { spawn } = require("child_process");


var getTime = function(req, res) {
    res.send(JSON.stringify(moment().format("dddd, h:mm:ss a")));
}

var getUsername = function(req, res) {
    var name = req.body.name;
    var nameArr = name.split(" ");
    var fname = nameArr[0];
    var lname = nameArr[1];
    db.get_username(fname, lname, function(err, data){
        if (err) {
            console.log("err");
        } else if (data) {
            res.send(data);
        }
    });
};

var userList = function(req, res) {
    db.scan_users(function(err, data) {
        if (err){
            console.log("error scanning users");
            res.send("error");
        } else {
            res.send(data);
        }
    });
    //db.user_list();
};

var updateProfile = function(req, res) {
    var topics = req.body.topics;
    var username = req.session.username;
    var password = req.body.password;
    var email = req.body.email;
    var affiliation = req.body.affiliation;
    var topics = req.body.topics;
    if (req.body.password == ""){
        db.lookup_password(username, function(err, data) {
            password = data;
            db.update_info(username, password, email, affiliation, topics);
        });
    } else {
        //password = req.body.password;
        const hash = crypto.createHash('sha256');
        const finalPassword = hash.update(req.body.password).digest('hex');
        db.update_info(username, finalPassword, email, affiliation, topics);
    }
    
};

var getUserInfo = function(req, res) {
    db.lookup_info(req.session.username, function(err, data) {
        console.log("getting info for " + req.session.username);
        if (err) {
            console.log("error: " + err);
        } else if (data) {
            db.access_file('g02.profiles', req.session.username, function(err2, data2){
                if (err2) {
                    console.log("error accessing file when getting user info");
                    var image = "https://mastodon.sdf.org/system/accounts/avatars/000/108/313/original/035ab20c290d3722.png"
                } else if (data2) {
                    let buf = Buffer.from(data2.Body);
                    
                    let base64 = buf.toString('base64');
                    var image="data:image/png;base64," + base64 + "";
                    
                } else {
                    console.log("something went wrong");
                    var image = "https://mastodon.sdf.org/system/accounts/avatars/000/108/313/original/035ab20c290d3722.png"
                }
            console.log("data is " + data);
            res.send({data: data, image: image});
        });
    }
});
};

var otherUserInfo = function(req, res) {
    console.log("username is " + req.body.username);
    db.lookup_info(req.body.username, function(err, data) {
        if (err) {
            console.log("call 1");
            console.log("error: " + err);
        } else if (data) {
            db.access_file('g02.profiles', req.body.username, function(err2, data2){
                if (err2) {
                    console.log("call 2");
                    console.log("error accessing file in getting other user info");
                    var image = "https://mastodon.sdf.org/system/accounts/avatars/000/108/313/original/035ab20c290d3722.png"
                } else if (data2) {
                    let buf = Buffer.from(data2.Body);
                    
                    let base64 = buf.toString('base64');
                    var image="data:image/png;base64," + base64 + "";
                    
                } else {
                    console.log("something went wrong");
                    var image = "https://mastodon.sdf.org/system/accounts/avatars/000/108/313/original/035ab20c290d3722.png"
                }
            res.send({data: data, image: image});
        });
    }
});
};
var currentChatName = '';

var newPostID = function(req, res) {
    db.post_id(function(err, data) {
        if (err) {
            console.log("ERROR ERROR ERROR");
        } else if (data) {
            res.send(data);
        }
    })
}

var newPost = function(req, res) {
    var type = req.body.type;
            var post_id = req.body.post_id;
            var d = new Date();
            var time = d.toISOString();
            var creator_username = req.session.username;
            var type = req.body.type;
            var friend_name = req.body.friend_name;
            var wall_username = req.session.username;
            var media = req.body.media;
            var text = req.body.text;
            var wall_username = "";
            if (type == 'text-own' || type == 'media-own' || type == 'status'){
                wall_username = creator_username;
            } else {
                wall_username = req.body.wall_username;
            }
            var wall_name = "";
            db.lookup_name(wall_username, function(err, data) {
                if (err) {
                    console.log(err);
                } else if (data){
                    db.lookup_name(creator_username, function(err1, data1) {
                        if (err1) {
                            console.log(err1);
                        } else if (data1) {
                            wall_name = data;
                            creator_name = data1;
                            db.put_post(post_id, time, creator_username, creator_name, type, wall_name, wall_username, media, text);
                            if (type == "media-own" || type == "media-friend"){
                                db.upload_file('g02.posts', media, post_id);
                            }
                        }
                    });
                     
                }
            });

            if (type == "status"){
                var textArr = text.split(' ');
                if (textArr.includes("interested")){
                    console.log("trigger brenner's thing");
                        const runAdsorption = spawn("mvn", ["exec:java@local"]);
    
                        runAdsorption.stdout.on("data", data => {
                            console.log(`stdout: ${data}`);
                        });
    
                        runAdsorption.stderr.on("data", data => {
                            console.log(`stderr: ${data}`);
                        });
    
                        runAdsorption.on('error', (error) => {
                            console.log(`error: ${error.message}`);
                        });
    
                        runAdsorption.on("close", code => {
                            console.log(`child process exited with code ${code}`);
                        });
            }
        }

};

var loginCheck = function(req, res) {
    var userInput = req.body.username;
    db.lookup_password(userInput, function(err, data) {
        if (err) {
            console.log("error when looking up password for logincheck");
            res.send({message: err});
        } else if (data) { //check to see if we have the correct password
            const hash = crypto.createHash('sha256');
            const finalPassword = hash.update(req.body.password).digest('hex');
            if (data == finalPassword) {
                req.session.username = userInput;
                res.send({message: "equal"});
            } else {
                res.send({message: "Invalid Username or Password."});
            }
        }
        });
};

var fileUpload = function(req, res) {
    console.log("about to upload");
    console.log("message");
    console.log(req.body);
    db.upload_file('g02.posts', req.body.file, '5');
    res.send("done");
};

var uploadProfilePic = function(req, res) {
    //req.session.username = "yourmom";
    console.log("about to upload");
    console.log("message");
    console.log(req.body);
    db.upload_file('g02.profiles', req.body.file, req.session.username, function(err, data) {
        if (err) {
            console.log("ERROR ERROR ERROR")
            res.send("error");
        } else {
            res.send("done");
        }
    });
};

var checkFriend = function(req, res) {
    console.log("CHECKING FRIEND");
    var friend1 = req.session.username;
    var friend2 = req.body.friend2;
    console.log(friend1 + "," + friend2);
    if (friend1 == friend2) {
        res.send();
    } else {
        db.getFriends(friend1, function(err, data) {
            if (err) {
                console.log("could not get friends, sorry");
                console.log(err);
                res.send({"value": false});
            } else if (data) {
                var friend = false;
                data.forEach(item => {
                    if (friend2 == item.friend2) {
                        friend = true;
                    }
                  });
                var sending = {"value": friend};
                res.send(sending);
            } else {
                console.log("you have zero friends");
                res.send({"value": false});
            }
        });
    }
    
}

var getProfilePic = function(req, res) {
    var username = req.params.username;

    db.access_file('g02.profiles', username, function(err, data) {
        let image = "https://mastodon.sdf.org/system/accounts/avatars/000/108/313/original/035ab20c290d3722.png";
        if (err) {
            console.log("error getting profile picture");
            console.log(err);
            image = "https://mastodon.sdf.org/system/accounts/avatars/000/108/313/original/035ab20c290d3722.png"
            console.log("sent");
            res.send(JSON.stringify(image));
        } else if (data) {
            let buf = Buffer.from(data.Body);
            let base64 = buf.toString('base64');
            image = "data:image/png;base64," + base64 + "";
            console.log("sending the image");
            res.send(JSON.stringify(image));
        } else {
            console.log("something went wrong");
            console.log("sent");
            res.send(JSON.stringify(image));
        }
    });
    
};

var home = function(req, res) {
    // res.render("home.ejs", {data: "rsetty"});
    if (!req.session.username) {
        res.redirect("/");
    } else {
        res.render("home.ejs", {data: req.session.username});
    }
};

var wall = function(req, res) {
    res.render('wall.ejs');
};

var createAccount = function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var email = req.body.email;
    var firstName = req.body.firstName;
    var lastName = req.body.lastName;
    var affiliation = req.body.affiliation;
    var birthday = req.body.birthday;
    var topics = req.body.topics;

    console.log(req.body);

    db.lookup_password(username, function(err, data){ //see if username already exists

        if (err) {
            console.log("error creating account");
            console.log(err);
            //res.render('createaccount.ejs', {theInput: username, message: err, result: null});
        } else if (data) {
            console.log("username already exists");
            res.send(false);
        } else { //if lookup doesn't return a query, create new item
                //encrypt password, then put everything in the table
            const hash = crypto.createHash('sha256');
            const finalPassword = hash.update(password).digest('hex');
            console.log(finalPassword);
            db.put_user(username, finalPassword, firstName, lastName, email, affiliation, birthday, topics);
            req.session.username = username;
            console.log("SHOULD REDIRECT NEXT");
            //go to home page
            res.redirect("/home");
        }
    });
};

var executeSearch = function(req, res) {
    console.log("EXECUTING SEARCH!!!! ");;
    var docClient = new AWS.DynamoDB.DocumentClient();

    //reads in the keywords and splits them into an array of the words
    var searchString = req.body.searchTerm.trim();
    console.log("search term: " + searchString);
    var lowerCaseString = searchString.toLowerCase();
    var words = lowerCaseString.split(' ');
    var listOfList = [];
    /*
        db.get_article_ids(words, function(err, data) {
        if (err) {
        			console.log("error");
        			console.log(err);
        		} else if (data) {
        		   
        		}
        });
        */
    words.forEach(function(word) {
        var stemmedWord = stemmer(word);
        //var stemmedWord = word;
        var params = {
            TableName: "articles_index",
            KeyConditionExpression: "#keyword = :key",
            ExpressionAttributeNames: {
                "#keyword": "keyword"
            },
            ExpressionAttributeValues: {
                ":key": stemmedWord
            }
        };

        //makes an array of promises of an array of parameters 
        //of the words that is added to a list of lists
        var listOfParams = docClient.query(params).promise();
        listOfList.push(listOfParams);
    });

    db.lookup_recs(req.session.username, function(err, data) {
        var recsMap = new Map();
        if (err) {
            console.log("ERROR" + err);
        } else if (data.Items[0] == undefined) {
            console.log("User has no recommendations");
        }   else if (data) {
            console.log("DATA BEING RETURNED")
            data.Items[0].recommendations.forEach((rec) => {
                if (rec[1] != null) {
                    // console.log("WEIGHRED REC: " + rec);
                    recsMap.set(rec[0], rec[1]);
                }
            })
        }

        //uses a promise to complete a list of tedtalks based on the list of lists
        Promise.all(listOfList).then(lists => {
                var results = [];
                var tempResults = [];
                lists.forEach(function(list) {
                    //iterates through each parameter to query the ted talk given the id
                    list.Items.forEach(function(item) {
                        var queryParams = {
                            TableName: "articles",
                            KeyConditionExpression: "#article_id = :id",
                            ExpressionAttributeNames: {
                                "#article_id": "article_id"
                            },
                            ExpressionAttributeValues: {
                                ":id": item.article_id
                            }
                        };
                        //creates a query promise for each param stored in a temporary result array
                        tempResults.push(docClient.query(queryParams).promise());
                    });
                });

                //iterate through the promise array to add the ted talks to the results
                Promise.all(tempResults).then(promises => {
                        //iterate through the promises to get to the queried parameters
                        var map = new Map();
                        promises.forEach(function(vals) {
                            //add the ted talk attributes to the results map for the first 15 ted talks in the parameters
                            vals.Items.forEach(function(qItem) {
                                console.log("CURRENT ITEM: " + JSON.stringify(qItem.headline));
                                if (map.get(JSON.stringify(qItem)) != undefined) {
                                    console.log("Duplicate was found");
                                    var val = map.get(JSON.stringify(qItem));
                                    map.set(JSON.stringify(qItem), val + 1);
                                } else {
                                    map.set(JSON.stringify(qItem), 1);
                                    //unsortedResults.push(qItem);
                                }
                            });
                        });

                        //scaling by weight
                        map.forEach(function(value, key) {
                            if (recsMap.get("a" + JSON.parse(key).article_id) != undefined) {
                            var w = recsMap.get("a" + JSON.parse(key).article_id);
                            map.set(key, value*w);
                            value *= w;
                            // console.log("New weight:" + value);
                            } else {
                            map.set(key, value*0.00005);
                            
                            value *= 0.00005;
                            }
                        });

                        const unsortedResults = Array.from(map);

                        var sortedByWeight = unsortedResults.sort(([key1, value1], [key2, value2]) => {
                            return value1 < value2
                        });

                        sortedByWeight.forEach(function(key) {
                            results.push(JSON.parse(key[0]));
                        })
                        res.send(results);
                    },
                    rejection => {
                        console.error("Error:", JSON.stringify(rejection, null, 2));
                    });
            },
            rejection => {
                console.error("Error:", JSON.stringify(rejection, null, 2));
            });

    });
};

var getUser = function(req, res) {
    db.lookup_name(req.session.username, function (err, data) {
        if (data) {
            res.send(JSON.stringify(data));
        } else {
            console.log("AN ERROR OCCURRED");
            res.send(JSON.stringify(err));
        }
    });
}

var getCurrentUsername = function(req, res) {
    res.send(JSON.stringify(req.session.username));
}

var postComment = function(req, res) {
    let commenter_username = req.session.username;
    
    //looking up fullname of username
    db.lookup_name(commenter_username, function (err, data) {
        if (data) {
            let full_name = data;
            let post_id = req.body.post_id;
            let time = req.body.time;
            let num_likes = 0;
            let text = req.body.text;

            //Making db call to add comment to table
            db.put_comment(post_id, time, commenter_username, full_name, num_likes, text, function(err, data) {
                if (err) {
                    console.log("AN ERROR OCCURRED.");
                    console.log(err);
                } 
                res.send(full_name);
            });
        }
    })
}

var getComments = function(req, res) {
    db.lookup_comments(req.params.post_id, function(err, data) {
        if (data) {
            res.send(JSON.stringify(data));
        } else {
            console.log("AN ERROR OCCURED");
        }
    })
}

var getFriends = function(req, res) {
    db.lookup_friends(req.session.username, function(err, data) {
        if (data) {
            // console.log(data);
            res.send(JSON.stringify(data));
        } 
        if (err) {
            console.log("AN ERROR OCCURRED.");
            console.log(err);
        }
    })
}

var getFriendsInfo = function(req, res) {
    db.friends_info(req.session.username, function(err, data) {
        if (err) {
            console.log(err);
        } else {
            console.log(data);
            res.send(data);
        }
    });
}

var getWallPosts = function(req, res) {
    console.log("INSDIE GETWALLPOSTS");
    var username = "";
    console.log(req.body);
    if (req.body.username){
        username = req.body.username;
    } else {
        username = req.session.username;
    }
    console.log("username is " + username);
    db.get_own_posts(username, function(err, data) {
        if (err) {
            console.log("err");
        } else {
            db.get_wall_posts(username, function(err, data2) {
                var combined = data.Items.concat(data2.Items);
                var set = new Set(combined);
                let finalPosts = Array.from(set);
                let posts = finalPosts;
                let swap = function (posts, leftIndex, rightIndex){
                    var temp = posts[leftIndex];
                    posts[leftIndex] = posts[rightIndex];
                    posts[rightIndex] = temp;
                }
    
                let partition = function (posts, left, right) {
                    var pivot   = posts[Math.floor((right + left) / 2)].time, //middle element
                        i       = left, //left pointer
                        j       = right; //right pointer
                    while (i <= j) {
                        while (posts[i].time < pivot) {
                            i++;
                        }
                        while (posts[j].time > pivot) {
                            j--;
                        }
                        if (i <= j) {
                            swap(posts, i, j); //sawpping two elements
                            i++;
                            j--;
                        }
                    }
                    return i;
                }
    
                let sort = function (posts, left, right) {
                    var index;
                    if (posts.length > 1) {
                        index = partition(posts, left, right); //index returned from partition
                        if (left < index - 1) { //more elements on the left side of the pivot
                            sort(posts, left, index - 1);
                        }
                        if (index < right) { //more elements on the right side of the pivot
                            sort(posts, index, right);
                        }
                    }
    
                    return posts;
                };
                
                let sortedPosts = [];
                if (posts) {
                    sortedPosts = sort(posts, 0, posts.length - 1);
                }
                res.send(sortedPosts);
            });
        }
    });
}

var getLikes = function(req, res) {
    db.lookup_likes(req.params.post_id, req.params.table, function(err, data) {
        let liked = false;
        if (data) {
            data.forEach((like) => {
                if (like.username == req.session.username) {
                    liked = true;
                }
            })
            let toSend = {"likes": data, "liked": liked};
            console.log(toSend);
    
            res.send(toSend);
        } else {
            res.send(null);
        }
    });
}



var postLike = function(req, res) {
    let username = req.session.username;
    let post_id = req.body.post_id;
    let table = req.body.table;
    db.lookup_user_like(post_id, username, table, function(err, data) {
        if (data) {
            db.delete_like(post_id, username, table)
            res.send("deleted");
        } else {
            //looking up fullname of username
            db.lookup_name(username, function (err, data) {
                if (data) {
                    db.put_like(post_id, username, data, table, function (err, data) {
                        if (err) {
                            console.log("AN ERROR OCCURRED.");
                            console.log(err);
                        } else {
                            res.send("liked");
                        }
                    })
                }
            });
        }
    })
}

var getRequests = function(req, res) {
    db.lookup_requests(req.session.username, function(data) {
        let reqList = [];
        if (data) {
            data.Items.forEach((request) => {
                let newRequest = {
                    "name": request.friend2_name,
                    "username": request.friend2
                }
                reqList.push(newRequest);
            })
        }
        res.send(JSON.stringify(reqList));
    })
}

var acceptRequest = function(req, res) {
    let friend = req.body.friend;
    db.set_request(req.session.username, friend, function(data) {
        db.set_request(friend, req.session.username, function(data) {
            res.send("done");
        })
    })
}

var deleteLike = function(post_id, username) {
    var docClient = new AWS.DynamoDB.DocumentClient();
      var params = {
          TableName: "likes",
          Key: {
              "post_id" : post_id,
        "username" : username
          }
      };
      
      docClient.delete(params, function(err, data){
          if (err) {
              console.log(err);
          }
      })
  }
  
var deleteRequest = function(req, res) {
    let friend2 = "brenlev";
    db.delete_request(req.session.username, friend2, function(data) {
        if (data == "Success") {
            db.delete_request(friend2, req.session.username, function(data) {
                if (data == "Success") {
                    res.send("done")
                }
            })
        }
    });
};

// Get the messages from a chat in the Datebase
var getChat = function(req, res) {
    let username = req.session.username; 
    let chatID = req.params.chatID;
    db.lookupChat(chatID, function(err, data) {
        if (err) {
            console.log("Failure");
        } else {
            console.log("I am here?");
            var holdMessages = data.Items[0].Messages.L;
            res.send({chatId: data.Items[0].chatID, messages: holdMessages});
        }
    })
}

// Get a list of chats that a user is allowed to join
var getListOfChats = function (req, res) {
    var username = req.session.username; 
    var availableChats = db.getChats(username, function(err,data) {
        if (err) {
            console.log("Was not able to access the users chats");
        } else {
            res.send(data);
        }
    });
}

// Gets the List of all the chats that an individual has been invited to
var getListOfChatInvites = function (req, res) {
    var username = req.session.username; 
    var availableChats = db.getChatInvites(username, function(err,data) {
        if (err) {
            console.log("Was not able to access the users chats");
        } else {
            res.send(data);
        }
    });
}

// Backup (should not be used unless get request fails)
var chatDataHelper = function (req, res) {
    var name = req.body.testing;
    currentChatName = name;
}

// Creates a chat
var create_chat = function (req, res) {
    currentChatName = req.body.name;
    var chatName = req.body.chatName
    var chat = currentChatName;
    db.createChat(chat, chatName, function(err, data) {
        if (err) {
            console.log("Failure");
        } else {
            console.log("I have made it here!");
        }
    })
}

// Every user has a list of chats that they are members of (this is the method for it)
var addChatToUserList = function (req, res) {
    var username = req.session.username;
    db.addChatToUserList(username, req.body.name, function(err, data) {
        if (err) {
            console.log("Have failed to add the chat: " + req.body.name);
        } else {
            console.log("Have added the chat: " + req.body.name);
        }
    })
}

// Every user has a list of chats that they are invited to (this is the method for it)
var addChatToRequestList = function (req, res) {
    var username = req.body.element2;
    db.addChatToRequestList(username, req.body.element, function(err, data) {
        if (err) {
            console.log("Have failed to add the chat: " + req.body.element);
        } else {
            console.log("Have added the chat: " + req.body.element);
        }
    })
}


var getPosts = function(req, res) {
    //first looking up the user's friends
    db.lookup_friends(req.session.username, function(err, data) {
        let friends = data;
        db.lookup_friends_posts(friends, function(data) {
            let posts = data;
            let swap = function (posts, leftIndex, rightIndex){
                var temp = posts[leftIndex];
                posts[leftIndex] = posts[rightIndex];
                posts[rightIndex] = temp;
            }

            let partition = function (posts, left, right) {
                var pivot   = posts[Math.floor((right + left) / 2)].time, //middle element
                    i       = left, //left pointer
                    j       = right; //right pointer
                while (i <= j) {
                    while (posts[i].time < pivot) {
                        i++;
                    }
                    while (posts[j].time > pivot) {
                        j--;
                    }
                    if (i <= j) {
                        swap(posts, i, j); //sawpping two elements
                        i++;
                        j--;
                    }
                }
                return i;
            }

            let sort = function (posts, left, right) {
                var index;
                if (posts.length > 1) {
                    index = partition(posts, left, right); //index returned from partition
                    if (left < index - 1) { //more elements on the left side of the pivot
                        sort(posts, left, index - 1);
                    }
                    if (index < right) { //more elements on the right side of the pivot
                        sort(posts, index, right);
                    }
                }

                return posts;
            };
            
            let sortedPosts = [];
            if (posts) {
                sortedPosts = sort(posts, 0, posts.length - 1);
            }
            
            res.send(sortedPosts);
        })
    })   
}

var checkLoggedIn = function(req, res) {
    console.log("sending: " + req.session.username);
    res.send(JSON.stringify(req.session.username));
}

// This method was never implemented into the code due to bugs
var removeChatToUserList = function(req, res) {
    console.log("From Routes- About to remove the entire chat requests");
    var username = req.session.username;
    db.removeChatToUserList([], username, function(err, data) {

        if (err) {
            console.log("Have failed to remove the chat: " + req.body.list);
        } else {
            console.log("Have removed the chat: " + req.body.list);
        }
    })
}

var getFriends2 = function(req, res) {
    console.log("Getting friends to send invatations to");
    var username = req.session.username;
    db.getFriends(username, function(err,data) {
        res.send(data);
    })
}

// Get the members of a chat
var getChatUsers = function(req, res) {
    let username = req.session.username; 
    let chatID = currentChatName;
    db.lookupChat(chatID, function(err, data) {
        if (err) {
            console.log("Failure");
        } else {
            console.log("I am here?");
            var holdMessages = data.Items[0].Users.L;
            res.send({chatId: data.Items[0].chatID, messages: holdMessages});
        }
    })
}

// This was never implemented due to bugs
var removeChatFromUser = function(req, res) {
    let username = req.session.username; 
    let chatName = req.body.testing;
    db.removeChatFromUser(username, chatName, function(err,data) {
        if (err) {
            console.log("Have failed to remove the chat from the user's list");
        } else {
            console.log("Have successed to remove the chat from the user's list");
        }
    });
}

var getNewsRec = function(req, res) {
    var docClient = new AWS.DynamoDB.DocumentClient();
    console.log("Looking up recs for: " + req.session.username);

    if (req.params.timeElapsed == "true") {
        const { spawn } = require("child_process");

        const runAdsorption = spawn("mvn", ["exec:java@local"]);

        runAdsorption.stdout.on("data", data => {
            console.log(`stdout: ${data}`);
        });

        runAdsorption.stderr.on("data", data => {
            console.log(`stderr: ${data}`);
        });

        runAdsorption.on('error', (error) => {
            console.log(`error: ${error.message}`);
        });

        runAdsorption.on("close", code => {
            console.log(`child process exited with code ${code}`);
        });
    }

    var user = req.session.username;
    db.lookup_recs(user, function(err, data) {
        let newsRecs = [];
        var numRecs = 0;
        if (err) {
            console.log(err);
        } else if (data.Items[0] == undefined){
            console.log("Unable to load recommendations")
        } else if (data) {
            data.Items[0].recommendations.forEach((rec) => {
                    newsRecs.push(parseInt(rec[0].substring(1)));
                numRecs++;
            })
            var results = [];
            var tempResults = [];
            newsRecs.forEach(function(id) {
                //iterates through each parameter to query the ted talk given the id
                var queryParams = {
                    TableName: "articles",
                    KeyConditionExpression: "#article_id = :id",
                    ExpressionAttributeNames: {
                        "#article_id": "article_id"
                    },
                    ExpressionAttributeValues: {
                        ":id": id
                    }
                };
                //creates a query promise for each param stored in a temporary result array
                tempResults.push(docClient.query(queryParams).promise());
            });

            //iterate through the promise array to add the ted talks to the results
            Promise.all(tempResults).then(promises => {
                    //iterate through the promises to get to the queried parameters
                    promises.forEach(function(vals) {
                        var map = new Map();
                        //add the ted talk attributes to the results map for the first 15 ted talks in the parameters
                        vals.Items.forEach(function(qItem) {
                            console.log("CURRENT ITEM: " + JSON.stringify(qItem.headline));
                            results.push(qItem);
                        });
                    });


                    //search given_recommendations table for user to retrieve list of recommended articles
                    //if current article has been recommended, iterate through recommended list until
                    //one is found that is not in the list
                    //then
                    db.get_prev_recs(user, function(err, data) {
                        let givenRecs = [];
                        if (data) {
                            console.log("USER EXISTS IN GIVEN RECS");
                            console.log("Data:" + JSON.stringify(data));
                            console.log("data.Items[0]" + data.Items[0]);
                            data.Items[0].recommendations.forEach((rec) => {
                                givenRecs.push(parseInt(rec.substring(1)));

                            })
                            console.log("Results article Id: " + results[0].article_id);
                            if (results[0]) {
                                while (givenRecs.includes(results[0].article_id)) {
                                    console.log("given recs includes current rec");
                                    results.shift();
                                }
                            }
                            
                            var articleId = "a" + results[0].article_id.toString()
                            db.update_rec(user, articleId, function(err, data) {
                                if (err) {
                                    console.log(err);
                                } else if (data) {
                                    // console.log("------------");
                                    // console.log(results);
                                    res.send(results[0]);
                                    // res.render("newsrecs.ejs", {
                                    //     results: results
                                    // });
                                }
                            });
                        } else {
                            console.log("USER DOESNT EXIST");
                            var articleId = "a" + results[0].article_id.toString()
                            db.put_user_and_rec(req.session.username, articleId, function(err, data) {
                                if (err) {
                                    console.log(err);
                                } else if (data) {
                                    res.send(results[0]);
                                }
                            });
                        }


                    });
                    //send the response which is an array of maps
                },
                rejection => {
                    console.error("Error:", JSON.stringify(rejection, null, 2));
                });
        }
    });
}

var getNewFriends = function(req, res) {
    db.getFriends(req.session.username, function(err, data) {
        let now = new Date(Date.now());
        console.log("now" + now.toISOString());
        let newDate = now.getDate() - 3;

        if (newDate < 1) {
            let month = now.getMonth();
            let newMonth = month - 1;

            if (newMonth = 0) {
                newMonth = 12;
                now.setFullYear(now.getFullYear() - 1);
            }
            
            if (parseInt(month) == 2) {
                newDate = 28 - newDate;
            } else if (parseInt(month) == 4 || parseInt(month) == 6 ||parseInt(month) == 9 || parseInt(month) == 11) {
                newDate = 30 - newDate;
            } else {
                newDate = 31 - newDate;
            }

            now.setMonth(newMonth); 
        }

        now.setDate(newDate);

        let newFriends = [];
        let limit = now.toISOString();
        if (data) {
            data.forEach(friend => {
                //edited
                if (friend.time > limit && friend.friend2 != req.session.username) {
                    newFriends.push(friend);
                }
            })
            res.send(newFriends)
        } else {
            console.log("no data in get new friends");
        }
        
    })
}

var getFriendsJSON = function (req, res) {
    let u = req.session.username; //DELETE
    if (req.params.user) {
        u = req.params.user;
    }

    req.session.friends = [];
    //need id, name, data, children
    let item = {
        "id": u,
        "name": "",
        "data": {},
        "children": []
    };

    //lookup full name 
    db.lookup_name(u, function(err, name)  {
        if (name) {
            item.name = name;
            req.session.name = name;
            db.friends_info(req.session.username, function(err, data) {
                data.forEach(friend => {
                    let newItem = {
                        "id": friend.username,
                        "name": friend.fullname,
                        "data": {},
                        "children": []
                    }
                    item.children.push(newItem);
                    req.session.friends.push(friend.username);
                })
                res.send(item)
            })
        } else {
            console.log("AN ERROR OCCURED.");
            console.log(err);
            res.send(null);
        }
    })
}

var getFilteredFriends = function(req, res) {
    let friendList = req.session.friends;
    let user = req.params.user;
    let item = {
        "id": user,
        "name": "",
        "data": {},
        "children": []
    };

    let affiliation = "";
    db.lookup_affiliation(req.session.username, function(err, data) {
        if (data) {
            affiliation = data;
            db.lookup_name(user, function(err, data) {
                item.name = data;
        
                //get friends and then get rid of the ones that are either not friends with the
                //main user or aren't the same affiliation
                db.friends_info(user, function(err, data) {
                    console.log("friends");
                    console.log(data);
                    let paramsList = [];
                    data.forEach(friend => {
                        if (friendList.includes(friend.username)) {
                            let newItem = {
                                "id": friend.username,
                                "name": friend.fullname,
                                "data": {},
                                "children": []
                            }
                            item.children.push(newItem);
                        } else {
                            var params = {
                                KeyConditions: {
                                  username: {
                                    ComparisonOperator: 'EQ',
                                    AttributeValueList: [ { S: friend.username } ]
                                  }
                                },
                                TableName: "users",
                                AttributesToGet: [ 'affiliation', 'firstName', 'lastName', 'username' ]
                            };
                            paramsList.push(params);
                        }
                    })

                    queryPromises = [];
                    paramsList.forEach(param => {
                        let p = (new AWS.DynamoDB()).query(param).promise();
                        queryPromises.push(p);
                    })

                    Promise.all(queryPromises).then(
                        successfulDataArray => {
                            successfulDataArray.forEach(data => {
                                if (data.Items[0]) {
                                    console.log("DATA");
                                    console.log(data);
                                    let u = data.Items[0].username.S;
                                    let n = data.Items[0].firstName.S + " " + data.Items[0].lastName.S;
                                    let a = data.Items[0].affiliation.S;
                                    if (a == affiliation ){
                                        let newItem = {
                                            "id": u,
                                            "name": n,
                                            "data": {},
                                            "children": []
                                        }
                                        item.children.push(newItem);
                                    }
                                }
                            })
                            res.send(item);
                        }, 
                        errDataArray => {
                            console.log("something went wrong...");
                        }
                    )
                })
            })
        }
    });
}

var logout = function(req, res) {
    req.session.username = "";
    res.redirect("/login");
}

var friendRequest = function(req, res) {
    db.lookup_name(req.session.username, function (err, data) {
        if (data) {
            var friend1 = req.session.username;
            var friend1Name = data;
            var friend2 = req.body.friend2;
            var friend2Name = req.body.friend2Name;
            var sender = friend1;
            console.log(friend1 + " " + friend2);
            var accepted = false;
            var d = new Date();
            var time = d.toISOString();
            console.log("about to request friend");
            db.request_friend(friend1, friend2, accepted, friend1Name, friend2Name, sender, time);
            console.log("dont requesting friend");
        }
        
    });
    
}
// Sends a message to the database
var addChatMessage = function(req, res) {
    let chatName = req.body.chatName;
    let message = req.body.message;
    db.addMessage(chatName, message, function(data, err) {
        if(err) {
            console.log(err);
            console.log("There was a problem in adding a message to the database");
        } else {
            if (data) {
                console.log("Have Suceeded in adding a message to the database");
            }
        }
    })
}

// Gets the chat coloquial name from the chat's ID
var chatNameFromID = function(req, res) {
    db.chatNameFromID(req.params.chatID, function(data, err) {
        if(err) {
            res.send({chatName: err});
        } else {
            if (data) {
                res.send({chatName: data});
            }
        }
    })
}

var getFullName = function(req, res) {
    db.lookup_name(req.body.username, function(err, data) {
        if (err) {
            console.log("Cannot get full name.");
        } else {
            var nameArr = data.split(" ");
            console.log(nameArr);
            res.send({"firstName": nameArr[0], "lastName": nameArr[1]});
        }
    })
}

var routes = { 
    create_account: createAccount,
    wall: wall,
    home: home,
    get_posts: getPosts,
    execute_search: executeSearch,
    get_user: getUser,
    post_comment: postComment,
    get_comments: getComments,
    get_friends: getFriends,
    get_likes: getLikes,
    post_like: postLike,
    fileUpload: fileUpload,
    // getFile: getFile,
    loginCheck: loginCheck,
    newPost: newPost,
    get_info: getUserInfo,
    get_requests: getRequests,
    accept_request: acceptRequest,
    delete_like: deleteLike,
    delete_request: deleteRequest,
    check_logged_in: checkLoggedIn,
    upload_profile: uploadProfilePic,
    update_profile: updateProfile,
    user_list: userList,
    get_username: getUsername,
    get_wall: getWallPosts,
    get_chat: getChat,
    getListOfChats: getListOfChats,
    chatDataHelper: chatDataHelper,
    create_chat: create_chat,
    get_current_username: getCurrentUsername,
    addChatToUserList: addChatToUserList,
    getListOfChatInvites: getListOfChatInvites,
    removeChatToUserList: removeChatToUserList,
    addChatToRequestList: addChatToRequestList,
    getFriends: getFriends2,
    getChatUsers: getChatUsers,
    removeChatFromUser: removeChatFromUser,
    check_login: loginCheck,
    get_news_rec: getNewsRec,
    friends_info: getFriendsInfo,
    post_id: newPostID,
    get_new_friends: getNewFriends,
    get_profile_pic: getProfilePic,
    get_friends_json: getFriendsJSON,
    get_filtered_friends: getFilteredFriends,
    logout: logout,
    other_user_info: otherUserInfo,
    check_friend: checkFriend,
    request_friend: friendRequest,
    addChatMessage: addChatMessage,
    getTime: getTime,
    chatNameFromID: chatNameFromID,
    get_full_name: getFullName
  };
  
module.exports = routes;
