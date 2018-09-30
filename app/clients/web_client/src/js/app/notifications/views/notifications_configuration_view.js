const Framework                          = require('nexia_framework');
const NotificationConfigurationItemView  = require('notifications/views/notification_configuration_item_view');
const NotificationDescriptionsCollection = require('notifications/models/notification_descriptions_collection');
const PaginationControl                  = require('utils/pagination_control');
const SearchFormView                     = require('root/views/search_form_view');
const SortIndicatorView                  = require('root/views/sort_indicator_view');
const templates                          = require('templates');
const $                                  = require('jquery');
const _                                  = require('underscore');

const NotificationsConfigurationView = Framework.SearchableCollectionView.extend({
  className: 'notifications-configuration',
  id: 'notifications-configuration-view',
  template: templates['notifications_configuration'],

  childViews: {
    '[data-js=search-container]' () {
      return _.tap(new SearchFormView(), (view) => {
        this.listenTo(view, 'queryChanged', this.filterDescriptions);
      });
    },
    '[data-sort-indicator=alarmId]' () {
      return new SortIndicatorView({
        collection: this.filteredDescriptions, sortAttribute: 'alarmId'
      });
    },
    '[data-sort-indicator=severity]' () {
      return new SortIndicatorView({
        collection: this.filteredDescriptions, sortAttribute: 'severity'
      });
    }
  },

  events: {
    'click [data-sort-on]': '_sortDescriptions'
  },

  initialize (options) {
    this.configurations = options.configurations;
    this.descriptions = options.descriptions;
    this.filteredDescriptions = new NotificationDescriptionsCollection();

    this.pagination = new PaginationControl({
      collection: this.filterDescriptions(),
      itemsPerPage: options.itemsPerPage || 20
    });
    this.collection = this.pagination.getViewportCollection();

    this.listenTo(this.collection, 'reset sort', this.render);
  },

  itemContainer: 'tbody',
  itemView (model) {
    let config = this.configurations.findWhere({ code: model.get('alarmId') });
    return new NotificationConfigurationItemView({model, config});
  },

  noResultsContainer: '#notification-results',

  onRender () {
    this._renderPaginator();
  },

  filterDescriptions (query = null) {
    if (this.pagination) {
      this.pagination.changePageNumber(1, { resetItems: false });
    }
    this.filteredDescriptions.reset(this.descriptions.search(query));
    return this.filteredDescriptions;
  },

  _renderPaginator () {
    this.$('[data-paginator]').html(this.pagination.render().el);
  },

  _sortDescriptions (e) {
    e.preventDefault();
    const sortOn = $(e.currentTarget).data('sort-on');
    this.filteredDescriptions
      .setSortAttribute(sortOn, {switchDirection: true})
      .sort();
  }
});

module.exports = NotificationsConfigurationView;
