define(function (require) {
  require('spec/spec_helper');
  const SystemsCollection = require('systems/models/systems_collection');

  describe('SystemsCollection', function () {
    beforeEach(function () {
      const system = Factories.build('system', {'group': 'A Group'});
      const system2 = Factories.build('system', {'group': 'B Group'});
      const system3 = Factories.build('system');
      this.systems = new SystemsCollection([system, system2, system3]);
    });

    it('is a Backbone Collection', function () {
      expect(_.has(this.systems, 'models')).toBe(true);
    });

    it('defines a url', function () {
      expect(this.systems.url()).toEqual('/api/systems');
    });

    describe('#generateOrderedGroupModels', () =>
      it('creates a sorted list of group names for a collection of systems', function () {
        const groupNameArray = this.systems.generateOrderedGroupModels().map(group => group.attributes.name);

        expect(groupNameArray).toEqual([null, 'A Group', 'B Group']);
      })
    );

    describe('#numberOfGroups', function () {
      describe('with at least one system that is assigned to a group', () =>
        it('returns true', function () {
          expect(this.systems.numberOfGroups()).toBe(2);
        })
      );

      describe('without any systems assigned to a group', () =>
        it('returns false', function () {
          const systems = new SystemsCollection([Factories.build('system')]);

          expect(systems.numberOfGroups()).toBe(0);
        })
      );
    });

    describe('#comparator', function () {
      beforeEach(function () {
        this.comparator = new SystemsCollection().comparator;

        this.system1 = Factories.create('system');
        this.system2 = Factories.create('system');
      });

      describe('with systems that have names', function () {
        it('sorts systems by name', function () {
          this.system1.primaryDevice.set('name', '1');
          this.system2.primaryDevice.set('name', '2');

          expect(this.comparator(this.system1, this.system2)).toEqual(-1);
          expect(this.comparator(this.system2, this.system1)).toEqual(1);
          expect(this.comparator(this.system1, this.system1)).toEqual(0);
        });
      });

      describe('with systems that don\'t have names', function () {
        it('sorts systems by device id', function () {
          this.system1.primaryDevice.set('name', null);
          this.system2.primaryDevice.set('name', null);

          this.system1.primaryDevice.set('deviceId', '1');
          this.system2.primaryDevice.set('deviceId', '2');

          expect(this.comparator(this.system1, this.system2)).toEqual(-1);
          expect(this.comparator(this.system2, this.system1)).toEqual(1);
          expect(this.comparator(this.system1, this.system1)).toEqual(0);
        });
      });
    });
  });
});
