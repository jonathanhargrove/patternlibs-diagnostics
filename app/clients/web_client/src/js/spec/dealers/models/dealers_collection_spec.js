define(function (require) {
  require('spec/spec_helper');
  const DealersCollection = require('dealers/models/dealers_collection');
  const Dealer = require('dealers/models/dealer');

  describe('DealersCollection', function () {
    beforeEach(function () {
      this.dealers = [
        { dealerName: 'dealerC', address: '999 LastAddress', city: 'MiddleCity', state: 'MN' },
        { dealerName: 'dealerB', address: '555 MiddleAddress', city: 'A City At Start', state: 'AL' },
        { dealerName: 'dealerA', address: '111 FirstAddress', city: 'Ze City At Ze End', state: 'VT' }
      ];
      this.collection = new DealersCollection();
    });

    describe('sorting', function () {
      beforeEach(function () {
        this.dealers.forEach(dealerInfo => {
          const dealer = new Dealer(dealerInfo);
          this.collection.add(dealer);
        });
      });

      it('sorts by dealer name by default', function () {
        expect(this.collection.map(dealer => dealer.get('dealerName'))).toEqual(['dealerA', 'dealerB', 'dealerC']);
      });

      describe('when sorted twice by the same thing', function () {
        beforeEach(function () {
          this.collection.sortOn('dealerName');
        });

        it('reverses the direction of the sort', function () {
          expect(this.collection.map(dealer => dealer.get('dealerName'))).toEqual(['dealerC', 'dealerB', 'dealerA']);
        });
      });
    });
  });
});
