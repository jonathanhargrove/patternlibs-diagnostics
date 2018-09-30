require('spec/spec_helper');
const LoadingView = require('root/views/loading_view');
const SysComponentsCollection = require('sys_components/models/sys_components_collection');
const SysComponentsView = require('sys_components/views/sys_components_view');
const SysComponent = require('sys_components/models/sys_component');
const sinon = require('sinon');

describe('SysComponentsView', function () {
  beforeEach(function () {
    this.deviceId = '01400184';
    this.collection = new SysComponentsCollection(null, {deviceId: this.deviceId});
  });

  describe('lastUpdatedAt', function () {
    describe('with time data', () =>
      it("does display 'last updated'", function () {
        this.collection.add(
          [
            new SysComponent({timestamp: 1400089860000})
          ]
        );
        const view = new SysComponentsView({collection: this.collection});
        view.render();

        expect(view.$el.find('.last-updated-at').length).toBe(1);
      })
    );

    describe('without time data', () =>
      it("doesn't display 'last updated'", function () {
        this.collection.add([new SysComponent()]);
        const view = new SysComponentsView({collection: this.collection});
        view.render();

        expect(view.$el.find('.last-updated-at').length).toBe(0);
      })
    );
  });

  describe('#initialize', function () {
    beforeEach(function () {
      this.xhr = sinon.useFakeXMLHttpRequest();
      this.requests = [];
      this.xhr.onCreate = xhr => {
        this.requests.push(xhr);
      };

      this.view = new SysComponentsView({collection: this.collection});
    });

    afterEach(function () {
      this.xhr.restore();
    });

    it('makes a request to get the non-communicating components', function () {
      expect(this.requests.length).toBe(1);
      expect(this.requests[0].url).toBe(`/api/devices/${this.deviceId}/system_components`);
    });

    describe('when the request succeeds', function () {
      beforeEach(function () {
        this.requests[0].respond(200, {'Content-Type': 'application/javascript'}, '[]');
      });

      it('sets the non-communicating collection dataReceived property', function () {
        expect(this.view.nonCommunicatingCollection.dataReceived).toBeTruthy();
      });
    });
  });

  describe('#render', function () {
    beforeEach(function () {
      this.view = new SysComponentsView({collection: this.collection});
    });

    describe('before everything has loaded', function () {
      beforeEach(function () {
        this.loadingSpy = sinon.spy(LoadingView.prototype, 'onRender');
      });

      afterEach(function () {
        this.loadingSpy.restore();
      });

      it('renders a loading view', function () {
        this.view.render();
        expect(this.loadingSpy.called).toBeTruthy();
      });
    });

    describe('when everything has loaded', function () {
      beforeEach(function () {
        this.collection.dataReceived = true;
        this.view.nonCommunicatingCollection.dataReceived = true;
      });

      describe('when components have zone IDs', function () {
        beforeEach(function () {
          this.collection.add(
            [
              new SysComponent({zoneId: 348})
            ]
          );
        });

        it('renders the Zone Name field', function () {
          this.view.render();

          expect(this.view.$el.find('th:contains("Associated Zone")').length).toBe(1);
        });
      });

      describe('when no component has zone names', function () {
        beforeEach(function () {
          this.collection.add(
            [
              new SysComponent(),
              new SysComponent()
            ]
          );
        });

        it('hides the Zone Name field', function () {
          this.view.render();

          expect(this.view.$el.find('th:contains("Associated Zone")').length).toBe(0);
        });
      });

      describe('with only one (unsaved) component', function () {
        beforeEach(function () {
          this.collection.add(
            [
              new SysComponent()
            ]
          );
          this.view.render();
        });

        it('hides the toggle button', function () {
          expect(this.view.$el.find('.icon-toggle-state:visible').length).toBe(0);
        });

        it("displays an 'Add Component' button", function () {
          expect(this.view.$el.find('button#add-component').length).toBe(1);
        });

        describe("when 'add component' is clicked", function () {
          beforeEach(function () {
            this.originalCount = this.view.$el.find('tr').length;
            this.view.$el.find('#add-component').click();
          });

          it('adds a new row', function () {
            expect(this.view.$el.find('.component-row').length).toBe(1 + this.originalCount);
          });

          it('shows a toggle button', function () {
            expect(this.view.$el.find('.icon-toggle-state').length).toBe(1);
          });
        });
      });

      describe('with more than one component', function () {
        beforeEach(function () {
          this.collection.add(
            [
              new SysComponent(),
              new SysComponent(),
              new SysComponent()
            ]
          );
          this.view.render();
        });

        it('shows the toggle button', function () {
          expect(this.view.$el.find('.icon-toggle-state').length).toBe(1);
        });

        it("displays an 'Add Component' button", function () {
          expect(this.view.$el.find('button#add-component').length).toBe(1);
        });

        it('renders the number of components', function () {
          expect(this.view.$el.find('.panel-header .count').html()).toBe(' (3)');
        });
      });

      describe('#beforeRemove', function () {
        it('aborts the active request', function () {
          const abortSpy = spyOn(this.view.activeRequest, 'abort');
          this.view.remove();

          expect(abortSpy).toHaveBeenCalled();
        });
      });
    });
  });
});
