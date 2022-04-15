const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

AWS.config.update({region:'us-east-1'});

var db = new AWS.DynamoDB();
var s3 = new AWS.S3();

var lookupName = function(uname, callback) {
  var params = {
    KeyConditions: {
      username: {
        ComparisonOperator: 'EQ',
        AttributeValueList: [ { S: uname } ]
      }
    },
    TableName: "users",
    AttributesToGet: [ 'firstName', 'lastName' ]
  };

  db.query(params, function(err, data) {
    if (err || data.Items.length == 0) {
      console.log(err);
      callback(err, null);
    } else {    
      let first = data.Items[0].firstName.S;
      let last = data.Items[0].lastName.S;
      let output = first + " " + last;
      callback(err, output);
    }
  });
}

var putPost = function(post_id, time, creator_username, creator_name, type, wall_name, wall_username, media, text) {
  var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
    			TableName: "posts",
    			Item:{
        			"post_id": post_id,
        			"time": time,
				    	"creator_username": creator_username,
              "creator_name": creator_name,
					    "type": type,
					    // "friend_name": friend_name,
					    "wall_name": wall_name,
              "wall_username": wall_username,
					    "media": media,
              "text": text
    			}
			};
	    docClient.put(params, function(err, data) {
        if (err) {
          console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
        } 
    });
}

var putUser = function(username, password, firstName, lastName, email, affiliation, birthday, topics){
	var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
    			TableName: "users",
    			Item:{
        			"username": username,
        			"password": password,
				    	"firstName": firstName,
					    "lastName": lastName,
              "email": email,
					    "affiliation": affiliation,
					    "birthday": birthday,
              "topics": topics,
              "chats": [],
              "chatInvatations": []
    			}
			};
	  docClient.put(params, function(err, data) {
        if (err) {
            console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
        } 
    });
}

var lookupUserInfo = function(searchTerm, callback) {
  var params = {
      KeyConditions: {
        username: {
          ComparisonOperator: 'EQ',
          AttributeValueList: [ { S: searchTerm } ]
        }
      },
      TableName: "users",
      AttributesToGet: [ 'firstName', 'lastName', 'email', 'birthday', 'affiliation', 'topics', 'password' ]
  };

  db.query(params, function(err, data) {
    if (err || data.Items.length == 0) {
      callback(err, null);
    } else {	  
      callback(err, data.Items[0]);
    }
  });
};

var lookupPassword = function(searchTerm, callback) {
    var params = {
        KeyConditions: {
          username: {
            ComparisonOperator: 'EQ',
            AttributeValueList: [ { S: searchTerm } ]
          }
        },
        TableName: "users",
        AttributesToGet: [ 'password' ]
    };
    db.query(params, function(err, data) {
      if (err || data.Items.length == 0) {
        console.log(err);
        callback(err, null);
      } else { 
        callback(err, data.Items[0].password.S);
      }
    });
}

var putComment = function(post_id, time, uname, name, likes, text, callback){
	var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
    TableName: "comments",
    Item: {
      "post_id": post_id,
      "time": time, 
      "commenter_username": uname,
      "commenter_name": name,
      "num_likes": likes,
      "text": text
    }
  };
	docClient.put(params, function(err, data) {
        if (err) {
          console.log("error putting comment");
          callback(err, null);
        } else {
          callback(null, data);
        }
    });
}

var lookupComments = function(post_id, callback) {
  var docClient = new AWS.DynamoDB.DocumentClient();
  let params = {
    TableName : "comments",
      KeyConditionExpression: "#post_id = :p",
      ExpressionAttributeNames:{
          "#post_id": "post_id"
      },
      ExpressionAttributeValues: {
          ":p": post_id
      }
  }

  docClient.query(params, function(err, data) {
    if (err) {
      console.log("AN ERROR OCCURED in lookupComments.");
      callback(err, null);
    } else {
      callback(null, data.Items);
    }
  });
}

