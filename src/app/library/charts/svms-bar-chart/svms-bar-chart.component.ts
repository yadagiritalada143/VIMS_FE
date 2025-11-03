import { Component, Input, ViewEncapsulation } from '@angular/core';
import * as d3 from 'd3';
import { CustomcurrencyPipe } from 'src/app/shared/pipe/customcurrency.pipe';
import { BasicChartComponent } from '../basic-chart/basic-chart.component';

const COLORS = [
  '#16A085',
  '#6bd1cb',
  '#53bdf7',
  '#9c8cf9',
  '#f28cbe',
  '#ffb18d',
  '#ff8c9b',
  '#4EF26D',
  '#24B57C',
  '#6E9573',
  '#84F45F',
  '#B5A36B',
  '#B1EDEF',
  '#AA2739',
  '#304AEB',
  '#B3E7A3',
  '#97B823',
  '#26149D',
  '#EA8F24',
  '#6C10B7',
  '#1655DD',
  '#49B23A',
  '#C04B88',
  '#7696D9',
  '#28BBDA',
  '#FE27D6',
  '#457273',
  '#FEA52D',
  '#184D37',
  '#0AA80E',
  '#FB4976',
  '#18DA09',
  '#D91A10',
  '#915522',
  '#61234D',
  '#43FEC9',
  '#AC80A4',
  '#4D0F3B',
  '#BBE6B1',
  '#9BED42',
  '#1DCFC0',
  '#7E4312',
  '#03DE31',
  '#CAEBE7',
  '#39827A',
  '#4D21A0',
  '#E87622',
  '#67CDC0',
  '#E1B464',
  '#08F015',
  '#CDE8DB',
  '#CEBB0B',
  '#3A33FD',
  '#043540',
  '#76367D',
  '#D86770',
  '#109768',
  '#FD11D2',
  '#8A5642',
  '#1C1F13',
  '#3C9B10',
  '#36DF70',
  '#679655',
  '#42753B',
  '#115D44',
  '#E8EAD2',
  '#51B2BE',
  '#FBFCC6',
  '#47BA77',
  '#B3032E',
  '#AA3928',
  '#61E918',
  '#1896F1',
  '#365B0A',
  '#41D26E',
  '#E1C2C7',
  '#19E48F',
  '#E414C0',
  '#4FD0F2',
  '#794088',
  '#7CC70A',
  '#6A156B',
  '#B986BD',
  '#D5C669',
  '#571A05',
  '#51E2C9',
  '#8EC86B',
  '#BD5BC1',
  '#504716',
  '#8934FE',
  '#41112B',
  '#D0BDAD',
  '#F7011E',
  '#9A3622',
  '#E856F6',
  '#1C36F4',
  '#C1C820',
  '#7CA267',
  '#DD5943',
  '#DEF1B7',
  '#387A35',
  '#F9809C',
  '#70B97E',
  '#EBFDA7',
  '#104663',
];

const xAxisFormat = d3.timeFormat('%b');
const tooltipDim = d3.timeFormat('%B');

@Component({
  selector: 'svms-bar-chart',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './svms-bar-chart.component.html',
  styleUrls: ['./svms-bar-chart.component.scss'],
})
export class SvmsBarChartComponent extends BasicChartComponent {
  data: any;
  svg: any;
  chartHeight = 500;
  chartWidth = 800;
  tooltip: any;
  xField: any;
  y1Field: any;
  y2Field: any;
  groupedBar: boolean = false;
  currencySymbol = '$';

  @Input() xLabel;
  @Input() xSecondLabel = '';
  @Input() yLabel;
  @Input() margin: any;
  @Input() showAvrg = false;
  @Input() reportKey: any;
  @Input() set chartData(data) {
    if (data.length) {
      this.data = data;
      this.initRedrawChart(true);
    }
  }

  constructor(private custCurrPipe: CustomcurrencyPipe) {
    super();
  }

