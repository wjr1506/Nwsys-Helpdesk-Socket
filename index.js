const express = require("express");
const cors = require("cors");
const app = express();
const axios = require('axios')
const socket = require("socket.io");
const { json } = require("express");
require("dotenv").config();

app.use(cors());
app.use(express.json());


//rota que recebe mensagem das integrações | Whatsapp | Instagram | Facebook | Telegram |
app.post('/socket/message/', async (req, res) => {

  console.log(req.body)

  //receber e enviar mensagem
  // socket.on("send-msg", (data) => {
  //   var json = JSON.parse(data)
  //   console.log(json)

  //   //status da mensagem
  //   //verificar se há usuários na sala e se a conversa for chat
  //   if (global.usersInRom.length > 0 && global.usersInRom.find(usr => json.conversation.id == usr.guid).channel == 'chat') {
  //     //verificar se o usuário está online no socket
  //     if (onlineUsersid.get(json.receiver.id)) {
  //       console.log('status de enviado')
  //     } else {
  //       console.log('status de entregue')
  //     }
  //   }
  //   io.to(json.conversation.id).emit("event", data)
  // });
  // io.to(json.conversation.id).emit("event", req.body)
  return res.sendStatus(200)

})

//rota que recebe atualização do status da mensagem
app.post('/socket/message/notification/', async (req, res) => {

  io.to(json.conversation.id).emit("event", req.body)
  return res.sendStatus(200)

})

//rota que recebe notificação para criar conversa
app.post('/socket/conversation/create/', async (req, res) => {

  const exemple = {
    conversation: {
      id: '556392031185@94ef992f-79c0-4556-8b7a-5be8db0c4849',
      ticket: null,
      status: 5,
      origin: '',
      requester: 84,
      assignee: 1668,
      guid: '94ef992f-79c0-4556-8b7a-5be8db0c4849',
      timestamp: '2023-06-16 16:59:59.15',
      channel: 'chat'
    },
    peopleList: [
      1, 2, 3, 4, 5,
      6, 7, 8, 9, 84,
      1134, 1668
    ]
  }

  peopleList = req.body.peopleList;
  console.log(req.body)
  //para cada Id recebido na lista de usuários
  peopleList.forEach(e => {

    if (onlineUsersid.get(e) != undefined) {
      // io.to(onlineUsersid.get(e)).emit("create-conversation", req.body.conversation);
      io.to(onlineUsersid.get(e)).emit("update-conversation", req.body.conversation);

    }

  });
  return res.sendStatus(200)

})

//rota que recebe notificação para fazer update na lista de conversa
app.post('/socket/conversation/update/', async (req, res) => {

  const exemple = {
    conversationId: { guid: '556392031185@caee14eb-1114-401b-aa82-22acfc86225c' },
    peopleList: [
      1, 2, 3, 4, 5,
      6, 7, 8, 9, 84,
      1134, 1668
    ]
  }

  peopleList = req.body.peopleList;
  //para cada Id recebido na lista de usuários
  peopleList.forEach(e => {

    if (onlineUsersid.get(e) != undefined) {
      io.to(onlineUsersid.get(e)).emit("update-conversation", req.body.conversationId);
    }

  });
  return res.sendStatus(200)

})

//rota que recebe notificação para remover conversa
app.post('/socket/conversation/delete/', async (req, res) => {

  const exemple = {
    conversationId: { guid: '556392031185@94ef992f-79c0-4556-8b7a-5be8db0c4849' },
    peopleList: [
      1, 2, 3, 4, 5,
      6, 7, 8, 9, 84,
      1134, 1668
    ]
  }

  peopleList = req.body.peopleList;
  //para cada Id recebido na lista de usuários
  peopleList.forEach(e => {

    if (onlineUsersid.get(e) != undefined) {
      // io.to(onlineUsersid.get(e)).emit("delete-conversation", req.body.conversation);
      io.to(onlineUsersid.get(e)).emit("update-conversation", req.body.conversationId);

    }

  });
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
global.usersInRom = [];


io.on("connection", (socket) => {
  global.chatSocket = socket;

  //adicionar usuários logados no sistema
  //userID -> socket
  socket.on("add-user", (userId) => {
    console.log(`usuário ${userId} logado`)
    onlineUsersid.set(userId, socket.id);
  });


  //adicionar usuários nas salas
  //preciso remover o usuário que deslogar do socket
  socket.on('sala', (data) => {
    console.log(data)

    //conectar usuário a sala
    socket.join(data.guid)

    //se recarregar a página
    const usersInRom = global.usersInRom.find(usr => usr.user_in_room == data.user_in_room && usr.guid == data.guid)

    //e o usuário estiver logado
    //é rearmazenado o novo socket do usuário

    if (usersInRom) {

      usersInRom.socketid = socket.id

    } else {

      //salvar os dados em um array
      //guid sala
      //id do usuário
      //conexão com o socket

      global.usersInRom.push({
        guid: data.guid,
        user_in_room: data.user_in_room,
        assignee: data.assignee,
        requester: data.requester,
        channel: data.channel,
        socketid: socket.id
      })

    }
  })



});
