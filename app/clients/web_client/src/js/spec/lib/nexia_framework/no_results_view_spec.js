const NoResultsView  = require('lib/nexia_framework/no_results_view');

describe('NoResultsView', () => {
  beforeEach(function () {
    this.sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    this.sandbox.restore();
  });

  describe('#render', function () {
    describe('with a given message', function () {
      it('renders the given message', function () {
        const view = new NoResultsView({ message: 'custom message' }).render();

        expect(view.$('h1').text()).toEqual('custom message');
      });
    });

    describe('without a given message', function () {
      it('renders the default message', function () {
        const view = new NoResultsView({ message: null }).render();

        expect(view.$('h1').text()).toEqual('No Search Results');
      });
    });
  });
});
