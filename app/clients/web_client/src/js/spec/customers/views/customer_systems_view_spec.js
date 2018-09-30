define(function (require) {
  require('spec/spec_helper');

  const AddSpiderView       = require('devices/views/add_spider_view');
  const Backbone            = require('backbone');
  const ButtonSpinner       = require('utils/button_spinner');
  const CustomerSystemsView = require('customers/views/customer_systems_view');
  const Factories           = require('spec/_support/factories');
  const Honeybadger         = require('honeybadger-js');
  const ModalDialog         = require('utils/modal_dialog');
  const Paginator           = require('utils/paginator');
  const ServerError         = require('root/server_error');
  const Session             = require('root/models/session');
  const Spider              = require('devices/models/spider');

  require('sinon');

  describe('CustomerSystemsView', function () {
    beforeEach(function () {
      this.collection = new Backbone.Collection();
      this.collection.url = () => 'fake';

      this.activeSystem = Factories.build('system', {timeZone: 'America/Chicago'});
      this.otherSystem = Factories.build('system');

      this.collection.reset([this.activeSystem, this.otherSystem]);

      this.tabPaginator = new Paginator([this.activeSystem, this.otherSystem]);

      this.session = new Session({roles: [], enabledFeatures: [], dealerPhoneNumber: '(888) 888-8888'});

      this.customer = Factories.create('customer');

      this.options = {
        tabPaginator: this.tabPaginator,
        activeSystem: this.activeSystem,
        collection: this.collection,
        session: this.session,
        customer: this.customer,
        reportCache: {}
      };

      this.renderView = () => {
        this.view = new CustomerSystemsView(this.options);

        this.$el = this.view.render().$el;
        this.triggerSpy = sinon.spy(this.view, 'trigger');
      };

      this.renderView();
    });

    describe('with an active system', function () {
      it("renders the system device's view", function () {
        expect(this.$el.find('#system-view').length).toBeTruthy();
      });

      it("marks the device's tab as selected", function () {
        expect(this.$el.find('.device-tabs .tab').length).toBe(2);
        expect(this.$el.find('.device-tabs .tab.active').length).toBe(1);
        expect(`${this.$el.find('.device-tabs .tab.active a').data('system-id')}`).toBe(`${this.activeSystem.id}`);
        expect(`${this.$el.find('.device-tabs .tab.active a .device-name').html()}`).toBe(`${this.activeSystem.primaryDevice.get('name')}`);
        expect(this.$el.find('.device-tabs .tab:first').hasClass('active')).toBeTruthy();
      });

      it("marks the sets the device selector's selected option", function () {
        expect(this.$el.find('.device-dropdown option').length).toBe(2);
        expect(this.$el.find('.device-dropdown option:first').prop('selected')).toBeTruthy();
      });

      describe("that isn't visible by default", function () {
        beforeEach(function () {
          this.options.activeSystem = this.otherSystem;
          this.view = new CustomerSystemsView(this.options);
          // force the non-active system to be hidden
          this.tabCountStub = sinon.stub(this.view, '_numberOfTabsThatFit').returns(1);

          this.view.render();
          this.view.updateTabs(); // show/hide all active/inactive tabs
          this.triggerSpy = sinon.spy(this.view, 'trigger');
          this.$el = this.view.$el;
        });

        it("marks the device's tab as selected", function () {
          expect(this.$el.find('.device-tabs .tab:not(.hidden)').length).toBe(1);
          expect(this.$el.find('.device-tabs .tab.active').length).toBe(1);
          expect(this.$el.find('.device-tabs .tab.active a').data('system-id') + '').toBe(this.otherSystem.id);
        });
      });

      describe('with ndm feature enabled', function () {
        beforeEach(function () {
          this.session.addFeatureCode('ndm', {forceEnable: true});
          this.renderView();
        });

        describe('with no ndm (spider)', function () {
          beforeEach(function () {
            // Just to ensure our @activeSystem is set up correctly
            expect(
              this.activeSystem.getDevices().filter(d => d.get('deviceType') === 'ndm').length
            ).toEqual(0);
          });

          it('renders an add ndm button', function () {
            expect(this.$el.find('button.add-ndm').length).toEqual(1);
          });

          it('renders no remove ndm button', function () {
            expect(this.$el.find('button.delete-ndm').length).toEqual(0);
          });

          describe('when add ndm button is clicked', function () {
            beforeEach(function () {
              $.fn.foundation = sinon.stub(); // required to prevent error in ModalDialog
              this.addSpiderSpy = sinon.spy(AddSpiderView.prototype, 'render');
              this.modalDialogSpy = sinon.spy(ModalDialog.prototype, 'show');

              this.$el.find('.add-ndm').click();
            });

            afterEach(function () {
              $.fn.foundation = undefined;
              this.addSpiderSpy.restore();
              this.modalDialogSpy.restore();
            });

            it('renders the AddSpiderView', function () {
              expect(this.addSpiderSpy.calledOnce).toBe(true);
              expect(this.modalDialogSpy.calledOnce).toBe(true);

              const { model } = this.modalDialogSpy.getCall(0).thisValue.view;

              expect(model).toBeTruthy();
              expect(model.constructor).toEqual(Spider);
              expect(model.timeZone()).toEqual(this.activeSystem.get('timeZone'));
            });
          });
        });

        describe('with an ndm (spider)', function () {
          beforeEach(function () {
            this.spider = Factories.create('spider');
            this.activeSystem.getDevices().add(this.spider);
            this.renderView();
          });

          it('renders a remove ndm button', function () {
            expect(this.$el.find('button.delete-ndm').length).toEqual(1);
          });

          it('renders no add ndm button', function () {
            expect(this.$el.find('button.add-ndm').length).toEqual(0);
          });

          it('renders the thermostat above the spider', function () {
            const deviceTypes = this.$el.find('[data-device-type]').map((_, el) => $(el).data('device-type')).get();
            expect(deviceTypes).toEqual(['thermostat', 'ndm']);
          });

          describe('when a spider is deleted', function () {
            beforeEach(function () {
              this.confirmStub = sinon.stub(window, 'confirm');
              this.confirmStub.returns(true);
              this.alertSpy = sinon.spy(window, 'alert');

              this.$deleteButton = this.$el.find('.delete-ndm');
              this.deleteStub = sinon.stub(this.spider, 'sync')
                .withArgs('delete')
                .returns($.Deferred().resolve(this.spider));
            });

            afterEach(function () {
              this.confirmStub.restore();
              this.spider.sync.restore();
              this.alertSpy.restore();
            });

            describe('for a read-only view', function () {
              beforeEach(function () {
                this.view = new CustomerSystemsView(_.extend({readOnly: true}, this.options));
                this.$el = this.view.render().$el;
                this.$deleteButton = this.$el.find('.delete-ndm');
              });

              it('does not destroy the model', function () {
                this.$deleteButton.click();
                expect(this.deleteStub.called).toBeFalsy();
              });

              it('alerts the user this is not allowed', function () {
                this.$deleteButton.click();
                expect(this.alertSpy.calledWith('Read-only view: Cannot delete Nexia Data Module')).toBeTruthy();
              });
            });

            it('destroys the spider', function () {
              this.$deleteButton.click();

              expect(this.deleteStub.called).toBeTruthy();
              expect(this.deleteStub.returnValues[0]).toBeTruthy();
            });

            describe('with a server error response', function () {
              beforeEach(function () {
                this.buttonSpinnerStopSpy = sinon.spy(ButtonSpinner.prototype, 'stop');
                this.serverErrorDisplaySpy = sinon.spy(ServerError, 'display');
                this.honeybadgerNotifySpy = sinon.spy(Honeybadger, 'notify');
              });

              afterEach(function () {
                ServerError.display.restore();
                ButtonSpinner.prototype.stop.restore();
                Honeybadger.notify.restore();
              });

              it('displays a server error message', function () {
                this.deleteStub.returns($.Deferred().reject());

                this.$deleteButton.click();

                expect(this.serverErrorDisplaySpy.called).toBeTruthy();
                expect(this.buttonSpinnerStopSpy.called).toBeTruthy();
                expect(this.honeybadgerNotifySpy.called).toBeTruthy();
              });
            });
          });
        });
      });
    });

    describe('ndm feature disabled', function () {
      it('renders no add ndm button', function () {
        expect(this.$el.find('button.add-ndm').length).toEqual(0);
      });

      it('renders no remove ndm button', function () {
        expect(this.$el.find('button.delete-ndm').length).toEqual(0);
      });
    });

    describe("when the system's notes button is clicked", function () {
      beforeEach(function () {
        $.fn.foundation = sinon.stub();
        this.showSpy = sinon.spy(ModalDialog.prototype, 'show');
      });

      afterEach(function () {
        $.fn.foundation = undefined;
        this.showSpy.restore();
      });

      it('renders an edit notes dialog', function () {
        this.$el.find('.tab.active .notes').click();

        expect(this.showSpy.called).toBeTruthy();
      });
    });

    describe('when the next page element is clicked', function () {
      it('triggers nextPage', function () {
        this.$el.find('.next-page a').click();

        expect(this.triggerSpy.calledWith('nextPage')).toBeTruthy();
      });

      describe("and the link has the 'disabled' class", function () {
        beforeEach(function () {
          this.$el.find('.next-page a').addClass('disabled');
        });

        it('does not trigger nextPage', function () {
          this.$el.find('.next-page a').click();

          expect(this.triggerSpy.calledWith('nextPage')).toBeFalsy();
        });
      });
    });

    describe('when the previous page element is clicked', function () {
      it('triggers previousPage', function () {
        this.$el.find('.prev-page a').click();

        expect(this.triggerSpy.calledWith('previousPage')).toBeTruthy();
      });

      describe("and the link has the 'disabled' class", function () {
        beforeEach(function () {
          this.$el.find('.prev-page a').addClass('disabled');
        });

        it('does not trigger nextPage', function () {
          this.$el.find('.prev-page a').click();

          expect(this.triggerSpy.calledWith('previousPage')).toBeFalsy();
        });
      });
    });

    describe('when the active system changes', function () {
      describe('because of a change', function () {
        beforeEach(function () {
          this.activeSystem.trigger('sync', null, null, {});
        });

        it('does triggers systemSelected', function () {
          expect(this.triggerSpy.calledWith('systemSelected')).toBeTruthy();
        });
      });

      describe('because of a destroy', function () {
        beforeEach(function () {
          this.activeSystem.trigger('sync', null, null, {isDestroy: true});
        });

        it('does not trigger systemSelected', function () {
          expect(this.triggerSpy.calledWith('systemSelected')).toBeFalsy();
        });
      });
    });

    describe('when a device tab is clicked', () =>
      it('triggers systemSelected', function () {
        this.$el.find('.tab:first a').click();

        expect(this.triggerSpy.calledWith('systemSelected')).toBeTruthy();
      })
    );

    describe('when a device select option is selected', () =>
      it('triggers systemSelected', function () {
        const deviceId = this.collection.first().id;
        this.$el.find('.device-dropdown').val(deviceId).change();

        expect(this.triggerSpy.calledWith('systemSelected', deviceId)).toBeTruthy();
      })
    );

    describe('when a system is deleted', function () {
      beforeEach(function () {
        this.activeSystem.set('isNew', false);
        this.confirmStub = sinon.stub(window, 'confirm');
        this.confirmStub.returns(true);
        this.alertSpy = sinon.spy(window, 'alert');
        this.deleteStub = sinon.stub(this.activeSystem, 'sync');
      });

      afterEach(function () {
        this.confirmStub.restore();
        this.deleteStub.restore();
        this.alertSpy.restore();
      });

      describe('for a read-only view', function () {
        beforeEach(function () {
          this.view = new CustomerSystemsView(_.extend({readOnly: true}, this.options));
          this.$el = this.view.render().$el;
        });

        it('does not destroy the model', function () {
          this.$el.find('.delete-system').click();
          expect(this.deleteStub.called).toBeFalsy();
        });

        it('alerts the user this is not allowed', function () {
          this.$el.find('.delete-system').click();
          expect(this.alertSpy.calledWith('Read-only view: Cannot delete system')).toBeTruthy();
        });
      });

      it('destroys the system', function () {
        this.$el.find('.delete-system').click();

        expect(this.deleteStub.called).toBeTruthy();
      });

      describe('with a server error response', function () {
        beforeEach(function () {
          this.deleteStub.withArgs('delete', this.activeSystem)
            .returns($.Deferred().reject());

          this.buttonSpinnerStopSpy = sinon.spy(ButtonSpinner.prototype, 'stop');
          this.serverErrorDisplaySpy = sinon.spy(ServerError, 'display');
          this.honeybadgerNotifySpy = sinon.spy(Honeybadger, 'notify');
        });

        afterEach(function () {
          ServerError.display.restore();
          ButtonSpinner.prototype.stop.restore();
          Honeybadger.notify.restore();
        });

        it('displays a server error message', function () {
          this.$el.find('.delete-system').click();

          expect(this.serverErrorDisplaySpy.called).toBeTruthy();
          expect(this.buttonSpinnerStopSpy.called).toBeTruthy();
          expect(this.honeybadgerNotifySpy.called).toBeTruthy();
        });
      });

      describe('triggers when it is deleted', function () {
        beforeEach(function () {
          this.device = Factories.create('thermostat');
          this.activeSystem.getDevices().add(this.device);

          this.renderView();

          this.deleteStub.withArgs('delete', this.activeSystem)
            .returns($.Deferred().resolve(this.activeSystem));
        });

        describe('checks each device in system for dealer code', function () {
          it('triggers device:unassigned if device has dealerCode', function (done) {
            this.device.set('dealerCode', '8888888888');
            this.customer.once('device:unassigned', done);
            this.$el.find('.delete-system').click();
          });

          it("doesn't trigger device:unassigned if device doesn't have dealerCode", function (done) {
            this.customer.once('device:unassigned', done.fail);
            this.$el.find('.delete-system').click();
            done();
          });
        });

        describe('with a tab that exists before the deleted tab', () =>
          it('triggers systemSelected for the tab before the deleted tab', function () {
            const thirdSystem = Factories.build('system');
            this.collection.reset([this.otherSystem, this.activeSystem, thirdSystem]); // active system is second

            this.$el.find('.delete-system').click(); // deletes the active system

            expect(this.triggerSpy.calledWith('systemSelected', this.otherSystem.id)).toBeTruthy();
          })
        );

        describe('without a tab that exists before the deleted tab', () =>
          it('triggers systemSelected for the tab after the deleted tab', function () {
            this.collection.reset([this.activeSystem, this.otherSystem]); // active system is first

            this.$el.find('.delete-system').click(); // deletes the active system

            expect(this.triggerSpy.calledWith('systemSelected', this.otherSystem.id)).toBeTruthy();
          })
        );

        describe("and it's the last system", () =>
          it('triggers lastSystemDeleted', function () {
            this.collection.reset([this.activeSystem]); // active system is first

            this.$el.find('.delete-system').click(); // deletes the active system

            expect(this.triggerSpy.calledWith('lastSystemDeleted')).toBeTruthy();
          })
        );
      });
    });
  });
});