  drawChart() {
    this.currencySymbol = this.custCurrPipe?.transform(0)?.substring(0, 1);
    d3.select('#columnId').html('');
    if (this.data?.length && (this.data[0] === 'no_data' || this.data[0] === 'error')) {
      d3.select('#columnId')
        .html(this.data[0] === 'no_data' ? 'No Data Available' : 'Error in Loading the Data')
        .style('font-size', '1.5em')
        .style('font-weight', 600)
        .style('color', 'rgb(185 183 183)');
      return;
    } else if (this.data?.length) {
      const keys = Object.keys(this.data[0]);
      this.groupedBar = keys?.length > 2 || false;
      if (this.groupedBar) {
        this.xField = keys[2]; // label
        this.y2Field = keys[1];
        this.y1Field = keys[0]; // status  // location
      } else {
        this.xField = keys[1]; // label
        this.y1Field = keys[0]; // status  // location
      }
      // if (!this.xLabel && !this.yLabel) {
      this.xLabel = this.xLabel ?? this.y1Field;
      this.yLabel = this.reportKey.includes('budget_report') || this.reportKey.includes('spend_report') ? 'Amount' : 'Count';
      // }
      this.initializeColComponents();
    } else {
      d3.select('#columnId').html('Loading...').style('font-size', '1.5em').style('font-weight', 600).style('color', 'rgb(185 183 183)');
    }
  }

  private initializeColComponents() {
    this.margin = { top: 15, right: 50, bottom: 60, left: 60 };
    this.svg = d3
      .select('#columnId')
      .selectAll('svg')
      .data([1])
      .join('svg')
      .attr('width', this.chartWidth)
      .attr('height', this.chartHeight)
      .attr('viewBox', `0 0 ${this.chartWidth} ${this.chartHeight}`)
      .append('g')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');
    this.tooltip = d3.select('.tooltip');
    this.drawColumns();
  }

