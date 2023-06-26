const express = require("express");
const cors = require("cors");
const app = express();
const axios = require('axios')
const socket = require("socket.io");
const { json } = require("express");
const jwt = require("jsonwebtoken")
require("dotenv").config();

app.use(cors());
app.use(express.json());

var dataUTC = new Date().toLocaleDateString();
var hUTC = new Date().toLocaleTimeString();

//userID -> socket
//Map(1) { 1668 => 'G3MFuRWDooKAeCFlAAAB' }
global.onlineUsers = new Map();
global.onlineUsersJson = {

};



// [
// {
// guid: '556392031185@21c7f765-528d-484d-bf98-df93772e0b42',
// user_id_in_room: '1668',
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
  const userobj = await ensureAuth(req.headers.authorization)

  const exemple = {
    "message": {
      "id": "5a0e4df7-b084-48d5-9141-c6a12aa8e24d",
      "conversation.id": "639920311855@e489dbe5-c9b7-4735-8a67-bdda9cf9f605",
      "sender.id": 1668,
      "sender.name": "Wellinton Neves",
      "sender.login": "Wellinton",
      "sender.photo_url": "https://helpdesk.radinfo.com.br/helpdesk/Upload/peoples/84.png",
      "receiver.id": 84,
      "receiver.name": "radTeste",
      "receiver.login": "radteste",
      "receiver.photo_url": null,
      "type": "text",
      "status": 2,
      "content": "[WELLINTON]: cccc",
      "media.id": null,
      "media.type": null,
      "media.caption": null,
      "media.link": null,
      "guid": "5a0e4df7-b084-48d5-9141-c6a12aa8e24d",
      "timestamp": "2023-06-22 10:38:55.543",
      "quoted.id": null,
      "quoted.conversation.id": null,
      "quoted.sender.id": null,
      "quoted.sender.name": null,
      "quoted.sender.login": null,
      "quoted.sender.photo_url": null,
      "quoted.receiver.id": null,
      "quoted.receiver.name": null,
      "quoted.receiver.login": null,
      "quoted.receiver.photo_url": null,
      "quoted.type": null,
      "quoted.status": null,
      "quoted.content": null,
      "quoted.media.id": null,
      "quoted.media.type": null,
      "quoted.media.caption": null,
      "quoted.media.link": null,
      "quoted.guid": null,
      "quoted.timestamp": null
    },
    "peopleList": [
      "0604b181-a69e-460b-8cb6-fccf94e4a3fd",
      "dcb384d5-5266-4e31-945d-b322293e4077"
    ]
  }

  var message = req.body.message;
  var peopleList = req.body.peopleList;
  message['receiver.guid'] = 'dcb384d5-5266-4e31-945d-b322293e4077'
  // var message = JSON.parse(message)

  if (global.onlineUsers.size > 0) {

    //se o usuário que recebeu estiver online
    // if (global.onlineUsers.get(message['receiver.id'])) {
    if (global.onlineUsers.get(message['receiver.guid'] + userobj.organization_credential_guid)) {

      //encontrar o usuário caso o destinatário da conversa esteja na sala

      if (global.usersInRom.find(usr => usr.guid == message['conversation.id'] && usr.user_id_in_room == message['receiver.id'] && usr.organization_guid == userobj.organization_credential_guid)) {
        message.status = 3 //dois ponteiros verdes (status de lido)
      } else {
        message.status = 2 //dois ponteiros (status de entregue)
      }
    } else {
      message.status = 1  //um ponteiro (status de enviado)
    }
  } else {
    message.status = 1  //um ponteiro (status de enviado)
  }

  io.to(message['conversation.id']).emit("event", message)

  //atualizar conversa
  peopleList.forEach(e => {

    if (global.onlineUsers.get(e + userobj.organization_credential_guid) != undefined) {
      io.to(global.onlineUsers.get(e + userobj.organization_credential_guid)['socket_id']).emit("update-conversation", message['conversation.id']);
      // io.to(onlineUsers.get(e)).emit("update-conversation", conversation);
    }
  });

  let onlineUsersId = []

  getKeysFromMap(global.onlineUsers).forEach(e => {
    onlineUsersId = [...onlineUsersId, global.onlineUsers.get(e).user_guid]
  });

  let json = sameValues(onlineUsersId, peopleList);
  return res.status(200).json({ online_users_list: json, message_status: message.status })

})

app.post('/socket/message/status/', async (req, res) => {

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

  //status da mensagem



  io.to(message['conversation.id']).emit("event", message)
  let onlineUsersId = getKeysFromMap(global.onlineUsers);
  let json = sameValues(onlineUsersId, peopleList);
  return res.status(200).json({ online_users_list: json })

})

