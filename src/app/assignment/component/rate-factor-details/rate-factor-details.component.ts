import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { RateVal } from '../../assignment.model'
import { AccuracyConfigEnum } from '../../enums/accuracy-config';


@Component({
  selector: 'app-rate-factor-details',
  templateUrl: './rate-factor-details.component.html',
  styleUrls: ['./rate-factor-details.component.scss']
})
export class RateFactorDetailsComponent implements OnInit {
  @Output() submit = new EventEmitter();
  addCertificate = "hidden";
  title = "";
  ratename1 = "Bill Rate";
  ratename2 = "";
  frmratefactors =
  {
      "abbreviation": "",
      "rate_type": "",
      "rates": [
        {
        "factor": 0,
        "rate_type": "BILL_RATE"
        },
        {
        "factor": 0,
        "rate_type": "PAY_RATE"
        }
      ],
      index:0
 }
 accuracyConfig = AccuracyConfigEnum;
  constructor(
    private eventStream: EventStreamService
  ) { }

  ngOnInit(): void {
    this.eventStream.on(Events.RATE_FACTOR_DETAILS).subscribe((data) => {
      this.frmratefactors.abbreviation = data?.rate?.abbreviation;
      this.frmratefactors.index = data?.index;
      this.title = this.frmratefactors?.abbreviation + " " + (this.frmratefactors?.rate_type === "billrate" ? "Bill Rate" : "Pay Rate");
      this.frmratefactors.rate_type = data?.ratetype;
      this.frmratefactors.rates = [];
      if (data?.ratetype === "billrate") {
        if (data?.rate?.bill_rate?.length > 0) {
          let rateVal: RateVal = {
            factor: 0, rate_type: "", adjustment: data?.rate?.bill_rate[0]?.adjustment || null, adjustment_type: data?.rate?.bill_rate[0]?.adjustment_type || null
          };
          rateVal.factor = data?.rate?.bill_rate[0]?.factor;
          rateVal.rate_type = data?.rate?.bill_rate[0]?.rate_type;;
          this.frmratefactors?.rates?.push(rateVal);
          this.ratename1 = rateVal?.rate_type=== "BILL_RATE" ? "Bill Rate" : "Pay Rate";
        }
        if (data?.rate?.bill_rate?.length > 1) {
          let rateVal: RateVal = {
            factor: 0, rate_type: "", adjustment: data?.rate?.bill_rate[1]?.adjustment || null, adjustment_type: data?.rate?.bill_rate[1]?.adjustment_type || null
          };
          rateVal.factor = data?.rate?.bill_rate[1]?.factor;
          rateVal.rate_type = data?.rate?.bill_rate[1]?.rate_type;
          this.frmratefactors?.rates?.push(rateVal);
          this.ratename2 = rateVal?.rate_type === "BILL_RATE" ? "Bill Rate" : "Pay Rate";
        }

      }
      else if (data?.ratetype === "payrate") {
       if (data?.rate?.pay_rate?.length > 0) {
          let rateVal: RateVal = {
              factor: 0, rate_type: "", adjustment: data?.rate?.pay_rate[0]?.adjustment || null, adjustment_type: data?.rate?.pay_rate[0]?.adjustment_type || null
          };
          rateVal.factor = data?.rate?.pay_rate[0]?.factor;
          rateVal.rate_type = data?.rate?.pay_rate[0]?.rate_type;;
          this.frmratefactors?.rates?.push(rateVal);
          this.ratename1 = rateVal?.rate_type === "BILL_RATE" ? "Bill Rate" : "Pay Rate";
        }
        if (data?.rate?.pay_rate?.length > 1) {
          let rateVal: RateVal = {
            factor: 0, rate_type: "", adjustment: data?.rate?.pay_rate[1]?.adjustment || null, adjustment_type: data?.rate?.pay_rate[1]?.adjustment_type || null
          };
          rateVal.factor = data?.rate?.pay_rate[1]?.factor;
          rateVal.rate_type = data?.rate?.pay_rate[1].rate_type;;
          this.frmratefactors?.rates?.push(rateVal);
          this.ratename2 = rateVal?.rate_type === "BILL_RATE" ? "Bill Rate" : "Pay Rate";
        }

      }
      if(data) {
        this.addCertificate = "visible";
      }
    });
  }
  sidebarClose() {
    this.addCertificate = "hidden";
  }
  updateFactors() {
    this.submit.emit(this.frmratefactors);
    this.sidebarClose();
  }
}
