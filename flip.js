import { Pane } from 'https://cdn.skypack.dev/tweakpane@4.0.4'
import gsap from 'https://cdn.skypack.dev/gsap@3.12.0'
import { bindAudioUnlock, playFlipBurst, testFlipSound } from './flip_sound.js'

bindAudioUnlock()

gsap.defaults({
  duration: 1,
  ease: 'none',
})

const flips = {}

const config = {
  theme: 'dark',
  perspective: 1,
  length: 10,
  characters: 'abcdefghijklmnopqrstuvwxyz',
  sound: true,
}

const ctrl = new Pane({
  title: 'Config',
  expanded: true,
})

const update = () => {
  document.documentElement.dataset.theme = config.theme
  document.documentElement.style.setProperty('--perspective', config.perspective)
}

const sync = (event) => {
  if (
    !document.startViewTransition ||
    event.target.controller.view.labelElement.innerText !== 'Theme'
  ) {
    return update()
  }

  document.startViewTransition(() => update())
}

ctrl.addBinding(config, 'perspective', {
  min: 0.5,
  max: 4,
  step: 0.1,
  label: 'perspective',
})

ctrl
  .addBinding(config, 'length', {
    min: 4,
    max: 20,
    step: 1,
    label: 'length',
  })
  .on('change', () => {
    for (const flip of Object.values(flips)) {
      flip.flipper.lineLength = config.length
    }
  })

ctrl.addBinding(config, 'theme', {
  label: 'theme',
  options: {
    system: 'system',
    light: 'light',
    dark: 'dark',
  },
})

ctrl.addBinding(config, 'sound', {
  label: 'sound',
})

ctrl.on('change', sync)
update()

const DEFAULT_CHARACTERS = 'abcdefghijklmnopqrstuvwxyz'

class FlipSlot {
  constructor(options = {}) {
    const {
      characters = DEFAULT_CHARACTERS,
      color = 'canvasText',
      pad = 0,
    } = options

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

    const currentIndex = chars.indexOf(chars[Math.floor(timeline.totalTime())]) || 0
    const desiredIndex = chars.indexOf(character) !== -1 ? chars.indexOf(character) : 0

    const shift =
      currentIndex > desiredIndex
        ? chars.length - 1 - currentIndex + desiredIndex
        : desiredIndex - currentIndex

    const padding = currentIndex === desiredIndex ? 0 : pad * (chars.length - 1)
    const totalSteps = shift + padding

    if (config.sound && totalSteps > 0) {
      playFlipBurst(Math.min(totalSteps, 12), delay)
    }

    gsap.to(scrubber, {
      delay,
      totalTime: `+=${totalSteps}`,
      ease: 'power1.out',
      duration: totalSteps * gsap.utils.random(0.02, 0.06),
    })
  }

  generateTimeline() {
    const { timeline: currentTimeline, scrubber } = this
    if (currentTimeline) currentTimeline.kill()
    if (scrubber) scrubber.kill()

    const [unfoldTop, unfoldBottom, foldTop, foldBottom] = Array.from(
      this.element.querySelectorAll(':scope > div')
    )

    const chars = this.characters

    gsap.set([foldTop, unfoldBottom], { clearProps: 'all' })

    unfoldTop.innerText = unfoldBottom.innerText = chars[1]
    foldTop.innerText = foldBottom.innerText = chars[0]

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
      .fromTo(unfoldTop, { filter: 'brightness(0)' }, { filter: 'brightness(1)', duration: 1 }, 0)
      .fromTo(foldTop, { rotateX: 0 }, { rotateX: -180, duration: 1 }, 0)
      .fromTo(foldBottom, { filter: 'brightness(1)' }, { filter: 'brightness(0)', duration: 1 }, 0)

    const duration = timeline.totalDuration()

    this.scrubber = gsap.to(timeline, {
      totalTime: duration,
      repeat: -1,
      paused: true,
      duration,
      ease: 'none',
    })

    this.scrubber.time(timeline.totalDuration())
    this.timeline = timeline
  }
}

