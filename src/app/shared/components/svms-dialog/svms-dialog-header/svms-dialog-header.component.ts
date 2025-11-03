import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'svms-dialog-header',
  templateUrl: './svms-dialog-header.component.html',
  styleUrls: ['./svms-dialog-header.component.scss']
})
export class SvmsDialogHeaderComponent implements OnInit {

  @Input() showCancelButton: boolean = true;
  @Output() close: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor() { }

  ngOnInit(): void { }

}
