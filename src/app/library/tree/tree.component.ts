import { Component, Input, Output, EventEmitter } from '@angular/core';
import { VMSTreeConfig } from 'src/app/library/tree/tree.model';

@Component({
  selector: 'app-tree',
  templateUrl: './tree.component.html',
  styleUrls: ['./tree.component.scss']
})
export class TreeComponent {
  @Input() vmsTreeDataSource: any[];
  @Input() treeConfig: VMSTreeConfig;
  @Input() viewBlock: boolean = true;
  @Input() flattednedHierarchy: any;
  @Output() addSubLevel = new EventEmitter();
  @Output() onDisableClicked = new EventEmitter();
  @Output() onDeleteClicked = new EventEmitter();
  @Output() onSearch = new EventEmitter();
  @Output() onListFilter = new EventEmitter();
  actualWidths = []

  constructor() { }

  ngOnInit(): void {
    this.treeConfig?.columnList.forEach(element => {
      this.actualWidths.push({name : element.name, width : element.width})
    })
  }

  onClickAddSubLevel(evevnt) {
    this.addSubLevel.emit(evevnt);
  }
  onDisableClick(vmsData) {
    if (vmsData) {
      this.onDisableClicked.emit(vmsData);
    }
  }
  onDeleteClick(vmsData) {
    if (vmsData) {
      this.onDeleteClicked.emit(vmsData);
    }
  }
  onSettingClick(colunm){
    this.treeConfig?.columnList.forEach(tConfig => {
      colunm.forEach(colunmList => {
        if(colunmList.name==tConfig.name){
          tConfig.isVisible = colunmList.value
        }
      })
    })
    let totalWidth = 0;
    this.treeConfig?.columnList.forEach(tConfig => {
      this.actualWidths.forEach(widths => {
        if(widths.name == tConfig.name){
          if(tConfig.isVisible){
            totalWidth = totalWidth + widths.width
          }
        }
      })
    })
    let ratio = 0
    ratio = 93/totalWidth;
    this.treeConfig?.columnList.forEach(tConfig => {
      this.actualWidths.forEach(widths => {
        if(widths.name == tConfig.name){
          if(tConfig.isVisible){
            tConfig.width = widths.width * ratio
          }
        }
      })
    })
  }

  searchHierarchy(event: any){
    this.onSearch.emit(event);
  }

  searchFilter(event: any) {
    this.onListFilter.emit(event);
  }
}
