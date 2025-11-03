import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  HostListener,
  Renderer2
} from '@angular/core';
import { ConfirmationDialogService } from '../../shared/components/confirmation-dialog/confirmation-dialog.service';

@Component({
  selector: 'svms-sidebar-ng',
  templateUrl: './svms-sidebar-ng.component.html',
  styleUrls: ['./svms-sidebar-ng.component.scss'],
})
export class SvmsSidebarNgComponent implements OnInit {
  @Input() size: string;
  @Input() title: string;
  @Input() icon: string;
  @Input() dataVisibility: string;
  @Input() dataProfilePanel: string;
  @Input() message: string;
  @Input() btnOkText: string = 'Leave this Page';
  @Input() btnCancelText: string = 'Stay on this Page';
  @Input() needConfirmation: boolean;
  @Input() showHeader = true;
  @Input() showFooter = true;
  @Input() clickOutside: boolean;
  @Output() onClose = new EventEmitter();
  constructor(private _confirmService: ConfirmationDialogService, private _render: Renderer2) {}

  closeSidebar() {
    if (this.needConfirmation) {
      this._confirmService
        .confirm('', this.message, this.btnOkText, this.btnCancelText)
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
        this._confirmService
          .confirm('', this.message, this.btnOkText, this.btnCancelText)
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
          this._confirmService
            .confirm('', this.message, this.btnOkText, this.btnCancelText)
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

  ngOnInit(): void {}

  ngOnChanges(changes: any) {
    this.updateScrillBar();
  }
 
  ngOnDestroy() {
    this._render.removeClass(document.body, 'sidebar-ng-overflow');
  }
 
  updateScrillBar() {
    if(this.dataVisibility == 'visible') {
      this._render.addClass(document.body, 'sidebar-ng-overflow');
    }
    else if (this.dataVisibility == 'hidden') {
      this._render.removeClass(document.body, 'sidebar-ng-overflow');
    }
  }
}
