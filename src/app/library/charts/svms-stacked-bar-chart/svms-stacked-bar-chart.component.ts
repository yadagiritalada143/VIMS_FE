import { Component, Input, ViewEncapsulation } from '@angular/core';
import * as d3 from 'd3';
import { BasicChartComponent } from '../basic-chart/basic-chart.component';

const COLORS = ["#9c8cf9", "#f28cbe", "#ffb18d", "#16A085", "#6bd1cb", "#53bdf7", "#9c8cf9", "#f28cbe", "#ffb18d", "#ff8c9b", "#4EF26D", "#24B57C", "#6E9573", "#84F45F", "#B5A36B", "#B1EDEF", "#AA2739", "#304AEB", "#B3E7A3", "#97B823", "#26149D", "#EA8F24", "#6C10B7", "#1655DD", "#49B23A", "#C04B88", "#7696D9", "#28BBDA", "#FE27D6", "#457273", "#FEA52D", "#184D37", "#0AA80E", "#FB4976", "#18DA09", "#D91A10", "#915522", "#61234D", "#43FEC9", "#AC80A4", "#4D0F3B", "#BBE6B1", "#9BED42", "#1DCFC0", "#7E4312", "#03DE31", "#CAEBE7", "#39827A", "#4D21A0", "#E87622", "#67CDC0", "#E1B464", "#08F015", "#CDE8DB", "#CEBB0B", "#3A33FD", "#043540", "#76367D", "#D86770", "#109768", "#FD11D2", "#8A5642", "#1C1F13", "#3C9B10", "#36DF70", "#679655", "#42753B", "#115D44", "#E8EAD2", "#51B2BE", "#FBFCC6", "#47BA77", "#B3032E", "#AA3928", "#61E918", "#1896F1", "#365B0A", "#41D26E", "#E1C2C7", "#19E48F", "#E414C0", "#4FD0F2", "#794088", "#7CC70A", "#6A156B", "#B986BD", "#D5C669", "#571A05", "#51E2C9", "#8EC86B", "#BD5BC1", "#504716", "#8934FE", "#41112B", "#D0BDAD", "#F7011E", "#9A3622", "#E856F6", "#1C36F4", "#C1C820", "#7CA267", "#DD5943", "#DEF1B7", "#387A35", "#F9809C", "#70B97E", "#EBFDA7", "#104663"];
const statuses = ['hit rate score', 'interview rate score',  'offer accepted rate score', 'offer rate score','overall score','response rate score','shortlist rate score'];

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
      // const dateRange = d3.timeMonth.range(new Date(2020, 0, 1), new Date(2021, 0, 1));
      // this.data = dateRange.map(d => {
      //     const dd = { date: d };
      //     let sum = 0;
      //     statuses.forEach(s => {
      //       dd[s] = Math.floor(1000 * Math.random());
      //       sum += dd[s]
      //     } );
      //     dd['total'] = sum - dd['total'];
      //     return dd; }
      // );
      // console.log(this.data);
        
      this.data = data.map(d => {
          const dd = { vendor: d.vendor };
          let sum = 0;
          statuses.forEach(s => {
            let key=s.replace(/ /g, '_'); 
            dd[s] = Number(d[key]); 
            sum += dd[s]
          } );
          dd['total'] = sum;
          return dd; 
        }
      );
      // console.log(this.data)
      this.initRedrawChart();
    }
  }

  constructor() {
    super();
   }

  drawChart() {
    d3.select('#columnId').html('');
    if (this?.data?.length) {
     // const dateRange = d3.timeMonth.range(new Date(2020, 0, 1), new Date(2021, 0, 1));
    //    this.data = dateRange.map(d =>
    //       { const dd = { date: d }; statuses.forEach(s => { dd[s] = Math.floor(1000 * Math.random()); } );  return dd; }
    //     );
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

    const series = d3.stack()
      .keys(statuses)
      (this.data)
      .map(d => (d.forEach(v => v['key'] = d.key), d));

    const color = d3.scaleOrdinal()
      .domain(statuses)
      .range(COLORS)
      .unknown('#ccc');

    //  const yMax = d3.max(this.data, d => d3.sum(statuses, dd => d[dd]));
    const yMax = +d3.max(this.data, d => d3.max(statuses, dd => d[dd]));

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
      .domain(this.data.map(d => d.vendor))
      .padding(.1 );

    this.svg.append('g')
      .attr('transform', `translate(0, ${contentHeight})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .classed('axisbottom-text', true)
      .attr('transform', 'translate(0, 0) rotate(30)');

    const seriesT = [];
    series[0].forEach((d, i) => {

      const ser = series.map(s => {s[i][2] = s[i][1] - s[i][0]; return s[i]; });
      ser.sort((a, b) => b[2] - a[2] );
      let pos = 0;
      // ser.forEach((d: any) => { d[3] = pos += d[2]; d.right = x.bandwidth()/2, d.width = x.bandwidth()/2 });
      ser.forEach((s: any) => { s[3] = pos += d[2]; s.right = 0, s.width = x.bandwidth(); });
      //    ser[0]['right'] = 50;
      //    ser[0]['width'] = x.bandwidth()/4
      seriesT.push(ser);
      //  seriesT.push( [{0: 0, 1: pos, 2: pos, key: 'total', width: x.bandwidth()/4, data: {date: ser[0].data.date }, right: 50 }]);
    });
    // console.log(seriesT);

    const bars = this.svg
      .selectAll('.bars')
      .data(seriesT)
      .join('g')
        .classed('bars', true)
      .selectAll('rect')
      .data(d => d)
      .join('rect')
        .classed('bar', true)
        // .attr('rx', 2)
        // .attr('ry', 2)
        .attr('fill', d => color(d.key))
        .attr('x', d => (d.right || 0) + x(d.data.vendor) )
        .attr('y', contentHeight)

        .on('mouseout', function(d) {
          d3.select(this).classed('selected', false);
          that.tooltip.transition().duration(100).style('opacity', 0);
          d3.select(this.parentNode).selectAll('rect').sort( (a, b) => b[2] - a[2]);
        })
        .on('mouseover', function(d) {
            d3.select(this).classed('selected', true).raise();
        })
        .on('mousemove', (event, data) => {

          if (currentBar !== data) {
            const table = this.tooltip.selectAll('table').data([1]).enter().append('table');
            table.append('tr').append('th').attr('colspan', 3);
            this.tooltip.select('th').html(data.data.vendor);

            data.data.total = d3.sum(legend.domain(), d => data.data[d]);
            const rows = legend.domain().reverse();
            rows.sort((a, b) => data.data[b] - data.data[a]);
            //  rows.push(rows.shift());
            rows.push('total');

            const content = this.tooltip.select('table').selectAll('.tr-data').data(rows);
            content.exit().remove();
            const enter = content.enter().append('tr').classed('tr-data', true)
              .call(d => {
                d.append('td').classed('legend', true);
                d.append('td').classed('name', true);
                d.append('td').classed('value', true);
              });
            const all = content.merge(enter)
              .classed('selected', d => d === data.key);
            all.select('.legend').style('color', legend).style('font-size', '1.8em').html('&#9632;');
            all.select('.name').text(d => this.titleCase(d));
            all.select('.value').text(d => data.data[d]);
            currentBar = data;
          }

          const coords = d3.pointer(event);
          const sizes = this.tooltip.node().getBoundingClientRect();
          const shift = 70;
          const posX = contentWidth - coords[0] - sizes.width  + 50 > 0 ? coords[0] + 15 : coords[0] - 40 - sizes.width;
          this.tooltip.style('opacity', 1)
              .style('left', (posX + shift) + 'px')
              .style('top', (coords[1] - this.chartHeight - 30) + 'px');

        });

    bars
      .transition().duration(1000)

      .delay((d, i) => i * 20)
      // .attr('height', d  => Math.abs(y(d[0]) - y(d[1] )))
      .attr('height', d  => y(d[0]) - y(d[1]) )
      .attr('width', d => d.width)
      // .attr('y', d => y(d[3]));
      .attr('y', d => y(d[2]));

  }
}
