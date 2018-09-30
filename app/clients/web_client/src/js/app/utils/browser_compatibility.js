class BrowserCompatibility {
  isCompatible (ua) {
    const isIE = new RegExp('\\sMSIE\\s', 'g');
    if (ua.match(isIE) !== null) {
      const splitUA = ua.split(';');
      const browserDetails = _.find(splitUA, chunk => chunk.match(isIE) !== null);
      const versionReg = new RegExp('\\d{1,2}[,.]\\d{1,2}', 'g');
      const versionNumber = parseInt(_.first(browserDetails.match(versionReg)));
      const minimumCompatVersion = 9;
      return versionNumber > minimumCompatVersion;
    } else {
      return true;
    }
  }
};

module.exports = BrowserCompatibility;
