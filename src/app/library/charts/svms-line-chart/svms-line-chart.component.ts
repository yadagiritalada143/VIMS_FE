import { Component, OnInit, Input, ViewEncapsulation } from '@angular/core';
import * as d3 from 'd3';
import { BasicChartComponent } from '../basic-chart/basic-chart.component';

@Component({
  selector: 'svms-line-chart',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './svms-line-chart.component.html',
  styleUrls: ['./svms-line-chart.component.scss']
})
export class SvmsLineChartComponent extends BasicChartComponent implements OnInit {
  @Input() data: any;
  @Input() margin: { top: 40, right: 20, bottom: 60, left: 60 };
  @Input() xLabel = 'headcount';
  @Input() yLabel = 'status';
  @Input() dimension;
  @Input() onHoverIncreaseEffect = true;
  @Input() removePrevChartsBeforeInit = true;
  @Input() isBackgroundVisible = false;

  // legend dimensions
  legendRectSize = 6; // defines the size of the colored squares in legend
  legendSpacing = 6; // defines spacing between squares

  chartWidth = 800;
  chartHeight = 280;
  svg: any;
  lineTooltip: any;
  color: any;
  tooltip: any;

  @Input() set chartData(data) {
    if (data.length) {
      this.data = data;
      const keys = Object.keys(this.data[0]);
      this.yLabel = keys[0], this.xLabel = keys[1];
      this.initRedrawChart(true);
    }
  }

  get chart() {
    return this.data;
  }

  constructor() {
    super();
  }

  ngOnInit() {

  }

  drawChart() {
    d3.select('#lineId').html('');
    if (this.data?.length && (this.data[0] === 'no_data' || this.data[0] === 'error')) {
      d3.select('#lineId')
        .html(this.data[0] === 'no_data' ? 'No Data Available' : 'Error in Loading the Data')
        .style('font-size', '1.5em')
        .style('font-weight', 600)
        .style('color', 'rgb(185 183 183)');
      return;
    } else if (this.data) {
      this.initializeLineComponents();
    } else {
      d3.select('#lineId').html('Loading...').style('font-size', '1.5em').style('font-weight', 600).style('color', 'rgb(185 183 183)');
    }
  }

  // Captialize Word
  private titleCase(str) {
    const splitStr = str.toLowerCase().split(' ');
    for (let i = 0; i < splitStr.length; i++) {
      splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
    }
    // Directly return the joined string
    return splitStr.join(' ');
  }

  private initializeLineComponents() {
    this.data.forEach(d => {
      d[this.yLabel] = +d[this.yLabel];
    });

    this.color = d3.scaleOrdinal(d3.schemePaired);
    this.margin = { top: 40, right: 20, bottom: 60, left: 60 };

    this.svg = d3.select('#lineId')
      .append('svg')
      .attr('width', this.chartWidth)
      .attr('height', this.chartHeight)
      .append('g')
      .attr('transform', 'translate(' + this.margin.left + ',' + 55 + ')');

    // this.lineTooltip = d3.select('#lineHoverId').append('div').attr('class', 'barToolTip');
    this.tooltip = d3.select('.tooltip');

    this.drawPath();
  }

