
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    getAudioWaveform
} = require('@whiskeysockets/baileys');

const pino = require('pino');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
// const { use } = require('react');
const aiSessions = {};
// const env = require('env')

async function KonekKeWA() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Menggunakan Baileys v${version.join('.')}, latest: ${isLatest}`);

    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' })
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log('QR Code siap, silakan pindai!');
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi terputus ', lastDisconnect.error, ', mencoba menghubungkan kembali... ', shouldReconnect);
            if (shouldReconnect) {
                KonekKeWA();
            }
        } else if (connection === 'open') {
            console.log('Koneksi berhasil tersambung!');
        }
    });

    sock.ev.on('creds.update', saveCreds);


    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && m.type === 'notify') {
            const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
            if (!text) return;

            const command = text.toLowerCase();
            const userJid = msg.key.remoteJid;

            if (command === 'ping') {
                await sock.sendMessage(userJid, { text: 'Pong!' }, { quoted: msg });
            
            } else if (command.startsWith('.ai ')) {
                const question = text.substring(4); 

                try {
                    let apiUrl = `https://api.ryzumi.vip/api/ai/chatgpt?text=${encodeURIComponent(question)}`;
                    if (aiSessions[userJid]) {
                        apiUrl += `&session=${aiSessions[userJid]}`;
                    }

                    const response = await axios.get(apiUrl);
                    const aiResponse = response.data.result;
                    aiSessions[userJid] = response.data.session;

                    await sock.sendMessage(userJid, { text: aiResponse }, { quoted: msg });
                } catch (error) {
                    await sock.sendMessage(userJid, { text: 'Maaf, sepertinya AI sedang istirahat.' }, { quoted: msg });
                }
            
            } else if (command === 'aireset') {
                delete aiSessions[userJid];
                await sock.sendMessage(userJid, { text: 'Session Direset' }, { quoted: msg });
            
            } else if (command === 'fufufafa') {
                try {
                    let fufufafaapi = 'https://fufufafapi.vanirvan.my.id/api/random'
                    const response = await axios.get(fufufafaapi)
                    const {content: fufurespon, doksli: doksli, image_url: gambar} = response.data
                    const gabungan = `Pesan: ${fufurespon}\nDoksi Pesan: ${doksli}`

                    // await sock.sendMessage(userJid, { text: gabungan }, { quoted: msg });
                    await sock.sendMessage(userJid, {image: {url: gambar}, caption: gabungan})
                } catch (error) {
                    await sock.sendMessage(userJid, { text: reply }, {quoted: msg})
                }
            } else if (command === 'gempa') {
                    let gempaurl = 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json'
                    const response = await axios.get(gempaurl)
                    const response1 = response.data.Infogempa
                    const {Tanggal: tanggal, Jam: jam, Coordinates: kordinat, Magnitude: magnitude, Wilayah: wilayah, Shakemap: ganbar} = response1.gempa
                    const realGambar = `https://data.bmkg.go.id/DataMKG/TEWS/${ganbar}`
                    const gabungan = `Gempa Terbaru
Tanggal : ${tanggal}
Jam : ${jam}
Kordinat : ${kordinat}
Magnitude : ${magnitude}
Wilayah : ${wilayah}`
                    // console.log(respon se1)
                    await sock.sendMessage(userJid, { image: {url: realGambar }, caption: gabungan})
                    // await sock.sendMessage(userJid, { text: 'error BOS' }, { quoted: msg })
            } else if (command.startsWith('ytmp3')) {
                const question1 = text.substring(1);
                let apiyt = `https://api.ferdev.my.id/downloader/ytmp3?link=${question1}&apikey=ikhsan-null`
                const response = await axios.get(apiyt)
                const { title: judul, thumbnail: tumnail, size, dlink: audio } = response.data.data;
                const MB = size / (1024 * 1024);
                const message3 = `Youtube MP3 Download
Judul : ${judul}
Ukuran : ${MB.toFixed(2)}MB`
                await sock.sendMessage(userJid, { image: { url: tumnail }, caption: message3})
                await sock.sendMessage(userJid, { audio: { url: audio}, mimetype: 'audio/mp4'})
            } else if (command.startsWith('roastinghp')) {
                const question = text.substring(1)
                async function callGeminiApi() {
    const apikey = 'AIzaSyBOKv1XUeNpFhxG6uJqA8eFveIGnO2gQn8';
    const nama_model = "gemini-2.5-pro";

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${nama_model}:generateContent?key=${apikey}`;

    const requestBody = {
        contents: [
            {
                parts: [
                    {
                        text: `Roasting habis-habisan ${question} dengan gaya pedas, menusuk, dan menyindir semua kekurangannya dari segi performa, desain, fitur, dan kualitas. Tulis dalam satu paragraf saja, tanpa angka, tanpa poin-poin, dan jangan bertele-tele. Tulis seperti anak IT yang udah muak sama HP ini karena terlalu sampah untuk dipakai.`
                    }
                ]
            }
        ]
    };

    try {
        const response = await axios.post(apiUrl, requestBody, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const geminiResponse = response.data;
    
        if (geminiResponse.candidates && geminiResponse.candidates.length > 0) {
            const hasilai = geminiResponse.candidates[0].content.parts[0].text
            await sock.sendMessage(userJid, { text: hasilai, quoted: msg })
        } else {
            console.log("\nTidak Ada Teks Yang Di Hasilkan.");
        }

    } catch (error) {
        console.error("Error BOS :", error.response ? error.response.data : error.message);
    }
}

// Panggil fungsinya
callGeminiApiQ();
            } else if (command.startsWith('igdl')) {
                const question = (typeof text === 'string' ? text.substring(4) : '').trim();
                if (!question) {
                    await sock.sendMessage(userJid, {text: 'Url Nya Mana Mas', quoted: msg })
                    return
                }
                try {
                    let urlig = `https://api.ryzumi.vip/api/downloader/igdl?url=${question}`
                    const respon = await axios.get(urlig)
                    // console.log(respon)
                    const { thumbnail: tumnail, url: urldl } = respon.data.data[0]
                    // console.log(urldl)
                    await sock.sendMessage(userJid, { text: 'Tunggu.......', quoted: msg })
                    await sock.sendMessage(userJid, { video: { url: urldl }, caption: 'Ini Bang' })
                    // console.log(question
                } catch (error) {
                    console.error(error)
                    await sock.sendMessage(userJid, { text: error, quoted: msg })
                }   
            } else if (command.startsWith('teradl')) {
                await sock.sendMessage(userJid, { text: 'Tunggu.....', caption: msg })
                const question = text.substring(7)
                let teraapi = `https://api.ferdev.my.id/downloader/terabox?link=${question}&apikey=ikhsan-null`
                const respon = await axios.get(teraapi)
                const { file_name: namafile, size: ukuran, direct_link: linkdl } = respon.data.result
                const gabungan = `Terabox Bypass Login
                Name : ${namafile}
                Size : ${ukuran}
                Download Link : ${linkdl}`
                await sock.sendMessage(userJid, { text: gabungan, quoted: msg })
            } else if (command.startsWith('ytsearch')) {
                const question = text.substring(9)
                let url = `https://api.ryzumi.vip/api/search/yt?query=${question}`
                const respon = await axios.get(url)
                const datavideo = respon.data.videos
                let replyMessage = `*Hasil Pencarian YouTube untuk "${question}"*\n\n`;
                datavideo.forEach((video, index) => {
                replyMessage += `*${index + 1}. ${video.title}*\n`;
                replyMessage += `   Channel: ${video.author.name}\n`;
                replyMessage += `   Durasi: ${video.duration.timestamp}\n`;
                replyMessage += `   Link: ${video.url}\n`;
                replyMessage += `\n`; 
                });
                await sock.sendMessage(userJid, { text: replyMessage, caption: msg })
            }
        }
    })
}

KonekKeWA();