var lookupName = function(uname, callback) {
	var params = {
    KeyConditions: {
      username: {
        ComparisonOperator: 'EQ',
        AttributeValueList: [ { S: uname } ]
      }
    },
    TableName: "users",
    AttributesToGet: [ 'firstName', 'lastName' ]
  };

  db.query(params, function(err, data) {
    if (err || data.Items.length == 0) {
      console.log(err);
      callback(err, null);
    } else {	  
      let first = data.Items[0].firstName.S;
      let last = data.Items[0].lastName.S;
      let output = first + " " + last;
      callback(err, output);
    }
  });
}

var lookupFriends = function(username, callback) {
  var docClient = new AWS.DynamoDB.DocumentClient();
  let params = {
    TableName : "friends",
      KeyConditionExpression: "#friend1 = :f",
      ExpressionAttributeNames:{
          "#friend1": "friend1"
      },
      ExpressionAttributeValues: {
          ":f": username
      }
  }

  docClient.query(params, function(err, data) {
    if (err) {
      console.log("Unable to lookup friends in lookupFriends");
      callback(err, null);
    } else {
      let friendList = [];
      data.Items.forEach((result) => {
        if (result.accepted) {
          friendList.push(result.friend2);
        }
      })
      callback(null, friendList);
    }
  });
}

var lookupFriendsInfo = function(username, callback) {
  var docClient = new AWS.DynamoDB.DocumentClient();
  let params = {
    TableName : "friends",
      KeyConditionExpression: "#friend1 = :f",
      ExpressionAttributeNames:{
          "#friend1": "friend1",
          
      },
      ExpressionAttributeValues: {
          ":f": username
      }
  }

  docClient.query(params, function(err, data) {
    if (err) {
      console.log("An error occurred in lookupFriendsInfo");
      callback(err, null);
    } else {
      let friendList = [];
      data.Items.forEach((result) => {
        
        if (result.accepted) {
          var info = {
            username: result.friend2,
            fullname: result.friend2_name
  
          }
          friendList.push(info);
        }
      })
      callback(null, friendList);
    }
  });
}

var scanPosts = function(username, friends, callback) {
  var params = {
    TableName: "posts",
    ProjectionExpression: "#post_id, creator_username, creator_name, #time, #text, #type, friend_name, wall_name, media, pic_key",
    ExpressionAttributeNames: {
      "#post_id": "post_id", 
      "#time": "time",
      "#text": "text",
      "#type": "type"
    },
  };

  db.scan(params, (err, data) => {
    if (err) {
      console.log("Error in scanPosts");
      callback(err, null);
    } else if (data) {
      let postsList = [];
      data.Items.forEach((post) => {
        if (post.creator_username) {
          if (friends.includes(post.creator_username.S)) {
            postsList.push(post);
          } 
        }
      })
      callback(null, postsList);
    }
  });
}

var scanUsers = function(callback) {
  var params = {
    TableName: "users",
    ProjectionExpression: "#firstName, #lastName",
    ExpressionAttributeNames: {
      "#firstName": "firstName", 
      "#lastName": "lastName"
    },
  };

  db.scan(params, (err, data) => {
    if (err) {
      console.log("Error in scanUsers");
      callback(err, null);
    } else if (data) {
      let namesList = [];
      data.Items.forEach((item) => {
        var name = item.firstName.S + " " + item.lastName.S;
        namesList.push(name);
      })
      callback(null, namesList);
    }
  });
}

var lookupLikes = function(post_id, table, callback) {
  var docClient = new AWS.DynamoDB.DocumentClient();
  let attr = "post_id"
  if (table == "article_likes") {
    attr = "article_id";
  }

  let params = {
    TableName : table,
      KeyConditionExpression: "#post_id = :p",
      ExpressionAttributeNames:{
          "#post_id": attr
      },
      ExpressionAttributeValues: {
          ":p": post_id
      }
  }

  docClient.query(params, function(err, data) {
    if (err) {
      console.log("Error in lookupLikes");
      console.log(err);
      callback(err, null);
    } else {
      callback(null, data.Items);
    }
  });
}

