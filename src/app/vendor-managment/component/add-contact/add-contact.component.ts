import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';


@Component({
  selector: 'app-add-contact',
  templateUrl: './add-contact.component.html',
  styleUrls: ['./add-contact.component.scss']
})
export class AddContactComponent implements OnInit {
  isPrimaryExist=false
  @Input() visiblity = 'hidden';
  @Input() isEditContact;
  @Input() dataToEditContactList;
  @Input() isPrimaryContactLength;
  @Input() allCountryList;
  @Output() onClose = new EventEmitter();
  @Output() onSubmit = new EventEmitter<any>();
  index = -1;
  contactForm = this.fb.group({
    contact_email: ['',],
    contact_name: ['', [Validators.required]],
    contact_phone: [null, [Validators.pattern('^[A-Za-z0-9]{10}$')]],
    member_type: [],
    phoneFormat: ['US', ''],
    title: [''],
    ext: [],
    is_primary : [false]
  })
  constructor(private fb: UntypedFormBuilder) { }
  ngOnInit(): void { }

  ngOnChanges(): void {
    if(this.isEditContact){
      this.contactForm.patchValue({
        contact_email: this.dataToEditContactList.email,
        contact_name: this.dataToEditContactList.contact_name ? this.dataToEditContactList.contact_name : this.dataToEditContactList.first_name +' '+this.dataToEditContactList.last_name,
        contact_phone: this.dataToEditContactList.phone_numbers[0].number,
        member_type: this.dataToEditContactList.type,
        phoneFormat: this.dataToEditContactList.phone_numbers[0].iso2_code ? this.dataToEditContactList.phone_numbers[0].iso2_code : 'US',
        title: this.dataToEditContactList.title,
        ext: this.dataToEditContactList.phone_numbers[0].ext,
        is_primary: this.dataToEditContactList.phone_numbers[0].label == "PRIMARY" ? true : false
      })
      this.index = this.dataToEditContactList?.editedIndex
    }
    if(!this.isEditContact){
        this.contactForm = this.fb.group({
        contact_email: ['',''],
        contact_name: ['', [Validators.required]],
        contact_phone: ['', [Validators.required]],
        member_type: [],
        phoneFormat: ['US', ''],
        title: [''],
        ext: [],
        is_primary: [false]
      })
    }

  }

  checkPrimary(event){
    if(!this.isEditContact){
      this.isPrimaryContactLength >= 1 ? event.target.checked ? this.isPrimaryExist = true : this.isPrimaryExist = false : this.isPrimaryExist = false
    } else {
      let isCurrentContact = this.dataToEditContactList?.phone_numbers[0]?.label == "PRIMARY" ? true : false
      if(isCurrentContact){
        this.isPrimaryExist = false
      }else {
        if(this.isPrimaryContactLength >= 1 && event.target.checked){
          this.isPrimaryExist = true;
        } else {
          this.isPrimaryExist = false
        }
      }
    }
  }

  sideBaClose() {
    this.isPrimaryExist = false
    this.index = -1
    this.onClose.emit();
  }

  contactSubmit(index) {
    let json = this.contactForm.value
    json.label = json.is_primary ? "PRIMARY" : "SECONDARY"
    json["sampleindex"] = index
    this.index = -1
    this.isPrimaryExist=false
    this.onSubmit.emit(json);
    this.contactForm.reset();
  }


}
