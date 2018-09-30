/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(function (require) {
  require('spec/spec_helper');
  const AlertView          = require('alerts/views/alert_view');
  const ALARM_DESCRIPTIONS = require('static_data/alarm_descriptions.yaml');

  describe('AlertView', function () {
    describe('render', function () {
      it('does not throw an error', function () {
        for (var key in ALARM_DESCRIPTIONS) {
          expect(() => new AlertView(ALARM_DESCRIPTIONS[key]).render()).not.toThrow();
        }
      });
    });

    describe('alert description layout', function () {
      beforeEach(function () {
        this.fakeAlertDetails = {
          alarm_description: 'Protection derating fault',
          alarm_id: 'sop.186.02',
          possible_cause: {
            causes:
              [{info: ['Off'], details: ['Turn on']}]
          },
          problem_description: ['Temp'],
          severity: 'Normal',
          short_text: 'MTP HD'
        };

        this.view = new AlertView(this.fakeAlertDetails).render();
      });

      it('displays an alert id', function () {
        expect(this.view.$('#alert-id').text()).toContain('sop.186.02');
      });

      it('displays "CL2." as "ERR "', function () {
        this.fakeAlertDetails.alarm_id = 'cl2.001.01';

        const view = new AlertView(this.fakeAlertDetails).render();

        expect(view.$('#alert-id').text()).toContain('err 001.01');
      });

      it('displays an alert name', function () {
        expect(this.view.$('#alert-name').text()).toContain('MTP HD');
      });

      it('displays the alarm type icon', function () {
        expect(this.view.$('#alarm-severity span').hasClass('normal'));
      });

      describe('when a problem description is provided', () =>
        it('displays the problem description', function () {
          expect(this.view.$('#problem-description').text()).toContain('Problem Description:');
          expect(this.view.$('#problem-description').text()).toContain('Temp');
        })
      );

      describe('when no problem description is provided', () =>
        it('does not display the problem description or title', function () {
          this.fakeAlertDetails.problem_description = null;
          this.view = new AlertView(this.fakeAlertDetails).render();

          expect(this.view.$('#problem-description').text()).not.toContain('Problem Description:');
          expect(this.view.$('#problem-description').text()).not.toContain('Temp');
        })
      );

      describe('when a possible cause is provided', () =>
        it('displays the possible cause', function () {
          expect(this.view.$('#alert-possible-causes').text()).toContain('Off');
        })
      );

      describe('when multiple possible causes are provided', () =>
        it('displays all provided causes', function () {
          const cause = {info: ['Gunk']};
          this.fakeAlertDetails.possible_cause.causes.push(cause);

          this.view = new AlertView(this.fakeAlertDetails).render();

          expect(this.view.$('#alert-possible-causes').text()).toContain('Off');
          expect(this.view.$('#alert-possible-causes').text()).toContain('Gunk');
        })
      );
    });
  });
});
