const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// GANTI dengan username TikTok Anda (tanpa tanda '@')
// Contoh: 'budi_gaming'
const TIKTOK_USERNAME = 'mantanpolwan6'; 

const tiktokConnection = new WebcastPushConnection(TIKTOK_USERNAME);
const userTeams = {}; 

tiktokConnection.connect().then(state => {
    console.info(`Berhasil terhubung ke Live: ${state.roomId}`);
}).catch(err => {
    console.error('Koneksi gagal. Pastikan akun tersebut sedang LIVE:', err);
});

// 1. Komentar untuk pilih tim
tiktokConnection.on('chat', (data) => {
    const text = data.comment.toLowerCase();
    const username = data.uniqueId;

    if (text.includes('cowo') || text.includes('boy') || text.includes('cowok')) {
        userTeams[username] = 'boys';
        io.emit('teamJoined', { username, team: 'boys' });
    } else if (text.includes('cewe') || text.includes('girl') || text.includes('cewek')) {
        userTeams[username] = 'girls';
        io.emit('teamJoined', { username, team: 'girls' });
    }
});

// 2. Likes / Tap-tap Layar
tiktokConnection.on('like', (data) => {
    const username = data.uniqueId;
    let team = userTeams[username];

    if (!team) {
        team = Math.random() > 0.5 ? 'boys' : 'girls';
        userTeams[username] = team;
        io.emit('teamJoined', { username, team });
    }

    io.emit('pointsAdded', { team, points: data.likeCount, type: 'like', username });
});

// 3. Hadiah / Gifts
tiktokConnection.on('gift', (data) => {
    const username = data.uniqueId;
    let team = userTeams[username];

    if (data.giftName === 'Rose' || data.giftName === 'Mawar') {
        team = 'girls';
    } else if (data.giftName === 'Finger Heart' || data.giftName === 'GG') {
        team = 'boys';
    }

    if (!team) {
        team = Math.random() > 0.5 ? 'boys' : 'girls';
        userTeams[username] = team;
    }

    const pointMultiplier = 50; 
    const points = (data.diamondCount || 1) * pointMultiplier * data.repeatCount;

    io.emit('pointsAdded', { team, points, type: 'gift', giftName: data.giftName, username });
});

server.listen(3000, () => {
    console.log('Server berjalan di port 3000');
});
