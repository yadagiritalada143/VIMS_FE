import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-svms-help',
  templateUrl: './svms-help.component.html',
  styleUrls: ['./svms-help.component.scss']
})
export class SvmsHelpComponent implements OnInit {
  @Input() help:boolean = false;
  @Input() helpTitle:string;
  @Input() helpText:string;
  constructor() { }

  ngOnInit(): void {
  }

}
