import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-self-config-log',
  templateUrl: './self-config-log.component.html',
  styleUrls: ['./self-config-log.component.scss']
})
export class SelfConfigLogComponent implements OnInit {

  @Input() title: string = '--';
  @Input() message: string = '--';
  @Input() type: AlertType = AlertType.INFO;
  
  @Input() btnTitle: string = '--';
  @Input() btnClick: Function = () => {};
  @Input() showButton: boolean = true;

  constructor() { }

  ngOnInit(): void {}

  get AlertType() {
    return AlertType;
  }
}

export enum AlertType {
  ERROR = 'error',
  INFO = 'info',
  SUCCESS = 'success',
  WARN = 'warn'
};