var putLike = function(post_id, username, name, table, callback) {
  var docClient = new AWS.DynamoDB.DocumentClient();

  let attr = "post_id"
  if (table == "article_likes") {
    attr = "article_id";
  }

	var params = {
    TableName: table,
    Item: {
      [attr]: post_id,
      "username": username,
      "name": name,
    }
  };
	docClient.put(params, function(err, data) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, data);
    }
  });
}

var putArticleLike = function(article_id, username, name, callback) {
  var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
    TableName: "likes",
    Item: {
      "article_id": article_id,
      "username": username,
      "name": name,
    }
  };
	docClient.put(params, function(err, data) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, data);
    }
  });
}

var lookupUserLike = function(post_id, username, table, callback) {
  var docClient = new AWS.DynamoDB.DocumentClient();
  
  let attr = "post_id"

  if (table == "article_likes") {
    attr = "article_id";
  }

  let params = {
    TableName : table,
      KeyConditionExpression: "#id = :p and #username = :u",
      ExpressionAttributeNames:{
          "#id": attr,
          "#username": "username"
      },
      ExpressionAttributeValues: {
          ":p": post_id,
          ":u": username
      }
  }

  docClient.query(params, function(err, data) {
    if (err) {
      console.log("AN ERROR OCCURED.");
      console.log(err);
      callback(err, null);
    } else {
      if (data.Items.length > 0){
        callback(null, true);
      } else {
        callback(null, false);
      }
    }
  });
}

var deleteLike = function(post_id, username, table) {
  var docClient = new AWS.DynamoDB.DocumentClient();
  let attr = "post_id"
  if (table == "article_likes") {
    attr = "article_id";
  }
	var params = {
		TableName: [table],
		Key: {
			[attr] : post_id,
      "username" : username
		}
	};
	
	docClient.delete(params, function(err, data){
		if (err) {
			console.log(err);
		}
	})
}


var uploadFile = function(bucketName, filepath, id, callback) {
  console.log("in upload method");
  var buf = Buffer.from(filepath.replace(/^data:image\/\w+;base64,/, ""),'base64')
  var params = {
    Bucket: bucketName,
    //Body : fs.createReadStream(filepath),
    Body : buf,
    Key : id, //will either be userID if uploading profile pic or postID if uploading file for post
    ContentEncoding: 'base64',
    ContentType: 'image/png'
  };
  console.log("about to upload");
  s3.upload(params, function (err, data) {});  
}

var accessFile = function(bucketName, id, callback) {
  var params = {
    Bucket: bucketName,
    Key: id
  };

  console.log("params are ");
  console.log(params);

  s3.getObject(params, function(err, data) {
    if (err) {
      callback (err, null);
    }
    if (data) {
      callback(err, data);
    }
  });
}

var scan = function(tableName, limit, callback) {
  var docClient = new AWS.DynamoDB.DocumentClient();
  var params = {};
  if (limit) {
    params = {
      TableName: tableName,
      Limit: limit,
      ScanIndexForward: true
    };
  } else {
    params = {
      TableName: tableName,
      ScanIndexForward: true
    };
  }
  //docClient.scan(params, scanFunction);
  docClient.scan(params, function (err, data) {
    var list = [];
    if (err) {
          console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
      callback(err, null);
      } else {
          console.log("Scan succeeded.");
          data.Items.forEach(function(item) {
            console.log(item);
          list.push(item);
          });
      callback (err, data);
    }
  });
  
}

