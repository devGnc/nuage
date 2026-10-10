import { create } from 'zustand'
import { audio, resumeAudio } from './engine'
import { Kit, LEVELS, SOUND_MAP } from './sounds'

interface Instance {
  gain: GainNode
  kit: Kit
}

const active = new Map<string, Instance>()

/** État de lecture (non persisté : les navigateurs bloquent l'autoplay au chargement). */
export const usePlayback = create<{ playing: boolean; loading: string | null }>(() => ({ playing: false, loading: null }))

const curve = (v: number) => v * v

function startSound(id: string, volume: number) {
  const def = SOUND_MAP.get(id)
  if (!def) return
  const { ctx, soundsBus, reverbIn } = audio()
  const gain = ctx.createGain()
  gain.gain.value = 0
  gain.connect(soundsBus)
  const kit = new Kit(ctx, gain, reverbIn)
  try {
    def.build(kit)
  } catch (e) {
    console.error('Son impossible à lancer', id, e)
    return
  }
  gain.gain.setTargetAtTime(curve(volume) * (LEVELS[id] ?? 1), ctx.currentTime, 0.25)
  active.set(id, { gain, kit })
}

function stopSound(id: string) {
  const inst = active.get(id)
  if (!inst) return
  const { ctx } = audio()
  inst.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.12)
  const kit = inst.kit
  setTimeout(() => {
    kit.stop()
    inst.gain.disconnect()
  }, 500)
  active.delete(id)
}

/** Aligne le graphe audio sur le mix voulu. */
export function syncMix(mix: Record<string, number>, master: number, playing: boolean) {
  const { ctx, soundsBus } = audio()
  soundsBus.gain.setTargetAtTime(curve(master), ctx.currentTime, 0.1)
  const wanted = playing ? mix : {}
  for (const id of [...active.keys()]) if (!(id in wanted)) stopSound(id)
  for (const [id, vol] of Object.entries(wanted)) {
    const inst = active.get(id)
    if (inst) inst.gain.gain.setTargetAtTime(curve(vol) * (LEVELS[id] ?? 1), ctx.currentTime, 0.08)
    else {
      // la synthèse des buffers peut prendre quelques dizaines de ms : on laisse l'interface respirer
      usePlayback.setState({ loading: id })
      setTimeout(() => {
        if (!active.has(id) && usePlayback.getState().playing) startSound(id, vol)
        if (usePlayback.getState().loading === id) usePlayback.setState({ loading: null })
      }, 10)
    }
  }
}

export async function setPlaying(playing: boolean) {
  if (playing) await resumeAudio()
  usePlayback.setState({ playing })
}
