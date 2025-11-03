import { Component, OnInit, Output, EventEmitter, Input, SimpleChanges } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, UntypedFormArray, FormControl } from '@angular/forms';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
//import { JobDetailsService } from 'src/app/jobs/job-details/job-details.service';
import { ConfirmationDialogService } from '../confirmation-dialog/confirmation-dialog.service';
import { debounceTime, distinctUntilChanged} from 'rxjs/operators';
import { AccuracyPipe } from '../../pipe/accuracy.pipe';
import { AccuracyConfigEnum } from 'src/app/shared/enums';
//import { TaxAdjustmentService } from '../../service/utility/taxAdjustment.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';

@Component({
  selector: 'app-adjustment-and-tax-forms',
  templateUrl: './adjustment-and-tax-forms.component.html',
  styleUrls: ['./adjustment-and-tax-forms.component.scss']
})
export class AdjustmentAndTaxFormsComponent implements OnInit {
  manageTax: boolean = false;
  viewTax: boolean = false;
  programDetails;
  taxAdjustmentForm: UntypedFormGroup;
  adjustment_fee;
  taxesArray;
  adjustmentChanged;
  adjustmentAmountControl;
  userInteractedWithTaxFields = false;
  decimalConfig;
  prevACAKeyBackspace = false;
  prevDecimalPrecision = 0;
  //taxTypePicklist = [];
  //taxOptionsArray = [];
  adjustmentAllowed: boolean = false;
  manageAdjustment: boolean = false;
  viewAdjustment : boolean = false;
  @Output() taxFormValueChange = new EventEmitter<any>();
  @Input() acceptOffer;
  @Input() currency;
  @Input() isShowTax;
  @Input() jobDetails;
  @Input() candidateDetails;
  @Input() remoteDetails;
  @Input() isRemoteWorker;

  patchAdjustmentFeeValue = (adjustmentFee = '0', isEdit = true) => {
    this.taxAdjustmentForm?.patchValue({
      adjustmentAmount: this.accuracy?.transform(adjustmentFee || 0, AccuracyConfigEnum.ADJUSTMENT, { isEdit })
    });
  }

  changeACAValue = (event)=>{
    let adjustmentFee = this.taxAdjustmentForm.get('adjustmentAmount').value?.trim();
    let strs = adjustmentFee.split('.');
    let strLen = adjustmentFee.length;

    if(!this.decimalConfig || event?.key === ' ') return;

    let toBeReturned = false;
    const selectedText = window.getSelection()?.toString()?.trim();

    if((selectedText === adjustmentFee) && event.key == '.') {
      this.taxAdjustmentForm?.patchValue({
        adjustmentAmount: '0.'
      });
      this.prevACAKeyBackspace = false;
      return;
    }

    if(selectedText && adjustmentFee.includes(selectedText) && isFinite(event.key)){
      adjustmentFee = adjustmentFee.substring(0, event?.target?.selectionStart)+ event.key+ adjustmentFee.substring(event?.target?.selectionStart + selectedText.length);
      this.taxAdjustmentForm?.patchValue({
        adjustmentAmount: adjustmentFee
      });
      this.prevACAKeyBackspace = false;
      this.prevDecimalPrecision = adjustmentFee?.split('.')?.[1].length || 0;
      return;
    }

    if(adjustmentFee === ''){
      this.patchAdjustmentFeeValue();
      this.prevACAKeyBackspace = false;
      toBeReturned=true;
    }else if(isFinite(event?.key) && (strs?.[0].length) < event?.target?.selectionStart){
      if(this.prevACAKeyBackspace || (this.prevDecimalPrecision < this.decimalConfig)){
        this.prevACAKeyBackspace = false;
        toBeReturned = true;
      }
      if(strs?.[1].length === this.decimalConfig){
        if(event?.target?.selectionStart < strLen){
          adjustmentFee = adjustmentFee.slice(0, event?.target?.selectionStart) + event?.key + adjustmentFee.slice(event?.target?.selectionStart, strLen-1);
        }else{
          adjustmentFee = strs?.[0] + strs?.[1].slice(0,1) + '.' + strs?.[1].slice(1) + event?.key;
        }
      }else{
        toBeReturned = true;
      }
    } else if(event?.key === "Backspace" && (strs?.[0].length) < event?.target?.selectionStart) {
      this.prevACAKeyBackspace = true;
      toBeReturned = true;
    } else{
      this.prevACAKeyBackspace = false;
      toBeReturned = true;
    }

    this.prevDecimalPrecision = strs?.[1]?.length || 0;
    if(toBeReturned){
      return;
    }
    this.patchAdjustmentFeeValue(adjustmentFee);
  }

