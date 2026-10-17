declare module "@novnc/novnc" {
  export default class RFB {
    constructor(target: HTMLElement, url: string)

    scaleViewport: boolean
    background: string
    viewOnly: boolean

    addEventListener(type: "connect", listener: (event: Event) => void): void
    addEventListener(
      type: "disconnect",
      listener: (event: CustomEvent<{ clean: boolean }>) => void
    ): void
    disconnect(): void
    focus(): void
  }
}
