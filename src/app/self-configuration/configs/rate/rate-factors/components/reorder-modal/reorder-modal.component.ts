import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {DndDropEvent} from "ngx-drag-drop";
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';

@Component({
  selector: 'app-reorder-modal',
  templateUrl: './reorder-modal.component.html',
  styleUrls: ['./reorder-modal.component.scss']
})
export class ReorderModalComponent implements OnInit {

  @Input()
  set dataSource(data: Array<any>) {
    if (data?.length) {
      this.standardBillAble = data.filter(item => item.billable && item.type === 'STANDARD')
      this.billAble = data.filter(item => item.billable && item.type !== 'STANDARD');
      this.nonBillAble = data.filter(item => !item.billable);
    }
  };
  @Input() modalTitle;
  @Input() hideInputBox: boolean = false;

  @Output() onClose = new EventEmitter();
  @Output() onSave = new EventEmitter();

  reorderModal:boolean = true;

  standardBillAble: Array<any> = []
  billAble: Array<any> = []
  nonBillAble: Array<any> = []

  private dragStartIndex: number;

  constructor(
    private sortPipe: SortHelperPipe
  ) { }

  ngOnInit(): void {}

  sidebarClose() {
    this.reorderModal = false;
    this.onClose.emit(true)
  }

  onDrop(event: DndDropEvent, data, billable: boolean) {
    if(event.data?.billable !== billable) return

    if (event.data && typeof event.index !== undefined) {
      if (this.dragStartIndex >= 0) {
        let dropIndex = event.index;
        if (dropIndex > this.dragStartIndex) {
          dropIndex--;
        }
        if (dropIndex !== this.dragStartIndex && dropIndex >= 0) {
          data.splice(this.dragStartIndex, 1);
          data.splice(dropIndex, 0, event.data);
        }
      }
    }
    data.forEach((x,i) => {
      x.selectedSeq = i + 1
    })
    this.dragStartIndex = null;
  }

  reOrderDataSource() {
    this.onSave.emit([...this.standardBillAble, ...this.billAble, ...this.nonBillAble]);
  }

  onDragStart(index: number) {
    this.dragStartIndex = index;
  }

}
