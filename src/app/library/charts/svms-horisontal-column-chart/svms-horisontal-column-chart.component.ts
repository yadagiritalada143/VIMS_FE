import { Component, Input, ViewEncapsulation } from '@angular/core';
import * as d3 from 'd3';
import { BasicChartComponent } from '../basic-chart/basic-chart.component';

const COLORS = ['#16A085', '#6bd1cb', '#53bdf7', '#9c8cf9', '#f28cbe', '#ffb18d', '#ff8c9b', '#4EF26D', '#24B57C', '#6E9573', '#84F45F', '#B5A36B', '#B1EDEF', '#AA2739', '#304AEB', '#B3E7A3', '#97B823', '#26149D', '#EA8F24', '#6C10B7', '#1655DD', '#49B23A', '#C04B88', '#7696D9', '#28BBDA', '#FE27D6', '#457273', '#FEA52D', '#184D37', '#0AA80E', '#FB4976', '#18DA09', '#D91A10', '#915522', '#61234D', '#43FEC9', '#AC80A4', '#4D0F3B', '#BBE6B1', '#9BED42', '#1DCFC0', '#7E4312', '#03DE31', '#CAEBE7', '#39827A', '#4D21A0', '#E87622', '#67CDC0', '#E1B464', '#08F015', '#CDE8DB', '#CEBB0B', '#3A33FD', '#043540', '#76367D', '#D86770', '#109768', '#FD11D2', '#8A5642', '#1C1F13', '#3C9B10', '#36DF70', '#679655', '#42753B', '#115D44', '#E8EAD2', '#51B2BE', '#FBFCC6', '#47BA77', '#B3032E', '#AA3928', '#61E918', '#1896F1', '#365B0A', '#41D26E', '#E1C2C7', '#19E48F', '#E414C0', '#4FD0F2', '#794088', '#7CC70A', '#6A156B', '#B986BD', '#D5C669', '#571A05', '#51E2C9', '#8EC86B', '#BD5BC1', '#504716', '#8934FE', '#41112B', '#D0BDAD', '#F7011E', '#9A3622', '#E856F6', '#1C36F4', '#C1C820', '#7CA267', '#DD5943', '#DEF1B7', '#387A35', '#F9809C', '#70B97E', '#EBFDA7', '#104663'];


@Component({
  selector: 'svms-horisontal-column-chart',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './svms-horisontal-column-chart.component.html',
  styleUrls: ['./svms-horisontal-column-chart.component.scss']
})
export class SvmsHorisontalColumnChartComponent extends BasicChartComponent {
  @Input() data: any;
  @Input() margin: any;
  @Input() xLabel = 'status';
  @Input() yLabel = 'headcount';
  @Input() dimension;
  @Input() onHoverIncreaseEffect = true;
  @Input() colorsScheme: string[];
  @Input() chartId: string;
  @Input() set chartData(data) {
    const chartId = Math.floor(Math.random() * 1000);
    this.columnId = 'columnId' + (this.chartId ? `-${this.chartId}` : chartId);
    this.columnHoverId = 'columnHoverId' + (this.chartId ? `-${this.chartId}` : chartId);
    this.tooltipId = 'tooltipId' + (this.chartId ? `-${this.chartId}` : chartId);

    if (data?.YTD) {
      data = data.YTD;
    }

    if (data?.length && (data[0] === 'no_data' || data[0] === 'error')) {
      this.data = data;
      this.initRedrawChart(true);
      return;
    }

    if (data.length) {
      const firstElem = data[0];
      const keys = Object.keys(firstElem);
      this.xLabel = keys[0]; // label
      this.yLabel = keys[1]; // status  // location
      this.data = data.map(elem => {
        return {
          [this.xLabel]: elem[this.xLabel],
          [this.yLabel]: elem[this.yLabel],
        };
      });
      this.initRedrawChart(true);
    }
  }

  get chart() {
    return this.data;
  }

  legendRectSize = 6;
  legendSpacing = 6;

  brushAreaSize = 300;

  brushAreaStart: number;
  mainChartAreaSize: number;

  svg: any;
  tooltip: any;
  color: any;

  columnId = '';
  columnHoverId = '';
  tooltipId = '';