class FlipLine {
  constructor(options = {}) {
    const { color, length = 10, pad = 0 } = options
    this.colorSet = color
    this.length = length
    this.padding = pad
    this.setup()
  }

  setup() {
    const { colorSet, length, padding } = this

    if (this.element) {
      this.element.innerHTML = ''
    } else {
      this.element = Object.assign(document.createElement('div'), {
        className: 'flip-line',
      })
    }

    this.flips = []

    for (let i = 0; i < length; i++) {
      const newSlot = new FlipSlot({
        pad: padding,
        characters: config.characters,
        color: colorSet,
      })
      this.element.appendChild(newSlot.element)
      this.flips.push(newSlot)
    }
  }

  set lineLength(value) {
    this.length = value
    this.setup()
  }

  set pad(value) {
    if (this.flips) {
      for (const flip of this.flips) flip.pad = value
    }
  }

  set color(value) {
    this.colorSet = value
    if (this.flips) {
      for (const flip of this.flips) flip.color = value
    }
  }

  run(update) {
    const letters = Array.from(update.padEnd(this.length, ' '))
    for (let i = 0; i < Math.min(letters.length, this.length); i++) {
      this.flips[i]?.flip(letters[i], i / 10)
    }
  }
}

const board = document.querySelector('.board')

const testButton = document.createElement('button')
testButton.textContent = 'Test Sound'
testButton.style.position = 'fixed'
testButton.style.top = '1rem'
testButton.style.right = '1rem'
testButton.style.zIndex = '9999'
testButton.style.padding = '0.5rem 0.75rem'
testButton.style.fontSize = '14px'

testButton.addEventListener('click', () => {
  testFlipSound()
})

document.body.appendChild(testButton)

const addLine = ({
  text = '',
  pad = 1,
  color = 'hsl(0,0%,90%)',
  alignment = 'left',
}) => {
  const lineConfig = {
    text,
    length: config.length,
    pad,
    color,
    characters: DEFAULT_CHARACTERS,
    alignment,
    id: crypto.randomUUID(),
  }

  const newLine = new FlipLine({
    length: lineConfig.length,
    color,
    pad,
  })

  board.appendChild(newLine.element)

  newLine.run(
    lineConfig.alignment === 'right'
      ? lineConfig.text.toLowerCase().padStart(lineConfig.length, ' ')
      : lineConfig.text.toLowerCase()
  )

  flips[lineConfig.id] = {
    config: lineConfig,
    flipper: newLine,
  }
}

function getColorForDays(days) {
  if (days < 10) return 'hsl(0, 100%, 50%)'
  if (days < 30) return 'hsl(44, 100%, 50%)'
  return 'hsl(120, 60%, 40%)'
}

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('./incident.json')
    const data = await response.json()

    const dateValues = Object.entries(data)
      .filter(([key]) => key.startsWith('incident.') && key.endsWith('.date'))
      .map(([, value]) => new Date(value))
      .filter((d) => !Number.isNaN(d.getTime()))

    if (!dateValues.length) {
      throw new Error('No valid incident dates found')
    }

    const lastIncidentDate = new Date(
      Math.max(...dateValues.map((d) => d.getTime()))
    )

    const now = new Date()
    const diffDays = Math.floor((now - lastIncidentDate) / (1000 * 60 * 60 * 24))

    addLine({ text: 'Days Since', pad: 0 })
    addLine({ text: 'Last Major', pad: 0 })
    addLine({ text: 'Incident', pad: 0 })
    addLine({ text: 'Caused by IAM:', pad: 0 })
    addLine({
      text: diffDays.toString(),
      pad: 1,
      color: getColorForDays(diffDays),
    })
  } catch (error) {
    console.error('Error loading incident data:', error)
  }
})