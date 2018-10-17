const webpack = require('webpack');

class WebpackPackageProgress extends webpack.ProgressPlugin {
  constructor() {
    super();
    this.socket = null;
    this.instance = null;
    this.handler = (percent, msg) => {
      this._progressHandler(percent, msg);
    };
  }

  static getInstatnce() {
    if (!this.instance) {
      this.instance = new WebpackPackageProgress();
    }
    return this.instance;
  }

  _progressHandler(percent, msg) {
    const progress = Math.floor(percent * 100);
    if (this.socket) {
      this.socket.emit('progress', { progress, msg });
    }
  }

  setSocket(socket) {
    this.socket = socket;
  }
}

module.exports = WebpackPackageProgress.getInstatnce();
