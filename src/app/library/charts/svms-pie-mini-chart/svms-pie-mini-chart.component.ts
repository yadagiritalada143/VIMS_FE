import { Component, OnInit, Input, Output, EventEmitter, HostListener, ViewEncapsulation } from '@angular/core';
import * as d3 from 'd3';
import { CustomcurrencyPipe } from 'src/app/shared/pipe/customcurrency.pipe';
import { BasicChartComponent } from '../basic-chart/basic-chart.component';

@Component({
  selector: 'svms-pie-mini-chart',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './svms-pie-mini-chart.component.html',
  styleUrls: ['./svms-pie-mini-chart.component.scss'],
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

export class SvmsPieMiniChartComponent extends BasicChartComponent implements OnInit {
  @Output() setLegendColors = new EventEmitter();
  @Input() value: string = 'headcount';
  @Input() label: string = 'name';
  @Input() margin: number = 10;
  @Input() thikness: number = 15;
  @Input() onHoverIncreaseEffect = true;
  @Input() isDoughnut = false;
  @Input() hideLabels = false;
  @Input() smallChart = false;
  @Input() colorsScheme: string[];
  @Input() currency: string;
  @Input() chartId: string;

  @Input() set chartData(data) {
    if (data && data.length) {
      const firstElem = data[0];
      const keys = Object.keys(firstElem);
      keys.forEach(key => {
        if (isNaN(Number(firstElem[key]))) {
          this.label = key;
        } else {
          this.value = key;
        }
      });
      this.chart = data;
      this.initRedrawChart(true);
    }
  }

  chart: any = [];
  legendRectSize: number = 6;
  legendSpacing: number = 6;

  @Input() chartHeight: number = 80;
  @Input() chartWidth: number = 80;
  @Input() showLegend = true;
  drawTimeout: any;
  radius: number = 0;
  svg: any;
  color: any;
  pie: any;
  arc: any;
  arcOver: any;
  outerArc: any;
  div: any;
  sumOfData: number = 0;
  show: any;

  doughnutId: string = '';
  doughnutHoverId: string = '';
  doughnutIdList: string[] = [];

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

  constructor(private customCurrencyPipe: CustomcurrencyPipe) {
    super();
  }

  ngOnInit() {
    this.doughnutId = 'label' + (this.chartId ? `-${this.chartId}` : '');
    // this.doughnutHoverId = 'hover' + (this.chartId ? `-${this.chartId}` : '');
  }

  drawChart() {
    d3.select(`#${this.doughnutId}`).html('');
    this.sumOfData = (this.chart.reduce((d: any, c: any) => (d + parseFloat(c[this.value])), 0)).toFixed(1);

    this.radius = (Math.min(this.chartWidth, this.chartHeight) / 2) - this.margin;
    // this.color = d3.scaleOrdinal(this.colorsScheme ?? d3.schemePaired);
    this.color = (i) => ['#4C7FF0', '#FF5252'][i];

    this.svg = d3.select(`#${this.doughnutId}`)
      .append('svg')
      .attr('width', this.chartWidth)
      .attr('height', this.chartHeight)
      .style('margin-left', '50%')
      .attr('transform', `translate( ${-this.chartWidth / 2}, 0)`)
      .append('g')
      .attr('transform', `translate(${this.chartWidth / 2}, ${this.chartHeight / 2})`);

    this.pie = d3.pie().sort(null).value((d: any) => Math.abs(d[this.value]));
    this.arc = d3.arc().outerRadius(this.radius).innerRadius(0);
    if (this.isDoughnut) {
      this.arc.innerRadius(this.radius - this.thikness);
    }
    this.arcOver = d3.arc().outerRadius(this.radius + 10).innerRadius(this.radius - this.thikness);
    this.outerArc = d3.arc().innerRadius(this.radius * 0.9).outerRadius(this.radius * 0.5);
    // this.div = d3
    //   .select(`#${this.doughnutHoverId}`)
    //   .attr('class', 'tooltip-donut' + (this.smallChart ? ' tooltip-donut-dark' : ''))
    //   .style('opacity', 0);
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

  private drawSlices() {
    const tempSvg = this.svg.selectAll('allSlices')
      .remove().exit()
      .data(this.pie(this.chart))
      .enter().append('g').append('path')
      .attr('d', this.arc)
      .attr('fill', '#fff')
      .attr('id', (d: any, i: number) => `${this.autoIdGenrator()}`);

    tempSvg.transition().delay((d: any, i: any) => i)
      .attrTween('d', a => {
        const i = d3.interpolate(a.startAngle + 0.1, a.endAngle);
        return t => {
          a.endAngle = i(t);
          return this.arc(a);
        };
      }).attr('fill', (d: any, i: number) => this.color(i));
    tempSvg.on('mouseover', (d: any, i: any) => {
      const others = this.svg.selectAll('path').filter(a => {
        return a !== i;
      });
      others.style('opacity', 1);

      const divData = document.getElementById(`${this.doughnutId}`).getBoundingClientRect();
      this.div.transition()
        .duration(50)
        .style('opacity', 1);
      const num = (Math.round((parseFloat(this.chart[i.index][this.value]) / this.sumOfData) * 100)).toString() + '%';

      const bgStyle = 'background:' + this.color(i.index);

      const tooltipLegend = `<div class='tooltipLegend' style='` + bgStyle + `'></div>`;
      const dataLabel = (i?.data[this.label]);
      let valueWithCurrency;
      if (this.currency) {
        const dataValue = (i?.data[this.value]);
        valueWithCurrency = this.customCurrencyPipe?.transform(dataValue, this.currency);
      }

      this.div.html(tooltipLegend + `${dataLabel} ${valueWithCurrency ?? ''}`)
        .style('left', Math.abs(d.pageX - (this.smallChart ? divData.left : 70)) + 'px')
        .style('top', Math.abs(d.pageY - (this.smallChart ? divData.top : 150)) + 'px')
        .style("fill", "white");
    })
      .on('mouseout', (d: any, i: any) => {
        const others = this.svg.selectAll('path').filter(a => {
          return a !== i;
        });
        others.style('opacity', 1);

        this.div.transition()
          .duration(50)
          .style('opacity', 0);
        if (this.onHoverIncreaseEffect) {
          d3.select(`#${d.target.id}`).transition()
            .duration(1000)
            .attr('d', this.arc);
        }

        d3.selectAll('.centerText').remove();
      });

    const legendContainer = document.getElementById('legendContainer');
    legendContainer.innerHTML = '';

    const legendUl = document.createElement('ul');

    const legendData = this.chart.map(d => {
      return d[this.label];
    });

    let summarizedLegendData = [];
    if (legendData.length > 3) {
      for (let i = 0; i < 3; i++) {
        summarizedLegendData.push(legendData[i]);
      }
      summarizedLegendData.push(`<i class='material-icons' style='color: rgb(82, 97, 255); font-size: 26px;'>more_horiz</i>`);
    } else {
      summarizedLegendData = legendData;
    }

    summarizedLegendData.forEach((d, i) => {

      const liElem = document.createElement('li');
      const circleElem = document.createElement('div');
      const textElem = document.createElement('span');

      circleElem.className = 'legendSymbol';
      circleElem.style.backgroundColor = this.color(i);

      textElem.innerHTML = d;
      textElem.className = 'legendText';

      if (d !== `<i class='material-icons' style='color: rgb(82, 97, 255); font-size: 26px;'>more_horiz</i>`) {
        liElem.appendChild(circleElem);
      } else {
        const colorSet = this.color;
        textElem.onclick = function () {

          const legendWrapper = document.createElement('div');
          legendWrapper.id = 'legendMoreContainer';
          legendWrapper.className = 'legendMoreContainer';

          liElem.appendChild(legendWrapper);

          const legendMoreContainer = document.getElementById('legendMoreContainer');
          const legendUlMoreContainer = document.createElement('ul');

          legendMoreContainer.innerHTML = '';

          legendData.forEach((d, i) => {

            const liMoreElem = document.createElement('li');
            const circleMoreElem = document.createElement('div');
            const textMoreElem = document.createElement('span');

            circleMoreElem.className = 'legendSymbol';
            circleMoreElem.style.backgroundColor = colorSet(i);

            textMoreElem.innerHTML = d;
            textMoreElem.className = 'legendText';

            liMoreElem.appendChild(circleMoreElem);
            liMoreElem.appendChild(textMoreElem);

            legendUlMoreContainer.appendChild(liMoreElem);

          });

          legendMoreContainer.appendChild(legendUlMoreContainer);
          document.getElementById('legendMoreContainer').style.display = 'block';
        };
      }

      liElem.appendChild(textElem);
      legendUl.appendChild(liElem);

    });

    if (!this.hideLabels) {
      legendContainer.appendChild(legendUl);
    } else {
      this.setLegendColors.emit(summarizedLegendData.map((data, i) => ({ label: data, color: this.color(i)})));
    }
  }

}
