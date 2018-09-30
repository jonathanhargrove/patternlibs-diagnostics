const Map     = require('utils/map');
const Session = require('root/models/session');

const GoogleMapsLoader = require('google-maps');

describe('Map', function () {
  beforeEach(function () {
    this.sandbox = sinon.sandbox.create();

    this.fakeGoogleMap = {
      fitBounds: () => {}
    };

    this.fakeMarker = {
      addListener: () => {},
      getPosition: () => 'fake position'
    };

    this.fakeBounds = {
      extend: () => {}
    };

    this.fakeGoogle = {
      maps: {
        Map: () => this.fakeGoogleMap,
        Size: () => {},
        Point: () => {},
        MarkerImage: () => {},
        Marker: () => this.fakeMarker,
        InfoWindow: () => {},
        LatLngBounds: () => this.fakeBounds
      }
    };

    this.loadStub = this.sandbox.stub(GoogleMapsLoader, 'load');

    this.map = new Map({
      session: new Session(),
      mapService: GoogleMapsLoader,
      tooltipContentCallback: this.sandbox.stub()
    });

    this.map.loadMap();

    this.initFn = this.loadStub.args[0][0];
  });

  afterEach(function () {
    this.sandbox.restore();
  });

  describe('#loadMap', function () {
    beforeEach(function () {
      this.mapLoadedCallbackStub = this.sandbox.stub();

      this.mapConstructorSpy = this.sandbox.spy(this.fakeGoogle.maps, 'Map');

      this.initFn(this.fakeGoogle);
    });

    it('loads the map', function () {
      expect(this.loadStub.calledOnce).toBeTruthy();
    });

    it('sets the center of the map to the center of the United States', function () {
      expect(this.mapConstructorSpy.args[0][1].center.lat).toBe(37.09);
      expect(this.mapConstructorSpy.args[0][1].center.lng).toBe(-95.71);
    });

    it('zooms out to see the whole united states main land', function () {
      expect(this.mapConstructorSpy.args[0][1].zoom).toBe(4);
    });
  });

  describe('#setMarker', function () {
    beforeEach(function () {
      this.addListenerStub = this.sandbox.stub();
      this.openInfoWindowStub = this.sandbox.stub();
      this.closeInfoWindowStub = this.sandbox.stub();
      this.markerImageStub = this.sandbox.stub(this.fakeGoogle.maps, 'MarkerImage');

      this.markerStub = this.sandbox.stub(this.fakeGoogle.maps, 'Marker').returns({
        addListener: this.addListenerStub,
        setMap: () => {}
      });

      this.sandbox.stub(this.fakeGoogle.maps, 'InfoWindow').returns({
        content: () => {},
        open: this.openInfoWindowStub,
        close: this.closeInfoWindowStub
      });

      this.initFn(this.fakeGoogle);
    });

    describe('when the marker is new', function () {
      it('adds the new marker to the map', function () {
        this.map.setMarker(1, {});

        expect(Object.keys(this.map.markers).length).toBe(1);
      });
    });

    describe('when updating an existing marker', function () {
      it('updates the marker\'s options', function () {
        this.map.setMarker(3, { 'lat': 22, 'lng': -155 });

        expect(this.markerStub.args[0][0].position.lat).toBe(22);
        expect(this.markerStub.args[0][0].position.lng).toBe(-155);
      });
    });

    describe('when the options include a custom icon', function () {
      it('includes the icon in the new marker object', function () {
        this.map.setMarker(4, { icon: 'fake icon path' });

        expect(this.markerStub.args[0][0].icon.url).toBe('fake icon path');
      });
    });

    describe('when the options do not include a custom icon', function () {
      it('sets a generic pin as the marker icon', function () {
        this.map.setMarker(4, {});

        expect(this.markerImageStub.called).toBeTruthy();
      });
    });

    describe('marker event listener', function () {
      it('listens for a click event on each marker', function () {
        this.map.setMarker(4, {});

        expect(this.addListenerStub.called).toBeTruthy();
        expect(this.addListenerStub.args[0][0]).toBe('click');
      });

      describe('when a marker is clicked', function () {
        beforeEach(function () {
          this.map.setMarker(3, {});
          this.map.setMarker(4, {});
          this.addListenerStub.args[0][1]();
        });

        it('opens tooltip content for the marker', function () {
          expect(this.openInfoWindowStub.called).toBeTruthy();
        });

        describe('with an already opened tooltip', function () {
          it('closes the previously opened tooltip', function () {
            this.addListenerStub.args[0][1]();

            expect(this.closeInfoWindowStub.called).toBeTruthy();
          });
        });
      });
    });
  });

  describe('#removeMarker', function () {
    it('removes the marker from google maps', function () {
      const setMapStub = this.sandbox.stub();

      this.markerStub = this.sandbox.stub(this.fakeGoogle.maps, 'Marker').returns({
        addListener: this.sandbox.stub(),
        setMap: setMapStub
      });

      this.initFn(this.fakeGoogle);

      this.map.setMarker(1, { lat: 1, lng: 1 });
      this.map.setMarker(2, { lat: 1, lng: 1 });
      this.map.setMarker(3, { lat: 1, lng: 1 });

      this.map.removeMarker(3);

      expect(setMapStub.calledWith(null)).toBeTruthy();
      expect(Object.keys(this.map.markers).length).toBe(2);
    });
  });

  describe('#fitBoundsToMarkers', function () {
    describe('with no markers', function () {
      it('does nothing', function () {
        const fitBoundsStub = this.sandbox.stub(this.fakeGoogleMap, 'fitBounds');

        this.initFn(this.fakeGoogle);

        this.map.fitBoundsToMarkers();

        expect(fitBoundsStub.called).toBe(false);
      });
    });

    describe('with markers', function () {
      it('extends the map boundary to include each marker position', function () {
        this.map.setMarker(1, {});

        this.fitBoundsStub = this.sandbox.stub(this.fakeGoogleMap, 'fitBounds');
        this.extendSpy = this.sandbox.stub(this.fakeBounds, 'extend');

        this.initFn(this.fakeGoogle);

        this.map.fitBoundsToMarkers();

        expect(this.extendSpy.calledWith('fake position')).toBeTruthy();
        expect(this.fitBoundsStub.calledWith(this.fakeBounds)).toBeTruthy();
      });
    });

    describe('#stashMap', function () {
      beforeEach(function () {
        this.map = new Map({
          session: new Session({}),
          mapService: GoogleMapsLoader
        });

        const mapContainer = document.createElement('div');
        mapContainer.setAttribute('id', 'map-container');

        window.$('body').append(mapContainer);
        mapContainer.append(this.map.$el);

        this.map.stashMap();
      });

      afterEach(function () {
        window.$('body #map-container').remove();
        window.$('body #map').remove();
      });

      it('stashes the map in the DOM body', function () {
        expect(window.$('body #map')).toBeTruthy();
      });

      it('hides the map', function () {
        expect(window.$('#map').css('display')).toBe('none');
      });

      describe('#isStashed', function () {
        describe('when stashed', function () {
          it('returns true', function () {
            expect(this.map.isStashed()).toBeTruthy();
          });
        });
      });
    });

    describe('#unstashMap', function () {
      beforeEach(function () {
        this.map = new Map({
          session: new Session({}),
          mapService: GoogleMapsLoader
        });

        const mapContainer = document.createElement('div');
        mapContainer.setAttribute('id', 'map-container');

        window.$('body').append(mapContainer);

        this.map.unstashMap();
      });

      afterEach(function () {
        window.$('body #map-container').remove();
      });

      it('appends the map to the map container', function () {
        expect(window.$('#map-container #map').length).toBe(1);
      });

      it('shows the map', function () {
        expect(window.$('#map').css('display')).toBe('block');
      });

      describe('#isStashed', function () {
        describe('when unstashed', function () {
          it('returns false', function () {
            expect(this.map.isStashed()).toBeFalsy();
          });
        });
      });
    });
  });
});