var lookupRequests = function(username, callback) {
  var docClient = new AWS.DynamoDB.DocumentClient();
  var params = {
    TableName : "friends",
    ProjectionExpression:"#friend2, friend2_name",
    KeyConditionExpression: "#friend1 = :username",
    FilterExpression: "#accepted = :false and #sender <> :username",
    ExpressionAttributeNames:{
        "#friend1": "friend1", 
        "#friend2": "friend2",
        "#accepted": "accepted",
        "#sender": "sender"
    },
    ExpressionAttributeValues: {
        ":username": username,
        ":false": false
    },
    ScanIndexForward: true
  };

  docClient.query(params, function(err, data) {
      if (err) {
          console.log("Unable to query. Error:", JSON.stringify(err, null, 2));
          callback(null);
      } else {
          console.log("Query succeeded.");
          console.log(data);
          callback(data);
      }
  });
}

var setRequest = function(username, friend_username, callback) {
  var docClient = new AWS.DynamoDB.DocumentClient();
  let newTime = (new Date(Date.now())).toISOString();
  var params = {
    TableName: "friends",
    Key:{
        "friend1": username,
        "friend2": friend_username
    },
    UpdateExpression: "set accepted = :true, #time = :time",
    ExpressionAttributeNames: {
      "#time": "time"
    },
    ExpressionAttributeValues: { 
      ":true": true,
      ":time": newTime
    },
    ReturnValues:"UPDATED_NEW"
  }
  console.log("Updating the item...");
  docClient.update(params, function(err, data) {
      if (err) {
          console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
      } else {
          console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
          callback("success");
      }
  });
}

var updateInfo = function(username, password, email, affiliation, topics) {
  var docClient = new AWS.DynamoDB.DocumentClient()
  var params = {
      TableName: "users",
      Key:{
          "username": username,
      },
      UpdateExpression: "set password = :p, email = :e, affiliation = :a, topics = :t",
      ExpressionAttributeValues:{
          ":p": password,
          ":e": email,
          ":a": affiliation,
          ":t": topics,
      },
      ReturnValues:"UPDATED_NEW"
    };
      console.log("Updating the item...");
      docClient.update(params, function(err, data) {
          if (err) {
              console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
          } else {
              console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
          }
      });
};

// Look up the information that is in a chat (messages, times, useres, etc.)
var lookupChat = function(searchTerm, callback) {
  console.log('Looking up the chats: ' + searchTerm); 
  var params = {
      KeyConditions: {
        ChatID: { 
          ComparisonOperator: 'EQ',
          AttributeValueList: [ { S: searchTerm } ]
        }
      },
      TableName: "Chat", 
  };
  db.query(params, function(err, data) {
    if (err || data.Items.length == 0) {
      callback(err, null);
    } else {
      console.log("This is the data from looking up the chat: " + data);
      callback(err, data);
    }
  });
}


// Create the chat
var createChat = function(chatID, chatname, callback) {
  var messageList = [];
  var params = {
      Item: {
        "ChatID": {
          S: chatID
        },
        "ChatName": {
          S: chatname
        },
        "Messages": {
          L: messageList
        }
      },
      TableName: "Chat",
      ReturnValues: 'NONE'
  };
  db.putItem(params, function(err, data){
    if (err)
      callback(err)
    else
      callback(null, 'Success')
  });
}

// // Add message to chat
var addMessage = function(chatID, message, callback) {
  var docClient = new AWS.DynamoDB.DocumentClient();
  var chatID2 = JSON.stringify(chatID);
  var mess = JSON.stringify(message);
  var mess2 = mess.toString();
  var list = [];
  list.push(mess2);
  var params = {
      TableName: "Chat",
      Key: {
          "ChatID": chatID
      },
      UpdateExpression: "set Messages = list_append(Messages, :m)",
      ExpressionAttributeValues: {
         ":m": list
      },
      ReturnValues: "NONE"
  };
  docClient.update(params, function(err, data) {
      if (err)
      callback(err)
    else {
      callback(null, 'Success')
    }
  });
}

var getChats = function(username, callback) {
  var params = {
    KeyConditions: {
      username: {
        ComparisonOperator: 'EQ',
        AttributeValueList: [ { S: username } ]
      }
    },
    TableName: "users",

  };

  db.query(params, function(err, data) {
    if (err || data.Items.length == 0) {
      console.log(err);
      callback(err, null);
    } else {	  
      callback(err, data.Items[0].chats.L);
    }
  });
}

