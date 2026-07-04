const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

module.exports = async function startServer() {
  await app.prepare();
  
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });
  
  return new Promise((resolve, reject) => {
    // Escuta na porta 0 para pegar uma porta aleatória disponível
    server.listen(0, (err) => {
      if (err) return reject(err);
      const port = server.address().port;
      console.log(`> Ready on http://localhost:${port}`);
      resolve(port);
    });
  });
};
