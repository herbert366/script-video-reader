const { GlobalKeyboardListener } = require('node-global-key-listener')
const WebSocket = require('ws')
const http = require('http')
const fs = require('fs')
const path = require('path')

// Função para servir arquivos estáticos
function serveStaticFile(filePath, res) {
  const extname = path.extname(filePath)
  const contentType =
    {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
    }[extname] || 'application/octet-stream'

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404)
      res.end('Arquivo não encontrado')
    } else {
      res.writeHead(200, { 'Content-Type': contentType })
      res.end(data)
    }
  })
}

// Cria o servidor HTTP
const server = http.createServer((req, res) => {
  if (req.method === 'GET') {
    // Caminho do arquivo solicitado dentro da pasta 'public'
    const filePath =
      req.url === '/'
        ? path.join(__dirname, 'public', 'index.html')
        : path.join(__dirname, 'public', req.url)

    // Serve o arquivo se ele estiver na pasta 'public'
    serveStaticFile(filePath, res)
  }
})

// Configura o WebSocket
const wss = new WebSocket.Server({ server })

// Função para enviar comandos ao cliente WebSocket
function sendCommand(command) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(command)
    }
  })
}

// Configuração do listener de teclado global
const listener = new GlobalKeyboardListener()
listener.addListener((e, down) => {
  if (e.state === 'DOWN') {
    if (e.name === '6' && down['LEFT CTRL']) {
      console.log('Atalho Control + 6 detectado')
      sendCommand('previous')
    } else if (e.name === '7' && down['LEFT CTRL']) {
      console.log('Atalho Control + 7 detectado')
      sendCommand('next')
    } else if (e.name === '8' && down['LEFT CTRL']) {
      console.log('Atalho Control + 8 detectado')
      sendCommand('repeat')
    }
  }
})

// Inicia o servidor na porta 8080
server.listen(8080, () => {
  console.log(
    'Servidor HTTP e WebSocket escutando na porta 8080, http://localhost:8080'
  )
})
