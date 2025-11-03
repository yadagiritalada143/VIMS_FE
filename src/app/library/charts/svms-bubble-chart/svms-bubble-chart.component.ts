import { Component, OnInit, Input, ViewEncapsulation } from '@angular/core';
import * as d3 from 'd3';
import { BasicChartComponent } from '../basic-chart/basic-chart.component';

const COLORS =  ['#16A085', '#6bd1cb', '#53bdf7', '#9c8cf9', '#f28cbe', '#ffb18d', '#ff8c9b', '#4EF26D', '#24B57C', '#6E9573', '#84F45F', '#B5A36B', '#B1EDEF', '#AA2739', '#304AEB', '#B3E7A3', '#97B823', '#26149D', '#EA8F24', '#6C10B7', '#1655DD', '#49B23A', '#C04B88', '#7696D9', '#28BBDA', '#FE27D6', '#457273', '#FEA52D', '#184D37', '#0AA80E', '#FB4976', '#18DA09', '#D91A10', '#915522', '#61234D', '#43FEC9', '#AC80A4', '#4D0F3B', '#BBE6B1', '#9BED42', '#1DCFC0', '#7E4312', '#03DE31', '#CAEBE7', '#39827A', '#4D21A0', '#E87622', '#67CDC0', '#E1B464', '#08F015', '#CDE8DB', '#CEBB0B', '#3A33FD', '#043540', '#76367D', '#D86770', '#109768', '#FD11D2', '#8A5642', '#1C1F13', '#3C9B10', '#36DF70', '#679655', '#42753B', '#115D44', '#E8EAD2', '#51B2BE', '#FBFCC6', '#47BA77', '#B3032E', '#AA3928', '#61E918', '#1896F1', '#365B0A', '#41D26E', '#E1C2C7', '#19E48F', '#E414C0', '#4FD0F2', '#794088', '#7CC70A', '#6A156B', '#B986BD', '#D5C669', '#571A05', '#51E2C9', '#8EC86B', '#BD5BC1', '#504716', '#8934FE', '#41112B', '#D0BDAD', '#F7011E', '#9A3622', '#E856F6', '#1C36F4', '#C1C820', '#7CA267', '#DD5943', '#DEF1B7', '#387A35', '#F9809C', '#70B97E', '#EBFDA7', '#104663'];


