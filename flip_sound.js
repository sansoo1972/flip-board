let audioCtx = null
let audioEnabled = false

export function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    }

    if (audioCtx.state === 'suspended') {
        audioCtx.resume()
    }

    audioEnabled = true
    console.log('[audio] initialized')
}

export function isAudioReady() {
    return !!audioCtx && audioEnabled
}

export function playFlipTick({
    volume = 0.03,
    duration = 0.025,
    frequency = 1400,
    noiseAmount = 0.6,
} = {}) {
    if (!audioEnabled || !audioCtx) return

    const now = audioCtx.currentTime

    const gain = audioCtx.createGain()
    gain.gain.setValueAtTime(volume, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

    const osc = audioCtx.createOscillator()
    osc.type = 'square'
    osc.frequency.setValueAtTime(frequency, now)
    osc.frequency.exponentialRampToValueAtTime(frequency * 0.7, now + duration)

    const noiseBuffer = audioCtx.createBuffer(
        1,
        Math.floor(audioCtx.sampleRate * duration),
        audioCtx.sampleRate
    )
    const data = noiseBuffer.getChannelData(0)

    for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * noiseAmount
    }

    const noise = audioCtx.createBufferSource()
    noise.buffer = noiseBuffer

    const noiseFilter = audioCtx.createBiquadFilter()
    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.setValueAtTime(1800, now)
    noiseFilter.Q.setValueAtTime(0.8, now)

    osc.connect(gain)
    noise.connect(noiseFilter)
    noiseFilter.connect(gain)
    gain.connect(audioCtx.destination)

    osc.start(now)
    osc.stop(now + duration)

    noise.start(now)
    noise.stop(now + duration)
}

export function playFlipBurst(steps = 1, startDelay = 0) {
    if (!audioEnabled || !audioCtx) return

    const spacing = 0.035

    for (let i = 0; i < steps; i++) {
        window.setTimeout(() => {
            playFlipTick({
                volume: 0.018 + Math.random() * 0.015,
                frequency: 1100 + Math.random() * 700,
                duration: 0.015 + Math.random() * 0.01,
                noiseAmount: 0.5 + Math.random() * 0.3,
            })
        }, (startDelay + i * spacing) * 1000)
    }
}

export function bindAudioUnlock() {
    const unlock = () => {
        initAudio()
        window.removeEventListener('click', unlock)
        window.removeEventListener('keydown', unlock)
        window.removeEventListener('touchstart', unlock)
    }

    window.addEventListener('click', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    window.addEventListener('touchstart', unlock, { once: true })
}

export function testFlipSound() {
    initAudio()

    for (let i = 0; i < 8; i++) {
        window.setTimeout(() => {
            playFlipTick({
                volume: 0.08,
                duration: 0.04,
                frequency: 900 + i * 60,
                noiseAmount: 0.8,
            })
        }, i * 45)
    }
}