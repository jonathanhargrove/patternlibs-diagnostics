define(function (require) {
  require('spec/spec_helper');

  const Session             = require('root/models/session');
  const CustomersCollection = require('customers/models/customers_collection');
  const AlertsMapView       = require('dashboard/views/alerts_map_view');
  const Map                 = require('utils/map');

  describe('AlertsMapView', function () {
    beforeEach(function () {
      this.sandbox = sinon.sandbox.create();

      this.map = new Map({
        session: new Session({})
      });

      this.loadMapStub = this.sandbox.stub(this.map, 'loadMap').resolves();
    });

    afterEach(function () {
      this.sandbox.restore();
    });

    describe('#initialize', function () {
      beforeEach(function () {
        const customer1 = Factories.build('customer', { id: 1, latitude: 20.00, longitude: -155.50 });
        const customer2 = Factories.build('customer');

        const system = Factories.build('system');
        this.device = Factories.build('thermostat', { majorAlerts: 4, status: 'OPTED IN' });

        system.getDevices().add([this.device]);
        customer1.getSystems().add(system);

        const collection = new CustomersCollection([customer1, customer2]);

        this.view = new AlertsMapView({
          session: new Session({}),
          map: this.map,
          customers: collection
        });

        this.setMarkerStub = this.sandbox.stub();
        this.view.map.setMarker = this.setMarkerStub;
      });

      describe('', function () {
        it('appends the map to the map container', function (done) {
          this.view.on('mapRendered', () => {
            expect(this.view.$('#map-container #map').length).toBe(1);

            done();
          });

          this.view.render().renderMap();
        });

        describe('when it builds the map', function () {
          beforeEach(function () {
            this.setMarkerSpy = this.sandbox.spy();
            this.fitBoundsToMarkersSpy = this.sandbox.spy();

            this.view.map.setMarker = this.setMarkerSpy;
            this.view.map.fitBoundsToMarkers = this.fitBoundsToMarkersSpy;
          });

          describe('for customers with coordinates and alerts', function () {
            it('sets a marker on the map for each customer', function (done) {
              this.view.on('mapRendered', () => {
                expect(this.setMarkerSpy.calledOnce).toBe(true);

                const callOptions = this.setMarkerSpy.args[0][1];

                expect(callOptions.id).toBe(1);
                expect(callOptions.lat).toBe(20);
                expect(callOptions.lng).toBe(-155.5);
                expect(callOptions.icon).toBe('/img/diagnostics-dashboard-major-icon.png');

                done();
              });

              this.view.render().renderMap();
            });
          });

          describe('for a dealer with coordinates', function () {
            it('sets a marker on the map for the dealer', function (done) {
              const view = new AlertsMapView({
                session: new Session({ latitude: 21.7, longitude: -158 }),
                map: this.map,
                customers: new CustomersCollection()
              });

              const setMarkerSpy = this.sandbox.spy();

              view.map.setMarker = setMarkerSpy;
              view.on('mapRendered', () => {
                expect(setMarkerSpy.calledOnce).toBe(true);

                const callOptions = setMarkerSpy.args[0][1];

                expect(callOptions.lat).toBe(21.7);
                expect(callOptions.lng).toBe(-158);

                done();
              });

              view.render().renderMap();
            });
          });

          it('fits the bounds of the map to the markers', function (done) {
            this.view.on('mapRendered', () => {
              expect(this.fitBoundsToMarkersSpy.called).toBe(true);

              done();
            });

            this.view.render().renderMap();
          });
        });
      });

      describe('when there are changes to critical or major alerts on any customer device', function () {
        describe('when a device alert is being added', function () {
          it('sets the marker on the map', function (done) {
            this.view.on('mapRendered', () => {
              const setMarkerSpy = this.sandbox.spy();

              this.view.map.setMarker = setMarkerSpy;

              this.device.set('criticalAlerts', 1);

              expect(setMarkerSpy.called).toBe(true);

              const callOptions = setMarkerSpy.args[0][1];

              expect(callOptions.id).toBe(1);
              expect(callOptions.lat).toBe(20);
              expect(callOptions.lng).toBe(-155.5);
              expect(callOptions.icon).toBe('/img/diagnostics-dashboard-critical-icon.png');

              done();
            });

            this.view.render().renderMap();
          });
        });
      });

      describe('when a device alert is removed', function () {
        it('removes the marker from the map', function (done) {
          this.view.on('mapRendered', () => {
            const removeMarkerSpy = this.sandbox.spy();
            this.view.map.removeMarker = removeMarkerSpy;

            this.device.set('majorAlerts', 0);

            expect(removeMarkerSpy.called).toBe(true);
            expect(removeMarkerSpy.args[0][0]).toBe(1);

            done();
          });

          this.view.render().renderMap();
        });
      });
    });

    describe('#beforeRemove', function () {
      it('stashes the map', function () {
        const view = new AlertsMapView({
          map: this.map,
          session: new Session({}),
          customers: new CustomersCollection()
        });

        const stashMapStub = this.sandbox.stub();
        view.map.stashMap = stashMapStub;

        view.remove();

        expect(stashMapStub.called).toBe(true);
      });
    });

    describe('#renderMap', function () {
      beforeEach(function () {
        this.view = new AlertsMapView({
          map: this.map,
          session: new Session({}),
          customers: new CustomersCollection()
        });
      });

      describe('when the map already exists', function () {
        it('unstashes the map', function () {
          const unstashMapStub = this.sandbox.stub();
          this.view.map.unstashMap = unstashMapStub;

          this.sandbox.stub(this.view.map, 'isStashed').returns(true);
          this.view.renderMap();

          expect(unstashMapStub.called).toBe(true);
        });
      });

      describe('when the map does yet exist', function () {
        it('loads the map', function () {
          this.sandbox.stub(this.view.map, 'isStashed').returns(false);
          this.view.renderMap();

          expect(this.loadMapStub.called).toBe(true);
        });
      });
    });

    describe('when clicking on the map container', function () {
      beforeEach(function () {
        const customer1 = Factories.build('customer', { id: 1, latitude: 20.00, longitude: -155.50 });
        const customer2 = Factories.build('customer');

        const system = Factories.build('system');
        this.device = Factories.build('thermostat', { majorAlerts: 4, status: 'OPTED IN' });

        system.getDevices().add([this.device]);
        customer1.getSystems().add(system);

        const collection = new CustomersCollection([customer1, customer2]);

        this.view = new AlertsMapView({
          session: new Session({}),
          map: this.map,
          customers: collection
        }).render();

        const fakeGoogle = {
          maps: {
            Marker: () => {},
            Size: () => {}
          }
        };

        this.view.map.google = fakeGoogle;

        this.fitBoundsStub = this.sandbox.stub();
        this.view.map.fitBoundsToMarkers = this.fitBoundsStub;

        this.view.$('#map-container').append($("<div id='map'></div>")[0]);
        this.view.$('#map-container').click();
      });

      it('won\'t refit the bounds of the map after an alert is added or removed', function () {
        expect(this.view.$('#map').data('userChangedBounds')).toBe(true);
      });

      it('will no longer adjust the boundary of the map', function () {
        this.device.set('criticalAlerts', 1);

        expect(this.fitBoundsStub.called).toBe(false);
      });
    });
  });
});