var getChatInvites = function(username, callback) {
  var params = {
    KeyConditions: {
      username: {
        ComparisonOperator: 'EQ',
        AttributeValueList: [ { S: username } ]
      }
    },
    TableName: "users",

  };
  db.query(params, function(err, data) {
    if (err || data.Items.length == 0) {
      console.log(err);
      callback(err, null);
    } else {	  
      callback(err, data.Items[0].chatInvatations.L);
    }
  });
}

var addChatToUserList = function(username, chatID, callback) {
  var params = {
      TableName: "users",
      Key: {
          "username": {S: username}
      },
      UpdateExpression: "set chats = list_append(chats, :m)",
      ExpressionAttributeValues: {
          ":m": {L: [{ S: chatID}]}
      },
      ReturnValues: "NONE"
  };
  db.updateItem(params, function(err, data) {
      if (err)
      callback(err)
    else
      callback(null, 'Success')
  });
}

var addChatToRequestList = function(username, chatID, callback) {
  var params = {
      TableName: "users",
      Key: {
          "username": {S: username}
      },
      UpdateExpression: "set chatInvatations = list_append(chatInvatations, :m)",
      ExpressionAttributeValues: {
          ":m": {L: [{ S: chatID}]}
      },
      ReturnValues: "NONE"
  };
  db.updateItem(params, function(err, data) {
      if (err)
      callback(err)
    else
      callback(null, 'Success')
  });
}

var removeChatToUserList = function(chatID, username, callback) {
  var params = {
      TableName: "users",
      Key: {
          "username": {S: username}
      },
      UpdateExpression: "set chatInvatations = :m",
      ExpressionAttributeValues: {
          ":m": {L: []}
      },
      ReturnValues: "NONE"
  };
  db.updateItem(params, function(err, data) {
      if (err)
      callback(err)
    else
      callback(null, 'Success')
  });
}

var getFriends = function(username, callback) {
  var docClient = new AWS.DynamoDB.DocumentClient();

  var params = {
    KeyConditionExpression: "#friend1 = :username",
    FilterExpression: "#accepted = :true",
    ExpressionAttributeNames:{
      "#friend1": "friend1",
      "#accepted": "accepted"
    },
    ExpressionAttributeValues: {
        ":true": true,
        ":username": username
    },
    TableName: "friends",
  };
  docClient.query(params, function(err, data) {
    if (err) {
      console.log(err);
      callback(err, null);
    } else if (data.Items.length == 0) {
      callback(null, null);
    } else {	  
      callback(err, data.Items);
    }
  });
}

var chatNameFromID = function(chatID, callback) {
  var params = {
    KeyConditions: {
      ChatID: {
        ComparisonOperator: 'EQ',
        AttributeValueList: [ { S: chatID } ]
      }
    },
    TableName: "Chat",
  };
  db.query(params, function(err, data) {
    if (err || data.Items.length == 0) {
      console.log(err);
      callback(err, null);
    } else {	  
      callback(err, data.Items[0].ChatName.S);
    }
  });
}

// Was never actually working and left out of implementation
var removeChatFromUser = function(username, chatName, callback) {
  console.log("Am I getting here: " + username + chatName);
  var params = {
    KeyConditions: {
      ChatID: { 
        ComparisonOperator: 'EQ',
        AttributeValueList: [ { S: chatName } ]
      }
    },
    TableName: "Chat",
  };
  db.query(params, function(err, data) {
    if (data) {
      var params3 = {
        TableName: "Chat",
        Key: {
            "chatID": {S: chatName}
        },
        UpdateExpression: "set Users = :m",
        ExpressionAttributeValues: {
            ":m": {L: []}
        },
        ReturnValues: "NONE"
      };

      db.updateItem(params3, function(err, data) {

    });
    }
  });
}


