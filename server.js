// Серверная часть приложения, работает с помощью WebSocket
// Сервер управляет подключениями, синхронизирует состояние игры и передает данные между игроками
// Основные технологии: 
// node.js - серверная платформа
// express - фреймворк для создания серверных приложений на node.js, для работы с http-запросами и статическими файлами
// socket.io - библиотека для работы с WebSocket-соединениями, обеспечивает двустороннюю связь между клиентом и сервером в реальном времени
// Инициализация серверных зависимостей
const http = require('http');          // Встроенный модуль node.js для создания HTTP-сервера
const express = require('express');    // фреймворк для веб-приложений и обработки маршрутов (например, для раздачи статических файлов)
const socketIo = require('socket.io'); // библиотека для node.js для работы с WebSocket. 
const path = require('path');          // модуль node.js для работы с путями к файлам

const app = express();                 // создаем express-приложение app
const server = http.createServer(app); // на базе него создаем http-сервер
const io = socketIo(server);           // подключаем socketio к серверу

// Обслуживание статических файлов из папки "public" (сервер будет раздавать их клиентам)
app.use(express.static(path.join(__dirname, 'public')));

// Для хранения данных о игроках
const players = {};

// Вот это блок рассмотреть подробнее
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
