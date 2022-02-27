const express = require('express');

const app = express();
const fs = require('fs');
const http = require('http');
const https = require('https');

const options = {
    key: fs.readFileSync('./ssl/chat.key'),
    cert: fs.readFileSync('./ssl/chat.pem'),
    rejectUnauthorized: false,
}




const server = https.createServer(options, app)
    .listen(3000, function () {
        console.log('server running on port 3000');
    })


const io = require('socket.io')(server);
const path = require('path');

const _ = require('underscore');
const moment = require('moment');

const userData = require('./users.json');






const USER_STATUS = ['ONLINE', 'OFFLINE'];
users = [];




app.use(express.static(path.join(__dirname, 'public')));


io.on('connection', socket => {
    socket.on('online', username => {
        socket.username = username;
        users[username] = {
            socketId: socket.id,
            status: USER_STATUS[0]
        };
        console.log(users);
    })

    socket.on('private_chat', (params, fn) => {
        console.log(params);
        const receiver = users[params.receiver];

        params.createTime = moment().format('YYYY-MM-DD HH:mm:ss');

        const senderData = _.findWhere(userData, { username: params.sender });
        params.senderPhoto = (senderData || {}).photo;

        if (!params.senderPhoto) {
            const senderLen = params.sender.length;
            params.senderPhotoNickname = params.sender.substr(senderLen - 2)
        }

        fn(params);

        if (receiver && receiver.status === USER_STATUS[0]) {
            socket.to(users[params.receiver].socketId).emit('reply_private_chat', params);
        } else {
            console.log(`${params.receiver} 不在线`);
        }
    });

    socket.on('disconnect', reason => {
        console.log('disconnect: ', reason);

        if (users[socket.username]) {
            users[socket.username].status = USER_STATUS[1];
        }
    });

})

