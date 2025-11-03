import { Component, Input, ViewEncapsulation } from '@angular/core';
import * as d3 from 'd3';
import { BasicChartComponent } from '../basic-chart/basic-chart.component';

//const COLORS = ['#3581b2','#a6e2e0','#52b7a5','#f7bad9','#ffd0bc','#c4b9fb'].reverse();
const COLORS = ['#68c0ff', '#ff7875', '#bfbfbf', '#ffc069'];


  //['#ffbfbf', '#79d2de', '#f3b2ff', '#a3b4ff'];
const statuses = ['open', 'rejected',  'closed', 'pending' ];
const xAxisFormat = d3.timeFormat('%b');
const tooltipDim = d3.timeFormat('%B');

@Component({
  selector: 'svms-stacked-bar-chart',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './svms-stacked-bar-chart.component.html',
  styleUrls: ['./svms-stacked-bar-chart.component.scss']
})
export class SvmsStackedBarChartComponent extends BasicChartComponent {

  data: any;
  svg: any;
  chartHeight = 500;
  chartWidth = 800;
  tooltip: any;

  @Input() xLabel = 'headcount';
  @Input() xSecondLabel = '';
  @Input() yLabel = 'name';
  @Input() margin: any;
  @Input() showAvrg = false;

  @Input() set chartData(data) {
    if (data.length) {
      const dateRange = d3.timeMonth.range(new Date(2020, 0, 1), new Date(2021, 0, 1));
      this.data = dateRange.map(d =>
        { const dd = { date: d }; statuses.forEach(s => { dd[s] = Math.floor(1000 * Math.random()); } );  return dd; }
      );
      this.initRedrawChart(true);
    }
  }

  constructor() {
    super();
   }

  drawChart() {
    d3.select('#columnId').html('');
    if (this?.data?.length) {
      const dateRange = d3.timeMonth.range(new Date(2020, 0, 1), new Date(2021, 0, 1));
      this.data = dateRange.map(d =>
        { const dd = { date: d }; statuses.forEach(s => { dd[s] = Math.floor(1000 * Math.random()); } );  return dd; }
      );
      this.initializeColComponents();
    } else {
      d3.select('#columnId').html('No Data Available').style('font-size', '1.5em').style('font-weight', 600).style('color', 'rgb(185 183 183)');
    }
  }

  private initializeColComponents() {

    this.margin = { top: 35, right: 50, bottom: 35, left: 40 };

    this.svg = d3.select('#columnId').selectAll('svg').data([1])
      .join('svg')
      .attr('width', this.chartWidth)
      .attr('height', this.chartHeight)
      .attr('viewBox', `0 0 ${this.chartWidth} ${this.chartHeight}`)
      .append('g')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

    this.tooltip = d3.select('#columnHoverId').selectAll('#tooltip').data([1]).join("div").attr("id","tooltip");
    this.drawColumns();
  }
  
  
  private titleCase(str) {
    const splitStr = str.toLowerCase().split(' ');
    for (let i = 0; i < splitStr.length; i++) {
      splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
    }
    return splitStr.join(' ');
  }


  private drawColumns() {
    const that = this;
    let currentBar = false;
    const contentWidth = this.chartWidth - this.margin.left - this.margin.right;
    const contentHeight = this.chartHeight - this.margin.top - this.margin.bottom;
    const yMax = d3.max(this.data, d => d3.sum(statuses, dd => d[dd]));
    const series = d3.stack()
      
      .keys(statuses)
     // .order( d3.stackOrderAscending(series)  )
      (this.data)
     
      .map(d => (d.forEach(v => v['key'] = d.key), d))

    const color = d3.scaleOrdinal()
      .domain(statuses)
      .range(COLORS)
      .unknown('#ccc');

    const y = d3.scaleLinear()
      .range([contentHeight, 0])
      .domain([0, yMax]);

    const legend = d3.scaleOrdinal()
      .domain(statuses)
      .range(COLORS)
      .unknown('#dde');

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

    const x = d3.scaleBand()
      .range([0, contentWidth])
      .domain(this.data.map(d => xAxisFormat(d.date)))
      .padding(.1 );

    this.svg.append('g')
      .attr('transform', `translate(0, ${contentHeight})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .classed('axisbottom-text', true)
      .attr('transform', 'translate(0, 0) rotate(30)');


    const seriesT = [];
    series[0].forEach((d,i) => {
      seriesT[i] = series.map(d => {d[i][2] = d[i][1]-d[i][0]; return  d[i] });
      seriesT[i].sort((a,b) => a[2]-b[2] )
      let pos = 0;
      seriesT[i].forEach(d => d[3] = pos += d[2]);
    })
    

    const bars = this.svg
      .selectAll('.bars')
      .data(seriesT)
      .join('g')      
        .classed('bars', true)
      .selectAll('rect')
      .data(d => d)
      .join('rect')
        .classed('bar', true)
        //.attr('rx', 2)
        //.attr('ry', 2)
        .attr('fill', d => color(d.key))
        .attr('x', d => x(xAxisFormat(d.data.date)))
        .attr('y', contentHeight)

        .on('mouseout', function (d) { d3.select(this).classed('selected', false); that.tooltip.transition().duration(100).style('opacity', 0)  })
        .on('mouseover', function (d) { 
            d3.select(this).classed('selected', true) 
            d3.select(this.parentNode).raise();
        }) 
        .on('mousemove', (event, data) => {

          if(currentBar !== data) {
            const table = this.tooltip.selectAll('table').data([1]).enter().append("table");
            table.append("tr").append("th").attr("colspan",3);                  
            this.tooltip.select("th").html(tooltipDim(data.data.date));

            data.data.total = d3.sum(legend.domain(), d => data.data[d]);
            const rows = legend.domain().reverse();
            
            rows.sort((a,b) => data.data[b] - data.data[a]);
            rows.push('total');
                        
            const content = this.tooltip.select('table').selectAll(".tr-data").data(rows);
            content.exit().remove();
            const enter = content.enter().append("tr").classed("tr-data",true)
              .call(d => {
                d.append("td").classed('legend',true)
                d.append("td").classed('name',true)
                d.append("td").classed('value',true)
              })    
            const all = content.merge(enter)
              .classed("selected", d => d === data.key)  
            all.select(".legend").style("color", legend).style('font-size','1.8em').html('&#9632;')  
            all.select(".name").text(d => this.titleCase(d))
            all.select(".value").text(d => data.data[d])
            currentBar = data;
          }
        
          const coords = d3.pointer(event);
          const sizes = this.tooltip.node().getBoundingClientRect();
          const shift = 70;
          const posX = contentWidth - coords[0] - sizes.width  + 50 > 0 ? coords[0] + 15 : coords[0] - 40 - sizes.width;
          this.tooltip.style("opacity",1)
              .style('left',(posX + shift) + 'px')
              .style('top',(coords[1]-this.chartHeight-30) + 'px');           

        });

    bars
      .transition().duration(1000)
      .delay((d, i) => i * 20)
      .attr('height', d  => Math.abs(y(d[0]) - y(d[1] )))
      .attr('width', x.bandwidth())
      .attr('y', d => y(d[3]));

  }
}
