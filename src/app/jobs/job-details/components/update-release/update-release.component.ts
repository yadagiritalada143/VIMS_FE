import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-update-release',
  templateUrl: './update-release.component.html',
  styleUrls: ['./update-release.component.scss']
})
export class UpdateReleaseComponent implements OnInit {
  @Input() visiblity = 'visible';
  constructor() { }

  ngOnInit(): void {
  }

}
