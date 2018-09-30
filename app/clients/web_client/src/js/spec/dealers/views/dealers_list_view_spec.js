define(function (require) {
  require('spec/spec_helper');
  const Dealer = require('dealers/models/dealer');
  const DealersCollection = require('dealers/models/dealers_collection');
  const DealersListView = require('dealers/views/dealers_list_view');
  const Honeybadger = require('honeybadger-js');
  const Session = require('root/models/session');
  const ServerError = require('root/server_error');

  require('template_helpers');
  require('sinon');

  describe('DealersListView', function () {
    beforeEach(function () {
      this.collection = new DealersCollection();
      this.router     = {
        navigate () {},
        resetCollections () {}
      };

      this.navigateSpy = sinon.spy(this.router, 'navigate');
      this.resetCollectionsSpy = sinon.spy(this.router, 'resetCollections');
    });

    describe('with dealers', function () {
      beforeEach(function () {
        this.dealers = [
          { username: 'dealerC', id: '33333333', phoneNumber: '3031234567', address: '123 Some Street', city: 'Somewhere', state: 'CO', zip: '12345', dealerName: "Bob's Shop" },
          { username: 'dealerB', id: '22222222', phoneNumber: '3032345678', address: '123 Sesame Street', city: 'That Place', state: 'NM', zip: '23456', dealerName: "Cinderella's Place" },
          { username: 'dealerA', id: '11111111', phoneNumber: '3033456789', address: '123 Main Street', city: 'Central City', state: 'AK', zip: '45678', dealerName: 'Some Company Name' }
        ];
        this.dealers.forEach(dealerInfo => {
          this.collection.add(new Dealer(dealerInfo));
        });

        this.view = new DealersListView({collection: this.collection, router: this.router});
        this.view.render();
      });

      it('displays a dealer-list-items select', function () {
        expect(this.view.$el.find('select#dealer-list-items').length).toBe(1);
      });

      it('displays dealer info in the dealer-list-items select', function () {
        const container = $(this.view.$el.find('select#dealer-list-items'));
        this.collection.each(function (dealer) {
          const contents = container.find(`option[value=${dealer.id}]`).html();

          expect(contents).toMatch(new RegExp(`${dealer.get('dealerName')}`));
          expect(contents).toMatch(new RegExp(`${dealer.fullAddress()}`));
          expect(contents).toMatch(new RegExp(`${dealer.get('username')}`));
        });
      });

      describe('with a query string', function () {
        describe('that matches something', function () {
          beforeEach(function () {
            this.view = new DealersListView({collection: this.collection, router: this.router, query: 'Bob'});
            this.view.render();
          });

          it('displays the cancel button', function () {
            expect(this.view.$el.find('#search-box #clear-search').length).toBe(1);
          });

          it('renders only the dealers that match', function () {
            const container = $(this.view.$el.find('select#dealer-list-items'));
            expect(container.find('option').length).toBe(1);
            expect(container.find("option[value=33333333]:contains('dealerC')").length).toBe(1);
          });

          describe('cancelling a search', () =>
            it('triggers navigates to the dealers route', function () {
              this.view.$el.find('#clear-search').click();
              expect(this.navigateSpy.calledWith('/dealers', {trigger: true})).toBeTruthy();
            })
          );
        });

        describe("that doesn't match anything", function () {
          beforeEach(function () {
            this.view = new DealersListView({collection: this.collection, router: this.router, query: 'potato'});
            this.view.render();
          });

          it('displays the cancel button', function () {
            expect(this.view.$el.find('#search-box #clear-search').length).toBe(1);
          });

          it("renders a 'no results' div", function () {
            expect(this.view.$el.find("h1:contains('No Search Results')").length).toBe(1);
          });
        });
      });

      describe('impersonating a dealer', function () {
        beforeEach(function () {
          this.sessionId = 'aSessionId';
          this.session = new Session({id: this.sessionId, roles: ['admin']});

          this.view = new DealersListView({session: this.session, collection: this.collection, router: this.router});
          this.view.render();

          this.requests = [];
          this.xhr = sinon.useFakeXMLHttpRequest();
          this.xhr.onCreate = xhr => {
            this.requests.push(xhr);
          };

          this.view.$('select').val(this.dealers[0].id);
          this.view.$('form').submit();
        });

        afterEach(function () {
          this.xhr.restore();
        });

        it('tries to save the session with the selected dealer id as impersonated', function () {
          expect(this.requests.length).toBe(1);
          expect(this.requests[0].method).toBe('PATCH');
          expect(this.requests[0].url).toBe(`/api/sessions/${this.sessionId}`);
          expect(this.requests[0].requestBody).toBe(`{"impersonateDealerId":"${this.dealers[0].id}"}`);
        });

        describe('when the request is successful', function () {
          beforeEach(function () {
            this.requests[0].respond(200, { 'Content-Type': 'application/json' },
              JSON.stringify(_(this.dealers[0]).extend({isImpersonating: true})));
          });

          it('resets the main collections', function () {
            expect(this.resetCollectionsSpy.called).toBeTruthy();
          });

          it('triggers a redirect to the /customers page', function () {
            expect(this.navigateSpy.calledWith('/customers')).toBeTruthy();
          });
        });

        describe('when the request fails', function () {
          beforeEach(function () {
            this.honeyBadgerSpy = sinon.spy(Honeybadger, 'notify');
            this.serverErrorSpy = sinon.spy(ServerError, 'display');

            this.requests[0].respond(403, { 'Content-Type': 'application/json' },
              '{"base": "whatever, something went wrong"}');
          });
          afterEach(function () {
            this.honeyBadgerSpy.restore();
            this.serverErrorSpy.restore();
          });

          it('calls honeybadger', function () {
            expect(this.honeyBadgerSpy.called).toBeTruthy();
          });

          it('displays a server error', function () {
            expect(this.serverErrorSpy.called).toBeTruthy();
          });
        });
      });
    });
  });
});
