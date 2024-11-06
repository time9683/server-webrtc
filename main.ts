import { Server } from "https://deno.land/x/socket_io@0.2.0/mod.ts";
import { Application } from "https://deno.land/x/oak@v17.1.3/mod.ts";
import type { ConnInfo } from "https://deno.land/x/socket_io@0.2.0/deps.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
const app = new Application();
app.use(oakCors()); // Enable CORS for all routes



app.use((ctx) => {
  ctx.response.body = "welcome to Webrtc server";
});

// fix cors
const io = new Server({
cors: {
  origin: "*",
  methods: ["GET", "POST"],
  credentials: true
}
}
)


const clients: Record<string, any> = {};

app.use((ctx) => {
  ctx.response.body = "Servidor de señalización WebRTC con Deno";
});

io.on("connection", (socket) => {


  // Almacenar el cliente en el registro
  socket.on("register", ({ userId }) => {
    console.log("Cliente registrado:", userId);
    clients[userId] = socket;
  })


  socket.on("call", ({ targetId }) => {
    const targetSocket = clients[targetId];
    if (targetSocket) {
      console.log("Llamando a:", targetId);
      // get the id of the socket that is calling from the clients object
       const from = Object.keys(clients).find(key => clients[key] === socket);
      targetSocket.emit('incomingCall', { from });
    }
  });

  socket.on("CancelCall", ({ targetId }) => {
    const targetSocket = clients[targetId];
    if (targetSocket) {
      console.log("Cancelando llamada a:", targetId);
            // get the id of the socket that is calling from the clients object
            const from = Object.keys(clients).find(key => clients[key] === socket);
      targetSocket.emit('CancelCall', { from });
    }
  })

  socket.on("acceptCall", ({ targetId }) => {
    const targetSocket = clients[targetId];
    if (targetSocket) {
      console.log("Llamada aceptada por:", targetId);
      const from = Object.keys(clients).find(key => clients[key] === socket);
      targetSocket.emit('acceptCall', { from});
    }
  })

  socket.on("rejectCall", ({ targetId }) => {
    const targetSocket = clients[targetId];
    if (targetSocket) {
      const from = Object.keys(clients).find(key => clients[key] === socket);
      targetSocket.emit('rejectCall', { from });
    }
  })

  socket.on("signal", (data) => {
    console.log("signal data send")
    const { targetId, signal } = data;
    const targetSocket = clients[targetId];
    if (targetSocket) {
      const from = Object.keys(clients).find(key => clients[key] === socket);
      targetSocket.emit('signal', { from, signal });
    }
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
    delete clients[socket.id];
  });
});






const HOSTNAME = "localhost";
const PORT = 3001;


const handler = io.handler(async (req) => {
  return await app.handle(req) || new Response(null, { status: 404 });
});








const customIOHandler: Deno.ServeHandler = (
  request: Request,
  info: Deno.ServeHandlerInfo
) => {
  const localAddr: Deno.Addr = {
    transport: "tcp",
    hostname: HOSTNAME,
    port: PORT,
  };

  const connInfo: ConnInfo = {
    remoteAddr: info.remoteAddr,
    localAddr,
  };
  return handler(request, connInfo);
};

Deno.serve({
  hostname: HOSTNAME,
  port: PORT,
}, customIOHandler);
