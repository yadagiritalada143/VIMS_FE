import { Component, Input } from '@angular/core';

@Component({
  selector: 'svms-sidebar-loader',
  templateUrl: './svms-sidebar-loader.component.html',
  styleUrls: ['./svms-sidebar-loader.component.scss']
})
export class SvmsSidebarLoaderComponent {

  @Input() message: string = 'Loading, please wait';

  constructor() { }

}
