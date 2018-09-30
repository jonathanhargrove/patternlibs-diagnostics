const LoadingView             = require('root/views/loading_view');
const templates               = require('templates');
const tippy                   = require('tippy.js');

var DeviceViewStreaming = {
  _renderSpinnerAndFetchModel ($container) {
    $container.append(new LoadingView().render().$el);
    this.activeRequest = this.model.fetch({skipReload: true}).always(() => {
      return this.$('.loading').remove();
    });

    return this.activeRequest;
  },

  _fetchOptedInAndRetryRender ($container) {
    return this._renderSpinnerAndFetchModel($container).then(() => {
      if (this.model.isOptedIn()) {
        return this.render();
      } else {
        return this._renderNotOptedInMessage($container);
      }
    });
  },

  _fetchCapabilitiesAndRetryRender ($container) {
    return this._renderSpinnerAndFetchModel($container).then(() => {
      if (this.model.get('capabilities').length) {
        return this.render();
      } else {
        return this._renderWaitingMessage($container);
      }
    });
  },

  _renderOptedOutMessage ($container) {
    const optedOutMarkup = templates['opted_out'](this.model.attributes);
    return $container.append(optedOutMarkup);
  },

  _renderNotOptedInMessage ($container) {
    const notOptedInMarkup = templates['not_opted_in'](this.model.attributes);
    return $container.append(notOptedInMarkup);
  },

  _renderWaitingMessage ($container) {
    const waitingForDataMarkup = templates['waiting_for_data'](this.model.attributes);
    $container.append(waitingForDataMarkup);

    // monitor the current status since all thermostats have that capability,
    // and once an initial set of data for the device is receive, then we'll
    // be able to query the server for the device's known capapbilities,
    // and then finally we can then render the device.
    const stream = this.model.currentStatusModel();
    stream.subscribe();
    return this.listenTo(stream, 'change', () => {
      return this.model.fetch({
        success: () => {
          if (this.model.get('capabilities').length) {
            this.stopListening(stream, 'change');
            stream.unsubscribe();
            return this.render();
          }
        }
      });
    });
  },

  _addStreamingView ($container, viewClass, streamClass, streamType, streamDataType, additionalViewOptions) {
    const streamOptions = {
      deviceId: this.model.get('deviceId'),
      timeZone: this.model.get('timeZone'),
      deviceModel: this.model.get('deviceModel'),
      session: this.session
    };

    const stream = this._resolveStream(streamOptions, streamClass, streamType, streamDataType);

    const opts = _.extend({
      [streamDataType]: stream,
      readOnly: this.readOnly,
      session: this.session
    }, additionalViewOptions);

    const view = new viewClass(opts); // eslint-disable-line new-cap

    this._showStreamingView($container, view, stream, additionalViewOptions);

    this.listenTo(stream, 'change reset', function () { // 'change' for models and 'reset' for collections
      stream.dataReceived = true;
      return view.render();
    });

    stream.onErrorCallback = function () {
      view.$('.stream-error').show();
      return tippy(view.$('.stream-error')[0], {
        html: $(templates['stream_error']())[0],
        arrow: true
      });
    };

    stream.onMessageCallback = () => view.$('.stream-error').hide();

    return view;
  },

  _resolveStream (streamOptions, streamClass, streamType, streamDataType) {
    let stream;
    const reportKey = streamOptions.deviceId + '_' + streamType;
    if (this.reportCache && this.reportCache.hasOwnProperty(reportKey)) {
      stream = this.reportCache[reportKey];
    } else {
      if (streamDataType === 'model') {
        stream = new streamClass(streamOptions); // eslint-disable-line new-cap
      } else if (streamDataType === 'collection') {
        stream = new streamClass(null, streamOptions); // eslint-disable-line new-cap
      } else {
        throw new Error(`Unexpected streamDataType '${streamDataType}'`);
      }
      this.reportCache[reportKey] = stream;
    }

    return stream;
  },

  _showStreamingView ($container, view, stream, additionalViewOptions) {
    if (additionalViewOptions == null) { additionalViewOptions = {}; }
    const {configModel} = additionalViewOptions;

    this.streamingViews.push(view);
    $container.append(view.render({watermark: !stream.dataReceived}).$el);
    if (configModel) {
      this.listenTo(configModel, 'change', () => view.render({watermark: !stream.dataReceived}));
    }

    return stream.subscribe();
  }
};

module.exports = DeviceViewStreaming;
