import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-group-name',
  templateUrl: './group-name.component.html',
  styleUrls: ['./group-name.component.scss']
})
export class GroupNameComponent implements OnInit {
  @Input() visiblity = 'visible';
  constructor() { }

  ngOnInit(): void {
  }

}
