import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { AccuracyConfigEnum } from 'src/app/shared/enums';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';

@Component({
  selector: 'app-edit-rate-factors',
  templateUrl: './edit-rate-factors.component.html',
  styleUrls: ['./edit-rate-factors.component.scss']
})
export class EditRateFactorsComponent implements OnInit {
  @Input() rateFactors;
  @Input() rateFactorValue;
  @Input() rateTypeFactors;
  @Input() rateType;
  @Input() factorsIndex;
  @Input() otExempt;
  @Input() editFromAssignment:boolean = false;
  @Output() rateFactorValueChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() cancelClick: EventEmitter<boolean> = new EventEmitter<boolean>();
  isEditing: boolean = false;
  isUpdateCancel: boolean = true;
  factorInputDisabled: boolean = true;
  originalRateTypeFactors: any[] = [];
  updatedRateTypeFactors: any[] = [];
  constructor(
    public authorizationService: AuthorizationService,
    private accuracy: AccuracyPipe
  ) { }

  ngOnInit(): void {
   this.rateTypeFactors = this.rateTypeFactors ? JSON.parse(JSON.stringify(this.rateTypeFactors)) : [];
   this.originalRateTypeFactors = JSON.parse(JSON.stringify(this.rateTypeFactors));
  }

  onClickInsideChild(event: Event) {
    event.stopPropagation(); // Prevent the click event from propagating to the parent document
  }

  editRateFactor(){
    this.isEditing = true;
    this.isUpdateCancel = false;
  }

  checkAuthorization(permission) {
    return this.authorizationService.authorize(permission)
  }

  cancelEdit() {
    this.rateTypeFactors = [...this.originalRateTypeFactors];
    this.cancelClick.emit(true);
  }
  onBlurAmount(rate) {
    rate.factor = this.accuracy?.transform(rate?.factor, AccuracyConfigEnum.RATE, { isEdit: true });
  }

  showEditButtons(){
    this.isEditing = true;
    this.isUpdateCancel = false;
    this.factorInputDisabled = false
  }

  updateRateFactors() {
    if (this.updatedRateTypeFactors.length > 0) {
      this.rateFactorValueChange.emit([...this.updatedRateTypeFactors]);
    }
  }

  updateFactorValue(abbreviation, rate_type, updatedValue, rateFactorType) {
    const existingValueIndex = this.updatedRateTypeFactors.findIndex(
      (value) => value.abbreviation === abbreviation && value.rate_type === rate_type
    );

    const newRateValue = {
      abbreviation: abbreviation,
      rate_type: rate_type,
      factor: this.accuracy?.transform(updatedValue, AccuracyConfigEnum.RATE, { isEdit: true }),
      rateFactorType: rateFactorType
    };

    if (existingValueIndex !== -1) {
      this.updatedRateTypeFactors[existingValueIndex] = newRateValue;
    } else {
      this.updatedRateTypeFactors.push(newRateValue);
    }

    if (this.updatedRateTypeFactors.length > 2) {
      this.updatedRateTypeFactors.shift();
      this.updatedRateTypeFactors.push(newRateValue);
    }

  }
}
