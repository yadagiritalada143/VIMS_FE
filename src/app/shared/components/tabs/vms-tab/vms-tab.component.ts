import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'vms-tab',
  templateUrl: './vms-tab.component.html',
  styleUrls: ['./vms-tab.component.scss']
})
export class VmsTabComponent implements OnInit {

  @Input() label: string;
  @Input() iconLeft: string;
  @Input() iconRight: string;
  @Input() disabled: boolean = false;
  @Input() active = false;
  constructor() { }

  ngOnInit(): void {
  }

}
