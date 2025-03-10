const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware'ler
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "'unsafe-eval'",
                'https://maps.googleapis.com',
                'https://cdn.jsdelivr.net',
                'https://cdn.quilljs.com'
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                'https://cdn.jsdelivr.net',
                'https://cdn.quilljs.com'
            ],
            imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
            connectSrc: [
                "'self'",
                'https://maps.googleapis.com',
                'https://*.firebaseio.com',
                'wss://*.firebaseio.com',
                'https://*.googleapis.com'
            ],
            frameSrc: ["'self'", 'https://wa.me'],
            fontSrc: ["'self'", 'data:', 'https://cdn.jsdelivr.net']
        }
    }
}));

// Statik dosyalar
app.use(express.static(path.join(__dirname, '')));

// Ana sayfa
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Google Places API proxy
app.get('/api/places/search', async (req, res) => {
    try {
        const { query, location } = req.query;
        const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
        
        const response = await fetch(searchUrl);
        const data = await response.json();
        
        res.json(data);
    } catch (error) {
        console.error('Places API Arama Hatası:', error);
        res.status(500).json({ error: 'Arama yapılırken bir hata oluştu' });
    }
});

// Place Details API proxy
app.get('/api/places/details/:placeId', async (req, res) => {
    try {
        const { placeId } = req.params;
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,rating,reviews,photos,opening_hours&key=${process.env.GOOGLE_PLACES_API_KEY}`;
        
        const response = await fetch(detailsUrl);
        const data = await response.json();
        
        res.json(data);
    } catch (error) {
        console.error('Places API Detay Hatası:', error);
        res.status(500).json({ error: 'Firma detayları alınırken bir hata oluştu' });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Sunucu Hatası:', err.stack);
    res.status(500).json({
        error: 'Sunucu hatası oluştu',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Bir hata oluştu'
    });
});

// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
    console.log('Ortam:', process.env.NODE_ENV || 'development');
}); 