  @Input() set adjustmentValue(adjustmentFee){
    this.adjustment_fee = adjustmentFee ? adjustmentFee[0]?.amount_value : null;
    this.patchAdjustmentFeeValue(this.adjustment_fee);
  };
  @Input() taxesData: any[] = [];

  constructor(
    //public JobDetailsService: JobDetailsService,
    private storageService : StorageService,
    private fb: UntypedFormBuilder,
    private _confirmService: ConfirmationDialogService,
    private accuracy: AccuracyPipe,
    //private taxService: TaxAdjustmentService,
    private authorizationService: AuthorizationService,
  ) {
    this.taxAdjustmentForm = this.fb.group({
      taxes: this.fb.array([]),
      adjustmentType:['ACA Fee'],
      adjustmentAmount:[]
    });
    if(this.taxesData){
      this.initializeTaxes();
    }
  }

  ngOnInit(): void {
    this.programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let accuracyObject = this.storageService.get(StorageKeys.ACCURACY_CONFIG);

    // TAX PERMISSIONS
    this.manageTax = this.authorizationService.authorize('manage_tax_offer');
    this.viewTax = this.authorizationService.authorize('view_tax_offer');

    this.adjustmentAllowed = this.programDetails?.config?.is_adjustment_fee_allowed;
    this.manageAdjustment = this.authorizationService.authorize('manage_adjustment');
    this.viewAdjustment = this.authorizationService.authorize('view_adjustment');

    // this.taxService.getTaxDataPicklist().subscribe(res=>{
    //   if(res){
    //     this.taxTypePicklist = res;
    //     this.taxOptionsArray = res;
    //   }
    // });

    if(typeof accuracyObject === 'object' && !Array.isArray(accuracyObject) && accuracyObject !== null){
      this.decimalConfig = accuracyObject?.adjustment?.scale;
    }
    this.prevDecimalPrecision = this.decimalConfig;

    this.manageTax = this.authorizationService.authorize('manage_tax');
    this.viewTax = this.authorizationService.authorize('view_tax');

    if(this.taxesData){
      this.initializeTaxes();
    }

    if(this.adjustment_fee){
      this.patchAdjustmentFeeValue(this.adjustment_fee);
    }

      this.adjustmentAmountControl = this.taxAdjustmentForm.get('adjustmentAmount');
      this.adjustmentAmountControl.valueChanges.pipe(
        debounceTime(1000),
        distinctUntilChanged()
      ).subscribe(() => {
        this.handleFormChanges();
      });

      this.taxArray.valueChanges.subscribe((data) => {
      this.handleFormChanges();
      });


      // this.taxService.subject.subscribe((res:any)=>{
      //   if(res){
      //     const taxType = this.taxTypePicklist.find(tax=>tax?.id === res?.tax_type);
      //     const taxValue = res?.tax_value ?? '';
      //     const taxExist =this.taxArray.controls.findIndex(control=> control?.get('name')?.value === taxType?.value);
      //     if(taxType && taxExist == -1){
      //       this.addTaxType(taxType?.value,taxValue)
      //     }
      //     else if(taxExist != -1){
      //       this.taxArray?.controls?.[taxExist]?.patchValue({
      //         value : this.accuracy?.transform(taxValue || 0, AccuracyConfigEnum.TAX_PERCENTAGE, { isEdit: true })

      //     })
      //     this.checkTaxAmountValue(taxValue,taxExist);
      //     }
      //   }
      // });

  }

