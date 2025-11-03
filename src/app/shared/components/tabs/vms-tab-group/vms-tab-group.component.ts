import { Component, OnInit, ContentChildren, QueryList, AfterContentInit, ChangeDetectorRef, Input, EventEmitter, Output } from '@angular/core';
import { VmsTabComponent } from '../vms-tab/vms-tab.component';


@Component({
  selector: 'vms-tab-group',
  templateUrl: './vms-tab-group.component.html',
  styleUrls: ['./vms-tab-group.component.scss']
})
export class VmsTabGroupComponent implements OnInit, AfterContentInit {
  @ContentChildren(VmsTabComponent) tabs: QueryList<VmsTabComponent>;
  @Output() onSelectedIndexChange = new EventEmitter<number>();
  index = 0;
  @Input() theme :string= "outlined"; 

  constructor(private changeDetectorRef: ChangeDetectorRef) { }

  @Input() public set selectedIndex(selectedIndex: number) {
    this.index = selectedIndex
    // selecting tab base on selectedIndex change
    if (this.tabs) {
      if (selectedIndex < this.tabs.length) {
        this.selectTab(this.tabs['_results'][this.index]);
      }
    }
    this.changeDetectorRef.detectChanges();
  }

  ngOnInit(): void {
  }
  ngAfterContentInit() {
    let activeTab = this.tabs.filter(tab => tab.active);
    if (activeTab.length === 0) {
      this.selectTab(this.tabs.first);
    }
  }
  selectTab(tab, click = false) {
    this.tabs.toArray().forEach(t => t.active = false);
    if (tab) {
      tab.active = true;
    }
    if (click) {
      this.index = this.tabs.toArray().indexOf(tab)
    }
    this.onSelectedIndexChange.emit(this.index)
  }

}