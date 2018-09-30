require('spec/spec_helper');
const SystemComponentItemView = require('sys_components/views/system_component_item_view');
const SysComponent = require('sys_components/models/sys_component');
const MediaQueryListener = require('utils/media_query_listener');
const sinon = require('sinon');
const $ = require('jquery');
const _ = require('underscore');

describe('SystemComponentItemView', function () {
  beforeEach(function () {
    this.xhr = sinon.useFakeXMLHttpRequest();
    this.requests = [];
    this.xhr.onCreate = xhr => {
      this.requests.push(xhr);
    };

    this.deviceId = '01400184';
    this.matchMediaStub = sinon.stub(MediaQueryListener.prototype, 'match');
    this.model = new SysComponent({deviceId: this.deviceId});
    this.view  = new SystemComponentItemView({model: this.model});
  });

  afterEach(function () {
    this.matchMediaStub.restore();
  });

  afterEach(function () {
    this.xhr.restore();
  });

  describe('for a communicating component', function () {
    beforeEach(function () {
      this.model.set('communicating', true);
      this.view.render();
    });

    it('shows communicating status', function () {
      expect(this.view.$el.find('.connection-status.desktop-content').length).toBe(1);
      expect(this.view.$el.find('.mobile-content', 'span.connection-status').length).toBe(1);
    });

    it('does not allow editing', function () {
      expect(this.view.$el.find('.update').length).toBe(0);
      expect(this.view.$el.find('input').length).toBe(0);
    });

    it('does not render battery level by default', function () {
      expect(this.view.$el.find('.battery-level').length).toBe(0);
    });

    describe('that has batteryLevel defined', function () {
      beforeEach(function () {
        this.model.set('batteryLevel', 45);
      });

      describe('when the component is connected', function () {
        beforeEach(function () {
          this.model.set('isConnected', true);
          this.view.render();
        });

        it('renders a battery-level span within the connection-status', function () {
          expect(this.view.$el.find('div.connection-status > .battery-level').length).toBe(1);
          expect(this.view.$el.find('div.field-value > .battery-level').length).toBe(1);
        });
      });

      describe('when the component is NOT connected', function () {
        beforeEach(function () {
          this.model.set('isConnected', false);
          this.view.render();
        });

        it('does not render a battery-level span within the connection-status', function () {
          expect(this.view.$el.find('td.connection-status > span.battery-level').length).toBe(0);
        });
      });
    });
  });

  describe('for a non-communicating component', function () {
    beforeEach(function () {
      this.model.set('communicating', undefined);
    });

    describe('that is new', function () {
      beforeEach(function () {
        this.model.id = undefined;
      });

      describe('#render', function () {
        beforeEach(function () {
          this.view.render();
        });

        it('allows editing on the component', function () {
          expect(this.view.$el.find('.desktop-content > input[type=text]').length).toBe(4);
          expect(this.view.$el.find('.mobile-content input').length).toBe(4);
        });

        it('renders a save button', function () {
          expect(this.view.$el.find('.desktop-content > .save').length).toBe(1);
          expect(this.view.$el.find('.mobile-content', '.save-buttons .save').length).toBe(1);
        });

        it('renders a cancel button', function () {
          expect(this.view.$el.find('.desktop-content > .cancel').length).toBe(1);
          expect(this.view.$el.find('.mobile-content', '.save-buttons .cancel').length).toBe(1);
        });
      });

      describe('that is rendered', function () {
        beforeEach(function () {
          this.viewTriggerSpy  = sinon.spy(this.view, 'trigger');
          this.removeSpy       = sinon.spy(this.view, 'remove');

          this.view.render();
        });

        describe('that is read-only', function () {
          beforeEach(function () {
            this.view.readOnly = true;
            this.alertSpy = sinon.spy(window, 'alert');
          });

          afterEach(function () {
            this.alertSpy.restore();
          });

          describe('when the save button is clicked', function () {
            beforeEach(function () {
              this.modelEditingSpy = sinon.spy(this.model, 'stopEditing');

              const $save = this.view.$el.find('.save');
              $save.click();
            });

            it('displays an alert', function () {
              expect(this.alertSpy.called).toBeTruthy();
            });
          });
        });

        describe('that is not read-only', function () {
          beforeEach(function () {
            this.view.readOnly = false;
          });

          describe('when the save button is clicked', function () {
            beforeEach(function () {
              this.modelEditingSpy = sinon.spy(this.model, 'stopEditing');

              const $save = this.view.$el.find('.save');
              $save.click();
            });

            it('displays a spinner', function () {
              expect(this.view.$el.find('.spinner.icon-spinner')).toBeTruthy();
            });

            it('saves the model', function () {
              expect(this.requests.length).toBe(2);
              expect(this.requests[0].url).toBe(`/api/devices/${this.deviceId}/system_components`);
            });

            describe('when the save is successful', function () {
              beforeEach(function () {
                this.requests[0].respond(200, {'Content-Type': 'application/json'}, JSON.stringify({id: 12}));
              });

              it("turns off the model's editability", function () {
                expect(this.modelEditingSpy.called).toBeTruthy();
              });

              it('triggers the created event with the model', function () {
                expect(this.viewTriggerSpy.calledWith('created', this.model)).toBeTruthy();
              });
            });

            describe('when there is an error', function () {
              beforeEach(function () {
                this.requests[0].respond(400, {'Content-Type': 'application/json'},
                  JSON.stringify({modelNumber: [{name: 'Model Number must be present'}]}));
              });

              it('wraps every input in a div', function () {
                _(this.view.$el.find('input').parent()).each(e => expect(e.tagName).toBe('DIV'));
              });

              it('applies the errors class to the parent div of the field with an error', function () {
                const $parent = this.view.$el.find('input[name=modelNumber]').parent();
                expect($parent.hasClass('errors')).toBeTruthy();
              });

              it('appends the error message to the parent div', function () {
                const siblings = $(this.view.$el.find('input[name=modelNumber]').siblings()[0]).html();
                expect(siblings)
                  .toBe('Model Number must be present');
              });
            });
          });
        });

        describe('when the cancel button is clicked', function () {
          beforeEach(function () {
            this.view.$el.find('.cancel').click();
          });

          it('removes the view', function () {
            expect(this.removeSpy.called).toBeTruthy();
          });

          it('triggers the removeComponent event with the model', function () {
            expect(this.viewTriggerSpy.calledWith('removeComponent', this.model)).toBeTruthy();
          });
        });
      });
    });

    describe('that is not new', function () {
      beforeEach(function () {
        this.model.id = 120384;
      });

      describe('#render', function () {
        beforeEach(function () {
          this.view.render();
        });

        it('does not allow editing on the component', function () {
          expect(this.model.isEditing()).toBeFalsy();
          expect(this.view.$el.find('input').length).toBe(0);
        });

        it('renders an update button', function () {
          expect(this.view.$el.find('.desktop-content > .update').length).toBe(1);
          expect(this.view.$el.find('.mobile-content', '.edit-buttons .update').length).toBe(1);
        });

        it('renders a delete button', function () {
          expect(this.view.$el.find('.desktop-content > .delete').length).toBe(1);
          expect(this.view.$el.find('.mobile-content', '.edit-buttons .delete').length).toBe(1);
        });
      });

      describe('that is rendered', function () {
        beforeEach(function () {
          this.view.render();
          this.triggerSpy = sinon.spy(this.view, 'trigger');
        });

        describe('when the update button is clicked', function () {
          beforeEach(function () {
            this.view.$el.find('.update').click();
          });

          it('marks the model as being editable', function () {
            expect(this.model.isEditing()).toBeTruthy();
          });

          it('shows edit fields for the model', function () {
            expect(this.view.$el.find('input').length).toBe(8);
          });

          it('shows a save button', function () {
            expect(this.view.$el.find('button.save').length).toBe(2);
          });

          it('shows a cancel button', function () {
            expect(this.view.$el.find('button.cancel').length).toBe(2);
          });

          describe('and then the cancel button is clicked', function () {
            beforeEach(function () {
              this.modelField = this.view.$el.find('input[name=modelNumber]');
              this.original   = this.modelField.val();
              this.modelField.val(this.newVal = 'potato');

              this.view.$el.find('.cancel').click();
            });

            it('stops showing the input form', function () {
              expect(this.view.$el.find('input').length).toBe(0);
            });

            it('resets the display to the original values', function () {
              expect(this.view.$el.find('.model-number').html()).toBe(this.original);
            });
          });

          describe('and then the save button is clicked', function () {
            beforeEach(function () {
              this.view.$el.find('.save').click();
            });

            it('saves the model', function () {
              expect(this.requests.length).toBe(2);
              expect(this.requests[0].url).toBe(`/api/devices/${this.deviceId}/system_components/${this.model.id}`);
            });

            describe('when the save is successful', function () {
              beforeEach(function () {
                expect(this.requests.length).toBe(2);
                this.requests[0].respond(200, {'Content-Type': 'application/json'},
                  JSON.stringify({id: this.model.id}));
              });

              it('stops editing the model', function () {
                expect(this.model.isEditing()).toBeFalsy();
              });

              it('does not trigger the created event', function () {
                expect(this.triggerSpy.called).toBeFalsy();
              });
            });

            describe('when the save is unsucessful', () => xit('does something...'));
          });
        });

        describe('that is read-only', function () {
          beforeEach(function () {
            this.view.readOnly = true;
            this.alertSpy = sinon.spy(window, 'alert');
          });

          afterEach(function () {
            this.alertSpy.restore();
          });

          describe('when the delete button is clicked', function () {
            beforeEach(function () {
              this.destroySpy = sinon.spy(this.model, 'destroy');
              this.view.$el.find('.delete').click();
            });

            it('displays an alert', function () {
              expect(this.alertSpy.called).toBeTruthy();
            });
          });
        });

        describe('that is not read-only', function () {
          beforeEach(function () {
            this.view.readOnly = false;
          });

          describe('when the delete button is clicked', function () {
            beforeEach(function () {
              this.destroySpy = sinon.spy(this.model, 'destroy');
              this.view.$el.find('.delete').click();
            });

            it('destroys the model', function () {
              expect(this.destroySpy.called).toBeTruthy();
            });
          });
        });
      });
    });
  });
});
