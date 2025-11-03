import {
  ChangeDetectorRef,
  Component,
  ContentChildren,
  EventEmitter,
  Input,
  OnInit,
  Output,
  QueryList,
} from '@angular/core';
import { SvmsSidebarBodyNgComponent } from '../svms-sidebar-body/svms-sidebar-body-ng.component';

@Component({
  selector: 'svms-sidebar-nav',
  templateUrl: './svms-sidebar-nav.component.html',
  styleUrls: ['./svms-sidebar-nav.component.scss'],
})
export class SvmsSidebarNavComponent implements OnInit {
  @ContentChildren(SvmsSidebarBodyNgComponent)
  tabs: QueryList<SvmsSidebarBodyNgComponent>;
  @Output() onSelectedIndexChange = new EventEmitter<number>();
  @Output() onSelectedsubIndexChange = new EventEmitter<any>();
  index = 0;
  @Input() theme: string = 'outlined';
  @Input() profileVisibility = false;
  @Input() helpVisible = false;
  @Input() helpTitle = '';
  @Input() helpText = '';
  @Input() avatar = '';
  @Input() userName = '';
  @Input() userPosition = '';
  @Input() socialProfiles: any;
  @Input() jobData: any;
  @Input() candidateInfo:any;
  @Input() showOnlyCandidateProfile;
  @Input() showSkelton: EventEmitter<boolean>;

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  @Input() public set selectedIndex(selectedIndex: number) {
    this.index = selectedIndex;
    // selecting tab base on selectedIndex change
    if (this.tabs) {
      if (selectedIndex < this.tabs.length) {
        this.selectTab(this.tabs['_results'][this.index]);
      }
    }
    this.changeDetectorRef.detectChanges();
  }

  ngOnInit(): void {}
  ngAfterContentInit() {
    let activeTab = this.tabs.filter((tab) => tab.active);
    if (activeTab.length === 0) {
      this.selectTab(this.tabs.first);
    }
  }

  selectTab(tab, click = false) {
    this.tabs.toArray().forEach((t) => (t.active = false));
    if (tab) {
      tab.active = true;
    }
    if (click) {
      this.index = this.tabs.toArray().indexOf(tab);
    }
    this.onSelectedIndexChange.emit(this.index);
  }

  selectSubtab(rootIndex, subIndex) {
    this.onSelectedsubIndexChange.emit({'subIndex': subIndex, 'rootIndex': rootIndex});
  }
}
