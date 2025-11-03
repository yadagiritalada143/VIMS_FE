import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'svms-basic-chart',
  templateUrl: './basic-chart.component.html',
  styleUrls: ['./basic-chart.component.scss']
})
export class BasicChartComponent implements OnInit {
  protected chartHeight = 280;
  protected chartWidth = 400;
  protected drawTimeout: any;

  @Input() set width(value) {
    this.chartWidth = value;
    this.initRedrawChart();
  }
  @Input() set height(value) {
    this.chartHeight = value;
    this.initRedrawChart();
  }

  constructor() { }

  ngOnInit(): void {
  }

  initRedrawChart(short = false) {
    const timeOutValue = short ? 200 : 500;
    clearTimeout(this.drawTimeout);
    this.drawTimeout = setTimeout(() => {
      this.drawChart();
    }, timeOutValue);
  }

  protected drawChart() {}

  protected setChartData(data) {}

}
