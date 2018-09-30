const Framework = require('nexia_framework');
const templates = require('templates');

const moment = require('moment');

const OPTED_IN = 'Opted In';
const SOME_SYSTEMS_OPTED_IN = 'Some Systems Opted In';
const OPTED_OUT = 'Opted Out';
const NO_SYSTEMS = 'No Systems';

const CustomerAdoptionChartView = Framework.View.extend({
  noDataTemplate: templates['no_chart_data'],

  class: 'chart',

  initialize (options) {
    this.customers = options.customers;
    this.filterBeforeOrAfterTimespan = options.filterBeforeOrAfterTimespan;
    this.sliceColorMap = options.sliceColorMap;
    this.timespanFn = options.timespanFn;

    this.chartData = this._createCustomerStatusBreakdown(this._filterCustomers());
  },

  render () {
    if (!this._hasData()) {
      this.$el.html(this.noDataTemplate());
    } else {
      this.chartOptions = this._buildChartOptions(this.chartData);

      this.$el.highcharts(this.chartOptions);
      this.highchart = this.$el.highcharts();

      requestAnimationFrame(() => {
        this.highchart.reflow();
      });

      this.chartRendered = true;
    }

    return this;
  },

  isCategoryShown (category) {
    return _.chain(this.chartData.series[0].data)
      .map((slice) => slice.name)
      .contains(category)
      .value();
  },

  _buildChartOptions (options) {
    return {
      chart: {
        plotBackgroundColor: null,
        plotBorderWidth: null,
        plotShadow: false,
        type: 'pie',
        height: 300
      },
      title: {
        enabled: false,
        text: ''
      },
      legend: {
        align: 'left'
      },
      tooltip: {
        headerFormat: '<span style="font-size: 13px">{point.key}</span><br/>',
        pointFormat: '<b>{point.percentage:.1f}%</b>',
        style: {
          padding: '10px'
        }
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            distance: 10,
            color: 'black',
            format: '<b>{point.y}</b>',
            style: {
              color: 'contrast',
              fontSize: 15,
              fontWeight: 'bold',
              textShadow: 'none'
            }
          }
        }
      },
      credits: { enabled: false },
      series: this._configureSeries(options.series)
    };
  },

  _configureSeries (series) {
    _.each(series[0].data, (slice) => {
      slice.color = this.sliceColorMap[slice.name];
    });

    if (series[0].data.length) {
      series[0].data.sliced = true;
      series[0].data.selected = true;
    }

    return series;
  },

  _hasData () {
    return this.chartData.series[0].data.length;
  },

  _filterCustomers () {
    return _.filter(this.customers.models, customer => {
      const periodStartDate = moment(new Date() - this.timespanFn());

      const customerStartDate = moment(customer.get('createdAt'));

      if (this.filterBeforeOrAfterTimespan === 'after') {
        return customerStartDate && customerStartDate.isAfter(periodStartDate);
      } else if (this.filterBeforeOrAfterTimespan === 'before') {
        return customerStartDate && customerStartDate.isBefore(periodStartDate);
      }
    });
  },

  _createCustomerStatusBreakdown (customers) {
    const chartData = {
      series: [{
        data: [
          { name: NO_SYSTEMS, y: 0 },
          { name: OPTED_OUT, y: 0 },
          { name: SOME_SYSTEMS_OPTED_IN, y: 0 },
          { name: OPTED_IN, y: 0 }
        ]
      }]
    };

    _.each(customers, (customer) => {
      if (this._isFullyOptedIn(customer)) {
        chartData.series[0].data[3].y += 1;
      } else if (this._isPartiallyOptedIn(customer)) {
        chartData.series[0].data[2].y += 1;
      } else if (customer.getSystems().models.length) {
        chartData.series[0].data[1].y += 1;
      } else {
        chartData.series[0].data[0].y += 1;
      }
    });

    chartData.series[0].data = _.reject(chartData.series[0].data, (data) => data.y === 0);

    return chartData;
  },

  _isFullyOptedIn (customer) {
    if (customer.getSystems().models.length) {
      return _.every(customer.getSystems().models, (system) => {
        return _.every(system.getDevices().models, (device) => {
          return device.attributes.status === 'OPTED IN';
        });
      });
    } else {
      return false;
    }
  },

  _isPartiallyOptedIn (customer) {
    if (customer.getSystems().models.length) {
      return _.some(customer.getSystems().models, (system) => {
        return _.some(system.getDevices().models, (device) => {
          return device.attributes.status === 'OPTED IN';
        });
      });
    } else {
      return false;
    }
  }
});

module.exports = CustomerAdoptionChartView;
