require('spec/spec_helper');

const FilterSelectView             = require('utils/filter_select_view');
const CustomersCollection          = require('customers/models/customers_collection');
const CustomerSearchResultItemView = require('customers/views/customer_search_result_item_view');
const Framework                    = require('nexia_framework');
const Factories                    = require('spec/_support/factories');
const $                            = require('jquery');

describe(FilterSelectView, function () {
  let defaultLabel;
  let viewInstance;
  let customer;
  let collection;
  let resultItemView;
  let itemDisplayCallback;

  let view = function () {
    viewInstance = viewInstance || new FilterSelectView({ defaultLabel, collection, resultItemView, itemDisplayCallback });
    return viewInstance;
  };

  beforeEach(function () {
    defaultLabel = 'Select a Value';
    viewInstance = undefined;
    customer = Factories.build('customer', { 'firstName': 'Bob' });
    collection = new CustomersCollection(customer);
    resultItemView = CustomerSearchResultItemView;
    itemDisplayCallback = (customer) => {
      return customer.fullName();
    };
  });

  describe('initial rendering', function () {
    beforeEach(function () { view().render(); });

    it('renders a button with a label and dropdown arrow', function () {
      // there is a button with a label
      expect(view().$el.find(`button:contains('${defaultLabel}')`).length).toBe(1);
      // and a dropdown arrow
      expect(view().$el.find('button .icon-circle-arrow-down').length).toBe(1);
    });
  });

  describe('when the button is clicked', function () {
    beforeEach(function () { view().render(); });
    beforeEach(function () { $('body').append(view().$el); });
    beforeEach(function () { view().$el.find('button').click(); });

    it('displays an input field', function () {
      expect(view().$el.find('input[type=text]').length).toBe(1);
    });

    it('renders a field of search results', function () {
      expect(view().$el.find('.search-results').length).toBe(1);
    });

    describe('and the user enters a valid search term', function () {
      beforeEach(function () {
        view().$el.find('input').val(customer.get('firstName')).trigger('change');
      });

      it('renders an item in the search results', function () {
        expect(view().$el.find(`.search-results:visible span:contains(${customer.fullName()})`).length).toBe(1);
      });

      describe('and the user clicks on a result', function () {
        beforeEach(function () {
          view().$el.find(`[${Framework.CollectionView._MODEL_CID_TAG}]`).click();
        });

        it('hides the search results', function () {
          expect(view().$el.find('.search-and-results').hasClass('collapsed')).toBe(true);
        });

        it("renders the selected item's selectedText info in the button text", function () {
          expect(view().$el.find(`button:contains(${customer.fullName()})`).length).toBe(1);
        });
      });
    });

    describe('and the user enters an invalid search term', function () {
      beforeEach(function () { view().$el.find('input').val('potato').trigger('input'); });

      it('does not render any items in the search results', function () {
        expect(view().$el.find('.search-results *').text()).toEqual('');
      });
    });
  });
});
