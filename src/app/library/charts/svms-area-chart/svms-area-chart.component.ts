import { Component, Input, ViewEncapsulation } from '@angular/core';
import * as d3 from 'd3';
import { BasicChartComponent } from '../basic-chart/basic-chart.component';

const COLORS = ['#ee9247', '#427bb2'];
const DataSets = ['Overtime Bill rate', 'Regular bill rate'];
const xAxisFormat = d3.timeFormat('%b');
const formatTime = d3.timeFormat('%B %d, %Y');

@Component({
  selector: 'svms-area-chart',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './svms-area-chart.component.html',
  styleUrls: ['./svms-area-chart.component.scss']
})
export class SvmsAreaChartComponent extends BasicChartComponent {

  data: any;
  svg: any;


  @Input() xSecondLabel = '';
  @Input() margin: any;

  @Input() set chartData(data) {

    if (data.length > 0) {
      const dateRange = d3.timeMonth.range(new Date(2020, 0, 1), new Date(2021, 0, 1));
      this.data = dateRange.map(d => { const dd = { date: d };
        DataSets.forEach(s => { dd[s] = Math.floor(1000 * Math.random()) } );
        return dd;
      });
      this.initRedrawChart(true);
    } else {
      d3.select('#columnId').html('No Data Available').style('font-size', '1.5em').style('font-weight', 600).style('color', 'rgb(185 183 183)');
    }
  }

  constructor() {
    super();
  }

  drawChart() {
    d3.select('#columnId').html('');

    this.margin = { top: 40, right: 50, bottom: 100, left: 40 };

    this.svg = d3.select('#columnId').selectAll('svg').data([1])
      .join('svg')
      .attr('width', this.chartWidth)
      .attr('height', this.chartHeight)
      .attr('viewBox', `0 0 ${this.chartWidth} ${this.chartHeight}`)
      .append('g')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

    d3.selectAll('#columnHoverId').data([1])
        .join('div')
        .attr('id', 'tooltip')
        .call(d => {

            const row1 = d.append('div')
              .classed('tooltip-row', true);

            row1.append('div')
                .attr('id', 'p0')
                .classed('tooltip-cell header', true)
                .html('header');

            const row2 = d.append('div')
                .classed('tooltip-row', true);

            row2.append('div')
                .attr('id', 'p1')
                .classed('tooltip-cell', true)
                .html('1');

            row2.append('div')
                .attr('id', 'p2')
                .classed('tooltip-cell', true)
                .html('2');
        });

    this.initializeColComponents();
  }

  private initializeColComponents() {
    const contentWidth = this.chartWidth - this.margin.left - this.margin.right;
    const contentHeight = this.chartHeight - this.margin.top - this.margin.bottom;
    const yMax = +d3.max(this.data, d => d3.max(DataSets, dd => d[dd]));

    const bisectDate = d3.bisector((d: any) => d.date).left;


    // const series = d3.stack()
    //  .keys(DataSets)(this.data)
    //  .map(d => (d.forEach((v: any) => v.key = d.key), d))


    const series = DataSets.map((d, i) => {
        const o = { key: d, values: [] };
        this.data.forEach(s => o.values.push({date: s.date, value: s[d] }));
        return o;
    });


    const color = d3.scaleOrdinal()
      .domain(series.map(d => d.key))
      .range(COLORS)
      .unknown('#ccc');

    const y = d3.scaleLinear()
      .range([contentHeight, 0])
      .domain([0, yMax + yMax / 10])
      .nice();

    const xScale = d3.scaleBand()
      .range([0, contentWidth])
      .domain(this.data.map(d => xAxisFormat(d.date)))
      .padding(.2 );

    const ext = d3.extent(this.data, (d: any) => new Date(d.date));
    console.log(ext);
    const x = d3.scaleTime()
      .range([0, contentWidth])
    //  .domain(this.data.map(d => d.date))
      .domain(ext);


    const area = d3.area()
      .curve(d3.curveMonotoneX)
      .x((d: any) => x(d.date) )
      .y0((d: any) => y(0))
      .y1((d: any) => y(d.value));


    const tooltip = d3.select('#tooltip');

    this.svg.append('g')
      .call(d3.axisLeft(y))
      .selectAll('text')
      .classed('axisleft-text', true);

    this.svg.append('g')
      .call(d3.axisLeft(y))
      .selectAll('line, text')
      .attr('x2', this.chartWidth - 120)
      .style('font-size', '8px')
      .style('opacity', '0.05');


    this.svg.append('g')
      .attr('transform', `translate(0, ${contentHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .classed('axisbottom-text', true)
      .attr('transform', 'translate(0, 0) rotate(30)')

    const source = this.svg.selectAll('.areas')
      .data(series)
      .join('g')
        .on('mouseover', (event, data) => {
            d3.select(event.currentTarget.parentElement).selectAll('path').style('opacity', 0.3);
            d3.select(event.currentTarget).select('path').style('opacity', 0.6);
        })
        .on('mousemove', (event, data) => {
          const coords = d3.pointer(event, this.svg);
            const X = Math.min( Math.max(coords[0],0), contentWidth);
            const Xi = +x.invert(X);        
            const i = bisectDate(this.data, Xi, 1);
            const d0 = this.data[i - 1] || this.data[i];
            const d1 = this.data[i];
            const d = Xi - d0.date > d1.date - Xi ? d1 : d0;
            tooltip.select('#p0').style('background-color', <string>color(data.key)).html(data.key);
            // tooltip.select('#p0').style('background-color', data?.key === 'Regular bill rate' ? '#427bb2' : '#ee9247').html(data?.key);
            tooltip.select('#p1').html(formatTime(d.date) + ' : ');
            tooltip.select('#p2').html(d[data.key]);

            tooltip
                //.transition().duration(200)
                .style('opacity',1)
                .style('left',coords[0] + 'px')
                .style('top',coords[1] + 'px'); 
        })
        .attr('class', (d, i) => `areas area-${i}`, true)
        .append('path')
            .style('cursor', 'pointer')
            .style('fill', d => color(d.key))
            .style('opacity', 0.3)
            .attr('d', d => area(d.values) );


    const legend = this.svg.append('g').classed('legend', true)
        .selectAll('.legend-item').data(series)
        .join(
            enter => enter.append('g')
                .classed('legend-item', true)
                .attr('transform', (d, i) => `translate(0,0)`)
                .call(el =>
                    el.append('rect')
                        .attr('fill', d => color(d.key))
                        .style('opacity', 0.5)
                        .attr('width', 14)
                        .attr('height', 14)
                        .attr('rx', 2)
                        .attr('ry', 2) &&
                    el.append('text')
                        .attr('dx', 18)
                        .attr('dy', 11)
                        .text(d => d.key)
                )
                .call(innerEnter => {
                    const w = innerEnter.node().getBoundingClientRect().width;
                    innerEnter.transition().duration(1000)
                    .attr('transform', (d, i) => `translate(${contentWidth - w}, ${i * 20})`);
                })
        );

    }
}
