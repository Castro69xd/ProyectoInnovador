export class AudioSystem {
  constructor() {
    this.context = null;
  }

  initialize() {
    if (!this.context) {
      this.context = new window.AudioContext();
    }

    return this.context;
  }
}