var deleteRequest = function(friend1, friend2, callback) {
  var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
		TableName: "friends",
		Key: {
			"friend1": friend1,
      "friend2": friend2
		}
	};
	
	docClient.delete(params, function(err, data){
		if (err) {
			callback(err);
		} else {
			callback("Success");
		}
	})
}

var lookupFriendsPosts = function(friends, callback) {
  var docClient = new AWS.DynamoDB.DocumentClient();
  let paramList = [];
  if (friends) {
    friends.forEach(friend => {
      let queryParam = {
        TableName : "posts",
        IndexName: "username-index",
        ProjectionExpression:"#post_id, #time, creator_username, creator_name, #type, friend_name, wall_name, wall_username, media, #text, pic_key",
        KeyConditionExpression: "creator_username = :u",
        ExpressionAttributeNames:{
          "#post_id": "post_id", 
          "#time": "time", 
          "#type": "type",
          "#text": "text",  
        },
        ExpressionAttributeValues: {
          ":u" : friend
        }, 
        ScanIndexForward: false
      };
      paramList.push(queryParam);
  
    });
  
    queryPromises = [];
    paramList.forEach(param => {
      let p = docClient.query(param).promise();
      queryPromises.push(p);
    })
  
    allPosts = [];
    Promise.all(queryPromises).then(
      //results of all post queries? 
      successfulDataArray => {
        successfulDataArray.forEach(posts => {
          posts.Items.forEach(post => {
            allPosts.push(post);
          })
        })
        callback(allPosts);
      },
      errorDataArray => {
        callback(null);
      }
    )
  } else {
    callback(null);
  }
  
}

var getUsername = function(fname, lname, callback) {
  var docClient = new AWS.DynamoDB.DocumentClient();

  var params = {
      TableName : "users",
      IndexName : "firstName-lastName-index",
      KeyConditionExpression: "#firstName = :f",
      ExpressionAttributeNames:{
          "#firstName": "firstName"
      },
      ExpressionAttributeValues: {
          ":f": fname
      }
  };
  console.log("after params");

  docClient.query(params, function(err, data) {
      if (err) {
          console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
          callback(err, null);
      } else {
        var user = null;
          console.log("Query succeeded.");
          data.Items.forEach(function(item) {
              console.log(item);
              if (item.lastName == lname){
                user = item.username;
              }
          });
          console.log(user);
          callback(null, user);
      }
  });
};

var getWallPosts = function(username, callback) {
  var docClient = new AWS.DynamoDB.DocumentClient();

  var params = {
      TableName : "posts",
      IndexName : "wall_username-index",
      KeyConditionExpression: "#wall_username = :w",
      ExpressionAttributeNames:{
          "#wall_username": "wall_username"
      },
      ExpressionAttributeValues: {
          ":w": username
      }
  };
  console.log("after params");

  docClient.query(params, function(err, data) {
      if (err) {
          console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
          callback(err, null);
      } else {
        //var user = null;
          console.log("Query succeeded.");
          data.Items.forEach(function(item) {
              //console.log(item);
              // if (item.lastName == lname){
              //   user = item.username;
              //   //callback(null, item.username);
              // }
          });
          //console.log(user);
          callback(null, data);
      }
  });
};

var getOwnPosts = function(username, callback) {
  var docClient = new AWS.DynamoDB.DocumentClient();

  var params = {
      TableName : "posts",
      IndexName : "username-index",
      KeyConditionExpression: "#creator_username = :c",
      ExpressionAttributeNames:{
          "#creator_username": "creator_username"
      },
      ExpressionAttributeValues: {
          ":c": username
      }
  };
  console.log("after params");

  docClient.query(params, function(err, data) {
      if (err) {
          console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
          callback(err, null);
      } else {
        //var user = null;
          console.log("Query succeeded.");
          data.Items.forEach(function(item) {
              //console.log(item);
              // if (item.lastName == lname){
              //   user = item.username;
              //   //callback(null, item.username);
              // }
          });
          //console.log(user);
          callback(null, data);
      }
  });
};