  drawChart() {
    if (this.data?.length && (this.data[0] === 'no_data' || this.data[0] === 'error')) {
      d3.select('#' + this.columnId)
        .html(this.data[0] === 'no_data' ? 'No Data Available' : 'Error in Loading the Data')
        .style('font-size', '1.5em')
        .style('font-weight', 600)
        .style('color', 'rgb(185 183 183)');
      return;
    } else if (this?.data?.length) {
      this.color = d3.scaleOrdinal(this.colorsScheme ?? COLORS);
      d3.select('#' + this.columnId).html('');
      const keys = Object.keys(this.data[0]);
      (this.xLabel = keys[1]), (this.yLabel = keys[0]);
      this.data = this.data
        .map(d => {
          d.title = this.sliceTitle(d[this.xLabel]);
          return d;
        })
        .sort((a, b) => b[this.yLabel] - a[this.yLabel]);
      this.initializeColComponents();
    } else {
      d3.select('#' + this.columnId)
        .html('Loading...')
        .style('font-size', '1.5em')
        .style('font-weight', 600)
        .style('color', 'rgb(185 183 183)');
      return;
    }
  }

  private initializeColComponents() {

    this.margin = { top: 10, right: 20, bottom: 45, left: 100 };

    this.mainChartAreaSize = this.chartWidth - this.brushAreaSize;
    this.brushAreaStart = this.mainChartAreaSize + 10;

    this.svg = d3.select('#' + this.columnId)
      .append('svg')
      .attr('width', this.chartWidth)
      .attr('height', this.chartHeight)
      .attr('viewBox', `0 0 ${this.chartWidth} ${this.chartHeight}`)
      .append('g')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

    // this.tooltip = d3.select('#' = this.columnHoverId).selectAll('#tooltip').data([1]).join('div')
    // .attr('class', 'columnToolTip').attr('id', 'tooltip');
    this.tooltip = d3.select('#' + this.tooltipId);
    this.drawColumns();
  }

  private sliceTitle(title: string) {
    return title.length >= 15
      ? title.split('-').length > 2
        ? title.slice(0, 4) + '...' + title.slice(-3)
        : title.slice(0, 12) + '...'
      : title;
  }

