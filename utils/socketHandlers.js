import userSockets from "./userSockets.js";

const socketHandler = (io, socket) => {
  socket.on("register-owner", (username) => {
    userSockets[username] = socket.id;
    console.log(`Registered ${username} with socket ID ${socket.id}`);
  });

  // other socket logic...
};

export default socketHandler;
