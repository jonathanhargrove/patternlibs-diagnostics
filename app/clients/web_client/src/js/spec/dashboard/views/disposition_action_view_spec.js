define(function (require) {
  require('spec/spec_helper');

  const DispositionActionView = require('dashboard/views/disposition_action_view');
  const Device = require('devices/models/device');

  describe('DispositionActionView', function () {
    beforeEach(function () {
      const device = new Device({
        deviceId: '12345678',
        dispositionAction: 'test',
        criticalAlerts: 0,
        majorAlerts: 0
      });

      this.deviceSpy = sinon.spy(device, 'save');

      this.view = new DispositionActionView({model: device}).render();

      this.view.$el.find('select').val('fake value').trigger('change');
    });

    describe('when a device has alerts', function () {
      it('does not allow the user to remove the system', function () {
        const device = new Device({deviceId: '12345678', criticalAlerts: 1});

        this.view = new DispositionActionView({model: device}).render();

        expect(this.view.$el.find('.remove').length).toBe(0);
      });
    });

    describe('when a device has no alerts but has a disposition action', function () {
      it('allows the user to remove the system from the list by clearing the disposition action', function () {
        expect(this.view.$el.find('.remove').length).toBe(1);
        expect(this.view.$el.find('.remove').text()).toBe('Remove');
      });
    });

    describe('Device#save', function () {
      it('invokes the save function on the model', function () {
        expect(this.deviceSpy.called).toBeTruthy();
      });

      describe('when save is successful', function () {
        it('shows a successful save message', function () {
          this.deviceSpy.getCall(0).args[1].success();

          expect(this.view.$el.find('.save-success').css('display')).not.toBe('none');
        });
      });

      describe('when save is unsuccessful', function () {
        it('shows an unsuccessful save message', function () {
          this.deviceSpy.getCall(0).args[1].error();

          expect(this.view.$el.find('.save-error').css('display')).not.toBe('none');
        });
      });

      it('will not trigger the model\'s sync event (helps prevent re-rendering of the view, which will cause issues)', function () {
        expect(this.deviceSpy.getCall(0).args[1].silent).toEqual(true);
      });
    });

    describe('#onRender', function () {
      describe('when a disposition action is null', function () {
        it('uses the blank string as the selected dropdown option', function () {
          const device = new Device({deviceId: '12345678', criticalAlerts: 1, dispositionAction: null});

          this.view = new DispositionActionView({model: device}).render();

          expect(this.view.$("select option[value='']").prop('selected')).toBeTruthy();
        });
      });

      describe('with a standard disposition action', function () {
        it('selects the specified standard disposition action option', function () {
          const device = new Device({deviceId: '12345678', dispositionAction: 'Resolved'});

          this.view = new DispositionActionView({model: device}).render();

          expect(this.view.$("select option[value='Resolved']").prop('selected')).toBeTruthy();
        });
      });

      describe('with a user entered disposition action', function () {
        beforeEach(function () {
          const device = new Device({deviceId: '12345678', dispositionAction: 'Custom Action'});

          this.view = new DispositionActionView({model: device}).render();
        });

        it('displays the user entered disposition action in the dropdown', function () {
          expect(this.view.$('select #user-entered-value').text()).toBe('Custom Action');
        });

        it('selects the user entered disposition action in the dropdown', function () {
          expect(this.view.$('select #user-entered-value').prop('selected')).toBeTruthy();
        });
      });
    });

    describe('when a new selection is made from the dropdown', function () {
      beforeEach(function () {
        const device = new Device({deviceId: '12345678', dispositionAction: 'Resolved'});

        this.saveSpy = sinon.spy(device, 'save');

        this.view = new DispositionActionView({model: device}).render();

        this.view.$el.find('select').val('Scheduled Repair').trigger('change');
      });

      it('sets the input value changes to the new selection', function () {
        expect(this.view.$("select option[value='Scheduled Repair']").prop('selected')).toBeTruthy();
      });

      it('saves the disposition action', function () {
        expect(this.saveSpy.called).toBeTruthy();
      });
    });

    describe('when a user types into the input field', function () {
      beforeEach(function () {
        const device = new Device({deviceId: '12345678', dispositionAction: 'Resolved'});

        this.saveSpy = sinon.spy(device, 'save');

        this.view = new DispositionActionView({model: device}).render();
      });

      it('sets the user entered value as the select\'s selected option', function () {
        const keyupEvent = $.Event('keyup');
        keyupEvent.keyCode = 4;

        this.view.$el.find('input').val('Ordered Parts').trigger(keyupEvent);

        expect(this.view.$("select option[value='Ordered Parts']").prop('selected')).toBeTruthy();
      });

      describe('pressing the enter key', function () {
        beforeEach(function () {
          this.keyupEvent = $.Event('keyup');
          this.keyupEvent.keyCode = 13;
        });

        describe('when the input matches the current disposition action', function () {
          it('does not save the disposition action', function () {
            this.view.$el.find('input').val('Resolved').trigger(this.keyupEvent);

            expect(this.saveSpy.called).toBe(false);
          });
        });

        describe('when the input does not match the current disposition action', function () {
          it('saves the disposition action', function () {
            this.view.$el.find('input').val('Custom Action').trigger(this.keyupEvent);

            expect(this.saveSpy.called).toBeTruthy();
          });
        });
      });
    });

    describe('when the user has the input field selected and clicks away', function () {
      it('saves the disposition action', function () {
        const device = new Device({deviceId: '12345678', dispositionAction: 'Resolved'});

        this.saveSpy = sinon.spy(device, 'save');

        this.view = new DispositionActionView({model: device}).render();

        this.view.$el.find('input').val('Custom Action').trigger('blur');

        expect(this.saveSpy.called).toBeTruthy();
      });
    });

    describe('when a user clicks away from the popped up dropdown then presses a key', function () {
      it('changes the focus to the input field and selects all', function () {
        const device = new Device({deviceId: '12345678', dispositionAction: 'Resolved'});

        this.view = new DispositionActionView({model: device}).render();

        $('body').append(this.view.$el);

        this.view.$el.find('select').focus().trigger('keydown');

        expect(document.getSelection().toString()).toBe('Resolved');

        this.view.$el.remove();
      });
    });
  });
});
