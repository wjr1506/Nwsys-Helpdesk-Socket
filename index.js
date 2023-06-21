const express = require("express");
const cors = require("cors");
const app = express();
const axios = require('axios')
const socket = require("socket.io");
const { json } = require("express");
require("dotenv").config();

app.use(cors());
app.use(express.json());

var dataUTC = new Date().toLocaleDateString();
var hUTC = new Date().toLocaleTimeString();

//userID -> socket
//Map(1) { 1668 => 'G3MFuRWDooKAeCFlAAAB' }
global.onlineUsers = new Map();



// [
// {
// guid: '556392031185@21c7f765-528d-484d-bf98-df93772e0b42',
// user_in_room: '1668',
// assignee: '1668',
//requester: '84',
//channel: 'chat',
//socketid: '-OYQ2spj0gY-Wg2xAAAD'
//}
//]
global.usersInRom = [];
var usrsMessageReceiveds = []

//rota que recebe mensagem das integrações | Whatsapp | Instagram | Facebook | Telegram |
app.post('/socket/message/', async (req, res) => {

  var exemple = {
    id: 'message_id',
    conversation: { id: 'id@guid' },
    sender: { id: 1, name: 'name' },
    receiver: { id: 2 },
    type: 'text',
    status: 0,
    content: '[RADTESTE]: asdacccxxx',
    guid: 'guid',
    timestamp: 'yyyy-mm-dd hh:mm:ss.mss'
  }

  var message = req.body.message;
  var peopleList = req.body.peopleList;
  // var message = JSON.parse(message)

  //receber e enviar mensagem
  // socket.on("send-msg", (data) => {
  //   var json = JSON.parse(data)

  console.log(global.usersInRom.length)
  //status da mensagem
  //verificar se há usuários na sala e se a conversa for chat
  if (global.usersInRom.length > 0 && global.usersInRom.find(usr => message['conversation.id'] == usr.guid).channel == 'chat') {
    //verificar se o usuário está online no socket
    if (global.onlineUsers.get(message['receiver.id'])) {
      console.log('status de entregue/recebido')
      message.status = 2 //dois ponteiros
    } else {
      console.log('status de enviado')
      message.status = 1  //um ponteiro
    }
  }
  //   io.to(json.conversation.id).emit("event", data)
  // });


  io.to(message['conversation.id']).emit("event", message)
  let onlineUsersId = getKeysFromMap(global.onlineUsers);
  let json = sameValues(onlineUsersId, peopleList);
  return res.status(200).json({ online_users_list : json })

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
  conversation = req.body.conversation
  //para cada Id recebido na lista de usuários
  peopleList.forEach(e => {

    if (onlineUsers.get(e) != undefined) {
      // io.to(onlineUsers.get(e)).emit("create-conversation", req.body.conversation);
      io.to(onlineUsers.get(e)).emit("update-conversation", conversation);

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
  conversationId = req.body.conversationId
  //para cada Id recebido na lista de usuários
  peopleList.forEach(e => {

    if (onlineUsers.get(e) != undefined) {
      io.to(onlineUsers.get(e)).emit("update-conversation", conversationId);
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
  conversationId = req.body.conversationId
  //para cada Id recebido na lista de usuários
  peopleList.forEach(e => {

    if (onlineUsers.get(e) != undefined) {
      // io.to(onlineUsers.get(e)).emit("delete-conversation", req.body.conversation);
      io.to(onlineUsers.get(e)).emit("update-conversation", conversationId);

    }

  });
  return res.sendStatus(200)

})

const server = app.listen(process.env.PORT, () => {
  console.log(`Server started on http://localhost:${process.env.PORT}`)
});

const io = socket(server, {
  // cors: {
  //   origin: "/*",
  //   credentials: true,
  // },
});



io.on("connection", (socket) => {

  if (socket.id) {
    console.log("\n" + 'connect ' + dataUTC + " - " + hUTC + "\n")
    io.to(socket.id).emit("reconnect", { "1": "reconnect" })
  }

  //adicionar usuários logados no sistema
  socket.on("add-user", (data) => {

    var exemple = 84;

    console.log(`usuário ${data} logado ` + dataUTC + " " + hUTC + "\n")
    onlineUsers.set(data, socket.id);
    console.log('====================')
    console.log(onlineUsers)
    console.log('====================')

  });

  //adicionar usuários nas salas
  socket.on('sala', (data) => {

    var exemple = {
      guid: 'id@guid',
      user_in_room: '84',
      assignee: '64',
      requester: '115',
      channel: 'whatsapp'
    }

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
      global.usersInRom.push({
        guid: data.guid,
        user_in_room: data.user_in_room,
        assignee: data.assignee,
        requester: data.requester,
        channel: data.channel,
        socketid: socket.id
      })

      console.log(global.usersInRom)

    }
  })

  socket.on("disconnect", (reason, details) => {

    if (global.onlineUsers != undefined) {
      let userId = getKeyByValue(onlineUsers, socket.id) 
      console.log(`user ${userId} foi removido ` + dataUTC + " - " + hUTC)
      onlineUsers.delete(userId)
      console.log(onlineUsers)

    };
  });
});


//===functions===

function getKeyByValue(map, searchValue) {
  for (let [key, value] of map) {
    if (value === searchValue) {
      return key;
    }
  }

  // Se o valor não for encontrado, pode retornar null ou lançar uma exceção, dependendo do seu caso de uso.
  return null;
}

//pegar chaves do mapa e retornar como array
function getKeysFromMap(map) {
  return Array.from(map.keys());
}

//pegar duas listas e retornar o valor igual entre elas
function sameValues(listaA, listaB) {
  const valoresIguais = [];

  for (let i = 0; i < listaA.length; i++) {
    for (let j = 0; j < listaB.length; j++) {
      if (listaA[i] === listaB[j]) {
        valoresIguais.push(listaA[i]);
        break;
      }
    }
  }

  return valoresIguais;
}