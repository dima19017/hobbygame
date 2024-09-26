const http = require('http');
const express = require('express');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Обслуживание статических файлов из папки "public"
app.use(express.static(path.join(__dirname, 'public')));

const players = {};  // Для хранения данных о игроках

io.on('connection', (socket) => {
    console.log(`Игрок подключился: ${socket.id}`);
    
    // Создаём нового игрока на сервере
    players[socket.id] = {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 }
    };

    // Отправляем существующих игроков новому игроку
    socket.emit('currentPlayers', players);

    // Сообщаем остальным о новом игроке
    socket.broadcast.emit('newPlayer', { id: socket.id, playerData: players[socket.id] });

    // Получаем обновлённые данные от клиента и пересылаем другим игрокам
    socket.on('playerMove', (data) => {
        players[socket.id] = data;
        socket.broadcast.emit('playerMoved', { id: socket.id, playerData: data });
    });

    // Удаляем игрока при отключении
    socket.on('disconnect', () => {
        console.log(`Игрок отключился: ${socket.id}`);
        delete players[socket.id];
        socket.broadcast.emit('removePlayer', socket.id);
    });
});

// Запуск сервера на порту 3000 и на всех интерфейсах
server.listen(3000, '0.0.0.0', () => {
    console.log('Сервер запущен на порту 3000');
});
