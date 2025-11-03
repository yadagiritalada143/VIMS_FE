import { Output, EventEmitter } from '@angular/core';
import { Component, Input, OnInit, TemplateRef } from '@angular/core';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { PopupService } from '../../service/popup.service';
@Component({
  selector: 'app-popover',
  templateUrl: './popover.component.html',
  styleUrls: ['./popover.component.scss']
})
export class PopoverComponent implements OnInit {
  @Input() popOverTemplate: TemplateRef<any>;
  @Input() placement: string = 'right';
  @Input() trigger: string = 'manual';
  @Input() autoClose: boolean = false;
  @Input() iconName: string = 'more_horiz';
  @Input() allowMultiple: boolean = false;
  @Output() onOpenPopOver = new EventEmitter<any>();
  @Output() onClosePopOver = new EventEmitter<any>();

  id: number = Math.floor(Math.random()*100000);

  constructor(
    public popupService: PopupService) { }

  ngOnInit(): void {
  }

  openPopOver = (currentPop: NgbPopover) => {
    if (currentPop) {
      if (this.popupService.selectedPopupId != this.id) {
        this.closeOpenedPopOvers();
        this.openedPopOver(currentPop);
        this.onOpenPopOver.emit(true);
      } else {
        this.closeOpenedPopOvers();
        this.onClosePopOver.emit(true);
      }
    }
  }

  openedPopOver(currentPop: NgbPopover) {
    currentPop.open();
    this.popupService.currentPopOver = currentPop;
    this.popupService.selectedPopupId = this.id;
  }

  closeOpenedPopOvers = () => {
    // remove popover elements
    if (this.popupService.currentPopOver) {
      this.popupService.currentPopOver.close();
      this.popupService.currentPopOver = null;
      this.popupService.selectedPopupId = null;
    }
  }

}
