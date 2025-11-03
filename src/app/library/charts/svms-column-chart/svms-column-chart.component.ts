import { Component, Input, Output, EventEmitter, ViewEncapsulation, AfterViewInit } from '@angular/core';
import * as d3 from 'd3';
const BLUE = '#167ad6';
// const RED = '#ec6667';
const GRAY = '#ced5e1';
@Component({
  selector: 'svms-column-chart',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './svms-column-chart.component.html',
  styleUrls: ['./svms-column-chart.component.scss']
})
export class SvmsColumnChartComponent implements AfterViewInit {
  data: any;
  @Output() setLegendColors = new EventEmitter();
  @Input() height = 500;
  @Input() width = 800;
  @Input() xLabel = 'headcount';
  @Input() xSecondLabel = '';
  @Input() yLabel = 'name';
  @Input() margin: any;
  @Input() showAvrg = false;
  @Input() noScroll = true;
  @Input() hideLabels = false;
  @Input() colorsScheme: string[];
  @Input() chartId: string;

  @Input() set chart(data) {
    const chartId = this.chartId ? `-${this.chartId}` : Math.floor(Math.random() * 1000);
    this.columnChartId = 'columnId' + chartId;
    this.columnHoverId = 'columnHoverId' + chartId;
    d3.select('#' + this.columnChartId).html('').style('overflow', this.noScroll ? 'hidden' : 'scroll');

    this.chartData = data.YTD || data;
    this.data = {
      value: [],
      label: []
    };
    if (this.chartData.length) {
      const firstElem = this.chartData[0];
      const keys = Object.keys(firstElem);
      keys.forEach(key => {
        if (!Number(firstElem[key]) && Number(firstElem[key]) !== 0) {
          this.yLabel = key;
        } else {
          this.xLabel = key;
        }
      });
    }
    this.data.label = this.chartData.map((elem: any) => elem[this.yLabel]);
    this.data.value.push([...this.chartData.map((elem: any) => Number(elem[this.xLabel]))]);
    if (this.xSecondLabel) {
      this.data.value.push([...this.chartData.map((elem: any) => Number(elem[this.xSecondLabel]))]);
    }
    if (this.chartData.length) {
      if (!this.hideLabels) {
        this.width = 330 + this.data.label.length * this.data.value.length * 20;
      }
      this.isInitializationAllowed = true;
    } else {
      d3.select('#' + this.columnChartId).html('No Data Available').style('font-size', '1.5em').style('font-weight', 600).style('color', 'rgb(185 183 183)');
      return;
    }
  }
  svg: any;
  tooltip: any;
  color: any;
  gray: any;
  level = 0;
  chartData = [];
  columnChartId = '';
  columnHoverId = '';
  isInitializationAllowed = false;

  ngAfterViewInit() {
    if (this.isInitializationAllowed) {
      this.initializeColComponents();
    }
  }

  private initializeColComponents() {

    this.color = d3.scaleOrdinal(this.colorsScheme ?? [BLUE]);
    this.gray = d3.scaleOrdinal([GRAY]);

    this.svg = d3.select('#' + this.columnChartId)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .attr('transform', 'translate(' + (this.margin?.left ?? 40) + ',' + (this.margin?.top ?? 40) + ')');
    this.margin = { top: 40, right: 50, bottom: 100, left: 40 };

    this.tooltip = d3.select('#' + this.columnHoverId).append('div').attr('class', 'columnToolTip').style('opacity', 0);

    this.drawColumns();
  }

  private drawColumns() {
    const contentWidth = this.width - this.margin.left - this.margin.right;
    const contentHeight = this.height - this.margin.top - this.margin.bottom;
    const yMax = Math.max.apply(Math, this.data.value.map(elem => Math.max.apply(Math, elem)));
    const yAvrg = this.data.value
      .map(elem => elem.reduce((acc, cur) => acc + cur) / elem.length)
      .reduce((acc, cur) => acc + cur) / this.data.value.length;

    const yScale = d3.scaleLinear()
      .range([contentHeight, 0])
      .domain([0, yMax]);

    this.svg.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .style('margin', '0 50px')
      .style('font-size', '8px')
      .style('opacity', '0.5');

    this.svg.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('line, text')
      .attr('x2', this.width - 120)
      .style('font-size', '8px')
      .style('opacity', '0.05');

    const xScale = d3.scaleBand()
      .range([0, contentWidth])
      .domain(this.data.label.map(elem => elem))
      .padding(.2 * this.data.value.length);

    if (!this.hideLabels) {
      this.svg.append('g')
        .attr('transform', `translate(-15, ${contentHeight})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .attr('transform', 'translate(20, 0) rotate(30)')
        .style('text-anchor', 'start')
        .style('text-transform', 'uppercase')
        .style('font-size', '8px')
        .style('font-weight', 'bold');
    }

    for (let j = 0; j < this.data.value.length; j++) {
      this.svg.selectAll()
        .data(this.data.value[j])
        .enter()
        .append('rect')
        .attr('x', (s: any, i: number) =>
          xScale(this.data.label[i]) + 30 * j - 5 * (this.data.value.length - 1))
        .attr('rx', this.data.value.length > 1 ? '10' : '5')
        .attr('y', (s) => yScale(s))
        .attr('height', (s) => contentHeight - yScale(s))
        .attr('width', xScale.bandwidth() / this.data.value.length)
        .attr('fill', (d: any) => {
          const colorIdx = this.data.value[j].indexOf(d);
          if (this.colorsScheme) {
            this.setLegendColors.emit(this.data.value[j].map((_, i) =>
              ({ label: this.data.label[i], color: this.color(i) }))
            );
          }
          return (d < yAvrg) && this.showAvrg ? this.gray() : this.color(colorIdx);
        });
    }
  }
}
