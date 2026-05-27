const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// GANTI dengan username TikTok Anda (tanpa tanda '@')
const TIKTOK_USERNAME = 'mantanpolwan6'; 

const tiktokConnection = new WebcastPushConnection(TIKTOK_USERNAME);
const userTeams = {}; 

tiktokConnection.connect().then(state => {
    console.info(`Berhasil terhubung ke Live: ${state.roomId}`);
}).catch(err => {
    console.error('Koneksi gagal. Pastikan akun tersebut sedang LIVE:', err);
});

// 1. Komentar untuk memilih tim (Ketik 1 atau 2)
tiktokConnection.on('chat', (data) => {
    const text = data.comment.trim().toLowerCase();
    const username = data.uniqueId;

    if (text === '1' || text.includes('cowo') || text.includes('boy')) {
        userTeams[username] = 'boys';
        io.emit('teamJoined', { username, team: 'boys' });
    } else if (text === '2' || text.includes('cewe') || text.includes('girl')) {
        userTeams[username] = 'girls';
        io.emit('teamJoined', { username, team: 'girls' });
    }
});

// 2. Likes / Tap-tap Layar (Membagi acak jika belum pilih tim)
tiktokConnection.on('like', (data) => {
    const username = data.uniqueId;
    let team = userTeams[username];

    if (!team) {
        team = Math.random() > 0.5 ? 'boys' : 'girls';
        userTeams[username] = team;
        io.emit('teamJoined', { username, team, isRandom: true });
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

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server berjalan di port ${PORT}`);
});
