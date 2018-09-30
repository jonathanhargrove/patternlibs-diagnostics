define(function (require) {
  require('spec/spec_helper');
  const Session = require('root/models/session');
  const RestrictionsManagerView = require('restrictions/views/restrictions_manager_view');

  require('sinon');

  describe('RestrictionsManagerView', function () {
    beforeEach(function () {
      this.ndmCode = 'ndm';

      this.session = new Session();
      this.view = new RestrictionsManagerView({model: this.session});
      this.view.render();
    });

    describe('initial render', () =>
      it('renders a form to input feature codes', function () {
        expect(this.view.$el.find('form').length).toBeTruthy();
      })
    );

    describe('render with a feature enabled', function () {
      beforeEach(function () {
        this.session.set({enabledFeatures: [this.ndmCode]});
        this.view.render();
      });

      it('renders enabled features', function () {
        expect(this.view.$el.find('li:contains(ndm)').length).toBeTruthy();
      });
    });

    describe('feature code submission', function () {
      beforeEach(function () {
        this.server = sinon.fakeServer.create();
      });

      afterEach(function () {
        this.server.restore();
      });

      describe('with a valid code', function () {
        beforeEach(function () {
          this.server.respondWith([200, { 'Content-Type': 'application/json' }, `{"enabledFeatures": ["${this.ndmCode}"]}`]);
          this.view.$el.find('input[name=featureCode]').val(this.ndmCode);
          this.view.$el.find('form').submit();

          this.server.respond();
        });

        it('enables the feature in the RestrictionsManager', function () {
          expect(this.session.featureEnabled(this.ndmCode)).toBe(true);
        });

        it('renders a success message', function () {
          expect(this.view.$el.find(':contains(Feature added successfully)').length).toBeTruthy();
        });

        it('renders the enabled feature', function () {
          expect(this.view.$el.find('li:contains(ndm)').length).toBeTruthy();
        });
      });

      describe('with an invalid code', function () {
        beforeEach(function () {
          this.errorMessage = 'Invalid Feature Code';
          this.server.respondWith([400, { 'Content-Type': 'application/json' }, `{"base": [{ "name": "${this.errorMessage}" }]}`]);
          this.view.$el.find('input[name=featureCode]').val('invalid');
          this.view.$el.find('form').submit();
          this.server.respond();
        });

        it('renders a failure message', function () {
          expect(this.view.$el.find(`:contains(${this.errorMessage})`).length).toBeTruthy();
        });

        it('disables the feature code in the Session', function () {
          expect(this.session.featureEnabled(this.ndmCode)).toBe(false);
        });
      });
    });

    describe('feature code removal', function () {
      beforeEach(function () {
        this.server = sinon.fakeServer.create();
        this.server.respondWith([200, { 'Content-Type': 'application/json' }, '{"enabledFeatures": []}']);
        this.session.set({enabledFeatures: [this.ndmCode]});
      });

      afterEach(function () {
        this.server.restore();

        this.view.$el.find('.remove-button').click();

        this.server.respond();

        it('disables the feature in the RestrictionsManager', function () {
          expect(this.session.featureEnabled(this.ndmCode)).toBe(false);
        });

        it('renders a success message', function () {
          expect(this.view.$el.find(`:contains(Feature '${this.ndmCode}' successfully removed)`).length).toBeTruthy();
        });

        it('renders the enabled feature', function () {
          expect(this.view.$el.find('li:contains(ndm)').length).toBeFalsy();
        });
      });
    });
  });
});
