import { Component, OnInit, Input, HostListener, ViewEncapsulation } from '@angular/core';
import * as d3 from 'd3';
import { BasicChartComponent } from '../basic-chart/basic-chart.component';
import { AccuracyConfigEnum } from 'src/app/assignment/enums/accuracy-config';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';


// const COLORS = ['#5E71FE','#0066FF','#79D2DE','#FFBFBF','#F3B2FF','#FFC069','#69C0FF','#FF7875','#48BB78','#5261FF','#B4DFFF','#F8D588'];
const COLORS =  ['#16A085', '#6bd1cb', '#53bdf7', '#9c8cf9', '#f28cbe', '#ffb18d', '#ff8c9b', '#4EF26D', '#24B57C', '#6E9573', '#84F45F', '#B5A36B', '#B1EDEF', '#AA2739', '#304AEB', '#B3E7A3', '#97B823', '#26149D', '#EA8F24', '#6C10B7', '#1655DD', '#49B23A', '#C04B88', '#7696D9', '#28BBDA', '#FE27D6', '#457273', '#FEA52D', '#184D37', '#0AA80E', '#FB4976', '#18DA09', '#D91A10', '#915522', '#61234D', '#43FEC9', '#AC80A4', '#4D0F3B', '#BBE6B1', '#9BED42', '#1DCFC0', '#7E4312', '#03DE31', '#CAEBE7', '#39827A', '#4D21A0', '#E87622', '#67CDC0', '#E1B464', '#08F015', '#CDE8DB', '#CEBB0B', '#3A33FD', '#043540', '#76367D', '#D86770', '#109768', '#FD11D2', '#8A5642', '#1C1F13', '#3C9B10', '#36DF70', '#679655', '#42753B', '#115D44', '#E8EAD2', '#51B2BE', '#FBFCC6', '#47BA77', '#B3032E', '#AA3928', '#61E918', '#1896F1', '#365B0A', '#41D26E', '#E1C2C7', '#19E48F', '#E414C0', '#4FD0F2', '#794088', '#7CC70A', '#6A156B', '#B986BD', '#D5C669', '#571A05', '#51E2C9', '#8EC86B', '#BD5BC1', '#504716', '#8934FE', '#41112B', '#D0BDAD', '#F7011E', '#9A3622', '#E856F6', '#1C36F4', '#C1C820', '#7CA267', '#DD5943', '#DEF1B7', '#387A35', '#F9809C', '#70B97E', '#EBFDA7', '#104663'];

@Component({
  selector: 'svms-pie-chart',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './svms-pie-chart.component.html',
  styleUrls: ['./svms-pie-chart.component.scss'],
  styles: [
    `
      .tooltipLegend{
        width: 8px;
        height: 8px;
        position: relative;
        display: inline-block;
        margin-right: 5px;
        top: -1px;
      }
    `
  ]
})

export class SvmsPieChartComponent extends BasicChartComponent implements OnInit {
  @Input() value = 'headcount';
  @Input() label = 'name';
  @Input() margin = 0;
  @Input() thikness = 50;
  @Input() onHoverIncreaseEffect = true;
  @Input() isDoughnut = false;
  @Input() hideLabels = false;
  @Input() smallChart = false;
  @Input() colorsScheme: string[];
  @Input() currency: string;
  @Input() chartId: string;
  @Input() dimension = 'headcount';
  @Input() chartRadius: number;

  @Input() set chartData(data) {
    if (data?.length) {
      const firstElem = data[0];
      const keys = Object.keys(firstElem);
      this.label = keys[1];
      this.value = keys[0];
      this.chart = data;
      this.initRedrawChart(true);
    }
  }

  chart: any = [];
  legendRectSize = 6;
  legendSpacing = 6;
  legendLimit = 3;
  legendItemSizeHeight = 18;
  legendItemExtraNum = 18;
  chartHeight = 280;
  chartWidth = 350;
  drawTimeout: any;
  radius = 0;
  svg: any;
  color: any;
  pie: any;
  arc: any;
  arcExtra: any;
  arcOver: any;
  outerArc: any;
  div: any;
  sumOfData = 0;
  show: any;
  tooltip: any;
  doughnutId = '';
  doughnutHoverId = '';
  doughnutIdList: string[] = [];
  disableMinItems = true;
  extraTooltips = false;
  tooltipMainNum: number;
  tooltipExtraNum: number;
  rectH: number;
  tooltipClass: string;
  accuracyConfig = AccuracyConfigEnum;

