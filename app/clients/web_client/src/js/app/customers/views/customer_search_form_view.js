const Backbone = require('backbone');
const Framework = require('nexia_framework');
const templates = require('templates');

const CustomerResultsItemView = require('customers/views/customer_results_item_view');
const CustomersCollection = require('customers/models/customers_collection');
const FilterSelectView = require('utils/filter_select_view');

const CustomerSearchFormView = Framework.View.extend({
  template: templates['customer_search_form'],

  viewModelBindings: {
    '[name=note]': 'note'
  },

  events: {
    'click [data-model-cid]': 'selectCustomer'
  },

  initialize (options) {
    Framework.View.prototype.initialize.apply(this, arguments);

    this.customers = options.collection;
    this.device = options.device;
    this.customerResults = new CustomersCollection();
    this.viewModel = new Backbone.Model({ customer: null, note: '' });
    this.listenTo(this.viewModel, 'change:note', function (viewModel, note) { this.device.set('note', note); });
  },

  onRender () {
    if (this.selectView) {
      this.selectView.remove();
    }
    this.stickit(this.viewModel, this.viewModelBindings);
    this.selectView = new FilterSelectView({ collection: this.customers, resultItemView: CustomerResultsItemView, defaultLabel: 'Select Customer...', itemDisplayCallback (customer) { return customer.fullName(); } });
    this.$el.find('.customer-search').html(this.selectView.render().$el);
    this.listenTo(this.selectView, 'selected:item', this.customerSelected);
  },

  customerSelected (customer) {
    this.trigger('selected:customer', customer);
  }
});

module.exports = CustomerSearchFormView;
