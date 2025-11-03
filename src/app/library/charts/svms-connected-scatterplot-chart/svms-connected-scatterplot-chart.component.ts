import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import * as d3 from 'd3';
import { BasicChartComponent } from '../basic-chart/basic-chart.component';

@Component({
  selector: 'svms-connected-scatterplot-chart',
  templateUrl: './svms-connected-scatterplot-chart.component.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./svms-connected-scatterplot-chart.component.scss'],
})
export class SvmsConnectedScatterplotChartComponent extends BasicChartComponent implements OnInit {
  chartWidth: number = 900;
  chartHeight: number = 280;
  @Input() data: any;
  @Input() margin: { top: 40; right: 20; bottom: 60; left: 60 };
  @Input() xLabel = 'label';
  @Input() yLabel = 'status';
  @Input() onHoverIncreaseEffect = true;

  @Input() set chartData(data) {
    if (data.length) {
      this.data = data;
      this.initRedrawChart(true);
    }
  }

  svg: any;
  lineTooltip: any;
  color: any;

  get chart() {
    return this.data;
  }

  constructor() {
    super();
  }

  ngOnInit() { }

  drawChart() {
    if (this?.data?.length) {
      d3.select('#connectedScatterplotId').html('');

      const keys = Object.keys(this.data[0]);

      (this.yLabel = keys[0]), (this.xLabel = keys[1]);

      this.initializeLineComponents();
    } else {
      d3.select('#connectedScatterplotId')
        .html('No Data Available')
        .style('font-size', '1.5em')
        .style('font-weight', 600)
        .style('color', 'rgb(185 183 183)');
      return;
    }
  }

  // Captialize Word
  private titleCase(str) {
    const splitStr = str.toLowerCase().split(' ');
    for (var i = 0; i < splitStr.length; i++) {
      splitStr[i] =
        splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
    }
    // Directly return the joined string
    return splitStr.join(' ');
  }

  private initializeLineComponents() {
    this.data.forEach((d) => {
      d[this.yLabel] = +d[this.yLabel];
    });

    this.color = d3.scaleOrdinal(d3.schemePaired);
    this.margin = { top: 40, right: 20, bottom: 60, left: 60 };

    this.svg = d3
      .select('#connectedScatterplotId')
      .append('svg')
      .attr('width', this.chartWidth)
      .attr('height', this.chartHeight)
      .append('g')
      .attr(
        'transform',
        'translate(' + this.margin.left + ',' + this.margin.top + ')'
      );

    this.lineTooltip = d3
      .select('#scatterplotHoverId')
      .append('div')
      .attr('class', 'barToolTip');

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
      .domain(this.data.map((d) => d[this.xLabel]));

    const y = d3
      .scaleLinear()
      .rangeRound([contentHeight, 0])
      .domain([
        0,
        Math.max.apply(
          Math,
          this.data.map((d) => {
            return d[this.yLabel];
          })
        ),
      ]);

    // text label for the x axis
    // this.svg.append("text")
    //   .attr("transform",
    //     "translate(" + (this.chartWidth / 2) + " ," +
    //     (this.chartHeight - 50) + ")")
    //   .style("text-anchor", "middle").style("text-transform", "capitalize")
    //   .text(this.xLabel);

    this.svg
      .append('g')
      .attr('class', 'axis axis--y')
      .attr('transform', 'translate(10, 0)')
      .call(d3.axisLeft(y).ticks(5))
      .call((g) => g.select('.domain').remove())
      .call((g) =>
        g
          .selectAll('.tick line')
          .clone()
          .attr('x2', this.chartWidth)
          .attr('opacity', '0.1')
          .attr('stroke', 'black ')
      )
      .call((g) => g.selectAll('line:first-of-type').attr('stroke', 'none'))
      // Y Axis Label
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '0.71em')
      .attr('text-anchor', 'end');
    // .text(this.yLabel);

    d3.selectAll('text').style('font-size', '12px').style('fill', '#7C828A');

    // text label for the y axis
    this.svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - this.margin.left)
      .attr('x', 0 - (this.chartHeight / 2 - this.margin.bottom))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('text-transform', 'capitalize')
      .text(this.yLabel);

    // --------line Code-----------
    // Line generator function
    const line = d3
      .line()
      .x((d) => {
        return x(d[this.xLabel]) + x.bandwidth() / 2;
      })
      .y((d) => {
        return y(d[this.yLabel]);
      });

    this.svg
      .append('path')
      .datum(this.data)
      .attr('d', line)
      .attr('class', 'line')
      .style('fill', 'none')
      .style('stroke', '#EC6666')
      .style('stroke-width', 2);

    // Add the points
    this.svg
      .append('g')
      .selectAll('dot')
      .data(this.data)
      .enter()
      .append('circle')
      .attr('cx', (d) => {
        return x(d[this.xLabel]) + x.bandwidth() / 2;
      })
      .attr('cy', (d) => {
        return y(d[this.yLabel]);
      })
      .attr('r', 3)
      .attr('fill', '#EC6666');
  }
}
