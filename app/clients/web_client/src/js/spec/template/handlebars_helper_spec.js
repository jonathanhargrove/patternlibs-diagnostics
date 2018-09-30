define(function (require) {
  require('spec/spec_helper');
  const HandlebarsHelpers = require('template_helpers');
  const DateTimeFormatter = require('utils/date_time_formatter');
  const moment            = require('moment');

  describe('HandlebarsHelpers', function () {
    beforeEach(function () {
      this.helpers = new HandlebarsHelpers();
    });

    describe('customerDeviceModel', function () {
      beforeEach(function () {
        this.model824 = '824';
        this.zoning = false;
      });

      it('returns device model number unless deviceModel is missing', function () {
        const noModel = null;

        expect(this.helpers.customerDeviceModel(noModel, this.zoning)).toBe('');
        expect(this.helpers.customerDeviceModel(this.model824, this.zoning)).toBe('824');
      });

      it('returns zoning info for any model except 824 or 850', function () {
        const model850 = '850';
        const model1050 = '1050';

        expect(this.helpers.customerDeviceModel(this.model824, this.zoning)).not.toContain('Non-zoned');
        expect(this.helpers.customerDeviceModel(model850, this.zoning)).not.toContain('Non-zoned');
        expect(this.helpers.customerDeviceModel(model1050, this.zoning)).toContain('Non-zoned');
      });
    });

    describe('momentToUriComponent', function () {
      beforeEach(function () {
        this.sampleMoment = moment('2016-11-22 15:24:03Z');
      });

      it('encodes the moment as a uri component', function () {
        const encodedString = '2016-11-22%2010%3A24%3A03';
        const timeZone = 'America/New_York';
        expect(this.helpers.momentToUriComponent(this.sampleMoment, timeZone)).toBe(encodedString);
      });
    });

    describe('streetAddress', () =>
      it('formats to accomodate missing values', function () {
        const specData = {
          // expected result          input
          '902 Pearl St.': { address1: '902 Pearl St.' },
          '902 Pearl St., Unit #5': { address1: '902 Pearl St.', address2: 'Unit #5' },
          '': {address1: '', address2: ''}
        };
        for (let expectedResult in specData) {
          const model = specData[expectedResult];
          const formatted = this.helpers.streetAddress(model);
          expect(formatted).toBe(expectedResult);
        }
      })
    );

    describe('cityStateZip', () =>
      it('formats to accomodate missing values if provided', function () {
        const specData = {
          // expected result     input
          '80305': { zip: '80305' },
          'Boulder, CO 80304': { city: 'Boulder', state: 'CO', zip: '80304' },
          '': {city: '', state: '', zip: ''}
        };
        for (let expectedResult in specData) {
          const model = specData[expectedResult];
          const formatted = this.helpers.cityStateZip(model);
          expect(formatted).toBe(expectedResult);
        }
      })
    );

    describe('phoneNumber', () =>
      it('returns a familiar format if provided', function () {
        const specData = {
          // result           input
          '(303) 555-1212': '3035551212',
          '': ''
        };
        for (let expectedResult in specData) {
          const input = specData[expectedResult];
          const formatted = this.helpers.phoneNumber(input);
          expect(formatted).toBe(expectedResult);
        }
      })
    );

    describe('fullName', () =>
      it('joins the firstName and lastName fields', function () {
        const specData = {
          // result            input
          'Bob Smith': { firstName: 'Bob', lastName: 'Smith' },
          'Tom Jones': { firstName: 'Tom', lastName: 'Jones' },
          '[No name given]': { firstName: '', lastName: '' }
        };
        for (let expectedResult in specData) {
          const input = specData[expectedResult];
          const formatted = this.helpers.fullName(input);
          expect(formatted).toBe(expectedResult);
        }
      })
    );

    describe('formAction', function () {
      describe('with a new model', () =>
        it('returns "Add"', function () {
          const model = { id: null };
          expect(this.helpers.formAction(model)).toBe('Add');
        })
      );

      describe('with an existing model', () =>
        it('returns "Edit"', function () {
          const model = { id: 1 };
          expect(this.helpers.formAction(model)).toBe('Edit');
        })
      );
    });

    describe('nullText', function () {
      describe('with a null value', () =>
        it('returns the null text', function () {
          expect(this.helpers.nullText(null, '-')).toBe('-');
        })
      );

      describe('with a null value and no null text', () =>
        it('returns the defualt null text "--"', function () {
          expect(this.helpers.nullText(null)).toBe('--');
        })
      );

      describe('with a non-null value', () =>
        it('returns the value', function () {
          expect(this.helpers.nullText('val', '-')).toBe('val');
        })
      );
    });

    describe('boolText', function () {
      describe('with the value true', () =>
        it('returns the positive text', function () {
          expect(this.helpers.boolText(true, 'yes', 'no', 'unknown')).toBe('yes');
        })
      );

      describe('with the value false', () =>
        it('returns the negative text', function () {
          expect(this.helpers.boolText(false, 'yes', 'no', 'unknown')).toBe('no');
        })
      );

      describe('with a null value', () =>
        it('returns the null text', function () {
          expect(this.helpers.boolText(null, 'yes', 'no', 'unknown')).toBe('unknown');
        })
      );

      describe('with a non null and non bool value', () =>
        it('throws an error', function () {
          expect(() => this.helpers.boolText('notBoolOrNull')).toThrow();
        })
      );
    });

    describe('damperAngle', () =>
      it('converts to a percent of 90-degrees', function () {
        const specData = {
          // expected input
          '0deg': {damper: 100},
          '45deg': {damper: 50},
          '90deg': {damper: 0}
        };
        for (let expected in specData) {
          const damperFlowPercent = specData[expected];
          expect(this.helpers.damperAngle(damperFlowPercent.damper)).toBe(`${expected}`);
        }
      })
    );

    describe('downcase', () =>
      it('converts a string to lowercase', function () {
        expect(this.helpers.downcase('Hi')).toBe('hi');
      })
    );

    describe('tempColor', function () {
      describe('without a value', () =>
        it('returns nothing', function () {
          expect(this.helpers.tempColor(' ')).toBeUndefined();
        })
      );

      describe('with temperature at or below 65 degrees', () =>
        it('returns "cool"', function () {
          expect(this.helpers.tempColor('65.0')).toBe('cool');
          expect(this.helpers.tempColor('64.0')).toBe('cool');
        })
      );

      describe('with temperature above 65 degrees', () =>
        it('returns "hot"', function () {
          expect(this.helpers.tempColor('66.0')).toBe('hot');
        })
      );
    });

    describe('degrees', function () {
      describe('without a value', () =>
        it('returns "--"', function () {
          expect(this.helpers.degrees('')).toBe('--');
        })
      );

      describe('with a value', () =>
        it('returns the number in degrees format', function () {
          expect(this.helpers.degrees('90', 1)).toBe('90.0°');
        })
      );
    });

    describe('posNegColor', function () {
      describe('without a value', () =>
        it('returns nothing', function () {
          expect(this.helpers.posNegColor('')).toBe(undefined);
          expect(this.helpers.posNegColor(undefined)).toBe(undefined);
          expect(this.helpers.posNegColor(null)).toBe(undefined);
        })
      );

      describe('with a value', function () {
        describe('that\'s true', () =>
          it('returns positive', function () {
            expect(this.helpers.posNegColor(true)).toBe('positive');
          })
        );
        describe('that\'s false', () =>
          it('returns negative', function () {
            expect(this.helpers.posNegColor(false)).toBe('negative');
          })
        );

        describe('that\'s enabled or installed', () =>
          it('returns positive', function () {
            expect(this.helpers.posNegColor('enabled')).toBe('positive');
            expect(this.helpers.posNegColor('installed')).toBe('positive');
            expect(this.helpers.posNegColor('ENABLED')).toBe('positive');
            expect(this.helpers.posNegColor('INSTALLED')).toBe('positive');
          })
        );

        describe('that\'s disbaled or not installed', () =>
          it('returns negative', function () {
            expect(this.helpers.posNegColor('disabled')).toBe('negative');
            expect(this.helpers.posNegColor('not_installed')).toBe('negative');
            expect(this.helpers.posNegColor('DISABLED')).toBe('negative');
            expect(this.helpers.posNegColor('NOT_INSTALLED')).toBe('negative');
          })
        );
      });
    });

    describe('alarmIcon', function () {
      describe('with serverity level', function () {
        describe('"critical"', () =>
          it('returns icon-warning-sign', function () {
            expect(this.helpers.alarmIcon('critical')).toBe('icon-warning-sign');
          })
        );

        describe('"major"', () =>
          it('returns icon-notification', function () {
            expect(this.helpers.alarmIcon('major')).toBe('icon-notification');
          })
        );

        describe('"normal"', () =>
          it('returns icon-warning2', function () {
            expect(this.helpers.alarmIcon('normal')).toBe('icon-warning2');
          })
        );
      });

      describe('with an invalid severity level', () =>
        it('raises an error', function () {
          expect(() => this.helpers.alarmIcon('invalid')).toThrow();
        })
      );
    });

    describe('pluralize', function () {
      describe('with a count of 1', () =>
        it('doesn\'t pluralize the noun', function () {
          expect(this.helpers.pluralize(1, 'dog')).toBe('dog');
        })
      );

      describe('with a count of anyting but 1', () =>
        it('pluralizes the noun', function () {
          expect(this.helpers.pluralize(0, 'dog')).toBe('dogs');
          expect(this.helpers.pluralize(2, 'dog')).toBe('dogs');
        })
      );
    });

    describe('upperCase', () =>
      it('uppercases the whole string', function () {
        expect(this.helpers.upperCase('test')).toBe('TEST');
      })
    );

    describe('titleCase', () =>
      it('title-cases a word phrase', function () {
        expect(this.helpers.titleCase('title case me')).toBe('Title Case Me');
      })
    );

    describe('constToTitleCase', () =>
      it('title-cases a word phrase', function () {
        expect(this.helpers.constToTitleCase('TITLE_CASE_ME_1')).toBe('Title Case Me 1');
      })
    );

    describe('replace', () =>
      it('performs a string replace operation', function () {
        expect(this.helpers.replace('HEATING_COMPRESSOR', '_', ' ')).toBe('HEATING COMPRESSOR');
        expect(this.helpers.replace('HEATING_COMPRESSOR_LOCKOUT', '_', ' ')).toBe('HEATING COMPRESSOR LOCKOUT');
      })
    );

    describe('ifEqual', function () {
      describe('with a "false" value comparison', () =>
        it('returns nothing', function () {
          expect(this.helpers.ifEqual('foo', 'bar', 'returnValue', '')).toBe('');
        })
      );

      describe('with a "true" value comparison', () =>
        it('returns nothing', function () {
          expect(this.helpers.ifEqual('foo', 'foo', 'returnValue')).toBe('returnValue');
        })
      );
    });

    describe('selectedAlerts', function () {
      describe('when no alerts are selected', () =>
        it("returns 'None'", function () {
          const noAlertObj = { majorAlerts: false, criticalAlerts: false, betaAlerts: false };
          expect(this.helpers.selectedAlerts(noAlertObj)).toBe('None');
        })
      );
      describe('when major alerts are selected', () =>
        it("returns 'Major'", function () {
          const noAlertObj = { majorAlerts: true, criticalAlerts: false, betaAlerts: false };
          expect(this.helpers.selectedAlerts(noAlertObj)).toBe('Major');
        })
      );
      describe('when critical alerts are selected', () =>
        it("returns 'Critical'", function () {
          const noAlertObj = { majorAlerts: false, criticalAlerts: true, betaAlerts: false };
          expect(this.helpers.selectedAlerts(noAlertObj)).toBe('Critical');
        })
      );
      describe('when beta alerts are selected', () =>
        it("returns 'Beta'", function () {
          const noAlertObj = { majorAlerts: false, criticalAlerts: false, betaAlerts: true };
          expect(this.helpers.selectedAlerts(noAlertObj)).toBe('Beta');
        })
      );
      describe('when both critical, major and beta alerts are selected', () =>
        it("returns 'Major, Critical, Beta'", function () {
          const noAlertObj = { majorAlerts: true, criticalAlerts: true, betaAlerts: true };
          expect(this.helpers.selectedAlerts(noAlertObj)).toBe('Major, Critical, Beta');
        })
      );
    });

    it('includes DateTimeFormatter helper functions', function () {
      _.each(DateTimeFormatter.prototype, (_, propName) => {
        expect(this.helpers[propName]).toBeDefined();
      });
    });

    describe('#displayStage', function () {
      describe('when operatingStage is 0', () =>
        it("returns 'idle'", function () {
          const stageValue = this.helpers.displayStage('anything', 0);
          expect(stageValue).toEqual('idle');
        })
      );

      describe('when operatingStage is > 0', function () {
        beforeEach(function () {
          this.compressorCapacity = 43;
          this.operatingStage = 2;
        });

        describe('for a heating stage', function () {
          beforeEach(function () {
            this.operatingStatus = 'SYSTEM_HEATING';
          });

          it('returns a friendly name', function () {
            const stageValue = this.helpers.displayStage(this.operatingStatus, this.operatingStage);
            expect(stageValue).toEqual(`HTG STG ${this.operatingStage}`);
          });
        });

        describe('for a cooling stage', function () {
          beforeEach(function () {
            this.operatingStatus = 'SYSTEM_COOLING';
          });

          it('returns a friendly name', function () {
            const stageValue = this.helpers.displayStage(this.operatingStatus, this.operatingStage);
            expect(stageValue).toEqual(`CLG STG ${this.operatingStage}`);
          });
        });
      });
    });

    describe('friendlyName', function () {
      it('maps const values to friendly names', function () {
        expect(this.helpers.friendlyName('VARIABLE')).toBe('VS');

        expect(this.helpers.friendlyName('COOLING_ONLY')).toBe('Clg Only');
        expect(this.helpers.friendlyName('HEAT_PUMP')).toBe('HP');

        expect(this.helpers.friendlyName('SINGLE_COMPRESSOR_ONE_STAGE')).toBe('1 Stg');
        expect(this.helpers.friendlyName('SINGLE_COMPRESSOR_TWO_STAGE')).toBe('1 Comp, 2 Stg');
        expect(this.helpers.friendlyName('TWO_COMPRESSOR_TWO_STAGE')).toBe('2 Comp, 2 Stg');
        expect(this.helpers.friendlyName('VARIABLE_SPEED_COMPRESSOR')).toBe('VS');

        expect(this.helpers.friendlyName('GAS_OIL')).toBe('Fossil');
        expect(this.helpers.friendlyName('ELECTRIC')).toBe('Elect');
        expect(this.helpers.friendlyName('HYDRONIC')).toBe('Hydro');

        expect(this.helpers.friendlyName('SINGLE_STAGE')).toBe('1');
        expect(this.helpers.friendlyName('TWO_STAGE')).toBe('2');
        expect(this.helpers.friendlyName('THREE_STAGE')).toBe('3');

        expect(this.helpers.friendlyName('VARIABLE_SPEED')).toBe('VS');
        expect(this.helpers.friendlyName('NON_VARIABLE_SPEED')).toBe('Non-VS');

        expect(this.helpers.friendlyName('SYSTEM_HEATING')).toBe('HTG');
        expect(this.helpers.friendlyName('SYSTEM_COOLING')).toBe('CLG');

        expect(this.helpers.friendlyName('ELECTRONIC_FILTER')).toBe('EAC');
        expect(this.helpers.friendlyName('COMM_AIR_CLEANER_DISCOVERED')).toBe('COMM EAC');
      });

      describe('without a friendlyName mapping', () =>
        it('passes the name to the replace function', function () {
          const replaceSpy = sinon.spy(this.helpers, 'replace');
          const friendlyName = 'FRIENDLY_NAME';
          this.helpers.friendlyName('FRIENDLY_NAME');

          expect(replaceSpy.calledWith(friendlyName)).toBeTruthy();
        })
      );
    });

    describe('friendlySystemConfig', () =>
      it('maps const values to friendly names', function () {
        expect(this.helpers.friendlySystemConfig('indoor_unit')).toBe('Indoor Unit');
        expect(this.helpers.friendlySystemConfig('walrus_party')).toBe('Walrus Party');
        expect(this.helpers.friendlySystemConfig(null)).toBe('--');
      })
    );
  });
});