var lookupRecs = function(user, callback) {
  var docClient = new AWS.DynamoDB.DocumentClient();
  console.log('Looking up user recs for:' + user);
  
  var params = {
    TableName : "article_recommendations",
    KeyConditionExpression: "#key = :user",
    ExpressionAttributeNames:{
    "#key": "username"
  },
  ExpressionAttributeValues: {
    ":user": user
    }
  };
  
  docClient.query(params, function(err, data) {
    if (err) {
      callback(err, null);
    } else {
      console.log("Query succeeded.");
      callback(null, data);
    }
  
  });
  }
var generateAndUpdatePostID = function(callback) {
  var docClient = new AWS.DynamoDB.DocumentClient();
  var params = {
    KeyConditions: {
      post_id: {
        ComparisonOperator: 'EQ',
        AttributeValueList: [ { S: '0' } ]
      }
    },
    TableName: "posts",
    AttributesToGet: [ 'creator_username' ]
  };

  db.query(params, function(err, data) {
    if (err || data.Items.length == 0) {
      console.log(err);
      callback(err, null);
    } else {
      console.log(data.Items[0].creator_username);
      var newID = (parseInt(data.Items[0].creator_username.S) + 1).toString();
      console.log("new ID is " + newID);
      console.log(newID.toString());

      var docClient = new AWS.DynamoDB.DocumentClient()
      var params = {
          TableName: "posts",
          Key:{
              "post_id": '0',
              "time": "time"
          },
          UpdateExpression: "set creator_username = :c",
          ExpressionAttributeValues:{
              ":c": newID
          },
          ReturnValues:"UPDATED_NEW"
      };

    console.log("Updating the item...");
    docClient.update(params, function(err1, data1) {
        if (err1) {
            console.error("Unable to update item. Error JSON:", JSON.stringify(err1, null, 2));
        } else {
            console.log("UpdateItem succeeded:", JSON.stringify(data1, null, 2));
        }
    });    
      callback(err, data.Items[0].creator_username.S);
    }
  });
}

var lookupNewFriends = function(username, callback) {
  var docClient = new AWS.DynamoDB.DocumentClient();
  var params = {
    TableName : "friends",
    ProjectionExpression:"#friend2, friend2_name",
    KeyConditionExpression: "#friend1 = :username",
    FilterExpression: "#time <= :t",
    ExpressionAttributeNames:{
        "#friend1": "friend1", 
        "#friend2": "friend2",
        "#time": "time",
    },
    ExpressionAttributeValues: {
        ":username": username,
        ":t": now
    }
  };

  docClient.query(params, function(err, data) {
      if (err) {
          console.log("Unable to query. Error:", JSON.stringify(err, null, 2));
          callback(null);
      } else {
          callback(data);
      }
  });

}

let lookupAffiliation = function(username, callback) {
  var params = {
    KeyConditions: {
      username: {
        ComparisonOperator: 'EQ',
        AttributeValueList: [ { S: username } ]
      }
    },
    TableName: "users",
    AttributesToGet: [ 'affiliation' ]
  };

  db.query(params, function(err, data) {
    if (err || data.Items.length == 0) {
      console.log(err);
      callback(err, null);
    } else {    
      console.log(data);
      callback(null, data.Items[0].affiliation.S);
    }
  });
}

var getPrevRecs = function(user, callback) {
  var docClient = new AWS.DynamoDB.DocumentClient();
  console.log('Looking up prev recs for:' + user);

  var params = {
      TableName: "given_recommendations",
      KeyConditionExpression: "#key = :user",
      ExpressionAttributeNames: {
          "#key": "username"
      },
      ExpressionAttributeValues: {
          ":user": user
      }
  };

  docClient.query(params, function(err, data) {
      if (err || data.Items.length == 0) {
          console.log("query failed");
          callback(err, null);
      } else {
          console.log("look up query succeeded.");
          callback(null, data);
      }

  });
}

