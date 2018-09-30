define(function (require) {
  require('spec/spec_helper');
  const SysComponentsCollection = require('sys_components/models/sys_components_collection');
  const Framework = require('nexia_framework');

  describe('SysComponentsCollection', function () {
    beforeEach(function () {
      this.deviceId = '00C00481';
      this.timeZone = 'America/Denver';
    });

    describe('#_update', () =>
      describe('when event is null', () =>
        it("doesn't blow up", function () {
          const collection = new SysComponentsCollection(null, {communicating: true, deviceId: this.deviceId, timeZone: this.timeZone});
          expect(() => collection._update(null)).not.toThrow();
        })
      )
    );

    describe('#url', function () {
      describe('if the collection is for communicating components', function () {
        beforeEach(function () {
          this.collection = new SysComponentsCollection(null, {communicating: true, deviceId: this.deviceId, timeZone: this.timeZone});
        });

        it('is a stream url', function () {
          expect(this.collection.url()).toBe(`/stream/sys_components/${this.deviceId}`);
        });
      });

      describe('if the collection is for non-communicating components', function () {
        beforeEach(function () {
          this.collection = new SysComponentsCollection(null, {communicating: false, deviceId: this.deviceId, timeZone: this.timeZone});
        });

        it('is an API url', function () {
          expect(this.collection.url()).toBe(`/api/devices/${this.deviceId}/system_components`);
        });
      });
    });

    describe('sorting', function () {
      describe('if the collection is for communicating components', function () {
        beforeEach(function () {
          this.first = 1;
          this.last  = 9;

          this.collection = new SysComponentsCollection(null, {communicating: true, deviceId: this.deviceId, timeZone: this.timeZone});
          this.collection.set([ new Framework.Model({id: 1, timestamp: this.last}), new Framework.Model({id: 2, timestamp: this.first}) ]);
        });

        it('sorts by timestamp', function () {
          const timestamps = this.collection.map(m => m.get('timestamp'));
          expect(timestamps).toEqual([this.first, this.last]);
        });
      });

      describe('if the collection is for non-communicating components', function () {
        beforeEach(function () {
          this.collection = new SysComponentsCollection(null, {communicating: false, deviceId: this.deviceId, timeZone: this.timeZone});
          this.collection.set([ new Framework.Model({id: this.last, timestamp: 1}), new Framework.Model({id: this.first, timestamp: 2}) ]);
        });

        it('sorts by ID', function () {
          const ids = this.collection.map(m => m.id);
          expect(ids).toEqual([this.first, this.last]);
        });
      });

      describe('#parse', function () {
        beforeEach(function () {
          this.collection = new SysComponentsCollection(null, {deviceId: this.deviceId, timeZone: this.timeZone});
          this.data = [{}, {}];
        });

        it("adds the collection's timeZone to each element", function () {
          const zones = _(this.collection.parse(this.data)).map(d => d.get('timeZone'));
          expect(zones).toEqual([this.timeZone, this.timeZone]);
        });

        it("sets the components 'communicating' flag based on the collection", function () {
          const zones = _(this.collection.parse(this.data)).map(d => d.get('communicating'));
          expect(zones).toEqual([this.collection.communicating, this.collection.communicating]);
        });
      });
    });
  });
});