  private drawPath() {

    const that = this;
    // Container Height & Width
    const contentWidth = this.chartWidth - this.margin.left - this.margin.right;
    const contentHeight = this.chartHeight - this.margin.top - this.margin.bottom;

    // ------X & Y Axes--------------
    const x = d3
      .scaleBand()
      .rangeRound([0, contentWidth])
      .padding(0.1)
      .domain(this.data.map(d => d[this.xLabel]));

    const y = d3
      .scaleLinear()
      //  .rangeRound([contentHeight, 0])
      .range([contentHeight, 0])
      .nice()
      .domain([0, 1.1 * +d3.max(this.data, d => d[this.yLabel])]);
    this.svg.append('text')
      .classed('chart-label', true)
      .attr('transform', 'rotate(-90)')
      .attr('y', -50)
      .attr('x', 0 - (contentHeight / 2))
      .text(this.titleCase(this.dimension || this.xLabel));

    this.svg.append('text')
      .classed('chart-label', true)
      .attr('y', contentHeight + 45)
      .attr('x', contentWidth / 2)
      .style('text-anchor', 'middle')
      .text(this.titleCase(this.yLabel));

    const leftAxis = d3.axisLeft(y).tickSize(-contentWidth);

    this.svg.append('g')
      .classed('axisleft', true)
      .call(leftAxis);

    const axisBottom = this.svg.append('g')
      .classed('axisbottom', true)
      .attr('transform', 'translate(0,' + (contentHeight + 5) + ')')
      .call(d3.axisBottom(x).tickSize(-contentHeight).tickFormat((d: any) => this.titleCase(this.sliceText(d, x))));

    const line = d3.line()
      .x(d => x.bandwidth() / 2 + x(d[this.xLabel]))
      .y(d => y(d[this.yLabel]))
      .curve(d3.curveCardinal);

    this.svg.append('path')
      .datum(this.data)
      .attr('d', line)
      .attr('class', 'line');
    // Line Transition
    // this.svg.selectAll('.line').datum(this.data).attr('d', line).call(this.lineTransition);

    // Line Tooltip
    this.svg.selectAll('circle')
      .data(this.data, d => d[this.xLabel])
      .join('circle')
      .attr('class', 'circle dots')
      .attr('r', 5)
      .attr('cx', d => x.bandwidth() / 2 + x(d[this.xLabel]))
      .attr('cy', d => y(d[this.yLabel]))

      .on('mouseover', (event, data) => {

        this.tooltip.transition().duration(500).style('opacity', 1);
        const rows = [data];
        const table = this.tooltip.selectAll('table') // .data(rows, d => d[this.xLabel])          
        .data([1])
        .join(
          enter => {
            enter.append('table')
            .append('tr').append('th').attr('colspan', 3).html(that.titleCase(data[that.xLabel]));
          },
          update => { update.select('th').html(that.titleCase(data[that.xLabel])); }
        );
        const content = this.tooltip.select('table').selectAll('.tr-data').data(rows, d => d[that.xLabel]);

        content.join(
          enter => {
            const r = enter.append('tr')
              .classed('tr-data', true);

            r.append('td').classed('legend', true)
              // .style('color', d => color(d[that.xLabel]))
              .style('color', d => 'steelblue')
              .style('font-size', '1.8em')
              .html('&#9679;');  // .html('&#9632;');

            r.append('td').classed('name', true)
              .text(d => that.titleCase(this.dimension || that.xLabel));

            r.append('td').classed('value', true)
              .text(d => d[that.yLabel]);
            return r;

          });

      })
      .on('mousemove', (event, data) => {
        const coords = d3.pointer(event, this.svg);
        const sizes = this.tooltip.node().getBoundingClientRect();
        const shiftX = -10;
        const shiftY = -75;
        const posX = contentWidth - coords[0] - sizes.width + 60 > 0 ? coords[0] : coords[0] - 75 - sizes.width;
        this.tooltip // .style('opacity', 1)
          .style('left', (posX + shiftX) + 'px')
          .style('top', (coords[1] + shiftY) + 'px');
      })
      .on('mouseout', () => this.tooltip.style('opacity', 0));
  }

  private sliceText(text, band) {
    const len = band.bandwidth() / 10;
    return text.length > len ? text.substring(0, len) + '..' : text;
  }
  // // ----------------Line Transition-----------
  // private lineTransition(path) {
  //   path.transition().duration(3000).attrTween('stroke-dasharray', this.tweenDash);
  // }

  // private tweenDash() {
  //   const path = this.svg.selectAll('.line');
  //   const l = path.get(0).getTotalLength();
  //   const i = d3.interpolateString('0,' + l, l + ',' + l);
  //   return (t) => i(t);
  // }
}