var updateRec = function(user, articleId, callback) {
  var docClient = new AWS.DynamoDB.DocumentClient();
  console.log("updating user's given recs'");


  var params = {
      TableName: "given_recommendations",
      Key: {
          "username": user
      },
      UpdateExpression: "SET #r = list_append(#r, :articleId)",
      ExpressionAttributeNames: {
          "#r": "recommendations",
      },
      ExpressionAttributeValues: {
          ":articleId": [articleId]
      }
  };

  docClient.update(params, function(err, data) {
      if (err) {
          callback(err, null);
      } else {
          console.log("update rec suceeded");
          callback(null, data);
      }
  });
}

var putUserAndRec = function(user, articleId, callback) {
  var docClient = new AWS.DynamoDB.DocumentClient();
  
  console.log("putting user for " + user);
  var params = {
      Item: {
          "username": user,
          "recommendations": [articleId]
      },
      TableName: "given_recommendations"
  };


  docClient.put(params, function(err, data) {
      if (err) {
          callback(err, null);
      } else {
          console.log("put user and rec suceeded");
          callback(null, data);
      }
  });
}
var requestFriend = function(friend1, friend2, accepted, friend1Name, friend2Name, sender, time){
	var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
    			TableName: "friends",
    			Item:{
        			"friend1": friend1,
        			"friend2": friend2,
				    	"accepted": accepted,
					    "friend1_name": friend1Name,
              "friend2_name": friend2Name,
					    "sender": sender,
					    "time": time
    			}
			};
    console.log("friend request params");
    console.log(params);
	  docClient.put(params, function(err, data) {
        if (err) {
            console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
        } 
    });

    var params = {
      TableName: "friends",
      Item:{
          "friend1": friend2,
          "friend2": friend1,
          "accepted": accepted,
          "friend1_name": friend2Name,
          "friend2_name": friend1Name,
          "sender": sender,
          "time": time
      }
    };
    console.log(params);
    docClient.put(params, function(err, data) {
        if (err) {
            console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
        } 
    });
}


var database = { 
  put_user: putUser,
  put_comment: putComment,
  lookup_comments: lookupComments,
  lookup_name: lookupName,
  lookup_friends: lookupFriends,
  scan_posts: scanPosts,
  lookup_likes: lookupLikes,
  put_like: putLike,
  lookup_user_like: lookupUserLike,
  delete_like: deleteLike,
  put_post: putPost,
  lookup_password: lookupPassword,
  upload_file: uploadFile,
  access_file: accessFile,
  scan: scan,
  lookup_name: lookupName,
  lookup_info: lookupUserInfo,
  lookup_requests: lookupRequests,
  set_request: setRequest, 
  delete_request: deleteRequest,
  update_info: updateInfo,
  lookup_friends_posts: lookupFriendsPosts,
  get_username: getUsername,
  scan_users: scanUsers,
  get_own_posts: getOwnPosts,
  addMessage: addMessage,
  createChat: createChat,
  lookupChat: lookupChat,
  getChats: getChats,
  addChatToUserList: addChatToUserList,
  getChatInvites: getChatInvites,
  removeChatToUserList: removeChatToUserList,
  addChatToRequestList: addChatToRequestList,
  getFriends: getFriends,
  removeChatFromUser: removeChatFromUser,
  lookup_recs: lookupRecs,
  friends_info: lookupFriendsInfo,
  post_id: generateAndUpdatePostID,
  get_wall_posts: getWallPosts,
  lookup_new_friends: lookupNewFriends,
  put_article_like: putArticleLike,
  lookup_affiliation: lookupAffiliation,
  get_prev_recs: getPrevRecs,
  update_rec: updateRec,
  put_user_and_rec: putUserAndRec,
  request_friend: requestFriend,
  chatNameFromID: chatNameFromID
};
  
module.exports = database;
