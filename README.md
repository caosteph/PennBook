# PennBook



**System Overview and Technical Description of Components **

* Chat: For the chat, we implemented a standalone page using the socket.io library along with three tables in Dynamodb (Users, Friends, and Chat). In order to have both readability as well as uniqueness for each of the chats, there is both a name (sort key) and a uniqueID (partition key). The name is set by the user at creation time through a popup and the id is automatically generated in the format of: ‘username’ + ‘unix epoch time’. Moving on to the specific tables that were used, the User Tab maintained two Lists that were changed with UpdateItem’s ‘list_append’ method as a user either join a chat or is invited to a chat: ChatInvitations and Chats (both of which stored the chatID). The Friends chat is used when inviting others (in conjunction with the User tab to see who is online), as a way to quickly query the friends of any given user. The Chat table maintained the id, name, and a list of JSON stringified messages, each of which held the sender, timestamp, and actual message. The Chat table is sent a message each time the ‘send button’ is clicked, but is only queried when a given user enters the chat because all other messages between users while online are done through socket.io. Creating a chat is done through buttons on either the toolbar or side page of home.ejs. The side page also maintains all current chats and invitations that a user has available to them. 

* News Search: For the search functionality pertaining to news, we use an Article Index table in order to query for articles based on a particular key word.The results from those would then get sorted based on the number of keywords they matched by storing the articles in a map with the article item as the key and the number of matched terms as the value. The map was built into a sorted array. Then, we do a lookup for all the recs for a given user and store all of the article recs that have a weight in an array. The weights are then scaled and the list of articles is sent back to the front end for display. An AJAX call is used to give a user’s their article recommendations everyday. This is done by first obtaining the user’s recommendations, and then cross-referencing the recommendations with articles that the user has already been recommended. This is done with an Article Recommendations Table and a Given Recommendations table that both have username as a partition key and a list of article IDs as a sort key. Once the most recommended article that is not in a user’s given recommendations is retrieved, then we update the current user’s list in the Given Recommendations table or if they don’t have any given recs, make a new item for them. Then this recommendation gets sent back to the page and displayed on the front end. Additionally, inside the function call there is a check at the beginning that determines whether an hour has elapsed before making a command line call to run the adsorption algorithm.

* Login/User Registration:
When a user creates an account, they must fill out all of the provided fields (and they get an alert if they try to submit without doing so). This includes selecting at least two topics they are interested in. A hashed version of the user’s password gets stored in the “users” table; when the user logs in, the hashed version of the input is compared to the version in the table associated with that username. Once logging in, the user’s username is stored as a session variable. If the user attempts to visit a different page without being logged in, they will be redirected to the login page.

* Home Page: On the home page, the logged-in user can see their incoming friend requests, new friends, current chats and chat invitations, and a feed of articles and user-created posts sorted by time. Posts, likes, and comments are all dynamically updated every thirty seconds; if another user were to create a post, comment on a post, or like a post, then the feed would update accordingly. Comments that are displayed also feature the commenter’s profile picture. Retrieving the posts required calls to multiple DynamoDB tables, including a Posts table, Comments table, Likes table, Article Likes, and Users table. Posts are kept track of with a unique post ID, users are kept track of with a unique username, and comments are kept track of with their timestamp. The home page (as well as all the other pages) is rendered with Bootstrap 5 and uses AJAX calls with JQuery to dynamically update the content. Friend requests immediately disappear once they are responded to, and if a request is accepted the new friend will show up under the New Friends section. The home page also allows the user to enter existing chats, respond to chat invitations, and create new chats.

* Wall: Our wall mainly relied on the “users” and “posts” tables in DynamoDB, as well as an S3 bucket titled “g02.posts” to store profile pictures. When rendering the “About Me” section, a call was made to the “users” table that queried based on the current session username, retrieving information like name, affiliation, email, and a list of interested topics. During this call, the user’s profile picture is also retrieved from the S3 bucket, and in the case that the user has not set one, an image of an anonymous user will be displayed in its place. If the user clicks the “Add Profile Picture” button, they can navigate their files and choose a file of size less than 70kb. If the user clicks the “Update Account Info” button, they can change their email, password, affiliation, and interested topics, where their current information (besides password) is already filled in. Changing affiliation or interests will automatically create a status update for the change. Saving changes will use an AJAX call to update that user’s information in the “users” table.
Once on their wall, the user has the option of creating a new post with/without media and to their wall or a friend’s wall. If the user chooses to post on their friend’s wall, a modal will appear with a list of their current friends, allowing them to choose one. The wall will dynamically update once a post has been added, and a call will be made that adds the post to our “posts” table.

**Nontrivial Design Decisions
**

* Table Design: There were several ways in which the tables were constructed, and certain decisions were made in the name of scalability so that queries would not be wasted on information that was not needed. For example, to see who is friends with whom, we should not be concerning ourselves with Chat messages or Profile pictures that can take up lots of space and time in search. As a result, information such as likes and comments for posts are stored in their own Likes and Comments tables, rather than in the Posts table. Additionally, readability is a major component of any successful software application and it makes the most logical sense to categorize features by their own tables (generally speaking, several instances of intersection were needed to link Tables together). One of the biggest design challenges that we encountered was how to set up our Posts table schema to facilitate a relatively easy and efficient query of the most recent posts posted by a particular user’s friend. We wanted to avoid having to scan every post in our Posts table every time posts had to be displayed on the home page. As a result, we decided to individually query posts made by each user’s friend, and then sort these posts by time stamp afterward. This way, irrelevant posts (made by non-friends) would never have to be processed. One way that we could have improved this was by keeping track of the timestamp of the most recent post and only querying posts for times later than that time in subsequent calls. 

* Newsfeed and Search: When reading in the articles, we wrote to an articles table that stored all the data about the article and simultaneously parsed each headline for keywords to write to an article_index table that stores the keyword as the partition key and the article id as the sort key, mirroring the inverted index we built-in class. For loading in the data for the adsorption algorithm, we scan the user table to get all the user nodes and make edges for the categories they are interested in, scan the categories table for all the category nodes, scan the articles table for all the articles and make edges for the categories they are connected to, scan the Friends table to get the edges between users and scan the liked_articles table to make edges for all the liked articles. Since we use the entirety of the data from each of these tables, a scan call makes the most sense. 



**Extra-credit features
**
* Chat
  * Clear all chat invitations (with the press of a button on chat.ejs)
  * Time with each message (stored in the database and with websocket)
  * Prompted to either keep current chat or create a new chat when inviting a friend
  * Group Chat names (still internally stored with id, but viewable with name)
* Friend Requests
  * Friend requests appear on a user’s home page, where they have the option to confirm or deny the request. If the request is confirmed, the new friend will show up in the New Friends section of the home page. 
  * Friend requests are kept track of in the Friends table through two attributes: an Accepted boolean and a Sender string. 
  * Friend requests can be sent if a user navigates to a wall of a user that they are not friends with, in which case there will be an “Add Friend” button. 
* Profile Pictures
  * S3 was used to store profile pictures; when a user added a new profile picture, it would be changed to the correct format using a buffer and uploaded to the bucket. When a user’s page is being rendered, a call is made that retrieves the file path and converts it to the correct base 64 URL format. Since the bucket is private, we made the key the user’s username, as it is already secure.
* Media Posts
  * Images for posts were stored in the format of a base 64 URL, and when rendering posts, we retrieved this URL and set it equal to the source of the post’s image element. The user can post with media both to their wall and their friend’s wall. Images and posts are added dynamically.
