// PUBLIC_INTERFACE
export function createKeys() {
  return { left: false, right: false, jump: false };
}

/**
 * Attach keyboard events needed for platformer
 */
export function attachKeyboardHandlers(setKeys, getGameStatusCb) {
  function handler(e, val) {
    let code = e.code || e.key;
    if (code === "ArrowLeft" || code === "KeyA") setKeys(k => ({ ...k, left: val }));
    if (code === "ArrowRight" || code === "KeyD") setKeys(k => ({ ...k, right: val }));
    if (
      code === "ArrowUp" ||
      code === "Space" ||
      code === "KeyW"
    ) setKeys(k => ({ ...k, jump: val }));
  }
  function onKeyDown(e) {
    handler(e, true);
    if (e.code === "Escape" && getGameStatusCb() === "playing") {
      // Pause by raising a custom event
      const pauseEvt = new Event("requestPause");
      window.dispatchEvent(pauseEvt);
    }
  }
  function onKeyUp(e) { handler(e, false); }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  return () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
  };
}
