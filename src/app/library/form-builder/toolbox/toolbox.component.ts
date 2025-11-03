import { Component, OnInit } from '@angular/core';
import { BASIC_FIELD_TYPES } from './../../../shared/enums';

@Component({
  selector: 'app-toolbox',
  templateUrl: './toolbox.component.html',
  styleUrls: ['./toolbox.component.scss']
})
export class ToolboxComponent implements OnInit {
  isShowInputFields: boolean = true;

  constructor() { }
  fieldTypes: any = BASIC_FIELD_TYPES;

  ngOnInit(): void {
  }
  openInputFields(){
    this.isShowInputFields = !this.isShowInputFields;
  }
}
