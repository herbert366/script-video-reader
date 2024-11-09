let sentences = []
let currentSentenceIndex = 0
let voice = null
let isPlaying = false // Controle para o Play/Pause

// Carrega o arquivo de texto e processa as frases
document.getElementById('fileInput').addEventListener('change', async event => {
  const file = event.target.files[0]
  if (file) {
    const text = await file.text()
    console.log('Texto completo carregado:', text)
    processText(text) // Atualizado para usar a nova função de divisão
  }
})

// Processa o texto e divide em frases com no mínimo 50 caracteres
// Função que divide o texto com base nas novas regras
function processText(text) {
  const maxCharacters = 100 // Altere para o valor desejado
  sentences = splitTextFromDot(text, maxCharacters)

  console.log('Número de frases processadas:', sentences.length)
  console.log('Exemplo de frases processadas:', sentences.slice(0, 5))

  if (sentences.length === 0) {
    alert('Nenhuma frase encontrada. Verifique o conteúdo do arquivo.')
    return
  }

  displayCurrentSentence()
  initializeVoice()
}

// Função de divisão fornecida
function splitTextFromDot(text, maxCharacters) {
  text = text.trim()
  const result = []

  function splitByPunctuations(text) {
    const sentences = text
      .split(/([.,?!:;—])/g)
      .reduce((acc, sentence, index) => {
        sentence = sentence.trim()
        if (sentence === '') return acc
        if (index % 2 === 0) {
          acc.push(sentence)
        } else {
          acc[acc.length - 1] += sentence
        }
        return acc
      }, [])
    return sentences
  }

  function getLength(text) {
    return text.replace(/([.,?!:;—\s])/g, '').length
  }

  const sentences = splitByPunctuations(text)

  for (let curSentence of sentences) {
    curSentence = curSentence.trim()
    const lastSentenceInResult = result[result.length - 1]

    if (result.length === 0) {
      result.push(curSentence)
      continue
    }

    const futureLength =
      getLength(curSentence) + getLength(lastSentenceInResult)

    if (futureLength < maxCharacters) {
      result[result.length - 1] += ' ' + curSentence
    } else {
      result.push(curSentence)
    }
  }
  return result
}

// Exibe a frase atual
function displayCurrentSentence() {
  const textOutput = document.getElementById('textOutput')
  textOutput.innerHTML = `<p>${sentences[currentSentenceIndex]}</p>`
}

// Configura a voz
function initializeVoice() {
  const voices = speechSynthesis.getVoices()
  voice = voices.find(
    v =>
      v.name.includes('Multi') ||
      (v.lang.includes('pt-BR') && v.voiceURI.includes('Natural'))
  )

  if (!voice) {
    speechSynthesis.onvoiceschanged = () => initializeVoice()
  }
}

// Fala a frase atual, interrompendo qualquer fala ativa
function speakCurrentSentence() {
  stopSpeaking() // Para a fala atual antes de iniciar uma nova
  if (voice && sentences[currentSentenceIndex]) {
    const utterance = new SpeechSynthesisUtterance(
      sentences[currentSentenceIndex]
    )
    utterance.voice = voice
    speechSynthesis.speak(utterance)
    isPlaying = true // Atualiza o status para "tocando"

    // Quando a fala termina, atualiza o status
    utterance.onend = () => {
      isPlaying = false
    }

    console.log(
      'Falando frase:',
      currentSentenceIndex,
      sentences[currentSentenceIndex]
    )
  } else {
    console.error('Falha ao falar: Voz ou frase não disponível.')
  }
}

// Para a fala em execução
function stopSpeaking() {
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel()
    isPlaying = false // Atualiza o status para "parado"
  }
}

// Navega para a próxima frase
function nextSentence() {
  if (currentSentenceIndex < sentences.length - 1) {
    currentSentenceIndex++
    displayCurrentSentence()
    speakCurrentSentence()
  } else {
    console.log('Última frase atingida.')
  }
}

// Navega para a frase anterior
function previousSentence() {
  if (currentSentenceIndex > 0) {
    currentSentenceIndex--
    displayCurrentSentence()
    speakCurrentSentence()
  } else {
    console.log('Primeira frase atingida.')
  }
}

// Repete a frase atual
function repeatSentence() {
  speakCurrentSentence()
}

// Controle de Play/Pause
function togglePlayPause() {
  if (isPlaying) {
    stopSpeaking()
  } else {
    speakCurrentSentence()
  }
}

// Escuta as teclas de atalho
document.addEventListener('keydown', event => {
  if (event.ctrlKey && event.key === '6') {
    event.preventDefault()
    previousSentence()
  } else if (event.ctrlKey && event.key === '7') {
    event.preventDefault()
    nextSentence()
  } else if (event.ctrlKey && event.key === '8') {
    event.preventDefault()
    repeatSentence()
  } else if (event.ctrlKey && event.key === '9') {
    // Atalho para Play/Pause
    event.preventDefault()
    togglePlayPause()
  }
})

// Carrega as vozes disponíveis ao iniciar o programa
window.speechSynthesis.onvoiceschanged = () => {
  initializeVoice()
}

const socket = new WebSocket('ws://localhost:8080')

socket.addEventListener('open', () => {
  console.log('Conexão WebSocket estabelecida')
})

socket.addEventListener('error', error => {
  console.error('Erro no WebSocket:', error)
})

socket.addEventListener('close', () => {
  console.log('Conexão WebSocket fechada')
})

// Ao receber uma mensagem do WebSocket, executa o comando correspondente
socket.addEventListener('message', event => {
  const command = event.data
  console.log('Comando recebido:', command)

  if (command === 'previous') {
    previousSentence()
  } else if (command === 'next') {
    nextSentence()
  } else if (command === 'repeat') {
    repeatSentence()
  } else if (command === 'playPause') {
    togglePlayPause()
  }
})
