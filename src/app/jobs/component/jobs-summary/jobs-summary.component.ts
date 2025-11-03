import { Component, EventEmitter, Input, Output, } from '@angular/core';

@Component({
  selector: 'app-jobs-summary',
  templateUrl: './jobs-summary.component.html',
  styleUrls: ['./jobs-summary.component.scss']
})
export class JobsSummaryComponent {
  @Input() jobData;
  @Input() selectedTemplate;
  @Input() hierarchyData;
  @Output() onSubmit = new EventEmitter();
  @Output() onClose = new EventEmitter();
  public showEstimate: boolean = false;

  public toggleDisable = {
    value: true
  };

  constructor() { }



  snakeCaseToTitle(snakeCaseString) {
    if (!snakeCaseString) {
      return '';
    }

    snakeCaseString = snakeCaseString.toLowerCase().split('_');
    for (let i = 0; i < snakeCaseString.length; i++) {
      snakeCaseString[i] = snakeCaseString[i][0].toUpperCase() + snakeCaseString[i].slice(1);
    }

    return snakeCaseString.join(' ');

  }
  onClickToggleDisable() {
    if (this.toggleDisable.value) {
      this.toggleDisable.value = false;
    } else {
      this.toggleDisable.value = true;
    }
  }
  saveJob() {
    this.onClose.emit({ type: 'saveJob', data: 'true' });
  }

  getType(r) {
    let count = 0;
    r?.forEach((e, i) => {
      if (e.flag) {
        count++;
      }
    });
    return count;
  }
  backToJobInfo() {
    this.onClose.emit({ type: 'jobDistribution', value: 3 });
  }

}

