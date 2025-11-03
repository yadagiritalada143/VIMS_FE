import { Component, Input, OnInit } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'svms-spiral-chart',
  templateUrl: './svms-spiral-chart.component.html',
  styleUrls: ['./svms-spiral-chart.component.scss'],
})
export class SvmsSpiralChartComponent implements OnInit {
  @Input() data: any;
  @Input() height: number = 500;
  @Input() width: number = 500;
  @Input() xLabel = 'date';
  @Input() yLabel = 'amount';

  private svg: any;
  private start = 0;
  private end = 2.25;
  private numSpirals = 4;

  @Input() set chart(data) {
    if (data.length) {
      d3.select('#spiralId').html('');
      this.data = data;
      // temporary mock data, should be recieved from props
      this.data = [
        { amount: '500.000', date: '2020-05-05' },
        { amount: '2040.000', date: '2020-09-22' },
        { amount: '2945.000', date: '2020-09-23' },
        { amount: '3007.500', date: '2020-09-24' },
        { amount: '3200.000', date: '2020-09-25' },
        { amount: '1669.200', date: '2020-09-26' },
        { amount: '380.000', date: '2020-10-09' },
        { amount: '405.000', date: '2020-10-10' },
        { amount: '20.000', date: '2020-11-01' },
        { amount: '391.500', date: '2020-11-02' },
        { amount: '411.900', date: '2020-11-03' },
        { amount: '423.100', date: '2020-11-04' },
        { amount: '435.100', date: '2020-11-05' },
        { amount: '411.900', date: '2020-11-06' },
        { amount: '222.260', date: '2021-01-26' },
        { amount: '613.740', date: '2021-01-27' },
        { amount: '26.500', date: '2021-01-28' },
        { amount: '26.500', date: '2021-01-29' },
        { amount: '9.010', date: '2021-01-30' },
        { amount: '150.000', date: '2021-03-03' },
        { amount: '10.000', date: '2021-03-05' },
      ];

      const keys = Object.keys(this.data[0]);

      (this.yLabel = keys[0]), (this.xLabel = keys[1]);

      this.initializeSpiralComponents();
    } else {
      d3.select('#spiralId')
        .html('No Data Available')
        .style('font-size', '1.5em')
        .style('font-weight', 600)
        .style('color', 'rgb(185 183 183)');
      return;
    }
  }

  get chart() {
    return this.data;
  }

  constructor() {}

  ngOnInit(): void {}

  private initializeSpiralComponents() {
    this.data.forEach((d) => {
      d[this.yLabel] = +d[this.yLabel];
    });

    this.drawSpiral();
  }

  private drawSpiral() {
    const theta = (r) => this.numSpirals * Math.PI * r;

    const r = d3.min([this.width, this.height]) / 2 - 40;

    const radius = d3
      .scaleLinear()
      .domain([this.start, this.end])
      .range([40, r]);

    this.svg = d3
      .select('#spiralId')
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .attr(
        'transform',
        'translate(' + this.width / 2 + ',' + this.height / 2 + ')'
      );

    const points = d3.range(
      this.start,
      this.end + 0.001,
      (this.end - this.start) / 1000
    );
    const spiral = d3
      .lineRadial()
      .curve(d3.curveCardinal)
      .angle(theta)
      .radius(<any>radius);

    const path = this.svg
      .append('path')
      .datum(points)
      .attr('id', 'spiral')
      .attr('d', spiral)
      .style('fill', 'none')
      .style('stroke', 'steelblue');

    this.data = this.data.map((item) => {
      const data = item.date.split('-');
      const convertedData = new Date(data[0], data[1] - 1, data[2]);
      return {
        amount: item.amount,
        date: convertedData,
      };
    });

    const spiralLength = path.node().getTotalLength(),
      coef = 30,
      N = this.data.length * coef,
      barWidth = spiralLength / N - 1;

    const someData: { date: Date; value: number }[] = this.data.map(
      ({ amount, date }) => ({
        date,
        value: amount,
      })
    );

    // here's our time scale that'll run along the spiral
    const timeScale = d3
      .scaleTime()
      .domain(
        d3.extent(someData, function (d) {
          return d.date;
        })
      )
      .range([0, spiralLength]);

    // yScale for the bar height
    const yScale = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(someData, function (d) {
          return d.value;
        }),
      ])
      .range([0, r / this.numSpirals - 30]);

    // append our rects
    this.svg
      .selectAll('rect')
      .data(someData)
      .enter()
      .append('rect')
      .attr('x', function (d, i) {
        // placement calculations
        const linePer = timeScale(d.date),
          posOnLine = path.node().getPointAtLength(linePer),
          angleOnLine = path.node().getPointAtLength(linePer - barWidth);

        d.linePer = linePer; // % distance are on the spiral
        d.x = posOnLine.x; // x postion on the spiral
        d.y = posOnLine.y; // y position on the spiral

        d.a = (Math.atan2(angleOnLine.y, angleOnLine.x) * 180) / Math.PI - 90; //angle at the spiral position

        return d.x;
      })
      .attr('y', function (d) {
        return d.y;
      })
      .attr('width', function (d) {
        return barWidth;
      })
      .attr('height', function (d) {
        return yScale(d.value);
      })
      .style('fill', 'steelblue')
      .style('stroke', 'none')
      .attr('transform', function (d) {
        return 'rotate(' + d.a + ',' + d.x + ',' + d.y + ')'; // rotate the bar
      });

    // add date labels
    const tF = d3.timeFormat('%b %Y'),
      firstInMonth = {};
    this.svg
      .selectAll('text')
      .data(someData)
      .enter()
      .append('text')
      .attr('dy', 10)
      .style('text-anchor', 'start')
      .style('font', '10px arial')
      .append('textPath')
      // only add for the first of each month
      .filter(function (d) {
        const sd = tF(d.date);
        if (!firstInMonth[sd]) {
          firstInMonth[sd] = 1;
          return true;
        }
        return false;
      })
      .text(function (d) {
        return tF(d.date);
      })
      // place text along spiral
      .attr('xlink:href', '#spiral')
      .style('fill', 'grey')
      .attr('startOffset', function (d) {
        return (d.linePer / spiralLength) * 100 + '%';
      });
  }
}
