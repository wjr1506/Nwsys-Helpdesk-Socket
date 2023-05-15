const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const app = express();
const axios = require('axios')
const socket = require("socket.io");
const { json } = require("express");
require("dotenv").config();

app.use(cors());
app.use(express.json());


//receber mensagem das integrações | Whatsapp | Instagram | Facebook | Telegram |
app.post('/socket/messages/', async (req, res) => {

  io.to(json.conversation.id).emit("event", req.body)
  return res.sendStatus(200)

})

const server = app.listen(process.env.PORT, () => {
  console.log(`Server started on ${process.env.PORT}`)

});

const io = socket(server, {
  // cors: {
  //   origin: "/*",
  //   credentials: true,
  // },
});

global.onlineUsersid = new Map();
global.onlineUsersInfo = [];


io.on("connection", (socket) => {
  global.chatSocket = socket;

  //adicionar usuários logados no sistema
  //userID -> socket
  socket.on("add-user", (userId) => {
    onlineUsersid.set(userId, socket.id);
  });


  //adicionar usuários nas salas
  //preciso remover o usuário que mudar de sala
  socket.on('sala', (data) => {
    console.log(data)

    //conectar usuário a sala
    socket.join(data.guid)
    //se recarregar a página
    const usersInRom = global.onlineUsersInfo.find(usr => usr.user_in_room == data.user_in_room && usr.guid == data.guid)

    //e o usuário estiver logado
    //é rearmazenado o novo socket do usuário

    if (usersInRom) {

      usersInRom.socketid = socket.id

    } else {

      //salvar os dados em um array
      //guid sala
      //id do usuário
      //conexão com o socket

      global.onlineUsersInfo.push({
        guid: data.guid,
        user_in_room: data.user_in_room,
        assignee: data.assignee,
        requester: data.requester,
        socketid: socket.id
      })

    }
  })




  //receber e enviar mensagem
  socket.on("send-msg", (data) => {
    var json = JSON.parse(data)
    io.to(json.conversation.id).emit("event", data)
  });
});
