import { BASIC_FIELD_TYPES } from './../../../../shared/enums';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-input-fields',
  templateUrl: './input-fields.component.html',
  styleUrls: ['./input-fields.component.scss']
})
export class InputFieldsComponent implements OnInit {
  isShowInputFields: boolean = true;
  constructor() { }

  fieldTypes: any = BASIC_FIELD_TYPES;

  ngOnInit(): void {
  }
  openInputFields(){
    this.isShowInputFields = !this.isShowInputFields;
  }
}
