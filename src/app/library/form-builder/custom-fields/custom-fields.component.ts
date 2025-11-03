import { Component, Input } from '@angular/core';
import { BASIC_FIELD_TYPES } from './../../../shared/enums';

@Component({
  selector: 'app-custom-fields',
  templateUrl: './custom-fields.component.html',
  styleUrls: ['./custom-fields.component.scss']
})
export class CustomFieldsComponent {
  @Input() field: any;
  public fieldTypes: any = BASIC_FIELD_TYPES;
  public toggle = { value: true };
  fieldProperties: any = {};
  constructor() { }

  onClickToggle(toggle) {
    this.fieldProperties[toggle] = !this.fieldProperties[toggle];
  }

  get acceptedType() {
    return this.field?.meta_data?.file_type?.join(',');
  }

}
