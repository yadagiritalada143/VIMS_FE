import { BASIC_FIELD_TYPES } from './../../../../shared/enums';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-headings',
  templateUrl: './headings.component.html',
  styleUrls: ['./headings.component.scss']
})
export class HeadingsComponent implements OnInit {
  isShowHeadings: boolean = true;
  fieldTypes: any = BASIC_FIELD_TYPES;
  constructor() { }

  ngOnInit(): void {
  }
  openHeadings() {
    this.isShowHeadings = !this.isShowHeadings;
  }
}
