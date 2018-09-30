define(function (require) {
  require('spec/spec_helper');
  require('template_helpers');
  require('sinon');
  const CustomersCollection    = require('customers/models/customers_collection');
  const CustomerSearchFormView = require('customers/views/customer_search_form_view');
  const Factories              = require('spec/_support/factories');

  describe('CustomerSearchFormView', function () {
    beforeEach(function () {
      this.device = Factories.create('thermostat');
      this.customer = Factories.create('customer', {firstName: 'Alexanderia'});
      this.unmatchingCustomer = Factories.create('customer', {firstName: 'Finn'});
      this.customers = new CustomersCollection([this.customer, this.unmatchingCustomer]);
      this.view = new CustomerSearchFormView({collection: this.customers, device: this.device});
      this.view.render();
      this.view.$el.find('.customer-search .select-customer').click();
      this.view.$el.find('[name=searchterm]').val('Alex').trigger('change');
      this.view.$el.find('[name=note]').val('Notes').trigger('change');
    });

    describe('customer search', function () {
      it('returns search results', function () {
        expect(this.view.selectView.results.models).toEqual([this.customer]);
        expect(this.view.selectView.viewModel.get('searchTerm')).toEqual('Alex');
      });

      it('displays search results', function () {
        expect(this.view.$el.find('.search-results').html()).toContain(this.customer.get('firstName'));
      });
    });

    describe('adding notes to a device', () =>
      it('sets the note on the device', function () {
        expect(this.device.get('note')).toEqual('Notes');
      })
    );

    describe('selecting a customer', function () {
      beforeEach(function () {
        this.triggerSpy = sinon.spy(this.view, 'trigger');
        this.view.$el.find(`[data-model-cid=${this.customer.cid}]`).click();
      });

      afterEach(function () {
        return this.triggerSpy.restore;
      });

      it('triggers the selected:customer event', function () {
        expect(this.triggerSpy.calledWith('selected:customer', this.customer)).toBeTruthy();
      });

      it('displays the selected customer', function () {
        expect(this.view.$el.find('.filter-select-view .button-label').text()).toContain(this.customer.get('firstName'));
      });

      it('hides the search results', function () {
        this.view.$('.customer-results').each(function () {
          expect($(this).is(':visible')).toBe(false);
        });
      });
    });
  });
});
