
const websocket = io('http://localhost:3000', { transports : ['websocket'] });
// const websocket = io('http://localhost:8080', { transports : ['websocket'] });


const form = document.getElementById('first-send-message')
const input = document.getElementById('first-message')
const container = document.getElementById('first-hold-to-send');
const userContainer = document.getElementById('first-list-participants');
var listFriends = [];
const listFriendsContainer = document.getElementById('first-list-friends');
const chatOptionsContainer = document.getElementById('chat-options-container');


var messageTime;

addMessagestoChat();

const user = prompt('This will be username after');
addMessage('','You Joined','', true);
websocket.emit('new-person', user);

websocket.on('message', data => {
    console.log(data);
    // console.log(data);
    // var wholeMess = data.name + ": " + data.message + "   (" + data.mm + ")";
    // addMessage(data);
    addMessage(data.name, data.message, data.mm, false);
    
    // var timeStamp = data.mm;
    // addMessage(timeStamp);
})

websocket.on('person-joined', username => {
    var hold = username + ' has connected';
    addMessage('',hold,'', false);
    addUser(username);
})


websocket.on('person-exited', username => {
    console.log("Get HERE?");
    var hold = username + ' has disconnected';
    addMessage('', hold,'', false);
})


form.addEventListener('submit', e => {
    e.preventDefault();
    const mess = input.value;
    websocket.emit('send-message', {mess:mess, time:"time"});
    input.value = '';
    var wholeMess = "You: " + mess;
    addMessage('You', mess, '', true);
})

function addMessage(sender, mess,time,  mine) {
    if (!mine) {
        const clearfix = document.createElement('li');
        clearfix.className = "clearfix";
        const messData = document.createElement('div');
        messData.className = "message-data";
        const mess_time = document.createElement('span');
        mess_time.className = "message-data-time";
        mess_time.innerText = "";
        if (time != "") {
            mess_time.innerText = sender + "  (" + time + ")";
        }
        const message1 = document.createElement('div');
        message1.className = "message my-message";
        message1.innerText = mess;
        clearfix.appendChild(messData);
        messData.appendChild(mess_time);
        clearfix.appendChild(message1);
        container.append(clearfix);
    } else {
        const clearfix = document.createElement('li');
        clearfix.className = "clearfix";
        const messData = document.createElement('div');
        messData.className = "message-data text-right";
        const mess_time = document.createElement('span');
        mess_time.className = "message-data-time";
        mess_time.innerText = "";
        if (time!="") {
            mess_time.innerText = sender + "  (" + time + ")";;
        }
        const message1 = document.createElement('div');
        message1.className = "message other-message float-right";
        message1.innerText = mess;
        clearfix.appendChild(messData);
        messData.appendChild(mess_time);
        clearfix.appendChild(message1);
        container.append(clearfix);
    }
    


}

function addUser(user) {
    const userElm = document.createElement('div');
    userElm.innerText = user;
    userContainer.append(userElm);
}

function inviteFriend() {
    console.log(listFriends);
    if (document.getElementById('first-list-friends').style.visibility != 'visible') {
        listFriends =  ['John', 'Frank']; // Here is where I query the database for ACTIVE FRIENDS
        listFriends.forEach(function(friend) {
            const friendElm = document.createElement('button');
            friendElm.setAttribute("onclick", "hideFriendOptions()");
            friendElm.setAttribute("class", "friendsToInvite");
            friendElm.innerText = friend;
            listFriendsContainer.append(friendElm);
            console.log(friend);
        });
        document.getElementById('first-list-friends').style.visibility = 'visible';
        // document.getElementById('demo').innerHTML=Date();
    }
}


function hideFriendOptions() {
    inviteUser();
    // The rest of the code is to hide what was seen
    document.getElementById('first-list-friends').style.visibility = 'hidden';
    listFriends = ['John', 'Frank'];
    var elements = document.getElementById('first-list-friends').getElementsByClassName("friendsToInvite");
    console.log(elements);
    console.log(elements.length);
    for (var i = elements.length - 1; i >=0; i--) {
        console.log(elements[i]);
        elements[i].remove();
    }
}

function inviteUser() {
    console.log("NAME:");
    alert("Need to figure out a way to find out which button was pressed");
           
    // alert("Do you want to create a new group or old group");
    const friendElm = document.createElement('button');
    friendElm.setAttribute("onclick", "inivteThisChat()");
    friendElm.setAttribute("class", "chooseAddToThisChat");
    friendElm.innerText = "Keep Chat";
    chatOptionsContainer.append(friendElm);

    const friendElm2 = document.createElement('button');
    friendElm2.setAttribute("onclick", "inivteThisChat()");
    friendElm2.setAttribute("class", "chooseAddToThisChat");
    friendElm2.innerText = "Create New Chat";
    chatOptionsContainer.append(friendElm2);
    document.getElementById('chat-options-container').style.visibility = 'visible';
}

function inivteThisChat() {
    document.getElementById('chat-options-container').style.visibility = 'hidden';
    var elements = document.getElementById('chat-options-container').getElementsByClassName("chooseAddToThisChat");
    console.log(elements);
    console.log(elements.length);
    for (var i = elements.length - 1; i >=0; i--) {
        console.log(elements[i]);
        elements[i].remove();
    }
}


function leaveChat() {
    alert("Handle leaving the chat");
    websocket.emit('person-left', user);
}


function createChat() {
    websocket.emit('created-chat');
}


// Query the database here
function addMessagestoChat(chatID){
    // Query from database
    // parse that information
    var chatIDName = 1234;
    var chatNameInput = "Changed Chat Name"
    var messages = [];
    var messages1 = {message: "hi", username: "Caleb", time: "12:00"};
    messages.push(messages1);
    var messages2 = {message: "good morning", username: "Ben", time: "12:01"};
    messages.push(messages2);
    var holdMess = JSON.stringify(messages);
    console.log("HERE are the MESSAGES: " + holdMess);
    var holdMess2 = JSON.parse(holdMess);
    console.log("HERE are the MESSAGES: " + holdMess2[0].message);
// [{"message":"hi","username":"Caleb","time":"12:00"},{"message":"good morning","username":"Ben","time":"12:01"}]


    for(let i = 0; i < messages.length; i++){ 
        var currentMessage = (messages[i]).message;
        var currentUsername = (messages[i]).username;
        var currentTime = (messages[i]).time;
        var chatName = chatNameInput;

        var toAdd = currentUsername + ': ' + currentMessage + "    (" + currentTime + ")";
        addMessage(toAdd, false);
    }
    document.getElementById('first-chat-name').innerHTML = chatName;
    // Test the stringify stuff
}