//rota que recebe notificação para criar conversa
app.post('/socket/conversation/create/', async (req, res) => {

  const userobj = await ensureAuth(req.headers.authorization)

  const exemple = {
    "conversation": {
      "id": "639920311855@a44280ac-b8dd-428b-b9cc-306f2eae933d2a11111",
      "channel": "chat",
      "status": 1,
      "requester": {
        "id": 1668,
        "login": "radteste",
        "name": "radTeste",
        "organization": {
          "id": 2187,
          "name": "1580 - Teste Araguaina-",
          "code": 1580
        }
      },
      "assignee": {
        "id": 84,
        "login": "Wellinton",
        "photo_url": "https://helpdesk.radinfo.com.br/helpdesk/Upload/peoples/84.png",
        "name": "Wellinton Neves",
        "department": {
          "id": 12,
          "name": "nwsys",
          "description": "NWSys"
        }
      },
      "last_message": {
        "id": "5a0e4df7-b084-48d5-9141-c6a12aa8e24d",
        "conversation": {
          "id": "639920311855@a44280ac-b8dd-428b-b9cc-306f2eae9d2a"
        },
        "sender": {
          "id": 84,
          "login": "Wellinton",
          "name": "Wellinton Neves"
        },
        "receiver": {
          "id": 1668,
          "login": "radteste",
          "name": "radTeste"
        },
        "type": "audio",
        "status": 2,
        "content": "",
        "guid": "5A0E4DF7-B084-48D5-9141-C6A12AA8E24D",
        "timestamp": "2023-06-22 10:34:52.000"
      },
      "rule": 0,
      "include": false,
      "support_started": false,
      "guid": "{A44280AC-B8DD-428B-B9CC-306F2EAE9D2B}",
      "timestamp": "2023-06-22 10:21:04.000",
      "updated_at": "2023-06-22 10:34:52.000",
      "now": "2023-06-22 15:02:49.000",
      "historic": []
    },
    "peopleList": [
      "0604b181-a69e-460b-8cb6-fccf94e4a3fd",
      "dcb384d5-5266-4e31-945d-b322293e4077"
    ]
  }

  peopleList = req.body.peopleList;
  conversation = req.body.conversation
  //para cada Id recebido na lista de usuários

  peopleList.forEach(e => {
    if (onlineUsers.get(e + userobj.organization_credential_guid) != undefined) {

      io.to(onlineUsers.get(e + userobj.organization_credential_guid)['socket_id']).emit("create-conversation", conversation);
      // io.to(onlineUsers.get(e)).emit("create-conversation", conversation);
    }
  });

  let onlineUsersId = []


  getKeysFromMap(global.onlineUsers).forEach(e => {
    onlineUsersId = [...onlineUsersId, global.onlineUsers.get(e).user_guid]
  });

  let json = sameValues(onlineUsersId, peopleList);
  return res.status(200).json({ online_users_list: json })

})

//rota que recebe notificação para fazer update na lista de conversa
app.patch('/socket/conversation/update/', async (req, res) => {
  const userobj = await ensureAuth(req.headers.authorization)

  const exemple = {
    conversation: { id: '556392031185@caee14eb-1114-401b-aa82-22acfc86225c' },
    peopleList: [
      1, 2, 3, 4, 5,
      6, 7, 8, 9, 84,
      1134, 1668
    ]
  }

  peopleList = req.body.peopleList;
  conversation = req.body.conversation.id
  //para cada Id recebido na lista de usuários
  peopleList.forEach(e => {

    if (onlineUsers.get(e + userobj.organization_credential_guid) != undefined) {
      io.to(onlineUsers.get(e + userobj.organization_credential_guid)['socket_id']).emit("update-conversation", conversation);
      // io.to(onlineUsers.get(e)).emit("update-conversation", conversation);
    }

  });

  onlineUsersId = []

  getKeysFromMap(global.onlineUsers).forEach(e => {
    onlineUsersId = [...onlineUsersId, global.onlineUsers.get(e).user_guid]
  });

  let json = sameValues(onlineUsersId, peopleList);
  return res.status(200).json({ online_users_list: json })

})

