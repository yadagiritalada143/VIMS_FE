import { Component, ViewEncapsulation, Input, OnInit, } from '@angular/core';
import * as d3 from 'd3';
import statesData from './/state.json'
import * as topojson from "topojson-client";
@Component({
  selector: 'svms-state-chart',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './svms-state-chart.component.html',
  styleUrls: ['./svms-state-chart.component.scss']
})
export class SvmsStateChartComponent implements OnInit {
  data = [];
  @Input() height = 230;
  @Input() width = 460;
  @Input() margin = 20;
  @Input() set chart(data) {
    if (data.length) {
      this.data.push(...data);
    } else {
      d3.select('#columnId').html('No Data Available').style('font-size', '1.5em').style('font-weight', 600).style('color', 'rgb(185 183 183)');
    }
  }

  readonly states = statesData;
  svg: any;
  path: any;
  zoom: any;
  g: any;
  state: any;

  zoomed: any;
  clicked: any;
  reset: any;


  ngOnInit() {
    this.svg = d3.select('#svg')
      .attr('width', this.width)
      .attr('height', this.height);
    this.path = d3.geoPath();

    this.data = this.data.map(elem => (elem / Math.max(...this.data)).toFixed(2));

    this.g = this.svg.append('g');

    d3.json('https://d3js.org/us-10m.v1.json')
      .then((us: any) => {
        const scale = (window.innerHeight + 100) / this.width;
        us.arcs = us.arcs.map(el => el.map(ele => ele.map(elem => {
          return (elem / scale);
        })));
        this.state = this.svg.append('g')
          .attr('class', 'states')
          .attr('width', this.width)
          .attr('height', this.height)
          .selectAll('path')
          .data(topojson.feature(us, us.objects.states).features)
          .enter().append('path')
          .attr('id', (i: any) => i.id)
          .attr('d', this.path)
          .attr('opacity', (d: any, i: number) => this.data[i]);

        this.svg.append('g')
          .attr('class', 'labels')
          .selectAll('text')
          .data(topojson.feature(us, us.objects.states).features)
          .enter().append('text')
          .attr('d', this.path)
          .attr('x', (d: any) => (this.path.bounds(d)[0][0] + this.path.bounds(d)[1][0]) / 2 - 10)
          .attr('y', (d: any) => (this.path.bounds(d)[0][1] + this.path.bounds(d)[1][1]) / 2)
          .style('fill', 'white')
          .style('text-shadow', '1px 1px 2px black')
          .style('font-size', this.width < 650 ? '8px' : '12px')
          .data(this.states)
          .text((d: any, i: number) => d);

        this.svg.append('path')
          .attr('class', 'state-borders')
          .attr('d', this.path(topojson.mesh(us, us.objects.states, (a, b) => a !== b)));
      });
  }
}