  // ngOnChanges(changes:SimpleChanges){
  //   if(((changes['jobDetails'] && changes['jobDetails'].previousValue != changes['jobDetails'].currentValue) ||
  //   (changes['candidateDetails'] && changes['candidateDetails'].previousValue != changes['candidateDetails'].currentValue) ||
  //   (changes['isRemoteWorker'] && changes['isRemoteWorker'].previousValue != changes['isRemoteWorker'].currentValue) ||
  //   (changes['remoteDetails'] && changes['remoteDetails'].previousValue != changes['remoteDetails'].currentValue)) &&
  //   this.jobDetails && this.candidateDetails && !this.taxesData?.length){
  //      const payload : any = {
  //        hierarchy : [this.jobDetails?.hierarchy?.[0]?.id],
  //       hierarchy_rule : [this.jobDetails?.hierarchy?.[0]?.id],
  //       program_vendor : [this.candidateDetails?.vendor?.id],
  //       location_id : [this.jobDetails?.location?.id],
  //       program_industry : [this.jobDetails?.program_industry?.[0]?.id],
  //       work_classification : null


  //      }
  //      if(this.isRemoteWorker === true ){
  //       payload.remote_country = [this.remoteDetails?.country?.id],
  //       payload.remote_state = [this.remoteDetails?.state?.id],
  //       payload.remote_county= [this.remoteDetails?.county?.id],
  //       payload.remote_city= [this.remoteDetails?.city?.id]
  //     }
  //     this.taxService.getRulesEngineTaxData(payload);

  //   }
  // }
  handleFormChanges(){
    const filteredData = this.taxAdjustmentForm.getRawValue().taxes.filter(item => item.name !== "" || item.value !== "");
    const adjustmentPayload = [];
    const amountValue = Number.parseFloat(this.adjustmentAmountControl.value?.trim());
    if (this.adjustmentAmountControl.dirty || (amountValue !== null && amountValue !== undefined)) {
      const adjustmentData = {
        entity_name: 'ACA',
        amount_type: 'fixed_amount',
        amount_value: amountValue || 0, // Set a default value if amountValue is falsy
        applicable_on: this.programDetails?.config?.adjustment_fee_applicable_on || 'client_bill_rate',
        calculated_on: this.programDetails?.config?.adjustment_fee_calculated_on,
        entity_type: 'adjustment_fee'
      };
      adjustmentPayload.push(adjustmentData);
    }

    const isTaxButtonDisabled = this.isTaxFieldsValid();
    const sendingData = {
      tax: filteredData.length !== 0 ? filteredData.map(item => {item.value = +item.value; return item;}) : null,
      adjustment_fee: adjustmentPayload.length !== 0 ? adjustmentPayload : null,
      adjustmentChanged: this.adjustmentAmountControl.dirty,
      isTaxValid: isTaxButtonDisabled
    };
    this.taxFormValueChange.emit(sendingData);
  }

  removeTaxTypeField(tax,index){
    this._confirmService.confirm('', `Do you want to remove ${tax || 'selected entity'} ?`,
    'Yes', 'No')
    .then((confirmed) => {
      if (confirmed) {
        if (index !== -1) {
          const control = this.taxAdjustmentForm?.get('taxes') as UntypedFormArray;
          control?.removeAt(index);
          // if(this.taxTypePicklist){
          //   this.updateOptions(index, "REMOVE");
          // }
        }
      }
    })
    .catch(() => {

    });
  }


  get taxArray() {
    return this.taxAdjustmentForm?.get('taxes') as UntypedFormArray;
  }

  isCutomTaxExist(eventValue, index) {
    const taxNameControl = this.taxArray?.at(index).get('name');
    if (eventValue.trim() === '') {
      taxNameControl.setErrors({ required: true });
    } else {
      const duplicateName = this.checkDuplicateTaxName(eventValue, index);
      if (duplicateName) {
        taxNameControl.setErrors({ duplicate: true });
      } else {
        taxNameControl.setErrors(null);
      }
    }
  }

  // updateOptions(i: number, type: string){

  //   if(!this.taxTypePicklist) return;

