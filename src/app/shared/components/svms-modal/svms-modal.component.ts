import { Component, Input, Output, OnInit, EventEmitter, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-svms-modal',
  templateUrl: './svms-modal.component.html',
  styleUrls: ['./svms-modal.component.scss']
})
export class SvmsModalComponent implements OnInit {
  @Input() size: string;
  @Input() title: string;
  @Input() btnlabel: string;
  @Input() visibility: boolean = false;
  @Output() onClose = new EventEmitter();
  constructor(private _render: Renderer2) { }

  ngOnInit(): void {
  }
  closeModal() {
    this.onClose.emit(false);
  }

  ngOnChanges(changes: any) {
    this.updateScrillBar();
  }
 
  ngOnDestroy() {
    this._render.removeClass(document.body, 'svms-modal-overflow');
  }
 
  updateScrillBar() {
    if(this.visibility == true) {
      this._render.addClass(document.body, 'svms-modal-overflow');
    }
    else if (this.visibility == false) {
      this._render.removeClass(document.body, 'svms-modal-overflow');
    }
  }
}
