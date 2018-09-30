require('spec/spec_helper');

const CurrentStatusList       = require('current_status/models/current_status_list');
const Customer                = require('customers/models/customer');
const CustomerListView        = require('customers/views/customer_list_view');
const CustomersCollection     = require('customers/models/customers_collection');
const DevicesCollection       = require('devices/models/devices_collection');
const Factories               = require('spec/_support/factories');
const PaginationControl       = require('utils/pagination_control');
const Session                 = require('root/models/session');
const Theme                   = require('utils/theme');
const ThermostatCurrentStatus = require('current_status/models/thermostat_current_status');

describe('CustomerListView', function () {
  beforeEach(function () {
    Theme.set('nexia');

    this.defaultOptions = {
      session: new Session({}),
      baseRoute: 'customers',
      currentStatusList: new CurrentStatusList(),
      visibleActions: {
        showDispositionDropdown: false,
        showInformationIcon: true
      }
    };
  });

  afterEach(function () {
    Theme.set('nexia');
  });

  describe('initialization', function () {
    afterEach(function () {
      this.changePageNumberSpy.restore();
      window.location.hash = '';
    });

    it('changes the page to the current page number found in the url hash', function () {
      this.changePageNumberSpy = sinon.spy(PaginationControl.prototype, 'changePageNumber');

      window.location.hash = 'page-4';
      /* eslint-disable no-unused-vars */
      var customerListView = new CustomerListView(_.extend(this.defaultOptions, {
        customers: new CustomersCollection()
      }));
      /* eslint-enable no-unused-vars */

      expect(this.changePageNumberSpy.calledWith(4)).toBeTruthy();
    });
  });

  describe('with a base customer filter', function () {
    it('filters the customers with the given base customer filter', function () {
      const customerFilterSpy = sinon.spy();

      new CustomerListView(_.extend(this.defaultOptions, { // eslint-disable-line no-new
        customers: new CustomersCollection(),
        baseCustomerFilter: customerFilterSpy
      }));

      expect(customerFilterSpy.called).toBeTruthy();
    });
  });

  describe('without customers or unassigned devices', function () {
    it('displays a \'no customers\' watermark', function () {
      const view = new CustomerListView(_.extend(this.defaultOptions, {customers: new CustomersCollection()}));
      expect(view.render().$el.find('.page-watermark.no-customers').length).toBeTruthy();
    });
  });

  describe('with only unassigned devices', function () {
    it('displays the customer list', function () {
      const unassignedDevices = new DevicesCollection([Factories.build('thermostat')]);
      const view = new CustomerListView(_.extend(this.defaultOptions, {customers: new CustomersCollection(), unassignedDevices: unassignedDevices}));

      expect(view.render().$el.find('#customer-results').length).toBeTruthy();
    });
  });

  describe('#hasResults', function () {
    describe('with a filter value set', function () {
      it('returns true', function () {
        const unassignedDevices = new DevicesCollection([Factories.build('thermostat')]);
        const customers = new CustomersCollection();
        const view = new CustomerListView(_.extend({ customers: customers, unassignedDevices: unassignedDevices }, this.defaultOptions));
        view.filterValue = 'assigned';
        customers.reset(); // triggers the results to get recaclulated

        expect(view.hasResults()).toBe(true);
      });
    });
  });

  describe('with customers', function () {
    beforeEach(function () {
      this.customers = [
        { id: 1, firstName: 'Cindy', lastName: 'Charlie', systems: [{primaryDeviceId: '1', devices: [{deviceId: '1', status: 'opted In', majorAlerts: 1, deviceType: 'thermostat'}]}] },
        { id: 2, firstName: 'Amy', lastName: 'Alpha', systems: [{primaryDeviceId: '2', devices: [{deviceId: '2', status: 'opted In', normalAlerts: 1, deviceType: 'thermostat'}]}] },
        { id: 3, firstName: 'Bob', lastName: 'Bravo', systems: [{primaryDeviceId: '3', devices: [{deviceId: '3', status: 'opted In', criticalAlerts: 1, deviceType: 'thermostat'}]}] },
        { id: 4, firstName: 'Danny', lastName: 'Delta' }
      ];
      this.collection = new CustomersCollection();
      this.collection.set(_(this.customers).map(function (json) {
        const customer = new Customer();
        customer.set(customer.parse(json));
        return customer;
      }));
      _.each(this.collection.models, (customer) => _.each(customer.getSystems().models, (system) => { system.session = new Session(); }));

      this.view = new CustomerListView(_.extend(this.defaultOptions, {customers: this.collection}));
    });

    it('does not display a \'no customers\' watermark', function () {
      expect(this.view.render().$el.find('.page-watermark').length).toBeFalsy();
    });

    it('shows a search form', function () {
      expect(this.view.render().$el.find('.search-form-view').length).toBe(1);
    });

    describe('device status icon', function () {
      beforeEach(function () {
        const device = this.collection.first().getSystems().first().getDevices().first();
        this.deviceId = device.get('deviceId');
      });

      describe('with a device that has an unknown status', function () {
        beforeEach(function () {
          this.view.render();
        });

        it('displays status spinner', function () {
          expect(this.view.$el.find('.status-unknown').length).toBe(3);
        });
      });

      describe('with a device that has a connected status', function () {
        beforeEach(function () {
          sinon.stub(ThermostatCurrentStatus.prototype, 'get').withArgs('connected').returns(true);
          this.view.render();
          this.view.currentStatusForVisibleSystems.get(this.deviceId).trigger('change');
        });

        afterEach(function () { ThermostatCurrentStatus.prototype.get.restore(); });

        it('displays connected icon', function () {
          expect(this.view.$el.find('.icon-circled-check').length).toBe(1);
        });
      });

      describe('with a device that has a disconnected status', function () {
        beforeEach(function () {
          sinon.stub(ThermostatCurrentStatus.prototype, 'get').withArgs('connected').returns(false);
          this.view.render();
          this.view.currentStatusForVisibleSystems.get(this.deviceId).trigger('change');
        });

        afterEach(function () { ThermostatCurrentStatus.prototype.get.restore(); });

        it('displays disconnected icon', function () {
          expect(this.view.$el.find('.icon-notification').length).toBe(1);
        });
      });

      describe('with an unassigned device', function () {
        beforeEach(function () {
          this.unassignedDevices = new DevicesCollection([Factories.build('thermostat')]);
          this.device = this.unassignedDevices.first();
          sinon.stub(ThermostatCurrentStatus.prototype, 'get').withArgs('connected').returns(true);

          this.view = new CustomerListView(_.extend(this.defaultOptions, {customers: this.collection, unassignedDevices: this.unassignedDevices}));
          this.view.render();
          this.view.currentStatusForVisibleSystems.get(this.device.id).trigger('change');
        });

        afterEach(function () { ThermostatCurrentStatus.prototype.get.restore(); });

        it('it displays connected', function () {
          expect(this.view.$el.find(`[data-model-cid=${this.device.cid}] .icon-circled-check`).length).toBe(1);
        });
      });
    });

    describe('executing a search query', function () {
      it('navigates to the search route', function () {
        const triggerStub = sinon.stub(this.view, 'trigger');

        this.view.render().$el.find('.search').val('test');

        $(document.body).append(this.view.$el);

        this.view.$el.find('.search-form-view button').click();

        expect(triggerStub.calledWith('navigate', '/customers/search/test')).toBeTruthy();

        this.view.remove();
      });
    });

    describe('filtering by query', function () {
      it('shows matching customers', function () {
        const view = new CustomerListView(_.extend(this.defaultOptions, {customers: this.collection, query: 'l'}));
        expect(view.render().$el.find(':contains(Bravo)').length).toBe(0);
        expect(view.render().$el.find('.name a:contains(Amy Alpha)').length).toBe(1);
        expect(view.render().$el.find('.name a:contains(Danny Delta)').length).toBe(1);
      });

      it('trims whitespace from search query', function () {
        const view = new CustomerListView(_.extend(this.defaultOptions, {customers: this.collection, query: ' Amy '}));
        expect(view.render().$el.find('.name a:contains(Amy Alpha)').length).toBe(1);
      });

      describe('with no matching customers', function () {
        beforeEach(function () {
          const view = new CustomerListView(_.extend(this.defaultOptions, {customers: this.collection, query: 'potatohead'}));
          this.$result = view.render().$el;
        });

        it('shows a \'no results\' watermark', function () {
          expect(this.$result.find('.page-watermark h1:contains(\'No Search Results\')').length).toBe(1);
        });

        it('shows a search form', function () {
          expect(this.$result.find('.search-form-view').length).toBe(1);
        });
      });
    });

    describe('filtering assigned and unassigned', function () {
      beforeEach(function () {
        this.unassignedDevices = new DevicesCollection([Factories.build('thermostat')]);
        this.view = new CustomerListView(_.extend(this.defaultOptions, {customers: this.collection, unassignedDevices: this.unassignedDevices}));
        this.view.render();

        expect(this.unassignedDevices.models.length > 0).toBeTruthy();
        expect(this.collection.models.length > 0).toBeTruthy();
      });

      describe('the default', function () {
        it('shows both assigned and unassigned devices', function () {
          _.each(this.collection.models, function (customer) {
            const customerName = customer.get('firstName') + ' ' + customer.get('lastName');

            expect(this.view.$('#customer-list-items').html()).toContain(customerName);
          }.bind(this));

          _.each(this.unassignedDevices.models, function (device) {
            expect(this.view.$('#customer-list-items').html()).toContain(device.get('deviceId'));
          }.bind(this));
        });

        it('shows the "All" option as selected', function () {
          expect(this.view.$('.filter-dropdown-contents li').first().hasClass('selected')).toBeTruthy();
        });

        it('does not show the filter icon as enabled', function () {
          expect(this.view.$('a[data-js=\'filter-dropdown\']').length).toBe(1);
          expect(this.view.$('a[data-js=\'filter-dropdown\']').hasClass('enabled')).toBe(false);
        });
      });

      describe('filtering on assigned', function () {
        beforeEach(function () {
          this.view.$('a[data-js=\'filter-dropdown\']').click();
          this.view.$('a[data-filter=assigned]').click();
        });

        it('shows customers with assigned devices', function () {
          _.each(this.collection.models, function (customer) {
            const customerName = customer.get('firstName') + ' ' + customer.get('lastName');

            expect(this.view.$('#customer-list-items').html()).toContain(customerName);
          }.bind(this));
        });

        it('hides unassigned devices', function () {
          _.each(this.unassignedDevices.models, function (device) {
            expect(this.view.$('#customer-list-items').html()).not.toContain(device.get('deviceId'));
          }.bind(this));
        });

        it('displays the filter icon as enabled', function () {
          expect(this.view.$('a[data-js=\'filter-dropdown\']').hasClass('enabled')).toBe(true);
        });
      });

      describe('filtering on unassigned', function () {
        beforeEach(function () {
          this.view.$('a[data-js=\'filter-dropdown\']').click();
          this.view.$('a[data-filter=unassigned]').click();
        });

        it('shows unassigned devices', function () {
          _.each(this.unassignedDevices.models, function (device) {
            expect(this.view.$('#customer-list-items').html()).toContain(device.get('deviceId'));
          }.bind(this));
        });

        it('hides customers with assigned devices', function () {
          _.each(this.collection.models, function (customer) {
            const customerName = customer.get('firstName') + ' ' + customer.get('lastName');

            expect(this.view.$('#customer-list-items').html()).not.toContain(customerName);
          }.bind(this));
        });

        it('displays the filter icon as enabled', function () {
          expect(this.view.$('a[data-js=\'filter-dropdown\']').hasClass('enabled')).toBe(true);
        });

        it('shows an empty customer list if there are none', function () {
          this.unassignedDevices.reset();
          expect(this.view.$el.text()).not.toContain('No Customers');
          expect(this.view.$('#customer-list-items').html()).toEqual('');
        });
      });

      describe('clicking on "All" after filtering', function () {
        beforeEach(function () {
          this.view.$('a[data-js=\'filter-dropdown\']').click();
          this.view.$('a[data-filter=assigned]').click();

          this.view.$('a[data-js=\'filter-dropdown\']').click();
          this.view.$('a[data-filter=all]').click();
        });

        it('shows both assigned and unassigned devices', function () {
          _.each(this.collection.models, function (customer) {
            const customerName = customer.get('firstName') + ' ' + customer.get('lastName');

            expect(this.view.$('#customer-list-items').html()).toContain(customerName);
          }.bind(this));

          _.each(this.unassignedDevices.models, function (device) {
            expect(this.view.$('#customer-list-items').html()).toContain(device.get('deviceId'));
          }.bind(this));
        });

        it('does not show the filter icon as enabled', function () {
          expect(this.view.$('a[data-js=\'filter-dropdown\']').length).toBe(1);
          expect(this.view.$('a[data-js=\'filter-dropdown\']').hasClass('enabled')).toBe(false);
        });
      });

      describe('clicking on a filter', function () {
        it('highlights the selection', function () {
          this.view.$('a[data-js=\'filter-dropdown\']').click();
          this.view.$('a[data-filter=unassigned]').click();

          expect(this.view.$('.filter-dropdown-contents li:nth-child(2)').hasClass('selected')).toBeTruthy();
        });
      });
    });

    describe('sorting', function () {
      it('sorts the customers by last name by default', function () {
        const customers = this.view.render().$el.find('#customer-list-items .customer-info .name').map((_i, c) => c.textContent).get();
        expect(customers).toEqual(['Amy Alpha', 'Bob Bravo', 'Cindy Charlie', 'Danny Delta']);
      });

      it('sorts the customers in reverse when the customer column is clicked', function () {
        const $customersColumn = this.view.render().$el.find('.sort-controls');
        $customersColumn.click();

        const customers = this.view.$el.find('#customer-list-items .customer-info .name').map((_i, c) => c.textContent).get();
        expect(customers).toEqual(['Danny Delta', 'Cindy Charlie', 'Bob Bravo', 'Amy Alpha']);
      });

      it('sorts the customers by alert priority when the alerts column is clicked', function () {
        const $alertsColumn = this.view.render().$el.find('.alert-sort');
        $alertsColumn.click();

        const customers = this.view.$el.find('#customer-list-items .customer-info .name').map((_i, c) => c.textContent).get();
        expect(customers).toEqual(['Bob Bravo', 'Cindy Charlie', 'Amy Alpha', 'Danny Delta']);
      });
    });
  });

  describe('with a customer', function () {
    beforeEach(function () {
      this.customer = new Customer({id: 1, firstName: 'John', lastName: 'Smith'});
      const primaryDevice = Factories.build('thermostat', {deviceId: 'A123456B', status: 'OPTED IN'});
      const system = Factories.build('system');
      system.primaryDevice = primaryDevice;
      this.customer.getSystems().add(system);

      const customers = new CustomersCollection(this.customer);

      expect(this.customer.getSystems().length).toBe(1);

      this.view = new CustomerListView(_.extend(this.defaultOptions, {
        customers,
        visibleActions: {
          showDispositionDropdown: false,
          showInformationIcon: true
        }
      }));
    });

    describe('selecting a customer', function () {
      it('shows the customer view', function (done) {
        const $customerInfo = this.view.render().$el.find('div.customer-info .name a');

        this.view.$el.on('click [data-route]', function (e) {
          expect($(e.target).attr('href')).toEqual('/customers/1#all');
          done();
        });

        $customerInfo.click();
      });
    });

    describe('selecting a customers system', function () {
      it('triggers navigation to the customer system view', function (done) {
        const $customerSystem = this.view.render().$el.find('[href="/customers/1/systems/A123456B"]');

        expect($customerSystem.length).toBe(1);

        this.view.$el.on('click [data-route]', function (e) {
          expect($(e.target).attr('href')).toEqual('/customers/1/systems/A123456B');
          done();
        });

        $customerSystem.click();
      });
    });

    describe('for a Trane theme', function () {
      beforeEach(function () {
        Theme.set('trane');
      });

      describe('with a company name', function () {
        beforeEach(function () {
          this.customer.set('companyName', 'Wildlife Reserve HQ');
        });

        it('shows the company name', function () {
          const companyName = this.view.render().$el.find('#customer-list-items .name a').html();

          expect(companyName).toEqual('Wildlife Reserve HQ');
        });

        it('shows the customer name', function () {
          const customerName = this.view.render().$el.find('#customer-list-items .customer-info-details').html();

          expect(customerName).toEqual('John Smith');
        });
      });

      describe('without a company name', function () {
        it('shows the customer name', function () {
          const customerName = this.view.render().$el.find('#customer-list-items .name a').html();

          expect(customerName).toEqual('John Smith');
        });
      });
    });

    describe('for a Nexia theme', function () {
      describe('with a company name', function () {
        it('does not show the company name', function () {
          this.customer.set('companyName', 'Wildlife Reserve HQ');

          const customerName = this.view.render().$el.find('#customer-list-items .name a').html();

          expect(customerName).toEqual('John Smith');
        });
      });
    });
  });

  describe('with a base customer filter', function () {
    it('filters the models with the give base customer filter', function () {
      const customer1 = Factories.build('customer');
      const customer2 = Factories.build('customer');

      const baseCustomerFilterSpy = sinon.stub().returns([customer1]);

      const view = new CustomerListView(_.extend(this.defaultOptions, {
        customers: new CustomersCollection([customer1, customer2]),
        baseCustomerFilter: baseCustomerFilterSpy
      }));

      expect(view.resultsCollection.length).toEqual(1);
      expect(view.resultsCollection.first()).toEqual(customer1);
    });
  });

  describe('with the live rerender option set', function () {
    beforeEach(function () {
      const customer = Factories.build('customer');
      const system = Factories.build('system');
      this.device = Factories.build('thermostat');

      customer.getSystems().add(system);
      system.getDevices().add(this.device);

      const view = new CustomerListView(_.extend(this.defaultOptions, {
        customers: new CustomersCollection([customer]),
        liveRerender: true
      })).render();

      this.resetSpy = sinon.spy(view.resultsCollection, 'reset');
    });

    describe('when a device disposition action changes', function () {
      it('recomputes the results collection', function () {
        this.device.set('dispositionAction', 'fake disposition action');

        expect(this.resetSpy.called).toBeTruthy();
      });
    });

    describe('when a device\'s critical or major alerts change', function () {
      // can't figure out a good solution for working around debounce
      xit('recomputes the results collection', function () {
        this.device.set('criticalAlerts', 1);

        expect(this.resetSpy.called).toBeTruthy();
      });
    });
  });
});
