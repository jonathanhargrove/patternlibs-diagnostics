define(function (require) {
  require('spec/spec_helper');
  const Dealer = require('dealers/models/dealer');

  beforeEach(function () {
    this.id = 'aDealerId';
    this.deviceId = '00C004D8';
    const devices = [{ deviceId: this.deviceId, deviceType: 'thermostat' }];
    this.dealer = new Dealer({id: this.id, systems: [{ primaryDeviceId: this.deviceId, devices }]}, {parse: true});
  });

  describe('Dealer', function () {
    describe('#name', function () {
      describe('when dealerName is set', function () {
        beforeEach(function () {
          this.dealerName = 'a dealer name';
          this.dealer.set('dealerName', this.dealerName);
        });

        it('returns the dealer name', function () {
          expect(this.dealer.name()).toBe(this.dealerName);
        });
      });

      describe('when dealerName is not set, but username is', function () {
        beforeEach(function () {
          this.username = 'a name for a user';
          this.dealer.set('username', this.username);
        });

        it('returns the username', function () {
          expect(this.dealer.name()).toBe(this.username);
        });
      });

      describe('when neither dealerName nor username is set', () =>
        it('returns the id of the user', function () {
          expect(this.dealer.name()).toBe(`Unknown (${this.id})`);
        })
      );
    });

    describe('#fullAddress', function () {
      beforeEach(function () {
        this.dealer.set({address: '123 A Street', city: 'Star City', state: 'CO', zip: '89012'});
      });

      it('concatenates the address, city, state and zip', function () {
        expect(this.dealer.fullAddress()).toBe('123 A Street Star City, CO 89012');
      });
    });

    describe('#matches', function () {
      [
        'address', 'brand', 'channel', 'contactEmail',
        'dealerName', 'phoneNumber', 'distributor',
        'address', 'city', 'state', 'zip'
      ].forEach(attribute =>
        it(`matches if the ${attribute} contains the value`, function () {
          this.value = 'potato orange elephant';
          this.dealer.set(attribute, this.value);
          expect(this.dealer.matches('orange')).toBeTruthy();
        })
      );

      it('matches if any device AUID matches', function () {
        this.dealer.getSystems().at(0).getDevices().at(0).id = 'potato orange elephant';
        expect(this.dealer.matches('orange')).toBeTruthy();
      });
    });
  });
});
