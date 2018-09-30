/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(function (require) {
  require('spec/spec_helper');
  const Backbone                = require('backbone');
  const AddSystemView           = require('systems/views/add_system_view');
  const Customer                = require('customers/models/customer');
  const CustomerSystemsView     = require('customers/views/customer_systems_view');
  const SystemGroupDropdownView = require('customers/views/system_group_dropdown_view');
  const CustomerView            = require('customers/views/customer_view');
  const ModalDialog             = require('utils/modal_dialog');
  const System                  = require('systems/models/system');
  const Theme                   = require('utils/theme');
  const Session                 = require('root/models/session');

  const Factories = require('spec/_support/factories');

  require('sinon');

  describe('CustomerView', function () {
    beforeEach(function () {
      this.firstName = 'Bob';
      this.lastName = 'Dobbs';
      this.fullName = `${this.firstName} ${this.lastName}`;
      this.customer = new Customer({id: 1, firstName: this.firstName, lastName: this.lastName, dealerUuid: '5555555555'});
      this.customerView = new CustomerView({model: this.customer});
      this.triggerSpy = sinon.spy(this.customerView, 'trigger');
      this.sinon = sinon.sandbox.create();
      this.session = new Session();
      Theme.set('nexia');
    });

    afterEach(function () {
      this.sinon.restore();
      $(window.location).attr('hash', '');
      Theme.set('nexia');
    });

    describe('for a Trane theme', function () {
      beforeEach(() => Theme.set('trane'));

      describe('with a company name', function () {
        beforeEach(function () {
          this.customer.set('companyName', 'Wildlife Reserve HQ');
        });

        it('shows the company name', function () {
          expect(this.customerView.render().$el.find('.customer-name').html()).toEqual('Wildlife Reserve HQ');
        });

        it('shows the customer name as company contact', function () {
          expect(this.customerView.render().$el.find('#company-contact-name').html()).toMatch(this.fullName);
        });
      });

      describe('without a company name', () =>
        it('shows the customer name', function () {
          expect(this.customerView.render().$el.find('.customer-name').html()).toEqual(this.fullName);
        })
      );
    });

    describe('for a Nexia theme', () =>
      describe('with a company name', () =>
        it('shows the customer name instead of a company name', function () {
          expect(this.customerView.render().$el.find('.customer-name').html()).toEqual(this.fullName);
        })
      )
    );

    describe('If the user name contains script tags', function () {
      beforeEach(function () {
        this.customer.set('firstName', '<script>alert(1);</script>');
        this.customer.set('lastName', '<script>alert(2);</script>');
        this.escapedName = '&lt;script&gt;alert(1);&lt;/script&gt; ' +
                       '&lt;script&gt;alert(2);&lt;/script&gt;';
      });

      it('escapes the tags', function () {
        expect(this.customerView.render().$('.customer-name').html()).toBe(this.escapedName);
      });
    });

    describe('when initialized', function () {
      describe('without systems', () =>
        it("displays a 'no devices' watermark", function () {
          const $watermark = this.customerView.render().$('#devices > .page-watermark');

          expect($watermark.length).toBeTruthy();
        })
      );

      describe('with systems', () =>
        it("does not display a 'no devices' watermark", function () {
          const system = Factories.build('system');
          this.customer.getSystems().add(system);
          this.customerView = new CustomerView({model: this.customer, system, session: this.session});

          const $watermark = this.customerView.render().$('#devices > .page-watermark');

          expect($watermark.length).toBeFalsy();
        })
      );

      describe("with an 'all' deep linked url designation", () =>
        it('displays all systems', function () {
          $(window.location).attr('hash', '#all');

          const system = Factories.build('system', {group: 'group'});
          this.customer.getSystems().add(system);

          const customerView = new CustomerView({model: this.customer, session: this.session});

          const { $el } = customerView.render();
          const selectedGroup = $el.find('#group-select').val();

          expect($el.find('#customer-system-heading').html()).toContain('group-select');
          expect(selectedGroup).toBe('all');
        })
      );

      describe("without an 'all' deep linked url designation", () =>
        it("displays systems filtered by the active system's group (including unassigned)", function () {
          const system1 = Factories.build('system', {group: 'A'});
          const system2 = Factories.build('system', {group: 'B'});
          const system3 = Factories.build('system', {group: 'B'});

          this.customer.getSystems().add([system1, system2, system3]);

          const customerView = new CustomerView({model: this.customer, system: system2, session: this.session});
          customerView.render();

          expect(customerView.filteredSystems.length).toBe(2);
        })
      );

      describe('without any systems assigned to a group', function () {
        beforeEach(function () {
          this.headingHtml = this.customerView.render().$('#customer-system-heading').html();
        });

        it('shows the system count', function () {
          expect(this.headingHtml).toContain('customer-systems-count');
        });

        it('does not show the system group filter', function () {
          expect(this.headingHtml).not.toContain('group-select');
        });
      });

      describe('with at least one system assigned to a group', function () {
        beforeEach(function () {
          this.system = Factories.build('system', {group: 'group'});
          const system2 = Factories.build('system', {group: 'group'});
          const system3 = Factories.build('system', {group: 'group'});
          this.customer.getSystems().add([this.system, system2, system3]);

          this.customerView = new CustomerView({model: this.customer, system: this.system, theme: this.fakeTheme, session: this.session});

          this.listenToSpy = sinon.spy(this.customerView, 'listenTo');
          this.triggerSpy = sinon.spy(this.customerView, 'trigger');

          this.html = this.customerView.render().$('#customer-system-heading').html();
        });

        it('does not show the system count', function () {
          expect(this.html).not.toContain('customer-systems-count');
        });

        it('shows the system group filter', function () {
          expect(this.html).toContain('group-select');
        });

        describe('when navigating to the next page of tabs', function () {
          beforeEach(function () {
            this.nextPageCallback = _.find(this.listenToSpy.args, callArgs => callArgs[1] === 'nextPage')[2];
          });

          describe('while the page is displaying all systems', () =>
            it('triggers the system selected event for the active system with #all', function () {
              $(window.location).attr('hash', '#all');

              this.customerView.initialize({}); // re-setup now that the #all hash is set

              sinon.stub(this.customerView.tabPaginator, 'nextPage').returns([this.system]);

              this.nextPageCallback();

              expect(this.triggerSpy.lastCall.args).toEqual(['systemSelected', this.system.id + '#all']);
            })
          );

          describe('while the page is not displaying all system', () =>
            it('triggers the system selected event for the active system without #all', function () {
              sinon.stub(this.customerView.tabPaginator, 'nextPage').returns([this.system]);

              this.nextPageCallback();

              expect(this.triggerSpy.lastCall.args).toEqual(['systemSelected', this.system.id]);
            })
          );
        });

        describe('when navigating to the previous page of tabs', function () {
          beforeEach(function () {
            this.previousPageCallback = _.find(this.listenToSpy.args, callArgs => callArgs[1] === 'previousPage')[2];
          });

          describe('while all systems are displayed', () =>
            it('triggers the system selected event for the active system with #all', function () {
              $(window.location).attr('hash', '#all');

              this.customerView.initialize({}); // re-setup now that the #all hash is set

              sinon.stub(this.customerView.tabPaginator, 'previousPage').returns([this.system]);

              this.previousPageCallback();

              expect(this.triggerSpy.lastCall.args).toEqual(['systemSelected', this.system.id + '#all']);
            })
          );

          describe('while all systems are not displayed', () =>
            it('triggers the system selected event for the active system without #all', function () {
              sinon.stub(this.customerView.tabPaginator, 'previousPage').returns([this.system]);

              this.previousPageCallback();

              expect(this.triggerSpy.lastCall.args).toEqual(['systemSelected', this.system.id]);
            })
          );
        });

        describe('and at least one system not assigned to a group', () =>
          it("shows the 'unassigned system groups' filter option", function () {
            const system = Factories.build('system');
            this.customer.getSystems().add(system);

            const customerView = new CustomerView({model: this.customer, session: this.session});

            const $groupSelectHtml = customerView.render().$('#group-select').html();

            expect($groupSelectHtml).toContain('unassigned-systems');
          })
        );
      });
    });

    describe('when the system group is set to a different group', function () {
      beforeEach(function () {
        this.system1 = Factories.build('system', {group: 'A'});
        this.system2 = Factories.build('system', {group: 'B'});
        Factories.build('system', {group: 'B'});

        this.customer.getSystems().add([this.system1, this.system2]);

        const customerView = new CustomerView({model: this.customer, system: this.system1, session: this.session});
        this.triggerSpy = sinon.spy(customerView, 'trigger');

        this.$groupSelect = customerView.render().$('select.group-select');
      });

      describe("and the active system is part of the selected group (i.e. going from 'all' to group)", () =>
        it('triggers the system selected event for the active system', function () {
          this.$groupSelect.find("option[value='all']").change();

          expect(this.triggerSpy.calledWith('systemSelected', this.system1.id)).toBeTruthy();
        })
      );

      it('triggers the system selected event for the first system in the selected group', function () {
        this.$groupSelect.find("option[value='B']").change();

        expect(this.triggerSpy.calledWith('systemSelected', this.system2.id)).toBeTruthy();
      });

      it("removes designation 'all' to the url", () => expect(window.location.href).not.toMatch(/#all/));
    });

    describe('when the system group is set to all', function () {
      beforeEach(function () {
        this.system1 = Factories.build('system', {group: 'A'});
        this.system2 = Factories.build('system', {group: 'A'});
        this.customer.getSystems().add([this.system1, this.system2]);

        this.customerView = new CustomerView({model: this.customer, system: this.system1, session: this.session});

        this.triggerSpy = sinon.spy(this.customerView, 'trigger');

        this.customerView.render().$("select.group-select option[value='all']").change();
      });

      it('triggers the system selected event for the active system', function () {
        expect(this.triggerSpy.calledWith('systemSelected', this.system1.id)).toBeTruthy();
      });

      it("adds designation 'all' to the url", () => expect(window.location.href).toMatch(/#all/));
    });

    describe("when a system's group is changed via sync", () =>
      it('re-renders the group dropdown', function () {
        const system = new System({group: 'A'});
        this.customer.getSystems().add([system]);

        const view = new CustomerView({model: this.customer, session: this.session});

        const listenToSpy = sinon.spy(view, 'listenTo');

        system.set('group', '');
        system.trigger('sync');

        // this is the only reasonable public way to see that a view was created and rendered
        expect(listenToSpy.getCall(0).args[0]).toEqual(jasmine.any(SystemGroupDropdownView));

        listenToSpy.restore();
      })
    );

    describe('when the system group is set to unassigned', () =>
      it('triggers the system selected event for the first system in the unassigned group', function () {
        const system1 = Factories.build('system');
        const system2 = Factories.build('system');
        const system3 = Factories.build('system', {group: 'group'});

        this.customer.getSystems().add([system1, system2, system3]);

        const customerView = new CustomerView({model: this.customer, session: this.session});
        customerView.activeSystem = system1;
        const triggerSpy = sinon.spy(customerView, 'trigger');
        const { $el } = customerView.render();

        $el.find("select.group-select option[value='']").change();

        expect(triggerSpy.calledWith('systemSelected', system1.id)).toBeTruthy();
      })
    );

    describe('when a system is deleted', function () {
      beforeEach(function () {
        this.system = Factories.build('system', {group: 'group'});
        this.customer.getSystems().add(this.system);

        this.deleteSystemView = new CustomerView({model: this.customer, system: this.system, session: this.session});
        this.triggerSpy = sinon.spy(this.deleteSystemView, 'trigger');
        this.listenToSpy = sinon.spy(this.deleteSystemView, 'listenTo');

        this.deleteSystemView.render();
      });

      describe("that's the last system of the customer", () =>
        it('triggers the system deleted event', function () {
          const deleteLastSystem = _.find(this.listenToSpy.args, callArgs => callArgs[1] === 'lastSystemDeleted')[2];

          this.deleteSystemView.systems = new Backbone.Collection();

          deleteLastSystem();

          expect(this.triggerSpy.calledWith('lastSystemDeleted')).toBeTruthy();
        })
      );

      describe("that's the last system of the group (but not the last system of the customer)", function () {
        beforeEach(function () {
          this.customer.getSystems().add(Factories.build('system', {group: 'group'}));

          this.deleteSystemView.render();
        });

        it('shows all the systems', function () {
          const deleteSystem = _.find(this.listenToSpy.args, callArgs => callArgs[1] === 'lastSystemDeleted')[2];

          deleteSystem();

          expect(this.triggerSpy.getCall(0).args[0]).toBe('systemSelected');
          expect(this.triggerSpy.getCall(0).args[1]).toMatch(/#all/);
        });

        it('triggers the system selected event for the first system', function () {
          const deleteSystem = _.find(this.listenToSpy.args, callArgs => callArgs[1] === 'lastSystemDeleted')[2];

          deleteSystem();

          expect(this.triggerSpy.getCall(0).args[0]).toBe('systemSelected');
          expect(this.triggerSpy.getCall(0).args[1]).toMatch(new RegExp(`${this.system.get('id')}`));
        });
      });
    });

    describe("when 'edit customer' is clicked", () =>
      it('triggers editCustomer', function () {
        this.customerView.render().$('.edit-customer').click();

        expect(this.triggerSpy.calledWith('editCustomer', this.customer.get('id')))
          .toBeTruthy();
      })
    );

    describe('when the notes button is clicked', function () {
      beforeEach(function () {
        $.fn.foundation = this.sinon.stub();
        this.showSpy = this.sinon.spy(ModalDialog.prototype, 'show');
      });

      afterEach(function () {
        $.fn.foundation = undefined;
        this.showSpy.restore();
      });

      it('renders an edit notes dialog', function () {
        this.customer.set('note', 'this is a note');
        this.customerView.render().$('.heading .notes').click();

        expect(this.showSpy.called).toBeTruthy();
      });
    });

    describe("when 'add system' is clicked", function () {
      beforeEach(function () {
        $.fn.foundation = this.sinon.stub();
        this.showSpy = this.sinon.spy(ModalDialog.prototype, 'show');

        const initializeSpy = this.sinon.spy(AddSystemView.prototype, 'initialize');

        const system = Factories.build('system', {group: 'group'});
        this.customer.getSystems().add(system);

        this.customerView = new CustomerView({model: this.customer, system, session: this.session});

        this.customerView.render();
        this.customerView.$('#group-select').val('group');
        this.customerView.$('.add-system').click();

        expect(initializeSpy.called).toBeTruthy();

        this.newSystem = initializeSpy.args[0][0].model;
      });

      afterEach(function () {
        $.fn.foundation = undefined;

        this.showSpy.restore();
      });

      it('shows the add system dialog', function () {
        this.customerView.$('.add-system').click();

        expect(this.showSpy.called).toBeTruthy();
      });

      describe('the newly built system', function () {
        it('has the customer params', function () {
          expect(this.newSystem.get('dealerUuid')).toEqual(this.customer.get('dealerUuid'));
          expect(this.newSystem.get('customerId')).toEqual(this.customer.id);
        });

        it('has the group set to the selected group', function () {
          expect(this.newSystem.get('group')).toEqual('group');
        });
      });
    });

    describe('#remove', () =>
      describe('without any devices', () =>
        it("doesn't error", function () {
          this.customer.devices = [];
          expect(() => this.customerView.remove()).not.toThrow();
        })
      )
    );

    describe('with an active system', () =>
      it('selects the active system', function () {
        const initializeSpy = this.sinon.spy(CustomerSystemsView.prototype, 'initialize');
        const activeSystem = Factories.build('system');
        this.customer.getSystems().add(activeSystem);
        const customerView = new CustomerView({model: this.customer, system: activeSystem, session: this.session});

        customerView.render();

        sinon.match.has('activeSystem', activeSystem);
        sinon.match.has('customer', this.customer);

        expect(
          initializeSpy
            .calledWith(
              sinon.match.has('activeSystem', activeSystem).and(
                sinon.match.has('customer', this.customer)
              )
            )
        ).toBeTruthy();
      })
    );

    describe('without an active system', () =>
      it('selects the first system', function () {
        const initializeSpy = this.sinon.spy(CustomerSystemsView.prototype, 'initialize');
        const system = Factories.build('system');
        this.customer.getSystems().add(system);
        const customerView = new CustomerView({model: this.customer, session: this.session});

        customerView.render();

        const systemIdMatcher = sinon.match(v => (v.id || v.get('id')) === system.get('id'));

        expect(
          initializeSpy
            .calledWith(
              sinon.match.has('activeSystem', systemIdMatcher).and(
                sinon.match.has('customer', this.customer)
              )
            )
        ).toBeTruthy();
      })
    );

    describe('with a readonly view', () =>
      it('builds a readonly systems view', function () {
        const initializeSpy = this.sinon.spy(CustomerSystemsView.prototype, 'initialize');
        const system = Factories.build('system');
        this.customer.getSystems().add(system);
        const customerView = new CustomerView({model: this.customer, readOnly: true, session: this.session});

        customerView.render();

        expect(initializeSpy.calledWith(sinon.match.has('readOnly', true))).toBeTruthy();
      })
    );
  });
});
