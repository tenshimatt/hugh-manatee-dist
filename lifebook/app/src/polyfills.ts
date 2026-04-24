// Hermes (React Native's JS engine) doesn't ship DOMException.
// LiveKit / WebRTC internals reference it — must be set before any
// @elevenlabs/react-native or livekit-client module is evaluated.
if (typeof (global as any).DOMException === "undefined") {
  class DOMExceptionPolyfill extends Error {
    static readonly ABORT_ERR = 20;
    readonly code: number;
    constructor(message = "", name = "Error") {
      super(message);
      this.name = name;
      this.code = name === "AbortError" ? DOMExceptionPolyfill.ABORT_ERR : 0;
    }
  }
  (global as any).DOMException = DOMExceptionPolyfill;
}
