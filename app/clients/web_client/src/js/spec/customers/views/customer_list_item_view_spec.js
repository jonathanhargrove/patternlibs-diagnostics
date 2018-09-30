define(function (require) {
  require('spec/spec_helper');
  const Customer = require('customers/models/customer');
  const CustomerListItemView = require('customers/views/customer_list_item_view');

  describe('CustomerListItemView', function () {
    beforeEach(function () {
      const user = new Customer({firstName: 'Joe', lastName: 'Smith', phone: '3035550000', zip: 80305, email: 'joe@domain.com'});

      const view = new CustomerListItemView({model: user});

      this.html = view.render().$el.html();
    });

    it("uses the 'all systems' designation for the customer link", function () {
      expect($(this.html).find('.name a').attr('href')).toMatch(/#all$/);
    });

    it('shows a customer\'s name', function () {
      expect(this.html).toContain('Joe');
      expect(this.html).toContain('Smith');
    });

    it('shows a customer\'s address', function () {
      expect(this.html).toContain('80305');
    });
  });
});
