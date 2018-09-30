define(function (require) {
  require('spec/spec_helper');
  const SysComponent = require('sys_components/models/sys_component');
  const moment    = require('moment');

  describe('SysComponent', function () {
    beforeEach(function () {
      this.deviceId     = '014001A8';
      this.sysComponent = new SysComponent({deviceId: this.deviceId});
    });

    describe('#url', function () {
      describe('for a new component', function () {
        beforeEach(function () {
          this.sysComponent.id = undefined;
        });

        it('is correct', function () {
          expect(this.sysComponent.url()).toBe(`/api/devices/${this.deviceId}/system_components`);
        });
      });

      describe('for an existing component', function () {
        beforeEach(function () {
          this.sysComponent.id = 120384;
        });

        it('is correct', function () {
          expect(this.sysComponent.url()).toBe(`/api/devices/${this.deviceId}/system_components/120384`);
        });
      });
    });

    describe('#parse', function () {
      beforeEach(function () {
        this.now = Date.now() / 1000;
        this.data = this.sysComponent.parse({timestamp: this.now, timeZone: 'America/Denver'});
      });

      it('parses the timezone as a moment object', function () {
        expect(moment.isMoment(this.data.timestamp)).toBeTruthy();
      });
    });

    describe('#isEditing', function () {
      describe('for a communicating component', function () {
        beforeEach(function () {
          this.sysComponent.set('communicating', true);
        });

        it('is always false', function () {
          this.sysComponent.startEditing();
          expect(this.sysComponent.isEditing()).toBeFalsy();
        });
      });

      describe('for a non-communicating component', function () {
        beforeEach(function () {
          this.sysComponent.set('communicating', false);
        });

        describe('that is new', () =>
          it('defaults to true', function () {
            expect(this.sysComponent.isEditing()).toBeTruthy();
          })
        );

        describe('that is not new', function () {
          beforeEach(function () {
            this.sysComponent.id = 12348;
          });

          it('defaults to false', function () {
            expect(this.sysComponent.isEditing()).toBeFalsy();
          });

          describe('once editing is started', function () {
            beforeEach(function () {
              this.sysComponent.startEditing();
            });

            it('becomes true', function () {
              expect(this.sysComponent.isEditing()).toBeTruthy();
            });

            describe('and then stopped', function () {
              beforeEach(function () {
                this.sysComponent.stopEditing();
              });

              it('becomes false again', function () {
                expect(this.sysComponent.isEditing()).toBeFalsy();
              });
            });
          });
        });
      });
    });
  });
});
