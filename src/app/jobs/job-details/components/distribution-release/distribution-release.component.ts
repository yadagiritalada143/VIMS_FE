import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-distribution-release',
  templateUrl: './distribution-release.component.html',
  styleUrls: ['./distribution-release.component.scss']
})
export class DistributionReleaseComponent implements OnInit {
  @Input() visiblity = 'visible';
  constructor() { }

  ngOnInit(): void {
  }

}
