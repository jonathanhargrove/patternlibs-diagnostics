/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const templates = require('templates');
const Framework = require('nexia_framework');
const AlarmsView = require('alarms/views/alarms_view');

const AlarmSearchView = Framework.View.extend({
  template: templates['alarm_search_view'],

  events: {
    'change input#deviceId': 'setDeviceId',
    'click .submit': 'subscribeToAlarms'
  },

  initialize () {
    Framework.View.prototype.initialize.apply(this, arguments);
    this.alarmsView = new AlarmsView({collection: this.collection});
  },

  setDeviceId (e) {
    this.collection.deviceId = $(e.currentTarget).val();
  },

  subscribeToAlarms (e) {
    return this.collection.subscribe(e);
  },

  onRender () {
    Framework.View.prototype.onRender.apply(this, arguments);
    return this.$el.append(this.alarmsView.render().el);
  }
});

module.exports = AlarmSearchView;
