import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'svms-sidebar-body-ng',
  templateUrl: './svms-sidebar-body-ng.component.html',
  styleUrls: ['./svms-sidebar-body-ng.component.scss']
})
export class SvmsSidebarBodyNgComponent implements OnInit {

  @Input() label: string;
  @Input() icon: string;
  @Input() active = false;
  @Input() subMenuItems;
  constructor() { }

  ngOnInit(): void {
  }

}
