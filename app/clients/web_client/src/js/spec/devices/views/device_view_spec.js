define(function (require) {
  require('spec/spec_helper');
  const Alarms                       = require('alarms/models/alarms_collection');
  const AlarmHistoryView             = require('alarm_history/views/alarm_history_view');
  const AlarmsView                   = require('alarms/views/alarms_view');
  const Backbone                     = require('backbone');
  const CustomersCollection          = require('customers/models/customers_collection');
  const Device                       = require('devices/models/device');
  const DeviceView                   = require('devices/views/device_view');
  const Factories                    = require('spec/_support/factories');
  const NexiaStream                  = require('infrastructure/nexia_stream');
  const Session                      = require('root/models/session');
  const StreamCollection             = require('reports/common/stream_collection');
  const StreamModel                  = require('reports/common/stream_model');
  const Thermostat                   = require('devices/models/thermostat');
  const ThermostatCurrentStatus      = require('current_status/models/thermostat_current_status');
  const ThermostatRuntimeHistoryView = require('runtime_history/views/thermostat_runtime_history_view');

  describe('DeviceView', function () {
    beforeEach(function () {
      this.deviceId = '00404505';
      this.timeZone = 'America/New_York';
      this.deviceModel = 'XL950';
      this.session = new Session({roles: [], enabledFeatures: []});
      this.model = new Thermostat({
        deviceId: this.deviceId,
        deviceModel: this.deviceModel,
        timeZone: this.timeZone,
        isNew: false,
        status: 'OPTED IN',
        capabilities: ['foo']});
      this.model.url = () => '/foo';
      this.model.collection = new Backbone.Collection();
      sinon.stub(this.model, 'hasCapability').returns(true);

      this.dealerUuid = 'some_pig';
      this.customersCollection = new CustomersCollection({dealerUuid: this.dealerUuid});

      this.system = Factories.create('system', {primaryDevice: this.model});

      this.alarmFetchSpy = sinon.spy(Alarms.prototype, 'fetch');
      this.alarmInitializeSpy = sinon.spy(Alarms.prototype, 'initialize');
      this.statusFetchSpy = sinon.spy(ThermostatCurrentStatus.prototype, 'fetch');
      this.addEventListenerSpy = sinon.spy(NexiaStream.instance(), 'addEventListener');

      this.reportCache = {};
      this.view = new DeviceView({model: this.model, reportCache: this.reportCache, session: this.session, system: this.system, customers: this.customersCollection});
    });

    afterEach(function () {
      this.alarmFetchSpy.restore();
      this.alarmInitializeSpy.restore();
      this.statusFetchSpy.restore();
      this.addEventListenerSpy.restore();
    });

    it('sends appropriate parameters to the AlarmsCollection', function () {
      this.view.render();

      expect(this.alarmInitializeSpy.calledWith(sinon.match.any, {
        deviceId: this.deviceId,
        deviceModel: this.deviceModel,
        timeZone: this.timeZone,
        session: this.session
      }
      )).toBeTruthy();
    });

    it('should subscribe to the various streams', function () {
      this.view.render();

      expect(this.addEventListenerSpy.calledWith(`${this.deviceId}_alarms`)).toBeTruthy();
      expect(this.addEventListenerSpy.calledWith(`${this.deviceId}_current_status`)).toBeTruthy();
      expect(this.addEventListenerSpy.calledWith(`${this.deviceId}_sys_config`)).toBeTruthy();
    });

    describe('with a null system', function () {
      beforeEach(function () {
        this.nullSystem = null;

        this.nullSystemView = new DeviceView({model: this.model, reportCache: this.reportCache, session: this.session, system: this.nullSystem});
      });

      it('does not raise an error', function () {
        this.nullSystemView.render();

        expect(() => this.nullSystemView.render()).not.toThrow();
      });
    });

    describe('with a device that is opted out', () =>
      it("displays a message of the device's status", function () {
        this.model.set('status', 'OPTED OUT');

        expect(this.view.render().$('.not-opted-in').length).toEqual(1);
      })
    );

    describe('with a device that is not enrolled', function () {
      beforeEach(function () {
        this.model.set('status', Device.PERMISSIONS.NOT_REGISTERED);
        spyOn(this.model, 'fetch').and.returnValue($.Deferred().resolve(this.model));
      });

      it('fetches the device', function () {
        this.view.render();
        expect(this.model.fetch).toHaveBeenCalled();
      });

      describe('when the fetch results in opted in', () =>
        it('renders the device view', function () {
          this.model.set('status', Device.PERMISSIONS.OPTED_IN);
          this.view.render();
          expect(this.view.$('.not-opted-in').length).toBe(0);
        })
      );

      describe('when the fetch results in still not enrolled', () =>
        it("displays a message of the device's status", function () {
          this.view.render();
          expect(this.view.$('.not-opted-in').length).toBeTruthy();
        })
      );
    });

    describe('with a device that is opted in', function () {
      const capabilities = ['alarms', 'current_status', 'sys_config', 'runtime_history'];

      describe("without any capabilities (read as 'unknown capabilities')", function () {
        beforeEach(function () {
          this.subscribeSpy = sinon.spy(ThermostatCurrentStatus.prototype, 'subscribe');
          this.modelFetchStub = sinon.stub(this.model, 'fetch');
          this.modelFetchDfd = $.Deferred();
          this.modelFetchStub.returns(this.modelFetchDfd);
          this.listenToSpy = sinon.spy(this.view, 'listenTo');
          this.model.set('capabilities', []);
          this.view.render();
        });

        afterEach(() => ThermostatCurrentStatus.prototype.subscribe.restore());

        it('tries to fetch the device immediately', function () {
          expect(this.modelFetchStub.calledOnce).toBeTruthy();
        });

        describe('when the fetch returns some capabilities', function () {
          beforeEach(function () {
            this.model.set('capabilities', capabilities);
            this.viewRenderSpy = sinon.spy(this.view, 'render');
            this.modelFetchDfd.resolve(this.model);
          });

          it('subscribes to the streams for those capabilities', function () {
            expect(this.addEventListenerSpy.calledWith(`${this.deviceId}_alarms`)).toBeTruthy();
          });

          it('renders the device view', function () {
            expect(this.viewRenderSpy.called).toBeTruthy();
          });
        });

        describe('when the fetch returns without capabilities', function () {
          beforeEach(function () {
            this.modelFetchDfd.resolve(this.model);
          });

          it('displays a waiting for data message', function () {
            expect(this.view.$('.waiting-for-data').length).toBeTruthy();
          });

          it('monitors the current status stream for communication from the device', function () {
            expect(this.subscribeSpy.called).toBeTruthy();
          });

          describe('when it receives communication from the current status stream', function () {
            beforeEach(function () {
              const streamChangeCallback = _.find(this.listenToSpy.args, callArgs => callArgs[1] === 'change')[2];
              streamChangeCallback();
            });

            it('fetches the device for an updated list of capabilities', function () {
              expect(this.modelFetchStub.called).toBeTruthy();
            });

            describe('with new found capabilities', function () {
              beforeEach(function () {
                this.model.set('capabilities', ['foo']);
                this.modelFetchSuccessCallback = _.find(this.modelFetchStub.args.reverse(), callArgs => callArgs[0].success)[0].success;
                this.streamUnsubscribeSpy = sinon.spy(ThermostatCurrentStatus.prototype, 'unsubscribe');
              });

              afterEach(() => ThermostatCurrentStatus.prototype.unsubscribe.restore());

              it('unsubscribes from the current status stream', function () {
                const viewStopListeningSpy = sinon.spy(this.view, 'stopListening');

                this.modelFetchSuccessCallback();

                expect(this.streamUnsubscribeSpy.called).toBeTruthy();
                expect(viewStopListeningSpy.getCall(0).args[1]).toBe('change');
              });

              it('rerenders the device view', function () {
                const viewRenderSpy = sinon.spy(this.view, 'render');

                this.modelFetchSuccessCallback();

                expect(viewRenderSpy.called).toBeTruthy();
              });
            });
          });
        });
      });

      describe('capabilities', function () {
        afterEach(function () {
          this.model.hasCapability.restore();
        });

        _.each(capabilities, function (capability) {
          const friendlyName = capability.replace('_', ' ');

          const containerIdForCapability = {
            current_status: '#thermostat-current-status-container',
            runtime_history: '#thermostat-runtime-history-container'
          };

          const expectedContainerId = containerIdForCapability[capability] || `#${capability}-container`.replace('_', '-');

          describe(`with a ${friendlyName} capability`, function () {
            beforeEach(function () {
              this.model.hasCapability.restore();
              sinon.stub(this.model, 'hasCapability').withArgs(capability).returns(true);
            });

            it(`displays the ${friendlyName} panel`, function () {
              expect(this.view.render().$(expectedContainerId).length).toBe(1);
            });
          });

          describe(`without a ${friendlyName} capability`, function () {
            beforeEach(function () {
              this.model.hasCapability.restore();
              sinon.stub(this.model, 'hasCapability').withArgs(capability).returns(false);
            });

            it(`doesn't display the ${friendlyName} panel`, function () {
              expect(this.view.render().$(expectedContainerId).length).toBe(0);
            });
          });
        });
      });
    });

    describe('#remove', function () {
      beforeEach(function () {
        this.modelUnsubscribeSpy = sinon.spy(StreamModel.prototype, 'unsubscribe');
        this.collectionUnsubscribeSpy = sinon.spy(StreamCollection.prototype, 'unsubscribe');

        this.alarmHistoryRemoveSpy = sinon.spy(AlarmHistoryView.prototype, 'remove');
        this.deviceViewRemoveSpy = sinon.spy(DeviceView.prototype, 'remove');

        this.alarmsViewRemoveSpy = sinon.spy(AlarmsView.prototype, 'remove');
        this.runtimeHistoryRemoveSpy = sinon.spy(ThermostatRuntimeHistoryView.prototype, 'remove');
      });

      afterEach(function () {
        StreamModel.prototype.unsubscribe.restore();
        StreamCollection.prototype.unsubscribe.restore();
        AlarmsView.prototype.remove.restore();
        AlarmHistoryView.prototype.remove.restore();
        DeviceView.prototype.remove.restore();
        ThermostatRuntimeHistoryView.prototype.remove.restore();
      });

      it("unsubscribes all the child stream views' models/collections", function () {
        this.view.render();
        this.view.remove();

        expect(this.modelUnsubscribeSpy.called).toBeTruthy();
        expect(this.collectionUnsubscribeSpy.called).toBeTruthy();
      });

      it('aborts all active requests', function () {
        const container = $('<div></div>');
        this.view._renderSpinnerAndFetchModel(container);
        const abortSpy = spyOn(this.view.activeRequest, 'abort');
        this.view.remove();

        expect(abortSpy).toHaveBeenCalled();
      });

      it('removes all streaming views', function () {
        this.view.render();
        this.view.remove();
        expect(this.alarmsViewRemoveSpy.called).toBeTruthy();
        expect(this.deviceViewRemoveSpy.called).toBeTruthy();
      });

      it('removes runtimeHistoryView', function () {
        this.view.render();
        this.view.remove();
        expect(this.runtimeHistoryRemoveSpy.called).toBeTruthy();
      });

      it('removes alarmHistoryView', function () {
        this.view.render();
        this.view.remove();
        expect(this.alarmHistoryRemoveSpy.called).toBeTruthy();
      });
    });

    describe('with cached models and collections for the stream reports', () =>
      it('uses the cached model/collection when rendering the view', function () {
        this.view.render(); // caches the streaming reports" model/collection

        const initialStreams = _.map(this.view.streamingViews, view => view.model || view.collection);
        expect(initialStreams.length).toBeGreaterThan(0);

        const secondView = new DeviceView({model: this.model, reportCache: this.reportCache, system: this.system, session: this.session});
        secondView.render();

        const subsequentStreams = _.map(secondView.streamingViews, view => view.model || view.collection);

        _.each(initialStreams, (stream, index) => expect(subsequentStreams[index]).toEqual(stream));
      })
    );

    describe('when the stream encounters a failure', () => it('displays an error notification'));

    describe('when the stream receives a successfull message', () => it('removes any error notifications'));

    describe('rendering stream views with a config model', function () {
      beforeEach(function () {
        this.model = Factories.create('spider');
        this.model.url = () => '/foo';
        this.model.collection = new Backbone.Collection();
        this.view = new DeviceView({model: this.model, reportCache: this.reportCache, session: this.session, system: this.system});
        this.view.render();
      });

      it('rerenders  when configModel is updated', function (done) {
        const currentStatusView = _.find(this.view.streamingViews, v => {
          return v instanceof this.model.currentStatusViewClass;
        });

        const renderSpy = sinon.spy(currentStatusView, 'render');

        currentStatusView.configModel.on('change', function () {
          expect(renderSpy.called).toBeTruthy();
          done();
        });

        currentStatusView.configModel.set('something', true);
      });
    });
  });
});
