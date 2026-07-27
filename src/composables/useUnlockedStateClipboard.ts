import { onMounted, onUnmounted } from 'vue';
import type { UnlockedState } from '$services/unlockedState';

/**
 * Wires the `copy` DOM event (triggered by document.execCommand('copy') from
 * UnlockedState.copyPassword/copyUsername) to actually place the decrypted value
 * on the clipboard, then starts the clipboard-forget timer.
 */
export function useUnlockedStateClipboard(unlockedState: UnlockedState) {
  function handleCopy(e: ClipboardEvent) {
    const payload = unlockedState.consumeClipboardPayload();
    if (!payload) return; // listener can get registered multiple times

    e.clipboardData?.setData('text/plain', payload.value);
    e.preventDefault();

    unlockedState.onClipboardCopied(payload.fieldName);
  }

  onMounted(() => document.addEventListener('copy', handleCopy));
  onUnmounted(() => document.removeEventListener('copy', handleCopy));
}
