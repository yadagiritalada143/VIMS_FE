import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Col } from '../../dynamic-html-template-builder.model';
import { DynamicHtmlTemplateBuilderService } from '../../dynamic-html-template-builder.service';
import { RowRendererComponent } from '../row-renderer/row-renderer.component';

@Component({
  selector: 'app-col-renderer',
  templateUrl: './col-renderer.component.html',
  styleUrls: ['./col-renderer.component.scss']
})
export class ColRendererComponent implements OnInit, AfterViewInit {
  @Input() colObject: Col = {};
  @Input() colIndex: number;
  @Output() clickDeleteItem: EventEmitter<{}> = new EventEmitter<{}>();
  @Output() clickDeleteCell: EventEmitter<{}> = new EventEmitter<{}>();
  @Output() clickCell: EventEmitter<{}> = new EventEmitter<{}>();

  isCellSelected = false;

  parentElement;

  constructor(private row: RowRendererComponent,
              private elRef: ElementRef,
              private dynamicHtmlTemplateBuilderService: DynamicHtmlTemplateBuilderService) {
  }

  ngOnInit(): void {
    this.dynamicHtmlTemplateBuilderService.itemAdded.subscribe((item:any) => {
      const selectedCell = this.colIndex === this.dynamicHtmlTemplateBuilderService.selectedColIndex && this.row.rowIndex === this.dynamicHtmlTemplateBuilderService.selectedRowIndex;
      if (!selectedCell) {
        return;
      }
      if (this.colObject.items && this.colObject.items.length > 0) {
        this.colObject.items.push({...item})
      } else {
        this.colObject.items = [{...item}];
      }
    });
    this.colObject.componentRef = this;
  }

  ngAfterViewInit() {
    this.parentElement = this.elRef.nativeElement.closest('td');
    if(this.parentElement){
      this.parentElement.addEventListener('click', () => {
        this.dynamicHtmlTemplateBuilderService.setSelectedCell(this.row.rowIndex, this.colIndex);
        // this.applyStyles();
        this.clickCell.emit({rowIndex: this.row.rowIndex, colIndex: this.colIndex});
      });
      this.applyStyles();
    }

  }

  applyStyles() {
    this.parentElement.setAttribute('width', this.colObject.width);
    this.colObject?.styles?.forEach(styleObj => {
      this.parentElement.style[styleObj.key] = styleObj.value;
    });

    this.colObject?.attributes?.forEach(obj=>{
      if(!obj.key && !obj.value){
        return ;
      }
      this.parentElement.setAttribute(obj.key,obj.value);
    })

    const selectedCell = this.colIndex === this.dynamicHtmlTemplateBuilderService.selectedColIndex && this.row.rowIndex === this.dynamicHtmlTemplateBuilderService.selectedRowIndex;
    if (selectedCell) {
      this.parentElement.style["border"] = '2px dashed red';
      this.isCellSelected = true;
      if(!this.colObject.items){
        console.log('Hi');
        this.dynamicHtmlTemplateBuilderService.setSelectedItemValue(null);
      }
    } else {
      this.parentElement.style["border"] = '1px dashed black';
      this.isCellSelected = false;
    }

  }

  onDeleteCell() {
    // console.log(this.colIndex, this.row.rowIndex)
    this.clickDeleteCell.emit({rowIndex: this.row.rowIndex, colIndex: this.colIndex});
  }
  onDeleteItem(itemIndex: number) {
    this.clickDeleteItem.emit({rowIndex: this.row.rowIndex, colIndex: this.colIndex, itemIndex});
  }

}
