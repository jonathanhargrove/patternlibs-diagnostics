define(function (require) {
  require('spec/spec_helper');
  const Session                         = require('root/models/session');
  const CustomerListItemSystemGroupView = require('customers/views/customer_list_item_system_group_view');
  const Theme                           = require('utils/theme');
  const CurrentStatusList               = require('current_status/models/current_status_list');
  require('sinon');

  describe('CustomerListItemSystemGroupView', function () {
    beforeEach(function () {
      this.session = new Session({});

      sinon.stub(this.session, 'featureEnabled').returns(true);

      this.currentStatusList = new CurrentStatusList();

      this.defaultOptions = {
        session: new Session(),
        visibleActions: {
          showDispositionDropdown: false,
          showInformationIcon: true
        }
      };
    });

    describe('with a named group', function () {
      beforeEach(function () {
        const customer = Factories.build('customer');

        this.system = Factories.build('system', {'group': 'A Group'});
        this.system2 = Factories.build('system', {'group': 'A Group'});

        customer.getSystems().add([this.system, this.system2]);

        this.view = new CustomerListItemSystemGroupView(_.extend(this.defaultOptions, {
          group: 'A Group',
          customer,
          session: this.session,
          currentStatusList: this.currentStatusList
        }));

        this.$el = this.view.render().$el;
      });

      it('shows the group header and group name', function () {
        expect(this.$el.html()).toContain('group-header');
        expect(this.$el.find('.group-header').html()).toContain('A Group');
      });

      it('shows all the systems included in the group', function () {
        expect(this.$el.html()).toContain(this.system.attributes.id);
        expect(this.$el.html()).toContain(this.system2.attributes.id);
      });

      describe('when a group header is collapsed', function () {
        beforeEach(function () {
          this.$el.find('.group-header-toggle').click();
        });

        it('updates the UI to show that the group is collapsed', function () {
          expect(this.$el.find('.group-header-toggle').hasClass('icon-arrow-right')).toBe(true);
        });

        it('hides all the systems under the group', function () {
          expect(this.$el.find('.systems').hasClass('hidden')).toBe(true);
        });
      });

      describe('when a group header is expanded', function () {
        beforeEach(function () {
          this.$el.find('.group-header-toggle').click();
          this.$el.find('.group-header-toggle').click();
        });

        it('updates the UI to show that the group is expanded', function () {
          expect(this.$el.find('.group-header-toggle').hasClass('icon-arrow-down2')).toBe(true);
        });

        it('shows all the systems under the group', function () {
          expect(this.$el.find('.systems').hasClass('hidden')).toBe(false);
        });
      });
    });

    describe('for a group of unassigned systems', function () {
      beforeEach(function () {
        const customer = Factories.build('customer');

        this.system = Factories.build('system');
        this.system2 = Factories.build('system');
        this.system3 = Factories.build('system', {'group': 'A Group'});

        customer.getSystems().add([this.system, this.system2, this.system3]);

        const view = new CustomerListItemSystemGroupView(_.extend(this.defaultOptions, {
          group: null,
          customer,
          session: this.session,
          currentStatusList: this.currentStatusList
        }));

        this.$el = view.render().$el;
      });

      it('uses a group label that designates the group as unassigned', function () {
        expect(this.$el.html()).toContain('group-header');
        expect(this.$el.find('.group-header').html()).toContain('[Systems Not Assigned to a Group]');
      });

      it('shows all the systems not included in a group', function () {
        expect(this.$el.html()).toContain(this.system.attributes.id);
        expect(this.$el.html()).toContain(this.system2.attributes.id);
        expect(this.$el.html()).not.toContain(this.system3.attributes.id);
      });
    });

    describe("without any of the customer's systems assigned to the group", function () {
      beforeEach(function () {
        const customer = Factories.build('customer');

        this.system = Factories.build('system');
        this.system2 = Factories.build('system');

        customer.getSystems().add([this.system, this.system2]);

        const view = new CustomerListItemSystemGroupView(_.extend(this.defaultOptions, {
          group: null,
          customer,
          session: this.session,
          currentStatusList: this.currentStatusList
        }));

        this.$el = view.render().$el;
      });

      it('does not show group headers', function () {
        expect(this.$el.html()).not.toContain('group-header');
        expect(this.$el.html()).not.toContain('[Systems Not Assigned to a Group]');
      });

      it('shows all the systems', function () {
        expect(this.$el.html()).toContain(this.system.attributes.id);
        expect(this.$el.html()).toContain(this.system2.attributes.id);
      });
    });

    describe('with devices that have alerts', function () {
      beforeEach(function () {
        this.device = Factories.build('thermostat');
        this.device.set('criticalAlerts', 5);
        this.device.set('majorAlerts', 8);

        this.system = Factories.build('system', {'group': 'A Group'});
        this.system.getDevices().add([this.device]);

        this.customer = Factories.build('customer');
        this.customer.getSystems().add([this.system]);

        this.view = new CustomerListItemSystemGroupView(_.extend(this.defaultOptions, {
          group: 'A Group',
          customer: this.customer,
          session: this.session,
          currentStatusList: this.currentStatusList
        }));

        this.view.render();
      });

      it('shows the quantity of each alarm type in the group header', function () {
        expect(this.view.$('.group-header-alerts').html()).toContain('critical');
        expect(this.view.$('.group-header-alerts').html()).toContain('major');
        expect(this.view.$('.critical .count').html()).toEqual('5');
        expect(this.view.$('.major .count').html()).toEqual('8');
      });

      it('listens to changes on any device in the system collection and rerenders', function () {
        const renderSpy = sinon.spy(this.view, 'render');

        this.device.set('criticalAlerts', 17);

        expect(renderSpy.called).toBeTruthy();
        expect(this.view.$('.critical .count').html()).toEqual('17');
      });
    });

    describe('with a base system filter', function () {
      it('filters the systems with the given base system filter', function () {
        const system = Factories.build('system');
        const baseSystemFilterSpy = sinon.stub().returns([system]);

        const view = new CustomerListItemSystemGroupView(_.extend(this.defaultOptions, {
          customer: Factories.build('customer'),
          session: this.session,
          currentStatusList: this.currentStatusList,
          baseSystemFilter: baseSystemFilterSpy
        }));

        expect(view.collection.length).toEqual(1);
        expect(view.collection.first()).toEqual(system);
      });
    });

    describe('when a customer does not have any systems', function () {
      it('rendering the view does not error', function () {
        const customer = Factories.build('customer');

        const view = new CustomerListItemSystemGroupView(_.extend(this.defaultOptions, {
          group: null,
          customer,
          session: this.session,
          currentStatusList: this.currentStatusList
        }));

        expect(() => view.render()).not.toThrow();
      });
    });

    describe('with theme', function () {
      beforeEach(function () {
        this.group = 'A Group';
        this.customer = Factories.build('customer');

        this.system = Factories.build('system', {'group': this.group});
        this.system2 = Factories.build('system', {'group': this.group});

        this.customer.getSystems().add([this.system, this.system2]);
      });

      describe('for Nexia', function () {
        it('show the system groups expanded on initial load', function () {
          const view = new CustomerListItemSystemGroupView(_.extend(this.defaultOptions, {
            group: this.group,
            customer: this.customer,
            session: this.session,
            currentStatusList: this.currentStatusList
          }));

          view.render();

          expect(view.$('.group-header-toggle').hasClass('icon-arrow-down2')).toBe(true);
          expect(view.$('.systems').hasClass('hidden')).toBe(false);
        });

        it('collapses groups that were previously collapsed by the user (for current browser load state)', function () {
          this.customer[`${this.group}_lastUserSetToggleState`] = 'collapsed';

          const view = new CustomerListItemSystemGroupView(_.extend(this.defaultOptions, {
            group: this.group,
            customer: this.customer,
            session: this.session,
            currentStatusList: this.currentStatusList
          }));

          view.render();

          expect(view.$('.group-header-toggle').hasClass('icon-arrow-right')).toBe(true);
          expect(view.$('.systems').hasClass('hidden')).toBe(true);
        });
      });

      describe('for Trane', function () {
        describe('with groups', function () {
          it('show the system groups collapsed on initial load', function () {
            Theme.set('trane');

            const view = new CustomerListItemSystemGroupView(_.extend(this.defaultOptions, {
              group: this.group,
              customer: this.customer,
              session: this.session,
              currentStatusList: this.currentStatusList
            }));

            view.render();

            expect(view.$('.group-header-toggle').hasClass('icon-arrow-right')).toBe(true);
            expect(view.$('.systems').hasClass('hidden')).toBe(true);
          });

          it('expands groups that were previously expanded by the user (for current browser load state)', function () {
            this.customer[`${this.group}_lastUserSetToggleState`] = 'expanded';

            const view = new CustomerListItemSystemGroupView(_.extend(this.defaultOptions, {
              group: this.group,
              customer: this.customer,
              session: this.session,
              currentStatusList: this.currentStatusList
            }));

            view.render();

            expect(view.$('.group-header-toggle').hasClass('icon-arrow-down2')).toBe(true);
            expect(view.$('.systems').hasClass('hidden')).toBe(false);
          });
        });

        describe('without groups', function () {
          beforeEach(function () {
            const customer = Factories.build('customer');

            this.system = Factories.build('system');
            this.system2 = Factories.build('system');

            customer.getSystems().add([this.system, this.system2]);

            this.view = new CustomerListItemSystemGroupView(_.extend(this.defaultOptions, {
              group: null,
              customer,
              session: this.session,
              currentStatusList: this.currentStatusList
            }));

            this.$el = this.view.render().$el;
          });

          it('does not show group headers', function () {
            expect(this.view.$('.systems').hasClass('hidden')).toBe(false);
          });

          it('contains all the systems', function () {
            expect(this.$el.html()).toContain(this.system.attributes.id);
            expect(this.$el.html()).toContain(this.system2.attributes.id);
          });
        });
      });
    });
  });
});
