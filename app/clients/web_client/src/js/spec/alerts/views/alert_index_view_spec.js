/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(function (require) {
  require('spec/spec_helper');
  const AlertIndexView = require('alerts/views/alert_index_view');
  const ALARM_DESCRIPTIONS = require('static_data/alarm_descriptions.yaml');

  describe('AlertIndexView', function () {
    beforeEach(function () {
      const fakeAlertDetails = {
        'cfg.001.01': null,
        'cfg.001.02': null,
        'cfg.002.02': null,
        'cl2.001.01': null,
        'sop.001.01': null
      };

      this.view = new AlertIndexView({alertDetails: fakeAlertDetails}).render();
    });

    describe('when entering an alert code', function () {
      beforeEach(function () {
        this.triggerSpy = sinon.spy(this.view, 'trigger');
      });

      _.each(['err.001.01', 'err 001 01', 'err00101', 'ERR00101', 'err-001-01', 'err  00101'], testCase =>
        describe(`in the format ${testCase}`, () =>
          it("navigates to the code's show page", function () {
            this.view.$el.find('input').val(testCase);

            this.view.$el.find('button').click();

            expect(this.triggerSpy.calledWith('navigate', '/alerts/cl2.001.01')).toBeTruthy();
          })
        )
      );
    });

    it('allows the user to skip to a category on the page', function () {
      const $shortcut = this.view.$('.category-shortcut');

      expect($shortcut.html()).toContain('CFG');
      expect($shortcut.attr('href')).toContain('#CFG');
    });

    it('displays the categories', function () {
      const $categoryCodes = this.view.$('.category-code');

      expect($categoryCodes.length).toBe(3);
      expect($categoryCodes.first().text()).toContain('CFG');
      expect($categoryCodes.last().text()).toContain('SOP');
    });

    it('displays the category names', function () {
      const $categoryCodes = this.view.$('.category-header');

      expect($categoryCodes.length).toBe(3);
      expect($categoryCodes.first().text()).toContain('(Configuration Errors)');
      expect($categoryCodes.last().text()).toContain('(Sensor Faults)');
    });

    it('displays the sections', function () {
      const $sectionNames = this.view.$('#CFG .section-name');

      expect($sectionNames.length).toBe(2);
      expect($sectionNames.first().text()).toContain('01');
      expect($sectionNames.last().text()).toContain('02');
    });

    it('displays the subsections', function () {
      const $subsections = this.view.$('#CFG .section:first .subsection');

      expect($subsections.length).toBe(2);
      expect($subsections.first().text().trim()).toBe('CFG.001.01');
      expect($subsections.last().text().trim()).toBe('CFG.001.02');
    });

    it('display codes "CL2." as "ERR "', function () {
      const $categoryShortcut = $(this.view.$('.category-shortcut')[1]);
      const $categoryCode = $(this.view.$('.category-header')[1]);
      const $subsectionName = this.view.$('#ERR .section:first .subsection').first();

      expect($categoryShortcut.text()).toContain('ERR');
      expect($categoryCode.text()).toContain('ERR');
      expect($categoryCode.text()).toContain('(Communicating Units)');
      expect($subsectionName.text().trim()).toBe('ERR 001.01');
      expect($subsectionName.attr('href')).toBe('/alerts/CL2.001.01');
    });

    it('excludes certain sections', function () {
      this.view = new AlertIndexView({alertDetails: ALARM_DESCRIPTIONS}).render();

      const $subsections = this.view.$('.section .subsection');

      expect($subsections.text().match(/NDM.*/i)).toBeNull();
      expect($subsections.text().match(/NDA\.002\.01/i)).toBeNull();
    });
  });
});
