import {TabComponent} from './tab/tab.component';
import {
  Component,
  ContentChildren,
  QueryList,
  AfterContentInit, 
  Output, 
  EventEmitter, 
  Input, 
  ChangeDetectorRef
} from '@angular/core';


@Component({
  selector: 'tabs-group',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss'],
})
export class TabsComponent implements AfterContentInit {

  @ContentChildren(TabComponent) tabs: QueryList <TabComponent>;

  @Output() onSelectedIndexChange: EventEmitter <number> = new EventEmitter <number> ();

  constructor(private changeDetectorRef: ChangeDetectorRef) { }

  public index: number = 0;
  @Input() public set selectedIndex(selectedIndex: number) {
    this.index = selectedIndex;
    if (this.tabs) {
      if (selectedIndex < this.tabs.length) {
        this.selectTab(this.tabs['_results'][this.index]);
      }
    }
    this.changeDetectorRef.detectChanges();
  }

  ngAfterContentInit() {
    const activeTabs = this.tabs.filter((tab) => tab.active);
    if (activeTabs.length === 0) {
      this.selectTab(this.tabs.first);
    }
  }

  selectTab(tab, click = false) {
    this.tabs.toArray().forEach(t => t.active = false);
    if (tab) {
      tab.active = true;
    }
    if (click) {
      this.index = this.tabs.toArray().indexOf(tab);
    }

    this.onSelectedIndexChange.emit(this.index);
  }
}