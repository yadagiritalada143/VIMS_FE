import { Component, OnInit, Input, AfterViewInit } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-create-job-chart',
  templateUrl: './create-job-chart.component.html',
  styleUrls: ['./create-job-chart.component.scss']
})
export class CreateJobChartComponent implements OnInit, AfterViewInit {

  @Input() data: any;
  @Input() height: number = 300;
  @Input() width: number = 450;
  @Input() margin: any;
  @Input() xLabel = 'Name';
  @Input() yLabel = 'Value';
  @Input() minVal: number = 1000;
  @Input() maxVal: number = 50000;
  @Input() onHoverIncreaseEffect = true;

  svg: any;
  lineTooltip: any;
  // color: any;

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {

    // this.color = d3.scaleOrdinal(d3.schemePaired);
    this.margin = { top: 20, right: 20, bottom: 30, left: 40 };

    this.svg = d3.select("#lineWrapper")
      .append("svg")
      .attr("class", "svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .append("g")
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

    this.lineTooltip = d3.select("body").append("div").attr("class", "lineToolTip");

    // if (!this.data) { return; }
    this.drawSlices();
  }

  // private autoIdGenrator() {
  //   let id = `_${Math.random().toString(36).substr(2, 9)}`;
  //   if (this.lineIdList.indexOf(id) === -1) {
  //     this.lineIdList.push(id);
  //     return id;
  //   } else {
  //     return this.lineIdList;
  //   }
  // }

  private drawSlices() {

    //Container Height & Width
    const contentWidth = this.width - this.margin.left - this.margin.right;
    const contentHeight = this.height - this.margin.top - this.margin.bottom;

    //--------Data--------------
    // let tempData = {};
    // let minVal = 1000,
    //   maxVal = 10000,
    //   mean = "",
    //   median = "";

    this.data = [{
      Name: "min1",
      Value: this.minVal
    }, {
      Name: "max",
      Value: this.maxVal
    }, {
      Name: "min2",
      Value: this.minVal
    }];

    //------X & Y Axes--------------
    const x = d3
      .scaleBand()
      .rangeRound([0, contentWidth])
      .padding(0.1)
      .domain(this.data.map(d => d.Name));

    const y = d3
      .scaleLinear()
      .rangeRound([contentHeight, 0])
      .domain([Math.min.apply(Math, this.data.map(d => {
        return d.Value;
      })), Math.max.apply(Math, this.data.map(d => {
        return d.Value;
      }))]);


    //-------------Data line Code------------------
    //Data Line generator function
    var line = d3.line()
      .x(d => { return x(d["Name"]); })
      .y(d => { return y(d["Value"]); })
      .curve(d3.curveCardinal);

    //Add data path
    this.svg.append("path")
      .datum(this.data)
      .attr("class", "line")
      .attr("d", line)
      .style("fill", "none").style("stroke", "steelblue").style("stroke-width", 2).style("stroke-dasharray", ("5, 5"));

    //     //-------------Mean line Code------------------
    //   //Data Line generator function
    //   var line = d3.line()
    //   .x(d => { return x(d["Name"]); })
    //   .y(d => { return y(d["Value"]); })
    //   .curve(d3.curveCardinal);

    // //Add data path
    // this.svg.append("path")
    //   .datum(this.data)
    //   .attr("class", "line")
    //   .attr("d", line)
    //   .style("fill", "none").style("stroke", "steelblue").style("stroke-width", 2).style("stroke-dasharray", ("5, 5"));

    //   //-------------Median line Code------------------
    //   //Data Line generator function
    //   var line = d3.line()
    //     .x(d => { return x(d["Name"]); })
    //     .y(d => { return y(d["Value"]); })
    //     .curve(d3.curveCardinal);

    //   //Add data path
    //   this.svg.append("path")
    //     .datum(this.data)
    //     .attr("class", "line")
    //     .attr("d", line)
    //     .style("fill", "none").style("stroke", "steelblue").style("stroke-width", 2).style("stroke-dasharray", ("5, 5"));



  }

}
