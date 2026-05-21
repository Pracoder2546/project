const express = require("express");
const app = express();

const http = require("http").createServer(app);

const io = require("socket.io")(http);

app.use(express.static("public"));

let users = [];

io.on("connection", socket => {

    console.log("Connected:", socket.id);

    users.push(socket);

    if (users.length >= 2) {

        const user1 = users[0];
        const user2 = users[1];

        user1.emit("start-call", {
            initiator: true,
            partner: user2.id
        });

        user2.emit("start-call", {
            initiator: false,
            partner: user1.id
        });

        users = [];
    }

    socket.on("signal", data => {

        io.to(data.to).emit("signal", {
            from: socket.id,
            signal: data.signal
        });
    });

    socket.on("disconnect", () => {

        console.log("Disconnected:", socket.id);

        users = users.filter(u => u.id !== socket.id);
    });
});

http.listen(3000, () => {
    console.log("Server running on 3000");
});