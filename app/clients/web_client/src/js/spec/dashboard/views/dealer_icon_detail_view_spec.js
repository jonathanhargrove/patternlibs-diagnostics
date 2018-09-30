define(function (require) {
  require('spec/spec_helper');

  const DealerIconDetailView = require('dashboard/views/dealer_icon_detail_view');

  describe('DealerIconDetailView', function () {
    describe('#render', function () {
      beforeEach(function () {
        this.session = Factories.build('dealer');

        this.view = new DealerIconDetailView({ model: this.session }).render();
      });

      it('displays the dealer name', function () {
        expect(this.view.$('.name').html()).toContain('Alpha');
      });

      it('displays the dealer address', function () {
        expect(this.view.$('.steet-address').html()).toContain('123 Main');
        expect(this.view.$('.city-state-zip').html()).toContain('12345');
      });
    });
  });
});
