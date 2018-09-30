/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const templates = require('templates');
const StreamView = require('reports/common/stream_view');

const ZoneStatusView = StreamView.extend({
  PANEL_TITLE: 'Zone Status',

  template: templates['zone_status'],

  className: 'device-panel',

  templateContext () {
    return _.extend(this.model.attributes,
      {fanStatusOn: this._getFanStatus()});
  },

  _getFanStatus () {
    const airflowValue = this.model.get('airFlowPercentage');
    return (airflowValue !== '0%') && (airflowValue !== 'OFF');
  },

  _renderData () {
    return this.$('.panel-content').html(this.template(this.templateContext()));
  }
});

module.exports = ZoneStatusView;
