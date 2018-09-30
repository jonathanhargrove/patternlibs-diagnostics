const Framework = require('nexia_framework');
const NoResultsView  = require('lib/nexia_framework/no_results_view');
const Backbone = require('backbone');

describe('SearchableCollectionView', () => {
  beforeEach(function () {
    this.sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    this.sandbox.restore();
  });

  describe('#render', function () {
    describe('with a custom no record message', function () {
      describe('without search criteria', function () {
        it('renders the custom message', function () {
          const initializeSpy = this.sandbox.spy(NoResultsView.prototype, 'initialize');

          const view = new Framework.SearchableCollectionView({
            noRecordsMessage: 'custom no records message',
            collection: new Backbone.Collection(),
            query: null // no search criteria
          });
          view.render();

          expect(initializeSpy.getCall(0).args[0].message).toEqual('custom no records message');
        });
      });

      describe('with search criteria', function () {
        it('renders the default message', function () {
          const initializeSpy = this.sandbox.spy(NoResultsView.prototype, 'initialize');

          const view = new Framework.SearchableCollectionView({
            noRecordsMessage: 'custom no records message',
            collection: new Backbone.Collection(),
            query: 'some search criteria'
          });
          view.render();

          expect(initializeSpy.getCall(0).args[0].message).not.toBeDefined();
        });
      });
    });
  });
});
