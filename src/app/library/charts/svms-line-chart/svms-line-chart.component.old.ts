import { Component, OnInit, Input, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
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
  @Input() xLabel = 'label';
  @Input() yLabel = 'status';
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

  @Input() set chartData(data) {
    if (data.length) {
      this.data = data;
      const keys = Object.keys(this.data[0]);
      this.yLabel = keys[0];
      this.xLabel = keys[1];
      console.log(this.data);
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
    if (this.data) {
      this.initializeLineComponents();
    } else {
      d3.select('#lineId').html('No Data Available')
        .style('font-size', '1.5em')
        .style('font-weight', 600)
        .style('color', 'rgb(185 183 183)');
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
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

    this.lineTooltip = d3.select('#lineHoverId').append('div').attr('class', 'barToolTip');

    this.drawPath();
  }

  private drawPath() {

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
      .rangeRound([contentHeight, 0])
      .domain([0, Math.max.apply(Math, this.data.map(d => {
        return d[this.yLabel];
      }))]);

    if (this.isBackgroundVisible) {
      this.svg.append('linearGradient')
        .attr('id', 'line-gradient')
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', 0).attr('y1', y(0))
        .attr('x2', 0).attr('y2', y(contentHeight * 2))
        .selectAll('stop')
        .data([
          { offset: '0%', color: 'purple' },
          { offset: '40%', color: 'white' },
        ])
        .enter().append('stop')
        .attr('offset', (d) => d.offset)
        .attr('stop-color', (d) => d.color);

      this.svg.append('g')
        .attr('class', 'axis axis--x')
        .attr('transform', 'translate(0,' + contentHeight + ')')
        .call(d3.axisBottom(x))
        .call((g) =>
          g
            .selectAll('.tick line')
            .clone()
            .attr('class', 'gradient-line')
            .attr('y2', -contentHeight)
            .attr('yr', 10)
            .attr('stroke-width', (contentWidth / this.data.length) - 5)
        )
        .call((g) =>
          g
            .selectAll('.tick text')
            .attr('transform', 'rotate(30)')
            .attr('text-anchor', 'start')
        );


    } else {
      this.svg.append('text')
        .attr('transform',
          'translate(' + (this.chartHeight / 2) + ' ,' +
          (this.chartHeight - 50) + ')')
        .style('text-anchor', 'middle').style('text-transform', 'capitalize')
        .text(this.xLabel);

      this.svg
        .append('linearGradient')
        .attr('id', 'area-gradient')
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '65%')
        .selectAll('stop')
        .data([
          { offset: '0%', color: '#147AD6' },
          { offset: '100%', color: '#fff' },
        ])
        .enter()
        .append('stop')
        .attr('offset', (d: any) => d.offset)
        .attr('stop-color', (d) => d.color);
    }

    this.svg.append('g')
      .attr('class', 'axis axis--y')
      .attr('transform', 'translate(10, 0)')
      .call(d3.axisLeft(y).ticks(5))
      .call(g => g.select('.domain').remove())
      .selectAll('line')
      .attr('class', 'line--y')
      // Y Axis Label

/*

    this.svg.append('g')
      .append('text')
      .classed('chart-label', true)
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '0.71em')
      .attr('text-anchor', 'end')
      .text(this.yLabel);

    d3.selectAll('text').style('font-size', '10px').style('fill', '#7C828A');

    // text label for the y axis
    this.svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - this.margin.left)
      .attr('x', 0 - ((this.chartHeight / 2) - (this.margin.bottom)))
      .attr('dy', '1em')
      .style('text-anchor', 'middle').style('text-transform', 'capitalize')
      .text(this.yLabel);
*/

    this.svg.append('text')
      .classed('chart-label', true)
      .attr('transform', 'rotate(-90)')
      .attr('y', -50)
      .attr('x', 0 - (contentHeight / 2) )
      .text(this.titleCase(this.xLabel));

    this.svg.append('text')
      .classed('chart-label', true)
      .attr('y', contentHeight + 45)
      .attr('x', contentWidth / 2)
      .style('text-anchor', 'middle')
      .text(this.titleCase(this.yLabel));



      // --------area Code-----------
    // Area generator function
    const area = d3.area()
      .x0(d => (x(d[this.xLabel]) + (x.bandwidth() / 2)))
      .y0(y(0))
      .y1(d => y(d[this.yLabel]))
      .curve(d3.curveCardinal);

    // --------line Code-----------
    // Line generator function
    const line = d3.line()
      .x(d => (x(d[this.xLabel]) + (x.bandwidth() / 2)))
      .y(d => y(d[this.yLabel]))
      .curve(d3.curveCardinal);

    // Add path
    this.svg.append('path')
      .datum(this.data)
      .attr('d', area)
      .style('fill', 'url(#area-gradient)')
      .style('fill-opacity', 0.5)
      .style('stroke', 'none');

    this.svg.append('path')
      .datum(this.data)
      .attr('d', line)
      .attr('class', 'line')
      .style('fill', 'none')
      .style('stroke', 'steelblue')
      .style('stroke-width', 2);

    this.svg.append('line')
      .data(this.data)
      .attr('x', 0)
      .attr('y', 0)
      .attr('x2', 20)
      .attr('y2', 300)
      .attr('class', 'background-area')
      .attr('fill', 'grey');
    // Line Transition
    // this.svg.selectAll('.line').datum(this.data).attr('d', line).call(this.lineTransition);

    // Line Tooltip
    this.svg.selectAll('dot')
      .data(this.data)
      .enter().append('circle').attr('class', 'circle')
      .attr('r', 3)
      .attr('cx', d => x(d.xLabel))
      .attr('cy', d => y(d.yLabel))
      .on('mouseover', (d, i) => {
        const name = (this.titleCase(i[this.xLabel].replace(/_/g, ' ')));
        this.lineTooltip
          .style('left', Math.abs(d.pageX - 20) + 'px')
          .style('top', Math.abs(d.pageY - 150) + 'px')
          .style('opacity', 1)
          .html(name + ': ' + (i[this.yLabel]));
      })
      .on('mouseout', d => {
        this.lineTooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });

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


