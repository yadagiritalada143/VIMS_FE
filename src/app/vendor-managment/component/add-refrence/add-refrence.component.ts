import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-refrence',
  templateUrl: './add-refrence.component.html',
  styleUrls: ['./add-refrence.component.scss']
})
export class AddRefrenceComponent implements OnInit {

  @Input() visiblity = 'hidden';
  @Input() isEditReference;
  @Input() allCountryList;
  @Input() dataToEditReference;
  index = -1;
  @Output() onClose = new EventEmitter();
  @Output() onSubmit = new EventEmitter<any>();
  referenceForm = this.fb.group({
    company_name: ['', [Validators.required]],
    affiliation: ['', [Validators.required]],
    contact_email: ['', [Validators.required]],
    contact_phone: [null, [Validators.pattern('^[A-Za-z0-9]{10}$')]],
    phoneFormat: ['US', ''],
  })
  constructor(private fb: UntypedFormBuilder) { }

  ngOnInit(): void { }

  ngOnChanges(): void {
    if(this.isEditReference){
      this.referenceForm.patchValue({
        company_name: this.dataToEditReference?.company_name,
        affiliation: this.dataToEditReference?.affiliation,
        contact_email: this.dataToEditReference?.contact_email,
        contact_phone: this.dataToEditReference?.contact_phone,
        phoneFormat: this.dataToEditReference?.iso2_code ? this.dataToEditReference?.iso2_code : 'US'
      })
      this.index = this.dataToEditReference?.editedIndex
    }
    if(!this.isEditReference){
        this.referenceForm = this.fb.group({
        company_name: ['', [Validators.required]],
        affiliation: ['', [Validators.required]],
        contact_email: ['', [Validators.required]],
        contact_phone: ['', [Validators.required]],
        phoneFormat: ['US', ''],
      })
    }
  }

  sideBaClose() {
    this.referenceForm.reset();
    this.onClose.emit();
  }

  referenceSubmit(index) {
    let json = this.referenceForm.value
    json["sampleindex"] = index
    this.index = -1
    this.onSubmit.emit(json);
    this.referenceForm.reset();
  }
}
