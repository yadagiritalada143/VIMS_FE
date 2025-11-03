import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'svms-sidebar-profile',
  templateUrl: './svms-sidebar-profile.component.html',
  styleUrls: ['./svms-sidebar-profile.component.scss'],
})
export class SvmsSidebarProfileComponent implements OnInit {
  @Input() profileVisibility?: boolean;
  @Input() helpVisibility?: boolean;
  @Input() helpTitle?: string;
  @Input() helpText?: string;
  @Input() avatar = '';
  @Input() userName = '';
  @Input() userPosition = '';
  @Input() socialProfiles: any;
  @Input() jobData: any;
  @Input() candidateInfo: any;
  @Input() showSkelton;
  constructor() {}

  ngOnInit(): void {}
}
