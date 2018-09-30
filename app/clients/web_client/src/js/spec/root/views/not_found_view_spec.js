define(function (require) {
  require('spec/spec_helper');
  const Backbone     = require('backbone');
  const NotFoundView = require('root/views/not_found_view');

  describe('NotFoundView', function () {
    beforeEach(function () {
      const model = new Backbone.Model({backToPageRoute: '/some-route', backToPageTitle: 'Some Title'});
      this.view = new NotFoundView({model});

      this.$link = this.view.render().$el.find('a');
    });

    it('displays a customer route and title', function () {
      expect(this.$link.attr('href')).toBe('/some-route');
      expect(this.$link.text()).toBe('Some Title');
    });

    it('triggers navigate when clicking on the back-to-page link', function () {
      const triggerSpy = sinon.spy(this.view, 'trigger');

      this.$link.click();

      expect(triggerSpy.calledWith('navigate', '/some-route')).toBeTruthy();
    });
  });
});
