import { Component, OnInit } from '@angular/core';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { scaling_type } from '../accuracy.config';
@Component({
  selector: 'app-try-out',
  templateUrl: './try-out.component.html',
  styleUrls: ['./try-out.component.scss']
})
export class TryOutComponent implements OnInit {
   public scalingType: any;
    public scaleExample: any = {
    type: null,
    scale: null,
    threshold: null,
    input: null,
    result: '0.0000',
  };
  public scaleLimitError: boolean = false;
  public scaleThresholdError: boolean = false;
  public scaleLimitErrorMessage: string = 'Scaling Limit should be within 0 - 8';
  public scaleThresholdErrorMessage: string = 'Scaling Threshold should be within 0 - 9';
  tryOut:boolean = false;
  title:string = "Try Out";
  scaling_type_supporting_text: string = `Using the definitions provided below, select the scaling type to utilize for this setting: 
  Round Up - Round Up increases the number to the nearest higher value based on the Scaling Limit and Threshold. 
  Round Down - Round Down decreases the number to the nearest lower value based on the Scaling Limit and Threshold. 
  Truncate - Truncate displays the number of decimals per the Scaling Limit.  No rounding is applied. 
  `
  constructor(
    private accuracyPipe: AccuracyPipe,
  ) {
    this.scalingType = scaling_type;
  }

  ngOnInit(): void {
  }
  openTryOut(){
    this.tryOut = true;
  }

  async sidebarClose() {
    this.tryOut = false;
 }
 tryInputChange(): void {
    this.scaleLimitError = this.scaleThresholdError = false;
    if (!(this.scaleExample?.scale >= 0 && this.scaleExample?.scale < 9)) {
      this.scaleLimitError = true;
      if (this.scaleExample?.type !== 'truncate' && !(this.scaleExample?.threshold >= 0 && this.scaleExample?.threshold <= 9)) {
        this.scaleThresholdError = true;
      }
      this.scaleExample.result = null;
    } else if (this.scaleExample?.type !== 'truncate' && !(this.scaleExample?.threshold >= 0 && this.scaleExample?.threshold <= 9)) {
      this.scaleThresholdError = true;
      this.scaleExample.result = null;
    } else if (
      this.scaleExample?.input &&
      this.scaleExample?.type &&
      this.scaleExample?.scale >= 0 &&
      this.scaleExample?.scale <= 9 &&
      (this.scaleExample?.type === 'truncate' || (this.scaleExample?.threshold >= 0 && this.scaleExample?.threshold <= 9))
    ) {
      this.scaleExample.result = this.accuracyPipe.roundByType(
        this.scaleExample?.input,
        this.scaleExample?.type,
        this.scaleExample?.scale,
        this.scaleExample?.threshold || null, // if threshold is 0 then it will not work
        true, // isFunction true to use roundByType function directly
      );
    } else {
      this.scaleExample.result = null;
    }
  }

}
