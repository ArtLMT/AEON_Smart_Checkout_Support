let audioContext: AudioContext | null = null

function playTones(frequencies: number[], spacing = 0.18): void {
  try {
    audioContext ??= new AudioContext()
    // Browsers keep audio suspended until the page has had a user gesture.
    if (audioContext.state === 'suspended') void audioContext.resume()
    const start = audioContext.currentTime
    frequencies.forEach((frequency, index) => {
      const oscillator = audioContext!.createOscillator()
      const gain = audioContext!.createGain()
      const at = start + index * spacing
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, at)
      gain.gain.exponentialRampToValueAtTime(0.15, at + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, at + spacing)
      oscillator.connect(gain).connect(audioContext!.destination)
      oscillator.start(at)
      oscillator.stop(at + spacing)
    })
  } catch {
    // Sound is an optional extra.
  }
}

export type AlertTone = 'info' | 'warning' | 'urgent'

export function playAlert(tone: AlertTone): void {
  if (tone === 'urgent') playTones([880, 660, 880, 660])
  else if (tone === 'warning') playTones([660, 880])
  else playTones([740])
}

export function setTabBadge(baseTitle: string, count: number): void {
  document.title = count > 0 ? `(${count}) ${baseTitle}` : baseTitle
}
