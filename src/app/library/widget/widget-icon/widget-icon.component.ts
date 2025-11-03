import { Component, Input, OnInit } from '@angular/core';
import { IWidgetIcon } from '../widget.interfaces';
import { IconNames } from '../widget.types';

@Component({
  selector: 'app-widget-icon',
  templateUrl: './widget-icon.component.html',
  styleUrls: ['./widget-icon.component.scss']
})
export class WidgetIconComponent implements OnInit {
  @Input() iconConfig: IWidgetIcon;

  public readonly IconNames = IconNames;

  constructor() { }

  ngOnInit(): void {
  }

  public getColor(): string {
    return `background: ${this.iconConfig?.iconColor}3b`;
  }

}
