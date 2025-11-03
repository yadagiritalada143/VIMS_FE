import {AfterViewInit,Directive, ElementRef, EventEmitter, Input, OnInit, Output,} from '@angular/core';

@Directive({
  selector: '[appRowRenderer]',
  // templateUrl: './row-renderer.component.html',
  // styleUrls: ['./row-renderer.component.scss']
})
export class RowRendererComponent implements OnInit, AfterViewInit {
  @Input() rowObj:any = [];
  @Input() rowIndex: number;
  @Output() clickDeleteCell: EventEmitter<{}> = new EventEmitter<{}>();
  @Output() clickDeleteRow: EventEmitter<{}> = new EventEmitter<{}>();
  @Output() clickDeleteItem: EventEmitter<{}> = new EventEmitter<{}>();
  @Output() clickCell: EventEmitter<{}> = new EventEmitter<{}>();
  isRowSelected = false;

  constructor(private elRef: ElementRef) {
  }


  ngOnInit(): void {
    this.rowObj.componentRef= this;
  }

  ngAfterViewInit() {
    // const parentElement = this.elRef.nativeElement.closest('tr');
    const parentElement = this.elRef.nativeElement;
    // parentElement.style.border = this.rowIndex == 1 ? '2px dotted red' : '2px dotted green'
    console.log(parentElement)
    this.applyStyles();
  }

  applyStyles(){
    const parentElement = this.elRef.nativeElement;
    this.rowObj?.styles?.forEach(styleObj => {
      parentElement.style[styleObj.key] = styleObj.value;
    });

    this.rowObj?.attributes?.forEach(obj=>{
      if(!obj.key && !obj.value){
        return ;
      }
      parentElement.setAttribute(obj.key,obj.value);
    })
  }

  // onClickCellDelete(event) {
  //   console.log(event);
  //   this.clickDeleteCell.emit(event);
  // }

  // onDeleteRow() {
  //   this.clickDeleteRow.emit(this.rowIndex);
  // }

  // onCellClick(event) {
  //   this.clickCell.emit(event);
  // }

  // onDeleteItem(event) {
  //   this.clickDeleteItem.emit(event);
  // }
}
