import { Component, Input, OnInit, Output,EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  EventStreamService,
  Events
} from 'src/app/core/services/event-stream.service';

@Component({
  selector: 'app-break-rule',
  templateUrl: './break-rule.component.html',
  styleUrls: ['./break-rule.component.scss']
})
export class BreakRuleComponent implements OnInit {
  private subscriptions: Subscription[] = [];
  addBreakRule:boolean = false;
  @Input() request: any;
  @Input() options : any;
  @Input() mode : any;
  @Input() configurationMode : any;
  @Output() selectBreakType = new EventEmitter();
  @Output() paidBreaks=new EventEmitter();
  @Output() paidMandatorys = new EventEmitter();
  @Output() paidMaxHour=new EventEmitter();
  @Output() paidMinHour=new EventEmitter();
  @Output() toggleValue = new EventEmitter();
  constructor(private eventStream: EventStreamService) { }

  ngOnInit(): void {
    this.subscriptions.push(this.eventStream.on(Events.ADD_BREAK_RULE).subscribe((data: any) => {
      console.log(data)
      if (data) {
        let exit =this.request.rules.basic_rules.break.options.filter(n => n.type)
        if(exit.length >=1){
        this.request.rules.basic_rules.break.options = this.request.rules.basic_rules.break.options.filter(n => n.type)
        }else {
        this.request.rules.basic_rules.break.options = this.request.rules.basic_rules.break.options.splice(0,1)
        }
       this.addBreakRule = true
      }
    }));
  }
  sidebarClose() {
    this.addBreakRule = false;
  }

  addBreakTime() {
    this.request.rules.basic_rules.break.options.push(
      {
        "type": null,
        "is_mandatory": false,
        "is_paid_inclusive": false,
        "is_validate_break_limit": false,
        "break_rule": [
          {
            "break_number": "0",
            "min_hours": 0,
            "operator": "AND",
            "max_hours": 0,
            "max_duration": 0
          }
        ],
        "penality_rule": {
          "is_allow": false,
          "limit": null,
          "rate": null,
          "value": null,
          "unit": "hour"
        }
      }
    );
  }

  addBreak(breakRule) {
    let count = 0;
    if (breakRule && breakRule.length > 0) {
      breakRule.forEach(element => {
        if (element.break_number > count) {
          count = element.break_number;
        }
      });
    }
    breakRule.push({
      break_number: count + 1,
      min_hours: 0,
      operator: 'AND',
      max_hours: 0,
      max_duration: 0
    });

  }

  removeBreak(rule, breakRules) {
    breakRules = breakRules.filter(element => {
      return element.break_number !== rule.break_number;
    });
    return breakRules;
  }

  changeSelection(value)  {
    this.selectBreakType.emit(this.request);
  }
  dropdownSelectionChange(value,index){
    this.request.rules.basic_rules.break.options[index]['penality_rule']['limit'] = value
    this.selectBreakType.emit(this.request);
  }
  penaltyTextValue(value,index) {
    this.request.rules.basic_rules.break.options[index]['penality_rule']['value'] = value
    this.selectBreakType.emit(this.request);
  }

  applyPenaltyValue(value,index) {
    this.request.rules.basic_rules.break.options[index]['penality_rule']['rate'] = value
    this.selectBreakType.emit(this.request);
  }

  paidBreak(value) {
    this.paidBreaks.emit(value);
  }
  paidMandatory(value) {
    this.paidMandatorys.emit(value);
  }
  breakRuleMinHour(value) {
    this.paidMinHour.emit(value);
  }
  breakRuleMaxHour(value) {
    this.paidMaxHour.emit(this.request);
  }
  toggleValueChange(value,index) {
    // break.penality_rule.is_allow
    const is_allow= value;
    this.request.rules.basic_rules.break.options[index].penality_rule= {
      "is_allow": is_allow,
      "limit": null,
      "rate": null,
      "value": null,
      "unit": "hour"
    };
    // this.request.rules.basic_rules.break.options[index].penality_rule =value
    this.toggleValue.emit(this.request)
  }
  preventSpecialChar(event)
  {
     var k;
     k = event?.charCode;  //         k = event.keyCode;  (Both can be used)
     return((k > 64 && k < 91) || (k > 96 && k < 123) || k == 8 || k == 32 || (k >= 48 && k <= 57));
  }

}
