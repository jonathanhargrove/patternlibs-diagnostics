const $                        = require('jquery');
const _                        = require('underscore');
const templates                = require('templates');

const Framework                = require('nexia_framework');

const CustomerListItemView     = require('customers/views/customer_list_item_view');
const CustomersCollection      = require('customers/models/customers_collection');
const DevicesCollection        = require('devices/models/devices_collection');
const NoCustomersView          = require('customers/views/no_customers_view');
const PaginationControl        = require('utils/pagination_control');
const SearchFormView           = require('root/views/search_form_view');
const SortIndicatorView        = require('root/views/sort_indicator_view');
const Theme                    = require('utils/theme');
const UnassignedDeviceItemView = require('devices/views/unassigned_device_item_view');

/*
 * Perhaps confusingly, there are a total of four different collections here
 * - `this.unassignedDevices`: all of the unassigned devices for the dealer
 * - `this.customers`: all of the customers for the dealer
 * - `this.resultsCollection`: the combination of customers and unassigned
 *   devices that matches the current search query and/or filter value and
 *   sorted according to what the user has selected
 * - `this.collection`: the visible subset of this.resultsCollection (due to pagination)
 */
const CustomerListView = Framework.SearchableCollectionView.extend({
  id: 'customer-list',
  className: 'customers-container',
  template: templates['customer_list'],

  events: {
    'click [data-sort-on] .sort-controls': '_sortList',
    'click [data-js="filter-dropdown"]': '_showDropdownFilter',
    'click *': '_hideDropdownFilter',
    'click [data-filter]': '_changeUnassignedAssignedFilter'
  },

  childViews: {
    '[data-js=search-form-container]' () {
      return _.tap(new SearchFormView({query: this.query}), view => {
        this.listenTo(view, 'queryChanged', this._navigateOnSearch);
      });
    },
    '[data-sort-indicator=customer]' () { return new SortIndicatorView({collection: this.resultsCollection, sortAttribute: 'customer'}); },
    '[data-sort-indicator=alerts]' () { return new SortIndicatorView({collection: this.resultsCollection, sortAttribute: 'alerts'}); }
  },

  initialize (options) {
    Framework.SearchableCollectionView.prototype.initialize.apply(this, arguments);

    this.query = (options.query || '').trim();
    this.unassignedDevices = options.unassignedDevices || new DevicesCollection();
    this.customers = options.customers || new CustomersCollection();
    this.visibleActions = options.visibleActions;
    this.showNdm = options.hasOwnProperty('showNdm') ? options.showNdm : true;
    this.baseCustomerFilter = options.baseCustomerFilter;
    this.baseSystemFilter = options.baseSystemFilter;
    this.baseRoute = options.baseRoute;
    this._computeFilteredAndSortedResults();
    this.itemsPerPage = options.itemsPerPage || 10;

    this.pagination = new PaginationControl({
      collection: this.resultsCollection,
      itemsPerPage: this.itemsPerPage,
      initialPageNumber: this._currentPageNumber()
    });
    this.collection = this.pagination.getViewportCollection();

    this.session  = options.session;

    this.listenTo(this.customers, 'add remove reset sync', this._computeFilteredAndSortedResults);
    this.listenTo(this.unassignedDevices, 'add remove reset', this._computeFilteredAndSortedResults);
    this.listenTo(this.resultsCollection, 'sort reset', this.render);

    if (options.liveRerender) {
      _.each(this.customers.getAllThermostats(), (device) => {
        this.listenTo(device, 'change:dispositionAction', this._computeFilteredAndSortedResults.bind(this));

        const debounceComputeFilteredAndSortedResults = _.debounce(this._computeFilteredAndSortedResults, 1000);
        this.listenTo(device, 'change:criticalAlerts change:majorAlerts', debounceComputeFilteredAndSortedResults);
      });
    }

    this.currentStatusForVisibleSystems = options.currentStatusList;
  },

  templateContext () {
    const filterEnabled = this.filterValue === 'assigned' || this.filterValue === 'unassigned';
    return {
      filterEnabled: filterEnabled,
      noFilterApplied: !filterEnabled,
      filteredByAssigned: (this.filterValue === 'assigned'),
      filteredByUnassigned: (this.filterValue === 'unassigned'),
      models: this.resultsCollection.models,
      systemCount: this.systemCount,
      showNdm: this.showNdm && this.session && this.session.featureEnabled('ndm'),
      isTraneTheme: Theme.isTrane(),
      showInformationIcon: this.visibleActions.showInformationIcon,
      showDispositionDropdown: this.visibleActions.showDispositionDropdown
    };
  },

  itemContainer: '#customer-list-items',

  itemView (model) {
    if (model.isUnassignedDevice()) {
      return new UnassignedDeviceItemView({
        model,
        currentStatusList: this.currentStatusForVisibleSystems,
        visibleActions: this.visibleActions,
        showNdm: this.showNdm,
        session: this.session
      });
    } else {
      return new CustomerListItemView({
        model,
        currentStatusList: this.currentStatusForVisibleSystems,
        baseSystemFilter: this.baseSystemFilter,
        visibleActions: this.visibleActions,
        showNdm: this.showNdm,
        session: this.session
      });
    }
  },

  noResultsContainer: '#customer-results',

  hasResults () {
    return !!this.resultsCollection.length || !!this.filterValue;
  },

  emptyView: new NoCustomersView(),

  isEmpty () {
    return this.customers.length === 0 && this.unassignedDevices.length === 0;
  },

  _showDropdownFilter (event) {
    event.preventDefault();

    if (this.$('.filter-dropdown-contents').css('display') === 'none') {
      const buttonPosition = $(event.target).offset();
      const buttonHeight = $(event.target).outerHeight();

      this.$('.filter-dropdown-contents').css('display', 'block').offset({top: buttonPosition.top + buttonHeight + 5, left: buttonPosition.left});
    } else {
      this.$('.filter-dropdown-contents').css('display', 'none');
    }
  },

  _hideDropdownFilter (event) {
    if ($(event.target).data('js') === 'filter-dropdown') { return; }
    this.$('.filter-dropdown-contents').css('display', 'none');
  },

  _changeUnassignedAssignedFilter (event) {
    event.preventDefault();

    this.filterValue = $(event.target).data('filter');

    this._computeFilteredAndSortedResults();
    this.render();
  },

  _computeFilteredAndSortedResults () {
    this.resultsCollection = this.resultsCollection || new CustomersCollection();

    let models;
    if (this.filterValue === 'assigned') {
      models = this.customers.models;
    } else if (this.filterValue === 'unassigned') {
      models = this.unassignedDevices.models;
    } else {
      models = this.customers.models.concat(this.unassignedDevices.models);
    }

    if (this.baseCustomerFilter) {
      models = this.baseCustomerFilter(models);
    }

    if (this.query) {
      models = models.filter(model => model.matches(this.query));
    }

    this.resultsCollection.reset(models);
  },

  _sortList (e) {
    const $target = $(e.target);
    if (($target.data('js') === 'filter-dropdown') || (e.target.nodeName === 'A')) { return; }
    const sortOn = $target.parents('[data-sort-on]').data('sort-on');
    this.resultsCollection
      .setSortAttribute(sortOn, {switchDirection: true})
      .sort();
  },

  _currentPageNumber () {
    const hash = $(window.location).attr('hash');
    if (hash) {
      const pageNumber = hash.replace('#page-', '');
      return parseInt(pageNumber);
    } else {
      return 1;
    }
  },

  onRender () {
    $('body').scrollTop(0);
    this._renderPaginator();
  },

  _renderPaginator () {
    const $paginator = this.pagination.render().$el;

    const clonePaginator = () =>
      this.$('[data-paginator-clone]').html($paginator.clone(true));

    this.$('[data-paginator]')
      .html($paginator)
      .bind('DOMSubtreeModified', clonePaginator);

    clonePaginator();
  },

  _navigateOnSearch (query) {
    const route = query
      ? `/${this.baseRoute}/search/${encodeURIComponent(query)}`
      : `/${this.baseRoute}`;

    this.trigger('navigate', route);
  }
});

module.exports = CustomerListView;
