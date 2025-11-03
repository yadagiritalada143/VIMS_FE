import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

@Component({
  selector: 'svms-tabs',
  templateUrl: './svms-tabs.component.html',
  styleUrls: ['./svms-tabs.component.scss']
})
export class SvmsTabsComponent implements OnChanges {

  @Input() tabs = [];
  @Input() count;
  _tabs = [];

  @Input() selectedTab = '';
  @Output() tabSelected = new EventEmitter<string>();

  constructor() { }
  ngOnChanges(changes: SimpleChanges): void {
    this._tabs = [];
    if (this.tabs && this.tabs.length > 0) {
      this.tabs.forEach(tab => {
        tab.selected = false;
        this._tabs.push(tab);
      });
    }
    this.tabChanged();
  }

  selectTab(tabName) {
    if (this.selectedTab !== tabName) {
      this.selectedTab = tabName;
      this.tabChanged();
      this.tabSelected.emit(tabName);
    }
  }

  tabChanged() {
    if (this.selectedTab && this._tabs && this._tabs.length > 0) {
      this._tabs.forEach(tab => {
        if (tab.name === this.selectedTab) {
          tab.selected = true;
        } else {
          tab.selected = false;
        }
      });
    }
  }
}
