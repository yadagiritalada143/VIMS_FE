import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'svms-dialog',
  templateUrl: './svms-dialog.component.html',
  styleUrls: ['./svms-dialog.component.scss']
})
export class SvmsDialogComponent implements OnInit {

  @Input() width: string;
  @Input() height: string;
  @Input() visibility: boolean = false;

  constructor() { }

  ngOnInit(): void { }

}