  @HostListener('document:click', ['$event'])

  clickout() {
    if (this.show === true) {
      this.show = false;
      if (document.getElementById('legendMoreContainer') != null) {
        document.getElementById('legendMoreContainer').style.display = 'none';
      }
    } else {
      this.show = true;
    }
  }

  constructor( private accuracyPipe: AccuracyPipe) {
    super();
  }

  ngOnInit() {
    this.doughnutId = 'label' + (this.chartId ? `-${this.chartId}` : '');
    this.doughnutHoverId = 'hover' + (this.chartId ? `-${this.chartId}` : '');
    this.tooltipClass = 'tooltip' + (this.chartId ? `-${this.chartId}` : '');
  }

  drawChart() {
    if (this.chart?.length && (this.chart[0] === 'no_data' || this.chart[0] === 'error')) {
      d3.select(`#${this.doughnutId}`)
        .html(this.chart[0] === 'no_data' ? 'No Data Available' : 'Error in Loading the Data')
        .style('font-size', '1.5em')
        .style('font-weight', 600)
        .style('color', 'rgb(185 183 183)');
      return;
    } else if (!this.chart?.length) {
      d3.select(`#${this.doughnutId}`)
        .html('Loading...')
        .style('font-size', '1.5em')
        .style('font-weight', 600)
        .style('color', 'rgb(185 183 183)');
      return;
    }
    d3.select(`#${this.doughnutId}`).html('');

    this.radius = this.chartRadius ?? (Math.min(this.chartWidth, this.chartHeight) / 1.7) - this.margin - 20;
    this.color = d3.scaleOrdinal(this.colorsScheme?.length ? this.colorsScheme : COLORS);
    this.tooltip = d3.select(`.${this.tooltipClass}`);

    this.svg = d3.select(`#${this.doughnutId}`)
      .append('svg')
      .attr('width', this.chartWidth)
      .attr('height', this.chartHeight)
      .style('margin', '0')
      .style('padding', '0')
      .attr('transform', `translate(-20, 0)`)
      .append('g')
      .attr('transform', `translate(${this.chartWidth / 2}, ${this.chartHeight / 2})`);

    this.pie = d3.pie().sort(null).value((d: any) => Math.abs(d[this.value]));
    this.arc = d3.arc().cornerRadius(3).outerRadius(this.radius).innerRadius(this.isDoughnut ? this.radius - this.thikness : 0);
    this.arcOver = d3.arc().cornerRadius(3).outerRadius(this.radius * 1.05).innerRadius(this.isDoughnut ? this.radius - this.thikness : 0);
    this.arcExtra = d3.arc().outerRadius(this.radius * 1.5).innerRadius(this.radius * 1.4);
    // this.arcOver = d3.arc().outerRadius(this.radius + 10).innerRadius(this.radius - this.thikness);
    // this.outerArc = d3.arc().innerRadius(this.radius * 0.9).outerRadius(this.radius * 0.9);
  //  this.div = d3.select(`#hover`).attr('class', 'tooltip-donut').style('opacity', 0);
    this.drawSlices();
  }

  private autoIdGenrator() {
    const id = `_${Math.random().toString(36).substr(2, 9)}`;
    if (this.doughnutIdList.indexOf(id) === -1) {
      this.doughnutIdList.push(id);
      return id;
    } else {
      return this.doughnutIdList;
    }
  }


  private showTooltipBox = (e, data) => {
    this.tooltip.style('opacity', 0);
    if (this.extraTooltips ) {
      d3.selectAll('.tooltip-extra,.tooltip-extra-rect').transition().duration(500).style('opacity', 0);
      this.extraTooltips = false;
    }else{
      d3.selectAll('.tooltip-extra,.tooltip-extra-rect').transition().duration(500).style('opacity', 1);
      this.extraTooltips = true;
    }
  }


