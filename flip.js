import gsap from 'https://cdn.skypack.dev/gsap@3.12.0'
import { bindAudioUnlock, playFlipBurst, testFlipSound } from './flip_sound.js'

bindAudioUnlock()

gsap.defaults({
  duration: 1,
  ease: 'none',
})

const DEFAULTS = {
  boardSelector: '.board',
  columns: 16,
  perspective: 1,
  theme: 'dark',
  sound: true,
  characters: 'abcdefghijklmnopqrstuvwxyz0123456789 .,:!?-/',
}

class FlipSlot {
  constructor(boardConfig, options = {}) {
    const {
      characters = boardConfig.characters,
      color = 'canvasText',
      pad = 0,
    } = options

    this.boardConfig = boardConfig
    this.characters = Array.from(` ${characters} `)
    this.colorSet = color
    this.pad = pad
    this.element = this.create()
    this.generateTimeline()
  }

  set chars(value) {
    this.characters = Array.from(` ${value} `)
    this.generateTimeline()
  }

  set color(value) {
    this.colorSet = value
    this.element?.style.setProperty('--color', value)
  }

  create() {
    return Object.assign(document.createElement('div'), {
      className: 'flip',
      style: `--color: ${this.colorSet}`,
      innerHTML: `
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      `,
    })
  }

  flip(character, delay = 0) {
    const { characters: chars, pad, timeline, scrubber } = this

    const currentRaw = Math.floor(timeline.totalTime())
    const currentChar = chars[currentRaw] ?? chars[0]
    const currentIndex = chars.indexOf(currentChar)
    const desiredIndex = chars.includes(character) ? chars.indexOf(character) : 0

    const shift =
      currentIndex > desiredIndex
        ? chars.length - 1 - currentIndex + desiredIndex
        : desiredIndex - currentIndex

    const padding = currentIndex === desiredIndex ? 0 : pad * (chars.length - 1)
    const totalSteps = shift + padding

    if (this.boardConfig.sound && totalSteps > 0) {
      playFlipBurst(Math.min(totalSteps, 12), delay)
    }

    gsap.to(scrubber, {
      delay,
      totalTime: `+=${totalSteps}`,
      ease: 'power1.out',
      duration: Math.max(0.1, totalSteps * gsap.utils.random(0.02, 0.06)),
    })
  }

  generateTimeline() {
    if (this.timeline) this.timeline.kill()
    if (this.scrubber) this.scrubber.kill()

    const [unfoldTop, unfoldBottom, foldTop, foldBottom] = Array.from(
      this.element.querySelectorAll(':scope > div')
    )

    const chars = this.characters

    gsap.set([foldTop, unfoldBottom], { clearProps: 'all' })

    unfoldTop.innerText = unfoldBottom.innerText = chars[1] ?? ' '
    foldTop.innerText = foldBottom.innerText = chars[0] ?? ' '

    const timeline = gsap
      .timeline({
        paused: true,
        repeat: chars.length - 2,
        onRepeat: () => {
          const index = Math.floor(timeline.totalTime() / timeline.duration())
          const next = chars[index % chars.length]
          const current = chars[(index + 1) % chars.length]
          unfoldTop.innerText = unfoldBottom.innerText = current
          foldTop.innerText = foldBottom.innerText = next
        },
      })
      .fromTo(unfoldBottom, { rotateX: 180 }, { rotateX: 0, duration: 1 }, 0)
      .fromTo(
        unfoldTop,
        { filter: 'brightness(0)' },
        { filter: 'brightness(1)', duration: 1 },
        0
      )
      .fromTo(foldTop, { rotateX: 0 }, { rotateX: -180, duration: 1 }, 0)
      .fromTo(
        foldBottom,
        { filter: 'brightness(1)' },
        { filter: 'brightness(0)', duration: 1 },
        0
      )

    const duration = timeline.totalDuration()

    this.scrubber = gsap.to(timeline, {
      totalTime: duration,
      repeat: -1,
      paused: true,
      duration,
      ease: 'none',
    })

    this.scrubber.time(duration)
    this.timeline = timeline
  }
}

class FlipLine {
  constructor(boardConfig, options = {}) {
    this.boardConfig = boardConfig
    this.colorSet = options.color ?? 'hsl(0,0%,90%)'
    this.length = options.length ?? boardConfig.columns
    this.padding = options.pad ?? 0
    this.characters = options.characters ?? boardConfig.characters
    this.setup()
  }

  setup() {
    if (this.element) {
      this.element.innerHTML = ''
    } else {
      this.element = Object.assign(document.createElement('div'), {
        className: 'flip-line',
      })
    }

    this.flips = []

    for (let i = 0; i < this.length; i++) {
      const slot = new FlipSlot(this.boardConfig, {
        pad: this.padding,
        characters: this.characters,
        color: this.colorSet,
      })
      this.element.appendChild(slot.element)
      this.flips.push(slot)
    }
  }

  set lineLength(value) {
    this.length = value
    this.setup()
  }

  set pad(value) {
    this.padding = value
    for (const flip of this.flips) flip.pad = value
  }

  set color(value) {
    this.colorSet = value
    for (const flip of this.flips) flip.color = value
  }

  set chars(value) {
    this.characters = value
    for (const flip of this.flips) flip.chars = value
  }

  run(text = '', alignment = 'left') {
    const normalized =
      alignment === 'right'
        ? text.toLowerCase().padStart(this.length, ' ')
        : text.toLowerCase().padEnd(this.length, ' ')

    const letters = Array.from(normalized.slice(0, this.length))

    for (let i = 0; i < this.length; i++) {
      this.flips[i]?.flip(letters[i] ?? ' ', i / 10)
    }
  }
}

export function createFlipBoard(options = {}) {
  const boardConfig = { ...DEFAULTS, ...options }

  document.documentElement.dataset.theme = boardConfig.theme
  document.documentElement.style.setProperty(
    '--perspective',
    boardConfig.perspective
  )

  const boardElement = document.querySelector(boardConfig.boardSelector)
  if (!boardElement) {
    throw new Error(`Board element not found: ${boardConfig.boardSelector}`)
  }

  const registry = []

  function clear() {
    boardElement.innerHTML = ''
    registry.length = 0
  }

  function addLine(lineOptions = {}) {
    const normalizedConfig = {
      text: lineOptions.text ?? '',
      alignment: lineOptions.alignment ?? 'left',
      color: lineOptions.color ?? 'hsl(0,0%,90%)',
      pad: lineOptions.pad ?? 0,
      length: lineOptions.length ?? boardConfig.columns,
      characters: lineOptions.characters ?? boardConfig.characters,
    }

    const line = new FlipLine(boardConfig, normalizedConfig)
    boardElement.appendChild(line.element)
    line.run(normalizedConfig.text, normalizedConfig.alignment)

    registry.push({
      config: normalizedConfig,
      line,
    })

    return line
  }

  function renderLines(lines = []) {
    clear()
    for (const line of lines) {
      addLine(line)
    }
  }

  function replay() {
    for (const item of registry) {
      item.line.run(item.config.text, item.config.alignment)
    }
  }

  function setTheme(theme) {
    boardConfig.theme = theme
    document.documentElement.dataset.theme = theme
  }

  function setPerspective(perspective) {
    boardConfig.perspective = perspective
    document.documentElement.style.setProperty('--perspective', perspective)
  }

  function setSound(enabled) {
    boardConfig.sound = Boolean(enabled)
  }

  return {
    config: boardConfig,
    element: boardElement,
    clear,
    addLine,
    renderLines,
    replay,
    setTheme,
    setPerspective,
    setSound,
    testSound: testFlipSound,
  }
}