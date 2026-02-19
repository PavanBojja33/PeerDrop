const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
app.get('/', (req, res) => {
  res.send('Server is running');
});

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);

  socket.on('join-room', (roomID) => {
    socket.join(roomID);

    const users=io.sockets.adapter.rooms.get(roomID);
    const otherUsers=[]

    if(users){
        users.forEach((user)=>{
            if(user!==socket.id){ 
                otherUsers.push(user);
            }
        })
        
    }
    socket.emit('all-users', otherUsers);
  });

  socket.on('sending-signal', (point) => {
    io.to(point.userToSignal).emit('user-joined', { 
        signal: point.signal, 
        callerID: point.callerID 
    
    });
  });

    socket.on('returning-signal', (point) => {
    io.to(point.callerID).emit('receiving-returned-signal', { 
        signal: point.signal, 
        id: socket.id 
    });
  })  

  socket.on('disconnect', () => {
    console.log('user disconnected', socket.id);
  });
})

const PORT=2569
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});