const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

const events = [
    // your events array here
];

app.get('/api/events', (req, res) => {
    let result = events.filter(event => {
        return (req.query.genre ? event.genre.toLowerCase() === req.query.genre.toLowerCase() : true) &&
               (req.query.date ? event.date === req.query.date : true) &&
               (req.query.city ? event.city.toLowerCase() === req.query.city.toLowerCase() : true);
    });
    res.json({ events: result });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
const cors = require('cors');

// Allow all origins
app.use(cors());

// Or, to allow only specific origins:
app.use(cors({
    origin: 'http://127.0.0.1:5500'
}));

// Or, to allow a dynamic list of origins based on the request:
app.use(cors((req, callback) => {
    const allowedOrigins = ['http://127.0.0.1:5500'];
    const origin = req.header('Origin');
    callback(null, allowedOrigins.includes(origin));
}));

