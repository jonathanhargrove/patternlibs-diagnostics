define(function (require) {
  require('spec/spec_helper');
  const SpiderLegendView = require('runtime_history/views/spider_legend_view');

  describe('SpiderLegendView', function () {
    beforeEach(function () {
      this.series = [
        { name: 'ID Temp 1', id: 'indoor', color: '#FF0000' },
        { name: 'OD Temp 1', id: 'outdoor', color: '#00FF00' }
      ];

      const mockHighchart = sinon.stub();

      this.view = new SpiderLegendView({
        el: $('<div />'),
        highchart: mockHighchart,
        series: this.series
      });

      this.view.render();
    });

    return it('renders a legend item per series line', function () {
      return this.series.forEach(line => {
        const li = this.view.$el.find(`li[data-series="${line.name}"]`);

        expect(li.length).toEqual(1);
        expect(li.data('indoor-outdoor')).toEqual(line.id);

        // Create a test bed element because IE and other browsers behave
        // differently when it comes to transforming colors (e.g. rgb -> hex)
        const testBed = $('<div>');
        testBed.css('background-color', line.color);
        const primaryIcon = li.find('div.primary-icon');
        expect(primaryIcon.length).toEqual(1);
        expect(primaryIcon.css('background-color')).toEqual(testBed.css('background-color'));

        const description = li.find('div.description');
        expect(description.length).toEqual(1);
        expect(description.html().replace(/^\W+/, '').replace(/\W+$/, '')).toEqual(line.name);
      });
    });
  });
});