@Component({
  selector: 'svms-bubble-chart',
  templateUrl: './svms-bubble-chart.component.html',
  styleUrls: ['./svms-bubble-chart.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class SvmsBubbleChartComponent extends BasicChartComponent implements OnInit {
  @Input() margin = 0;
  @Input() value = 'Count';
  @Input() label = 'headcount';
  @Input() dimension = 'headcount';
  @Input() onHoverIncreaseEffect = true;
  @Input() removePrevChartsBeforeInit = true;
  @Input() set chartData(data) {
    if (data.length) {
      const firstElem = data[0];
      const keys = Object.keys(firstElem);
      keys.forEach(key => {
        if (!isNaN(Number(firstElem[key]))) {
          this.value = key;
        } else {
          this.label = key;
        }
      });

      this.data = data;
      this.initRedrawChart(true);
    }
  }

  data: any = {
    label: [],
    value: []
  };
  // legend dimensions
  legendRectSize = 6; // defines the size of the colored squares in legend
  legendSpacing = 6; // defines spacing between squares
  minNodeSize = 15;

  radius = 0;
  svg: any;
  color: any;
  div: any;
  tooltip: any;
  bubbleId = 'bubbleId';
  simulation: any;
  nodes = [];
  links = [];

  bubbleIdList: string[] = [];

  constructor() {
    super();
  }

  ngOnInit() {
    d3.select('.bubble').remove();
   // this.color = d3.scaleOrdinal(d3.schemePaired);
  }

  drawChart() {
    d3.select('#bubbleId').html('');
    if (this.data?.length && (this.data[0] === 'no_data' || this.data[0] === 'error')) {
      d3.select('#bubbleId')
        .html(this.data[0] === 'no_data' ? 'No Data Available' : 'Error in Loading the Data')
        .style('font-size', '1.5em')
        .style('font-weight', 600)
        .style('color', 'rgb(185 183 183)');
      return;
    } else if (!this.data?.length) {
      d3.select('#bubbleId').html('Loading...').style('font-size', '1.5em').style('font-weight', 600).style('color', 'rgb(185 183 183)');
      return
    }
    d3.select('.bubble').remove();
    d3.select('.bubbleTooltip').remove();
    this.drawFields();
    this.drawBubbles();
  }

  private drawFields() {
    d3.select('.bubbleTooltip').remove();
    this.radius = (Math.min(this.chartWidth, this.chartHeight) / 2);
    this.svg = d3.select(`#bubbleId`)
      .append('svg')
      .attr('width', this.chartWidth + 50)
      .attr('height', this.chartHeight)
      .attr('class', 'bubble')
      .append('g')
      .attr('transform', 'translate(' + ('40') + ' ,' + ('0') + ')');


    this.tooltip = d3.select('#tooltip-oneline');
    /* this.tooltip = d3.select('#bubbleHoverId').hoin('div')
      .attr('class', 'bubbleTooltip').attr('id','tooltip-oneline').style('opacity', 0); */

  }

  private drawBubbles() {

    const that = this;

    const data =  JSON.parse(JSON.stringify(this.data));
    const color = d3.scaleOrdinal(COLORS)
      .domain(data.map(d => d[this.label]));

    const circleR = d3.scaleLinear()
      .domain([0, d3.max(data, d => +d[this.value])])
      .range([0, 100]);

    data.forEach(d => {
      d.r = d3.max([this.minNodeSize, circleR(+d[this.value])]);
      d.x =  this.chartWidth / 2;
      d.y =  this.chartHeight / 2;
    });

    this.simulation = d3.forceSimulation()
        // .force("link", d3.forceLink(this.links).id(d => d.id))
         .force('charge', d3.forceManyBody().strength(-900))
        .force('x', d3.forceX().x(this.chartWidth / 2).strength(1))
        .force('y', d3.forceY().y(this.chartHeight / 2).strength(1))
        .force('collide', d3.forceCollide(d  => d['r'] + 4).strength(1));

    const nodes = this.svg.selectAll('.nodes')
      .data(data)
      .join(
       g => {
        const enter = g.append('g')
          .classed('nodes', true);
         // .on('mouseover', e => nodes.style('opacity', 0.7).filter(d => d.id === data.id).style('opacity', 1))
         // .on('mouseout', e => nodes.style('opacity', 0.9) );


        enter
          .append('text')
            // .attr('dy', d => d.r < 10 ? -10 : 4)
            .attr('dy',  0)
            .text( d => d[that.label])
            .each( function(d) {
                const el = d3.select(this);
                const sizes = el.node().getBoundingClientRect();
                const koeff = sizes.width / d.r / 1.4;
                if ( koeff > 1) {
                  el.text(d[that.label].substring(0, Math.ceil(d[that.label].length /  koeff)));
                }
            })
            .append('tspan')
            .attr('dy', 10)
            .attr('x', 0)
            .text(d => d[that.value])

           /* .clone(true).lower()
            .attr('fill', 'none')
            .attr('stroke', 'white')
            .attr('stroke-width', 3);
          */
        enter
            .append('circle')
            .attr('r', d => d.r)
            .attr('fill', d => color(d[this.label]) )
            .lower()
            .on('mouseover', function(e, data) {

              that.tooltip.transition().duration(100).style('opacity', 1);
              const table = that.tooltip.selectAll('table')
                .data([1])
                .join(
                  enter => {
                    enter.append('table')
                    .append('tr').append('th').attr('colspan', 3).html(that.titleCase(data[that.label]));
                  },
                  update => { update.select('th').html(that.titleCase(data[that.label])); }
                );
              const rows = [data];
              const content = that.tooltip.select('table').selectAll('.tr-data').data(rows, d => d[that.label]);
              content.join(
                enter => {
                  const r = enter.append('tr')
                    .classed('tr-data', true);

                  r.append('td').classed('legend', true)
                    .style('color', d => color(d[that.label]))
                    .style('font-size', '1.8em')
                    .html('&#9679;');  // .html('&#9632;');

                  r.append('td').classed('name', true)
                    .text(d => that.titleCase(this.dimension || that.label));

                  r.append('td').classed('value', true)
                    .text(d => d[that.value]);

                  return r;

                }
                );

            })
            .on('mousemove', e => {
              const coords = d3.pointer(e, that.svg);
              const shiftX =  15;  // + this.chartWidth / 2;
              const shiftY = 0; // + this.chartHeight / 2;
              that.tooltip
                .style('opacity', 1)
                .style('left', (coords[0] + shiftX) + 'px')
                .style('top', (coords[1] + shiftY) + 'px');
            })
            .on('mouseout', () => this.tooltip.style('opacity', 0))
            .transition().duration(500).style('opacity', 1);

        return enter;
      });


    this.simulation
     // .velocityDecay(0.7)
      .alpha(0.3)
      .nodes(data)
      .on('tick', () => d3.selectAll('.nodes').attr('transform', d => {
        d['x'] = Math.max( Math.min(d['x'], this.chartWidth-d['r']), d['r'] );
        d['y'] = Math.max( Math.min(d['y'], this.chartHeight-d['r']), d['r'] );
        return `translate(${d['x']},${d['y']})`;
       }));

    // d3.select(self.frameElement).style('height', diameter + 'px');
  }

  private sliceTitle(title: string) {
    return title.length >= 18 ? title.slice(0, 10) + '...' + title.concat(' ').slice(-7, -1) : title;
  }

  private titleCase(str) {
    const splitStr = str.toLowerCase().split(' ');
    for (let i = 0; i < splitStr.length; i++) {
      splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
    }
    return splitStr.join(' ');
  }
}
