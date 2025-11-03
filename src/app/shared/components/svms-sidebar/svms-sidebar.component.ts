import { Component, OnInit, Input, Output, EventEmitter, HostListener, Renderer2, OnDestroy, OnChanges } from '@angular/core';
import { ConfirmationDialogService } from '../confirmation-dialog/confirmation-dialog.service';

@Component({
  selector: 'svms-sidebar',
  templateUrl: './svms-sidebar.component.html',
  styleUrls: ['./svms-sidebar.component.scss']
})
export class SvmsSidebarComponent implements OnInit, OnChanges, OnDestroy {

  @Input() size: string;
  @Input() title: string;
  @Input() icon: string;
  @Input() dataVisibility: string;
  @Input() dataExtended: string;
  @Input() message: string;
  @Input() btnOkText = 'Leave this Page';
  @Input() btnCancelText = 'Stay on this Page';
  @Input() needConfirmation: boolean;
  @Input() hideHeader = false;
  @Input() clickOutside: boolean;
  @Output() onClose = new EventEmitter();
  constructor(private confirmService: ConfirmationDialogService, private render: Renderer2) { }

  closeSidebar() {
    if (this.needConfirmation) {
      this.confirmService.confirm('', this.message, this.btnOkText, this.btnCancelText)
        .then((confirmed) => {
          if (confirmed) {
            this.onClose.emit(confirmed);
          }
        });
    } else {
      this.dataVisibility = 'hidden';
      this.onClose.emit(false);
    }
  }

  closeSvmsSidebar() {
    if (this.clickOutside) {
      if (this.needConfirmation) {
        this.confirmService.confirm('', this.message, this.btnOkText, this.btnCancelText)
          .then((confirmed) => {
            this.onClose.emit(confirmed);
          });
      } else {
        this.dataVisibility = 'hidden';
        this.onClose.emit(false);
      }
    }
  }

  @HostListener('document:keyup', ['$event'])
  handleDeleteKeyboardEvent(event: KeyboardEvent) {
    if (this.clickOutside) {
      if (event.key === 'Escape') {
        if (this.needConfirmation) {
          this.confirmService.confirm('', this.message, this.btnOkText, this.btnCancelText)
            .then((confirmed) => {
              this.onClose.emit(confirmed);
            });
        } else {
          this.dataVisibility = 'hidden';
          this.onClose.emit(false);
        }
      }
    }
  }

  ngOnInit(): void {

  }

  ngOnChanges(changes: any) {
    this.updateScrillBar();
  }

  ngOnDestroy() {
    this.render.removeClass(document.body, 'sidebar-overflow');
  }

  updateScrillBar() {
    if (this.dataVisibility === 'visible') {
      this.render.addClass(document.body, 'sidebar-overflow');
    }
    else if (this.dataVisibility === 'hidden') {
      this.render.removeClass(document.body, 'sidebar-overflow');
    }
  }
}