//rota que recebe notificação para remover conversa
app.delete('/socket/conversation/delete/', async (req, res) => {
  const userobj = await ensureAuth(req.headers.authorization)

  const exemple = {
    "conversation": {
      "id": "639920311855@a44280ac-b8dd-428b-b9cc-306f2eae933d2a11111"
    },
    "peopleList": [
      "0604b181-a69e-460b-8cb6-fccf94e4a3fd",
      "dcb384d5-5266-4e31-945d-b322293e4077"
    ]
  }

  peopleList = req.body.peopleList;
  conversation = req.body.conversation.id
  //para cada Id recebido na lista de usuários
  peopleList.forEach(e => {

    if (onlineUsers.get(e + userobj.organization_credential_guid) != undefined) {
      io.to(onlineUsers.get(e + userobj.organization_credential_guid)['socket_id']).emit("delete-conversation", conversation);
      // io.to(onlineUsers.get(e)).emit("delete-conversation", conversation);
    }

  });
  onlineUsersId = []

  getKeysFromMap(global.onlineUsers).forEach(e => {
    onlineUsersId = [...onlineUsersId, global.onlineUsers.get(e).user_guid]
  });

  let json = sameValues(onlineUsersId, peopleList);
  return res.status(200).json({ online_users_list: json })

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

io.on("connection", async (socket) => {
  const userobj = await ensureAuth(socket.handshake.auth.token)

  if (socket.id) {
    console.log("\n" + 'connect ' + dataUTC + " - " + hUTC + "\n")
    io.to(socket.id).emit("reconnect", { "reconect": true })
    userobj['socket_id'] = socket.id
  }

  //adicionar usuários logados no sistema
  socket.on("add-user", (data) => {


    console.log(`usuário ${data} logado ` + dataUTC + " " + hUTC + "\n")
    onlineUsers.set(userobj.user_guid + userobj.organization_credential_guid, userobj);

    // onlineUsers.set(data, socket.id);

    console.log('====================')
    console.log(onlineUsers)
    console.log('====================')

  });

  //adicionar usuários nas salas
  socket.on('sala', (data) => {

    var exemple = {
      guid: 'id@guid',
      user_id_in_room: '84',
      assignee: '64',
      requester: '115',
      channel: 'whatsapp',
    }

    //conectar usuário a sala
    socket.join(data.guid)

    //se recarregar a página
    const users = global.usersInRom.find(usr => usr.user_id_in_room == data.user_id_in_room && usr.organization_guid == userobj.organization_credential_guid) //localizar se o usuário está em uma sala
    const userIndex = global.usersInRom.findIndex(usr => usr.user_id_in_room === data.user_id_in_room && usr.organization_guid == userobj.organization_credential_guid); //localizar index do usuário
    console.log(global.usersInRom)
    if (users) {

      if (users.guid == data.guid) {
        console.log('mesma sala')
        usersInRom[userIndex].socketid = socket.id
      } else {
        console.log('nova sala')
        usersInRom[userIndex].guid = data.guid
        usersInRom[userIndex].assignee = data.assignee
        usersInRom[userIndex].requester = data.requester
        usersInRom[userIndex].channel = data.channel
        usersInRom[userIndex].socketid = socket.id
      }
    } else {
      //salvar os dados em um array
      console.log('primeira sala')
      global.usersInRom.push({
        guid: data.guid,
        organization_guid: userobj.organization_credential_guid,
        user_id_in_room: data.user_id_in_room,
        assignee: data.assignee,
        requester: data.requester,
        channel: data.channel,
        socketid: socket.id,
      });

    }
  })

  socket.on("disconnect", (reason, details) => {

    if (global.onlineUsers != undefined) {
      // let userId = getKeyByValue(onlineUsers, socket.id)
      console.log(`user ${userobj.user_guid + userobj.organization_credential_guid} foi removido ` + dataUTC + " - " + hUTC)
      onlineUsers.delete(userobj.user_guid + userobj.organization_credential_guid)
      // console.log(`user ${userId} foi removido ` + dataUTC + " - " + hUTC)
      // onlineUsers.delete(userId)
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


//middleware
const ensureAuth = async (auth) => {

  authorization = auth
  const [type, token] = authorization.split(' ')

  if (type !== 'Bearer') {

    return res.status(401).json({
      errors: {
        default: 'Não autenticado'
      }
    });
  }
  const jwtData = verify(token)

  if (jwtData === "JWT_SECRET NOT FOUND") {
    return res.status(500).json({
      errors: {
        default: 'Erro interno no servidor'
      }
    });
  } else if (jwtData === "INVALID_TOKEN") {
    return res.status(400).json({
      errors: {
        default: 'Não autenticado'
      }
    });
  }

  return jwtData
}


const verify = async (token) => {
  if (!process.env.JWT_SECRET) return 'JWT_SECRET NOT FOUND';

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (typeof decoded === 'string') {
      return 'INVALID_TOKEN';
    }
    return decoded
  } catch (e) {
    return 'INVALID_TOKEN';
  }

}