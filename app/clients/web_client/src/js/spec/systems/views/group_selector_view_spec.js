/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(function (require) {
  require('spec/spec_helper');
  require('template_helpers');
  require('sinon');

  const Factories = require('spec/_support/factories');

  const GroupSelectorView = require('systems/views/group_selector_view');

  describe('GroupSelectorView', function () {
    beforeEach(function () {
      const system1 = Factories.build('system', {group: 'group 1'});
      const system2 = Factories.build('system', {group: 'group 2'});

      this.groupSelector = new GroupSelectorView({
        system: system1,
        systems: [system1, system2]});

      this.$el = this.groupSelector.render().$el;
    });

    _.each([
      { case: "isn't selected", selected: false, action: 'hides', expectHidden: 'toBeTruthy' },
      { case: 'is selected',    selected: true,  action: 'shows', expectHidden: 'toBeFalsy' }
    ], testCase =>
      describe(`when the 'create new group' option ${testCase.case}`, () =>
        it(`${testCase.action} the new group name text field`, function () {
          this.$el.find('#new-group-option').prop('selected', testCase.selected);

          this.$el.find('#group-selector').change();

          expect(this.$el.find('.new-group').hasClass('hidden'))[testCase.expectHidden]();
        })
      )
    );

    describe('#render', function () {
      it('displays a list of existing groups', function () {
        expect(this.$el.find('#group-selector option[value="group 1"]').length).toBeTruthy();
        expect(this.$el.find('#group-selector option[value="group 2"]').length).toBeTruthy();
      });

      it("pre-selects the current system's group", function () {
        expect(this.$el.find('#group-selector').val()).toBe('group 1');
      });

      describe('with some existing groups', () =>
        it("shows the 'existing group' option group", function () {
          expect(this.$el.find('#group-selector optgroup[label="Existing Groups"]').length).toBeTruthy();
        })
      );

      describe('without any existing groups', () =>
        it("hides the 'existing group' option group", function () {
          const system = Factories.build('system');

          this.$el = new GroupSelectorView({system, systems: [system]}).render().$el;

          expect(this.$el.find('#group-selector optgroup[label="Existing Groups"]').length).toBeFalsy();
        })
      );
    });

    describe('isDirty', function () {
      describe('with the same original group selected', () =>
        it('returns false', function () {
          this.$el.find('#group-selector').val('group 1');

          expect(this.groupSelector.isDirty()).toBeFalsy();
        })
      );

      describe('with a different group selected', () =>
        it('returns true', function () {
          this.$el.find('#group-selector').val('group 2');

          expect(this.groupSelector.isDirty()).toBeTruthy();
        })
      );

      describe('with a new group specified', () =>
        it('returns true', function () {
          this.$el.find('#new-group-option').prop('selected', true);

          expect(this.groupSelector.isDirty()).toBeTruthy();
        })
      );
    });

    describe('#selectedGroup', function () {
      describe('with apostrophes in the group name', () =>
        it('strips out the apostrophes', function () {
          this.$el.find('#new-group-option').prop('selected', true);
          this.$el.find('#new-group').val("'group with apostrophes'");

          expect(this.groupSelector.selectedGroup()).toBe('group with apostrophes');
        })
      );

      describe('with an existing group selected', () =>
        it('returns the existing group', function () {
          this.$el.find('#group-selector').val('group 2');

          expect(this.groupSelector.selectedGroup()).toBe('group 2');
        })
      );

      describe('with a new group selected', () =>
        it('returns the new group', function () {
          this.$el.find('#new-group-option').prop('selected', true);
          this.$el.find('#new-group').val('new group');

          expect(this.groupSelector.selectedGroup()).toBe('new group');
        })
      );

      describe('with a new group name entered, but an existing group selected', () =>
        it("doesn't use the new group name", function () {
          this.$el.find('#group-selector').val('group 1');
          this.$el.find('#new-group').val('new group');

          expect(this.groupSelector.selectedGroup()).toBe('group 1');
        })
      );
    });
  });
});
