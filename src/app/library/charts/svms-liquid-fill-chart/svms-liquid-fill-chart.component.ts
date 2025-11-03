import { Component, Input, OnInit } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'svms-liquid-fill-chart',
  templateUrl: './svms-liquid-fill-chart.component.html',
  styleUrls: ['./svms-liquid-fill-chart.component.scss']
})
export class SvmsLiquidFillChartComponent implements OnInit {
  @Input() radius = 160;
  @Input() percent = 0;
  config = {
    circleColor: '#178BCA', // The color of the outer circle.
    waveTextColor: '#FFFFFF', // The color of the value text when the wave overlaps it.
    waveColor: '#178BCA', // The color of the fill wave.
    circleThickness: 0.05, // The outer circle thickness as a percentage of it's radius.
    textVertPosition: 0.5, // The height at which to display the percentage text withing the wave circle. 0 = bottom, 1 = top.
    waveAnimateTime: 1000, // The amount of time in milliseconds for a full wave to enter the wave circle.
    minValue: 0, // The gauge minimum value.
    maxValue: 100, // The gauge maximum value.
    circleFillGap: 0.05, // The size of the gap between the outer circle and wave circle as a percentage of the outer circles radius.
    waveHeight: 0.05, // The wave height as a percentage of the radius of the wave circle.
    waveCount: 1, // The number of full waves per width of the wave circle.
    waveRiseTime: 1000, // The amount of time in milliseconds for the wave to rise from 0 to it's final height.
    waveRise: true, // Control if the wave should rise from 0 to it's full height, or start at it's full height.
    waveHeightScaling: true, // Controls wave size scaling at low and high fill percentages. When true, wave height reaches it's maximum at 50% fill, and minimum at 0% and 100% fill. This helps to prevent the wave from making the wave circle from appear totally full or empty when near it's minimum or maximum fill.
    waveAnimate: true, // Controls if the wave scrolls or is static.
    waveOffset: 0, // The amount to initially offset the wave. 0 = no offset. 1 = offset of one full wave.
    textSize: 1, // The relative height of the text to display in the wave circle. 1 = 50%
    valueCountUp: true, // If true, the displayed value counts up from 0 to it's final value upon loading. If false, the final value is displayed.
    displayPercent: true, // If true, a % symbol is displayed after the value.
    textColor: '#045681', // The color of the value text when the wave does not overlap it.
  };
  constructor() { }

  ngOnInit(): void {
    this.loadLiquidFillGauge('fillgauge', this.percent);
  }