  private titleCase(str: string, toUpperCase?: boolean) {
    const splitStr = (str?.includes('_') ? str?.toLowerCase().split('_') : str?.toLowerCase().split(' ')) ?? [];
    for (let i = 0; i < splitStr.length; i++) {
      splitStr[i] = (splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1)).replace(/_/g, ' ');
    }
    return toUpperCase ? splitStr?.join(' ')?.toUpperCase() : splitStr?.join(' ');
  }

  private numFormatter(num) {
    const formatNumber = d3.format('.2s'),
      formatBillion = function (x) {
        return formatNumber(x / 1e9) + 'B';
      },
      formatMillion = function (x) {
        return formatNumber(x / 1e6) + 'M';
      },
      formatThousand = function (x) {
        return formatNumber(x / 1e3) + 'K';
      };

    const v = Math.abs(num);
    switch (this.yLabel?.toLowerCase() ?? '') {
      case 'percentage':
        return (v >= 0.9995e9 ? formatBillion : v >= 0.9995e6 ? formatMillion : v >= 0.9995e3 ? formatThousand : formatNumber)(num) + ' %';
      case 'amount':
        return (
          this.currencySymbol +
          ' ' +
          (v >= 0.9995e9 ? formatBillion : v >= 0.9995e6 ? formatMillion : v >= 0.9995e3 ? formatThousand : formatNumber)(num)
        );
      default:
        return (v >= 0.9995e9 ? formatBillion : v >= 0.9995e6 ? formatMillion : v >= 0.9995e3 ? formatThousand : formatNumber)(num);
    }
  }

  private drawColumns() {
    const that = this;
    const contentWidth = this.chartWidth - this.margin.left - this.margin.right;
    const contentHeight = this.chartHeight - this.margin.top - this.margin.bottom;

    const xData = this.data.map(d => d[this.xField]);
    const color = d3.scaleOrdinal(COLORS).domain(xData).unknown('#dde');

    /* Y-axis Pointers */
    const yMax = +d3.max(this.data.map(d => +d[this.y1Field]));
    const y = d3.scaleLinear().range([contentHeight, 0]).domain([0, yMax]);
    let leftAxis;
    if (yMax <= 35) {
      leftAxis = d3
        .axisLeft(y)
        .ticks(yMax > 15 && yMax <= 100 ? parseInt('' + (yMax / 2 + 1)) : yMax)
        .tickSize(-this.chartWidth - 120)
        .tickFormat(function (d) {
          return that.numFormatter(d);
        });
    } else {
      leftAxis = d3
        .axisLeft(y)
        .tickSize(-this.chartWidth - 120)
        .tickFormat(function (d) {
          return that.numFormatter(d);
        });
    }

    this.svg.append('g').classed('axisleft', true).call(leftAxis);

    const x = d3
      .scaleBand()
      .range([0, contentWidth])
      .domain(this.data.map(d => d[this.xField]))
      .padding(0.1)
      .paddingOuter(this.data.length > 5 ? 0.5 : 2);

    /* X-axis Pointers */
    const isTranslate = 10 * this.data.length > x.bandwidth();
    this.svg
      .append('g')
      .classed('axisbottom', true)
      .attr('transform', `translate(0, ${contentHeight})`)
      .call(d3.axisBottom(x).tickSize(-this.chartHeight))
      .selectAll('text')
      .attr('dy', 15)
      .attr('transform', isTranslate ? 'translate(5, 0) rotate(30) scale(.9)' : '')
      .style('text-anchor', isTranslate ? 'start' : 'center')
      .text(function (d) {
        const t = xData.length > 30 ? '' : that.titleCase(d3.select(this).text());
        return (6 * t.length > x.bandwidth() ? t.slice(0, 8) + '...' : t)?.toUpperCase();
      });

    /* Y-axis Label */
    this.svg
      .append('text')
      .classed('chart-label', true)
      .attr('transform', 'rotate(-90)')
      .attr('y', -50)
      .attr('x', 0 - contentHeight / 2)
      .attr('dy', '0.2em')
      .text(this.titleCase(this.yLabel ?? this.y1Field));

    /* X-axis Label */
    this.svg
      .append('text')
      .classed('chart-label', true)
      .attr('y', contentHeight + (isTranslate ? 55 : 45))
      .attr('x', isTranslate && xData.length <= 30 ? 0 : contentWidth / 2)
      .style('text-anchor', isTranslate ? 'unset' : 'middle')
      .text(this.titleCase(this.xLabel ?? this.data[0][this.xField]));

    /* First Bar in the Grouped Bar Chart */
    const bars = this.svg
      .selectAll('.bars1')
      .data(this.data)
      .join('g')
      .classed('bars1', true)
      .append('rect')
      .classed('bar', true)
      .attr('fill', this.groupedBar ? '#ff7f0e' : d => color(d[this.xField]))
      .attr('x', d => x(d[this.xField]))
      .attr('width', d => x.bandwidth() * (this.groupedBar ? 0.5 : 1))
      .attr('y', contentHeight)
      .on('mouseout', d => this.tooltip.transition().duration(100).style('opacity', 0))
      .on('mouseover', (event, data) => {
        that.tooltip.transition().duration(100).style('opacity', 1);
        let row;
        const table = that.tooltip.style('opacity', 1).selectAll('table').data([1]).enter().append('table');
        table.append('tr').append('th').attr('colspan', 3);
        row = that.data.filter(d => d[that.xField] === data[that.xField]);
        that.tooltip.select('th').html(this.titleCase(that.y1Field));
        const content = that.tooltip.select('table').selectAll('.tr-data').data(row);
        content.join(
          enter => {
            let r = enter.append('tr').classed('tr-data', true);
            r.append('td')
              .classed('legend', true)
              .style('color', this.groupedBar ? '#ff7f0e' : d => color(d[that.xField]))
              .style('font-size', '1.8em')
              .html('&#9679;'); // .html('&#9632;');
            r.append('td')
              .classed('name', true)
              .text(d => this.titleCase(data[that.xField], this.xLabel?.includes('code')));
            r.append('td')
              .classed('value', true)
              .text(d => (this.yLabel?.toLowerCase() === 'amount' ? this.custCurrPipe.transform(+d[that.y1Field]) : d[that.y1Field]));
          },
          update => {
            update.select('.legend').style('color', this.groupedBar ? '#ff7f0e' : d => color(d[that.xField]));
            update.select('.name').text(d => this.titleCase(data[that.xField], this.xLabel?.includes('code')));
            update
              .select('.value')
              .text(d => (this.yLabel?.toLowerCase() === 'amount' ? this.custCurrPipe.transform(+d[that.y1Field]) : d[that.y1Field]));
          },
        );
      })
      .on('mousemove', (event, data) => {
        const coords = d3.pointer(event);
        const sizes = this.tooltip.node().getBoundingClientRect();
        const posX = contentWidth - coords[0] - sizes.width + 50 > 0 ? coords[0] + 15 : coords[0] - 40 - sizes.width;
        const shiftX = 50;
        const shiftY = -10;

        this.tooltip.style('left', posX + shiftX + 'px').style('top', coords[1] - this.chartHeight + shiftY + 'px');
      });
    bars
      .transition()
      .duration(600)
      .delay((d, i) => i * 20)
      .attr('height', d => contentHeight - y(d[this.y1Field]))
      .attr('y', d => y(d[this.y1Field]));

    /* Second Bar in the Grouped Bar Chart */
    if (this.groupedBar) {
      const bars2 = this.svg
        .selectAll('.bars2')
        .data(this.data)
        .join('g')
        .classed('bars2', true)
        .append('rect')
        .classed('bar', true)
        .attr('fill', this.groupedBar ? '#1f77b4' : d => color(d[this.xField]))
        .attr('x', d => x(d[this.xField]) + x.bandwidth() * 0.5)
        .attr('width', d => x.bandwidth() * 0.5)
        .attr('y', contentHeight)
        .on('mouseout', d => this.tooltip.transition().duration(100).style('opacity', 0))
        .on('mouseover', (event, data) => {
          that.tooltip.transition().duration(100).style('opacity', 1);
          let row;
          const table = that.tooltip.style('opacity', 1).selectAll('table').data([1]).enter().append('table');
          table.append('tr').append('th').attr('colspan', 3);
          row = that.data.filter(d => d[that.xField] === data[that.xField]);
          that.tooltip.select('th').html(this.titleCase(data[that.xField]));

          const content = that.tooltip.select('table').selectAll('.tr-data').data(row);
          content.join(
            enter => {
              let r = enter.append('tr').classed('tr-data', true);
              r.append('td')
                .classed('legend', true)
                .style('color', this.groupedBar ? '#1f77b4' : d => color(d[that.xField]))
                .style('font-size', '1.8em')
                .html('&#9679;'); // .html('&#9632;');
              r.append('td')
                .classed('name', true)
                .text(d => this.titleCase(that.y2Field));
              r.append('td')
                .classed('value', true)
                .text(d => (this.yLabel?.toLowerCase() === 'amount' ? this.custCurrPipe.transform(+d[that.y2Field]) : d[that.y2Field]));
            },
            update => {
              update.select('.legend').style('color', this.groupedBar ? '#1f77b4' : d => color(d[that.xField]));
              update.select('.name').text(d => this.titleCase(that.y2Field));
              update
                .select('.value')
                .text(d =>
                  this.yLabel?.toLowerCase() === 'amount'
                    ? this.custCurrPipe.transform(+d[that.y2Field])
                    : this.custCurrPipe.transform(+d[that.y2Field]).substring(1),
                );
            },
          );
        })
        .on('mousemove', (event, data) => {
          const coords = d3.pointer(event);
          const sizes = this.tooltip.node().getBoundingClientRect();
          const posX = contentWidth - coords[0] - sizes.width + 50 > 0 ? coords[0] + 15 : coords[0] - 40 - sizes.width;
          const shiftX = 50;
          const shiftY = -10;
          this.tooltip.style('left', posX + shiftX + 'px').style('top', coords[1] - this.chartHeight + shiftY + 'px');
        });
      bars2
        .transition()
        .duration(600)
        .delay((d, i) => i * 20)
        .attr('height', d => contentHeight - y(d[this.y2Field]))
        .attr('y', d => y(d[this.y2Field]));
    }
  }
}