  //   // for setting tax value
  //   if(type !== "REMOVE"){
  //     const taxName = this.taxArray?.at(i).get('name').value || "";
  //     if(taxName){
  //       let option = this.taxOptionsArray.filter(taxOptions => taxOptions.name === taxName)[0];
  //       const taxValue = this.accuracy?.transform(this.taxArray?.at(i).get('value').value || option?.value || 0, AccuracyConfigEnum.TAX_PERCENTAGE, { isEdit: true });
  //       this.taxArray?.at(i).patchValue({
  //         name: taxName,
  //         value : taxValue,
  //       });
  //     }
  //   }

  //   // for updating taxOptions array
  //   const taxFields = [];
  //   this.taxArray?.controls.filter(control => {
  //     const taxName = control.get('name').value ? control.get('name').value : '';
  //     taxFields.push(taxName.trim());
  //   });
  //   this.taxOptionsArray = this.taxTypePicklist.filter(taxType => {
  //     return !(taxFields.includes(taxType.value));
  //   })
  // }

  isTaxFieldsValid(){
    if(this.taxArray?.dirty) {
    const hasValidationErrors = this.taxArray?.controls.some(control => {
      const taxName = control.get('name').value;
      const taxValue = control.get('value').value;
      return (
        taxName.trim() === '' ||
        isNaN(taxValue) || taxValue === '' ||
        taxValue > 100
      );
    });

    const hasDuplicateNames = this.taxArray?.controls.some((control, index) => {
      const currentName = control.get('name').value?.trim();
      return this.checkDuplicateTaxName(currentName, index);
    });

    const isInvalid = this.taxArray?.invalid ||
      this.taxArray?.hasError('required') ||
      hasValidationErrors ||
      hasDuplicateNames;

    return isInvalid;
  }
  }

  isTaxButtonDisabled() {
    const hasEmptyRow = this.taxArray?.controls.some(control => {
    const taxName = control.get('name').value;
    const taxValue = control.get('value').value;
    return taxName.trim() === '' || isNaN(taxValue) || taxValue === '';
  });

  const hasValidationErrors = this.taxArray?.controls.some(control => {
    const taxName = control.get('name').value;
    const taxValue = control.get('value').value;
    return (
      taxName.trim() === '' ||
      isNaN(taxValue) || taxValue === '' ||
      taxValue > 100
    );
  });

  const hasDuplicateNames = this.taxArray?.controls.some((control, index) => {
    const currentName = control.get('name').value?.trim();
    return this.checkDuplicateTaxName(currentName, index);
  });

  const isInvalid = this.taxArray?.invalid ||
    this.taxArray?.hasError('required') ||
    hasValidationErrors ||
    hasDuplicateNames;

  return hasEmptyRow || isInvalid;
  }

  checkDuplicateTaxName(value: string, index: number): boolean {
    const trimmedValue = value.trim();
    return this.taxArray?.controls
      .filter((control, i) => i !== index)
      .some(control => control.get('name').value === trimmedValue);
  }

  checkTaxAmountValue(value: number, i) {
    let taxData = this.taxAdjustmentForm?.get('taxes') as UntypedFormArray;
    if (value > 100 || !value) {
      taxData.at(i)?.get('value')?.setErrors({ 'invalidAmount': true });
    } else {
      taxData.at(i)?.get('value')?.setErrors(null);
    }
  }

  initializeTaxes(): void {
    this.taxArray?.clear();
    if (this.taxesData && this.taxesData?.length > 0) {
      for (const tax of this.taxesData) {
        this.addTaxType(tax.name, tax.value);
      }
    }
  }

  addTaxType(name: string, value: any){
    const taxForm = this.fb.group({
      name: name,
      unit: 'PERCENTAGE',
      value: this.accuracy?.transform(value, AccuracyConfigEnum.TAX_PERCENTAGE, { isEdit: true })
    });
    this.taxArray?.push(taxForm);
      //this.updateOptions(null,"REMOVE");
    this.taxAdjustmentForm?.updateValueAndValidity();
  }
  addNewTaxType(): void {
      this.addTaxType('', '');
  }

}