  loadLiquidFillGauge(elementId, value) {
    const WAVE_COUNT = 40;
    const gauge = d3.select('#' + elementId);

    const appendText = (v, overplaps) => {
      return v.append('text')
        .text(textRounder(textFinalValue) + percentText)
        .attr('class', 'liquidFillGaugeText')
        .attr('text-anchor', 'middle')
        .attr('font-size', textPixels + 'px')
        .style('fill', overplaps ? this?.config?.waveTextColor : this?.config?.textColor)
        .attr('transform', 'translate(' + this.radius + ',' + textRiseScaleY(this?.config?.textVertPosition) + ')');
    };

    const fillPercent = Math.max(this?.config?.minValue, Math.min(this?.config.maxValue, value)) / this?.config.maxValue;

    let waveHeightScale;
    if (this?.config.waveHeightScaling){
      waveHeightScale = d3.scaleLinear().range([0, this?.config.waveHeight, 0]).domain([0, 50, 100]);
    } else {
      waveHeightScale = d3.scaleLinear().range([this?.config.waveHeight, this?.config.waveHeight]).domain([0, 100]);
    }

    const textPixels = (this?.config.textSize * this.radius / 2);
    const textFinalValue = parseFloat(value).toFixed(2);
    const percentText = this?.config.displayPercent ? '%' : '';
    const circleThickness = this?.config.circleThickness * this.radius;
    const circleFillGap = this?.config.circleFillGap * this.radius;
    const fillCircleMargin = circleThickness + circleFillGap;
    const fillCircleRadius = this.radius - fillCircleMargin;
    const waveHeight = fillCircleRadius * waveHeightScale(fillPercent * 100);

    const waveLength = fillCircleRadius * 2 / this?.config.waveCount;
    const waveClipCount = 1 + this?.config.waveCount;
    const waveClipWidth = waveLength * waveClipCount;

    // Rounding functions so that the correct number of decimal places is always displayed as the value counts up.
    const textRounder = v => Math.round(v);

    // Data for building the clip wave area.
    const data = [];
    for (let i = 0; i <= WAVE_COUNT * waveClipCount; i++){
      data.push({x: i / (WAVE_COUNT * waveClipCount), y: (i / (WAVE_COUNT))});
    }

    // Scales for drawing the outer circle.
    const gaugeCircleX = d3.scaleLinear().range([0.2 * Math.PI]).domain([0, 1]);
    const gaugeCircleY = d3.scaleLinear().range([0, this.radius]).domain([0, this.radius]);

    // Scales for controlling the size of the clipping path.
    const waveScaleX = d3.scaleLinear().range([0, waveClipWidth]).domain([0, 1]);
    const waveScaleY = d3.scaleLinear().range([0, waveHeight]).domain([0, 1]);

    // Scales for controlling the position of the clipping path.
    const waveRiseScale = d3.scaleLinear()
      // The clipping area size is the height of the fill circle + the wave height, so we position the clip wave
      // such that the it will overlap the fill circle at all when at 0%, and will totally cover the fill
      // circle at 100%.
      .range([(fillCircleMargin + fillCircleRadius * 2 + waveHeight), (fillCircleMargin - waveHeight)])
      .domain([0, 1]);
    const waveAnimateScale = d3.scaleLinear()
      .range([0, waveClipWidth - fillCircleRadius * 2]) // Push the clip area one full wave then snap back.
      .domain([0, 1]);

    // Scale for controlling the position of the text within the gauge.
    const textRiseScaleY = d3.scaleLinear()
      .range([fillCircleMargin + fillCircleRadius * 2, (fillCircleMargin + textPixels * 0.7)])
      .domain([0, 1]);

    // Center the gauge within the parent SVG.
    const gaugeGroup = gauge.append('g');

    // Draw the outer circle.
    const gaugeCircleArc = d3.arc()
      .startAngle(0)
      .endAngle(360)
      .innerRadius(gaugeCircleY(this.radius - circleThickness))
      .outerRadius(gaugeCircleY(this.radius));
    gaugeGroup.append('path')
      .attr('d', gaugeCircleArc)
      .style('fill', this?.config.circleColor)
      .attr('transform', 'translate(' + this.radius + ',' + this.radius + ')');

    // Text where the wave does not overlap.
    const text1 = appendText(gaugeGroup, false);

    // The clipping wave area.
    const clipArea = d3.area()
      .x(d => waveScaleX(d['x']))
      .y0(d => waveScaleY(Math.sin(Math.PI * 2 * this?.config.waveOffset * -1 + Math.PI * 2 * (1 - this?.config.waveCount))))
      .y1(d => (fillCircleRadius * 2 + waveHeight));
    const waveGroup = gaugeGroup.append('defs')
      .append('clipPath')
      .attr('id', 'clipWave' + elementId);
    const wave = waveGroup.append('path')
      .datum(data)
      .attr('d', clipArea)
      .attr('T', 0);

    // The inner circle with the clipping wave attached.
    const fillCircleGroup = gaugeGroup.append('g')
      .attr('clip-path', 'url(#clipWave' + elementId + ')');
    fillCircleGroup.append('circle')
      .attr('cx', this.radius)
      .attr('cy', this.radius)
      .attr('r', fillCircleRadius)
      .style('fill', this?.config.waveColor);

    // Text where the wave does overlap.
    const text2 = appendText(fillCircleGroup, true);

    // Make the value count up.
    if (this?.config.valueCountUp){
      const textTween = function(){
        const i = d3.interpolate(this.textContent, textFinalValue);
        return function(t) { this.textContent = textRounder(i(t)) + percentText; };
      };
      text1.transition()
        .duration(this?.config.waveRiseTime)
        .tween('text', textTween);
      text2.transition()
        .duration(this?.config.waveRiseTime)
        .tween('text', textTween);
    }

    // Make the wave rise. wave and waveGroup are separate so that horizontal and vertical movement can be controlled independently.
    const waveGroupXPosition = fillCircleMargin + fillCircleRadius * 2 - waveClipWidth;
    if (this?.config.waveRise){
      waveGroup.attr('transform', 'translate(' + waveGroupXPosition + ',' + waveRiseScale(0) + ')')
        .transition()
        .duration(this?.config.waveRiseTime)
        .attr('transform', 'translate(' + waveGroupXPosition + ',' + waveRiseScale(fillPercent) + ')')
        .each(() => {
          wave.attr('transform', 'translate(1,0)');
        }); // This transform is necessary to get the clip wave positioned correctly when waveRise=true and waveAnimate=false.
        // The wave will not position correctly without this, but it's not clear why this is actually necessary.
    } else {
      waveGroup.attr('transform' , 'translate(' + waveGroupXPosition + ',' + waveRiseScale(fillPercent) + ')');
    }

    function GaugeUpdater(){
      this.update = (value) => {
        const textRounderUpdater = (v) => Math.round(v);

        const textTween = () => {
          const i = d3.interpolate(this.textContent, parseFloat(value).toFixed(2));
          return t => this.textContent = textRounderUpdater(i(t)) + percentText;
        };

        text1.transition()
          .duration(this?.config.waveRiseTime)
          .tween('text', textTween);
        text2.transition()
          .duration(this?.config.waveRiseTime)
          .tween('text', textTween);

        const fillPercent = Math.max(this?.config?.minValue, Math.min(this?.config.maxValue, value)) / this?.config.maxValue;
        const waveHeight = fillCircleRadius * waveHeightScale(fillPercent * 100);
        const waveRiseScale = d3.scaleLinear()
          // The clipping area size is the height of the fill circle + the wave height, so we position the clip wave
          // such that the it will overlap the fill circle at all when at 0%, and will totally cover the fill
          // circle at 100%.
          .range([(fillCircleMargin + fillCircleRadius * 2 + waveHeight), (fillCircleMargin - waveHeight)])
          .domain([0, 1]);
        const newHeight = waveRiseScale(fillPercent);
        const waveScaleX = d3.scaleLinear().range([0, waveClipWidth]).domain([0, 1]);
        const waveScaleY = d3.scaleLinear().range([0, waveHeight]).domain([0, 1]);
        let newClipArea;
        if (this?.config.waveHeightScaling){
          newClipArea = d3.area()
            .x(d => waveScaleX(d['x']))
            .y0(d =>
              waveScaleY(
                Math.sin(Math.PI * 2 * this?.config.waveOffset * -1 + Math.PI * 2 * (1 - this?.config.waveCount) + d['y'] * 2 * Math.PI)
              ))
            .y1(d => (fillCircleRadius * 2 + waveHeight));
        } else {
            newClipArea = clipArea;
        }

        const newWavePosition = this?.config.waveAnimate?.waveAnimateScale(1) || 0;
        wave.transition()
            .duration(0)
            .transition()
            .attr('d', newClipArea)
            .attr('transform', 'translate(' + newWavePosition + ',0)')
            .attr('T', '1');
        waveGroup.transition()
          .duration(this?.config.waveRiseTime)
          .attr('transform', 'translate(' + waveGroupXPosition + ',' + newHeight + ')');
      };
    }

    return new GaugeUpdater();
    }
  }