  private drawSlices() {

    const that: any = this;
    const legendLineGap = 53;
    const allSorted = JSON.parse(JSON.stringify(this.chart));
    allSorted.sort((a, b) => +b[this.value] - a[this.value]);
    const dataSet = allSorted.slice(0, this.legendItemExtraNum + this.legendLimit - 1);
    if (dataSet.length !== this.chart.length) {
      const other = {};
      other[this.label] = 'Other';
      other[this.value] = d3.sum(allSorted.slice(this.legendItemExtraNum + this.legendLimit ), d => +d[this.value]);
      dataSet.push(other);
    }

    this.sumOfData = d3.sum(dataSet, (d: any) => +d[this.value]);
    this.sumOfData = this.accuracyPipe.transform(this.sumOfData , this.accuracyConfig?.amount , {isEdit : true});
    const pData = this.pie(dataSet);
    this.color.domain(pData.map(d => d.data[this.label]));

    this.tooltipMainNum = Math.min(pData.length, this.legendLimit);
    this.tooltipExtraNum = this.legendLimit > pData.length ? 0 : pData.length - this.tooltipMainNum;

    this.rectH = Math.min(that.legendItemExtraNum, that.tooltipExtraNum) * that.legendItemSizeHeight;

    const chart = this.svg.selectAll(`${this.doughnutId} > .allSlices`)
      .data(pData)
      .join(
        g => {
          const enter = g.append('g')
            .classed('allSlices', true)
            .attr('transform', `translate(0, -15)`)
            .each((d, i) => {
              d.id = this.autoIdGenrator();
            })
            .on('mouseover', (e, data) => chart.style('opacity', 0.5).filter(d => d.id === data.id).style('opacity', 1))
            .on('mouseout', (e, data) => chart.style('opacity', 1) );
          enter
            .append('path')
              .attr('d', this.arc)
              .style('fill', d => that.color(d.data[this.label]))
              .on('mouseover', function(e, data) {

                that.tooltip.transition().duration(100).style('opacity', 1);
                const table = that.tooltip.selectAll('table')
                  .data([1])
                  .join(
                    enter => {
                      enter.append('table')
                        .append('tr').append('th').attr('colspan', 3)
                        .html(that.titleCase(data.data[that.label]));
                    },
                    update => { 
                      update.select('th').html(that.titleCase(data.data[that.label]));
                    }
                  );
                const rows = [data.data];
                const content = that.tooltip.select('table').selectAll('.tr-data').data(rows, d => d[that.label]);
                content.join(
                  enter => {
                    const r = enter.append('tr')
                      .classed('tr-data', true);

                    r.append('td').classed('legend', true)
                      .style('color', d => that.color(d[that.label]))
                      .style('font-size', '1.8em')
                      .html('&#9679;');  // .html('&#9632;');

                    r.append('td').classed('name', true)
                      .text(d => that.titleCase(that.dimension || that.value));

                    r.append('td').classed('value', true)
                      .text(d => that.currency ? that.updatedvalue(d[that.value] ,'amount', that.currency) : d[that.value]);
                  }
                  );

                d3.select(this).transition().duration(100).attr('d', that.arcOver );
              })
              .on('mousemove', (e, data) => {
                const coords = d3.pointer(e);
                const shiftX =  15 + this.chartWidth / 2;
                const shiftY = 70 + this.chartHeight / 2;
                that.tooltip
                  .style('opacity', 1)
                  .style('left', (coords[0] + shiftX) + 'px')
                  .style('top', (coords[1] + shiftY) + 'px')
                  .style('z-index', 1);
              })
              .on('mouseout', function() {
                that.tooltip.style('opacity', 0);
                d3.select(this).transition().duration(100).attr('d', that.arc );
              } );

          if (!this.hideLabels) {
            enter
              .append('path')
              .classed('legend-line', true);
            enter
              .append('rect');
            enter
              .append('text')
              .classed('arc-text', true);
            enter
              .append('text')
              .classed('legend-text', true)
              // .attr('dx', (d, i) => i === this.legendLimit ? 0 : 11)
              .attr('dy', 5)
              .attr('y', (d, i) => i >= this.legendLimit ? -that.rectH / 2 - 80 + i * this.legendItemSizeHeight : this.radius  + 20)
              // .classed('last-one', (d, i) => i === this.legendLimit)
              .classed('tooltip-extra', (d, i) => i >= this.legendLimit)
              // .on('click', this.showTooltipBox)
              // .html((d, i) => {
              //    that.titleCase(d.data[this.label]);
              //  })
              .html((d, i) => that.titleCase(d.data[this.label]));

            enter
              .append('circle')
              // .attr('y', -that.rectH / 2 - 20);
              .attr('cy', (d, i) => i >= this.legendLimit ? -that.rectH / 2 - 80  + i * this.legendItemSizeHeight : this.radius  + 20)
              .classed('tooltip-extra', (d, i) => i >= this.legendLimit)
              // .attr('r', (d, i) => i >= this.legendLimit ? 0 : 8)
              .attr('r', 8)
              .style('fill', d => this.color(d.data[this.label]));
          }
          return enter;
        }
      );


    let maxWidth = 0;

    chart.select('path').transition().delay((d: any, i: any) => i * 20)
        .on('end', function(d)  {

          const val = +(100 / that.sumOfData * +d.data[that.value]).toFixed(0);
          const parent = d3.select(this.parentNode);
          let cent;
          let label;
          let classname;
          let line;

          if (val >= 5 ) {  /// limit for percent number display
            cent = that.arc.centroid(d);
            classname = 'inner';
          }/*else if (!that.disableMinItems && ( val > 3 || pData.length < 6 )){
            cent = that.arcExtra.centroid(d);
            const cent2 = that.arc.centroid(d);
            line = d3.line()([cent, cent2]);
            d3.select(this.parentNode).select('.legend-line').attr('d', line);
            classname = 'outer';
          }*/
          if (cent) {
            label = parent.select('.arc-text')
              .text(val + '%')
              .classed(classname, true)
              .attr('x', cent[0]).attr('y', cent[1])
              .attr('dy', 4);
          }
          const lw = (  parent.select('.legend-text').node() as any)?.getBBox();
          d.width = lw?.width;
          maxWidth = Math.max(maxWidth, d.width);
          if (line) {
            const labelC = ( label.node() as any)?.getBBox();
            const rect = parent.select('rect')
              .attr('x', labelC.x - 1)
              .attr('y', labelC.y - 1)
              .attr('width', labelC.width + 1)
              .attr('height', labelC.height + 1)
              .attr('fill', 'white');
          }
        })
      .attrTween('d', a => {
        const i = d3.interpolate(a.startAngle + 0.1, a.endAngle);
        return t => {
          a.endAngle = i(t);
          return this.arc(a);
        };
      })
      .attr('fill', (d: any, i: number) => this.color(i)).attr('fill-opacity', 0.7)
      .end()
      .then(() => {
          let prev = 0;
          chart.selectAll('.legend-text').filter(d => d.index < that.legendLimit)
            .transition().duration(300)
            .attr('x', (d, i) => {
              d.pos = prev ? prev + legendLineGap : 0;
              prev = d.pos + d.width;
              return d.pos; // d.index === that.legendLimit ? d.pos : d.pos;
            })
            .style('opacity', 1);

         // chart.selectAll('.legend-text').filter(d => d.index > that.legendLimit)
          //
          let minX = this.radius + 30 ;

          chart.selectAll('circle').filter(d => d.index < that.legendLimit )
            .transition().duration(300).attr('cx', d => d.pos - 11 - prev / 2).style('opacity', 1);
          chart.selectAll('.legend-text:not(.tooltip-extra)').attr('dx', - prev / 2 );

          if ( that.tooltipExtraNum ) {
            that.svg.append('text').attr('x', prev + 10)
              .attr('dy', 7)
              .attr('dx', - prev / 2 )
              .attr('x', prev  + 15)
              .attr('y', that.radius  + 6)
              .style('opacity', 1)
              .classed('last-one legend-text', true)
              .html('&#8801')
              .on('click', this.showTooltipBox);

            that.svg.append('rect')
              .lower()
              .classed('tooltip-extra-rect', true)
              .attr('x', minX)
              .attr('width', 1.5 * maxWidth + 5)
              .attr('height', that.rectH + 10)
              .attr('y', -that.rectH / 2 - 55);

            chart.selectAll('.tooltip-extra')
              .attr('cx', this.radius + 45)
              .attr('dx', this.radius + 55);


            }



      });

    }

  private sliceTitle(title: string) {
    return title.length >= 18 ? title.slice(0, 10) + '...' + title.concat(' ').slice(-7, -1) : title;
  }

  updatedvalue (val , type? , currency?) {
    return this.accuracyPipe.transform(val , this.accuracyConfig[type] , {currencyCode : currency});
  } 

  private titleCase(str) {
    const splitStr = str.toLowerCase().split(' ');
    for (let i = 0; i < splitStr.length; i++) {
      splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
    }
    return splitStr.join(' ');
  }

}
