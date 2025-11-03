import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgxQrcodeElementTypes, NgxQrcodeErrorCorrectionLevels } from '@techiediaries/ngx-qrcode';
import { StorageService } from 'src/app/core/services/storage.service';
import { DndDropEvent } from 'ngx-drag-drop';

@Component({
  selector: 'column-custom-order',
  templateUrl: './column-custom-order.component.html',
  styleUrls: ['./column-custom-order.component.scss']
})
export class ColumnCustomOrderComponent implements OnInit {
  @Input() dataSource;
  @Input() tableTitle;
  @Input() moduleList = [];
  @Input() hideInputBox:boolean=false;
  @Output() onClose = new EventEmitter();
  @Output() onSave = new EventEmitter();
  @Output() onModuleChange = new EventEmitter();
  columnOrderModal:boolean = true;
  // name = 'Angular ' + VERSION.major;
  elementType = NgxQrcodeElementTypes.CANVAS;
  correctionLevel = NgxQrcodeErrorCorrectionLevels.HIGH;
  moduleCode:any
  // value   = 'https://www.techiediaries.com/';
  requiredData: any = {};
  userData: any = {};
  newData: string ;
  seqData: any=[];
  private dragStartIndex: number;
  constructor(public storageService: StorageService) { }
  ngOnInit(): void {
    this.dataSource?.forEach((x,i) => {
      x.selectedSeq = i + 1
    })
  }
  openColumnOrderScaner() {
    this.columnOrderModal = true;
  };
  closeColumnOrder () {
    this.columnOrderModal = false;
  };
  sidebarClose() {
    this.columnOrderModal = false;
    this.onClose.emit(true)
  }
  reOrderDataSource() {
    this.onSave.emit(this.dataSource);
  }
  onDragStart(index: number) {
    this.dragStartIndex = index;
  }
  getCustomFieldListByModules(moduleCode){
    this.onModuleChange.emit(this.moduleCode);
  }
  onDrop(event: DndDropEvent) {
    if (event.data && typeof event.index !== undefined) {
      if (this.dragStartIndex >= 0) {
        let dropIndex = event.index;
        if (dropIndex > this.dragStartIndex) {
          dropIndex--;
        }
        if (dropIndex !== this.dragStartIndex && dropIndex >= 0) {
          this.dataSource.splice(this.dragStartIndex, 1);
          this.dataSource.splice(dropIndex, 0, event.data);
        }
      }
    }
    this.dataSource.forEach((x,i) => {
      x.selectedSeq = i + 1
    })
    this.dragStartIndex = null;
  }
}
