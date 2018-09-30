class BannerDisplayManager {
  static monitor ($mainBody, $bannerContainer) {
    if (this._initialized) {
      throw new Error('BannerDisplayManager#monitor cannot be called more than once.');
    }

    this._initialized = true;

    // When the browser window is resized or a device orientation is switched,
    // adjust the height of the banner container
    $(window).resize(() => $mainBody.css('padding-top', $bannerContainer.height()));

    // when a banner is displayed, increase the top padding of the main body and
    // scroll down to retain the user's scrolling position
    $bannerContainer.bind('DOMNodeInserted', (e) => {
      const containerHeight = $bannerContainer.height();
      const elementHeight = $(e.target).outerHeight();

      $mainBody.css('padding-top', containerHeight);

      $(window).scrollTop($(window).scrollTop() + elementHeight);
    });

    // when a banner is hidden, decrease the top padding of the main body and
    // scroll up to retain the user's scrolling position
    $bannerContainer.bind('DOMNodeRemoved', (e) => {
      const containerHeight = $bannerContainer.height();
      const elementHeight = $(e.target).outerHeight();

      const bottomScrollableHeightBeforePaddingAdjusted =
        document.body.offsetHeight - window.scrollY - window.innerHeight;

      $mainBody.css('padding-top', containerHeight - elementHeight);

      if (bottomScrollableHeightBeforePaddingAdjusted < elementHeight) {
        $(window).scrollTop($(window).scrollTop() + bottomScrollableHeightBeforePaddingAdjusted  * -1);
      } else {
        $(window).scrollTop($(window).scrollTop() + elementHeight * -1);
      }
    });
  }
}

module.exports = BannerDisplayManager;
