import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'icon',
  templateUrl: './icon.component.html',
  styleUrls: ['./icon.component.scss']
})
export class IconComponent implements OnInit {

  @Input() size: string;
  @Input() color: string;
  @Input() name: string;
  @Input() type: string = 'material';
  @Input() cuClass: string;
  @Input() theme: string;
  @Input() variationSettings: string = "'FILL' 0, 'wght' 200, 'GRAD' -25, 'opsz' 48";

  @Output() onClick = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
  }

  onClickIcon() {
    this.onClick.emit(true)
  }

}
