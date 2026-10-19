import { scheduleStudySync } from '../../study/sync'

/** Après un import : envoi rapide, sans attendre le délai habituel. */
export function requestStudySync() {
  scheduleStudySync(500)
}