  private titleCase(str) {
    const splitStr = str.toLowerCase().split(' ');
    for (let i = 0; i < splitStr.length; i++) {
      splitStr[i] = (splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1)).replace(/_/g, ' ');
    }
    return splitStr.join(' ');
  }

  private drawColumns() {
    const that = this;
    const contentWidth = this.chartWidth - this.margin.left - this.margin.right;
    const contentHeight = this.chartHeight - this.margin.top - this.margin.bottom;
    const yField = this.yLabel;
    const xField = this.xLabel;
    const maxX = +d3.max(this.data, d => +d[yField]);

    const x = d3.scaleLinear()
      .domain([0, maxX])
      .range([0, this.mainChartAreaSize]);

    const mx = d3.scaleLinear()
      .domain([0, maxX])
      .range([0, this.brushAreaSize - 30]);

    const axisBottom = this.svg.append('g')
      .classed('axisbottom', true)
      .attr('transform', 'translate(0,' + contentHeight + ')')
      .call(d3.axisBottom(x).tickSize(-contentHeight));

    const yDom = this.data.map(d => d[this.xLabel]);
    this.color.domain(yDom);

    const y = d3.scaleBand()
      .range([0, contentHeight])
      .domain(yDom)
      .padding(.4);

    const my = d3.scaleBand()
      .range([0, contentHeight])
      .domain(yDom)
      .padding(.1);

    let leftAxis = d3.axisLeft(y).tickSize(-contentWidth).tickFormat((d: any) => yDom.length > 85
      ? '' : this.titleCase(this.sliceTitle(d)));

    const axisLeft = this.svg.append('g')
      .classed('axisleft', true)
      .call(leftAxis);

    this.svg.append('text')
      .classed('chart-label', true)
      .attr('transform', 'rotate(-90)')
      .attr('y', -90)
      .attr('x', 0 - (this.chartHeight / 2) + 20)
      .attr('dy', '0.2em')
      .text(this.titleCase(this.yLabel));

    this.svg.append('text')
      .classed('chart-label', true)
      .attr('y', this.chartHeight - 10)
      .attr('x', this.mainChartAreaSize / 2)
      .text(this.titleCase(this.dimension || this.xLabel));

    const updateBars = (dataset) => {

      d3.selectAll('.axisLeft').style('font-size', y.bandwidth() + 'px');

      const bars = this.svg.selectAll('.bar')
        .data(dataset, d => d[that.xLabel])
        .join('rect')
        .classed('bar', true)
        .attr('x', x(0))
        .attr('height', y.bandwidth())
        .attr('y', d => y(d[that.xLabel]))
        .attr('fill', (d, i) => this.color(d[that.xLabel]))
        .on('mouseover', (event, data) => {
          that.tooltip
            // .html(this.sliceTitle(name) + ': ' + (data[yField]))
            .transition().duration(500).style('opacity', 1);
          const table = that.tooltip.selectAll('table')
            .data([1])
            .join(
              enter => {
                const t = enter.append('table')
                  .append('tr').append('th').attr('colspan', 3)
                  .html(this.titleCase(data[that.xLabel]));
              },
              update => {
                update.select('th').html(this.titleCase(data[that.xLabel]));
              }

            );
          const rows = [data];
          const content = that.tooltip.select('table').selectAll('.tr-data').data(rows, d => d[that.xLabel]);
          content.join(
            enter => {
              const r = enter.append('tr')
                .classed('tr-data', true);

              r.append('td').classed('legend', true)
                .style('color', d => this.color(d[that.xLabel]))
                .style('font-size', '1.8em')
                .html('&#9679;');  // .html('&#9632;');

              r.append('td').classed('name', true)
                .text(d => this.titleCase(this.dimension || this.xLabel));

              r.append('td').classed('value', true)
                .text(d => d[that.yLabel]);

            },
            update => {
              update.select('.legend').style('color', d => that.color(d[that.xLabel]));
              update.select('.name').text(d => this.titleCase(this.dimension || this.xLabel));
              update.select('.value').text(d => d[that.yLabel]);
            }
          );
        })
        .on('mousemove', (event, data) => {
          const coords = d3.pointer(event);
          const sizes = that.tooltip.node().getBoundingClientRect();
          const shift = 70;
          const posX = contentWidth - coords[0] - sizes.width + 70 > 0 ? coords[0] + 35 : coords[0] - 40 - sizes.width;
          this.tooltip.style('opacity', 1)
            .style('left', (posX + shift) + 'px')
            .style('top', coords[1] + 100 + 'px');
        })
        .on('mouseout', () => that.tooltip.style('opacity', 0))
        .transition()
        .duration(400)
        .attr('width', d => x(d[yField]));

      // axisLeft.selectAll('text').style('font-size', parseInt(axisLeft.select('text').style('font-size') , 10) > 20 ? '20px' : null);

    };
    if (this.data.length > 10) {

      this.svg.selectAll('.m-bar')
        .data(this.data)
        .join('rect')
        .classed('m-bar', true)
        .attr('x', this.mainChartAreaSize + 10)
        .attr('y', (d) => my(d[that.xLabel]))
        .attr('height', my.bandwidth())
        .attr('fill', '#eee')
        .transition()
        .duration(200)
        .attr('width', d => mx(d[yField]))
        .delay((d, i) => (i * 10));

      const brushed = (data) => {
        const range = data.selection || my.range();
        const eachBand = my.step();
        const index1 = Math.floor((range[0] / eachBand));
        const index2 = Math.floor((range[1] / eachBand));

        const newData = this.data.filter((d, i) => i >= index1 && i <= index2);
        y.domain(newData.map(d => d[that.xLabel]));
        updateBars(newData);
        leftAxis = d3.axisLeft(y).tickSize(-contentWidth).tickFormat((d: any) => newData.length > 25
          ? '' : this.titleCase(this.sliceTitle(d)));
        axisLeft.call(leftAxis);

      };

      const brush = d3.brushY()
        .extent([[this.brushAreaStart, 0], [this.brushAreaStart + this.brushAreaSize - 30, contentHeight]])
        .on('brush end', brushed);

      this.svg
        .call(brush)
        .call(brush.move, [0, 60]);
    } else {
      updateBars(this.data);
    }

  }
}
