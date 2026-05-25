const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const MODELS_FILE = path.join(__dirname, 'models.json');

// Прочитати моделі з файлу при старті
let models;
try {
    const data = fs.readFileSync(MODELS_FILE, 'utf8');
    models = JSON.parse(data);
} catch (err) {
    models = [];
    fs.writeFileSync(MODELS_FILE, JSON.stringify(models, null, 2), 'utf8');
}

const MIME = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
};

// Статичні файли шукаємо у проєктному корені:
// week16/*, assets/*, lib/*
const STATIC_ROOTS = [
    path.join(__dirname),           // week16/
    path.join(__dirname, '..'),     // корінь проєкту (assets/, lib/)
];

function serveStatic(res, pathname) {
    for (const root of STATIC_ROOTS) {
        let filePath;
        if (pathname === '/') {
            filePath = path.join(__dirname, 'index.html');
        } else {
            // Прибираємо ведучий слеш, пробуємо знайти файл
            const relativePath = pathname.replace(/^\//, '');
            filePath = path.join(root, relativePath);
        }

        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath);
            const contentType = MIME[ext] || 'application/octet-stream';

            fs.readFile(filePath, (err, content) => {
                if (err) {
                    res.statusCode = 500;
                    res.end('<h1>500 - Internal Server Error</h1>');
                    return;
                }
                res.statusCode = 200;
                res.setHeader('Content-Type', `${contentType}; charset=utf-8`);
                res.end(content);
            });
            return true;
        }
    }
    return false;
}

const server = http.createServer((req, res) => {
    const parsedURL = url.parse(req.url, true);
    const pathname = parsedURL.pathname;
    const method = req.method;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
    }

    console.log(method, pathname);

    // GET /api/models — повернути всі моделі
    if (pathname === '/api/models' && method === 'GET') {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(models));
        return;
    }

    // POST /api/models — додати нову модель
    if (pathname === '/api/models' && method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            const newModel = JSON.parse(body);
            newModel.id = models.length > 0 ? Math.max(...models.map(m => m.id)) + 1 : 1;
            models.push(newModel);
            fs.writeFileSync(MODELS_FILE, JSON.stringify(models, null, 2), 'utf8');
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.statusCode = 201;
            res.end(JSON.stringify(newModel));
            console.log('Додано модель:', newModel.name, 'id:', newModel.id);
        });
        return;
    }

    // Статичні файли
    if (serveStatic(res, pathname)) {
        return;
    }

    // 404
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<h1>404 - файл не знайдено</h1>');
});

server.listen(PORT, () => {
    console.log(`Week16 сервер працює на http://localhost:${PORT}`);
});
