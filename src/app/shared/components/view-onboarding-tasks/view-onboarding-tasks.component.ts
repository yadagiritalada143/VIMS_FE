import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import {  Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-view-onboarding-tasks',
  templateUrl: './view-onboarding-tasks.component.html',
  styleUrls: ['./view-onboarding-tasks.component.scss']
})
export class ViewOnboardingTasksComponent implements OnInit {

  viewTaskSidebar: string = "hidden";
  initialValue:any;
  selectedValue:any;
  selectedItem:any;
  private subscrptions: Subscription[] = [];
  @Input() onBoardingdata;
  @Input() set selectedOnboardingItem(selectedOnboardingItem){
    this.selectedItem = selectedOnboardingItem;
    this.selectedValue = selectedOnboardingItem?.id
  };
  @Output() selectedItemFromFlyout = new EventEmitter();
  @Output() sideBarClose = new EventEmitter();

  constructor(private eventStream: EventStreamService) { }

  ngOnInit(): void {
    this.subscrptions.push(
      this.eventStream.on(Events.VIEW_TASKS).subscribe((data: any) => {
        if (data) {
          this.viewTaskSidebar = 'visible';
          this.initialValue = {...this.selectedItem};
        }
      }),
    );
  }
  closeSidebr() {
    this.viewTaskSidebar = "hidden";
    this.sideBarClose.emit(this.initialValue);
  }

  setSelectedItem(event) {
    this.selectedItem = event;
  }

  update(){
    this.viewTaskSidebar = "hidden";
    this.selectedItemFromFlyout.emit(this.selectedItem);
  }

}
