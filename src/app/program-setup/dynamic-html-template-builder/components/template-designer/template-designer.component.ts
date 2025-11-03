import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ViewChildren } from '@angular/core';
import { DynamicHtmlTemplateBuilderService } from '../../dynamic-html-template-builder.service';
import { Col, RowObject } from '../../dynamic-html-template-builder.model';
import { ColRendererComponent } from '../col-renderer/col-renderer.component';
import { RowRendererComponent } from '../row-renderer/row-renderer.component';
import { TemplateRenderComponent } from '../template-render/template-render.component';

@Component({
  selector: 'app-template-designer',
  templateUrl: './template-designer.component.html',
  styleUrls: ['./template-designer.component.scss'],
  providers : [DynamicHtmlTemplateBuilderService]
})
export class TemplateDesignerComponent implements OnInit {

  headerFooterEditor = "visible";
  formTitle = "Configure Template";
  editorMode = "design";

  private _templateDesignerConfig : any;

  @Input()
  public get templateDesignerConfig() : any {
    return this._templateDesignerConfig;
  }
  public set templateDesignerConfig(v : any) {
    this._templateDesignerConfig = v;
    if (this._templateDesignerConfig.config) {
      this.dynamicHtmlTemplateBuilderService.setConfig(this._templateDesignerConfig.config)
    }
  }

  @Output() desingerClosed = new EventEmitter();

  currentConfig: RowObject = {
    rows: [{
      "cols":
      [{
        "styles":[{"key":"","value":""}],"attributes":[{"key":"","value":""}],
        "items":[]
      }],
      "styles":[{"key":"","value":""}],"attributes":[{"key":"","value":""}]
    }]
  };
  blankColumn: Col = {
    items: [],
    width: '',
  };
  selectedRowIndex = -1;

  @ViewChildren(RowRendererComponent) allRows;
  @ViewChildren(ColRendererComponent) allCells;
  @ViewChild(TemplateRenderComponent) renderes;

  constructor(
    private dynamicHtmlTemplateBuilderService: DynamicHtmlTemplateBuilderService,
  ) {}

  ngOnInit(): void {
    this.dynamicHtmlTemplateBuilderService.configLoaded.subscribe((config:any) => {config ? this.currentConfig = config : null});
    this.dynamicHtmlTemplateBuilderService.configUpdated.subscribe((config:any) => {config ? this.currentConfig = config : null});
    this.dynamicHtmlTemplateBuilderService.itemSelected.subscribe(() => {
      this.allCells && this.allCells.forEach((cell) => cell.applyStyles());
    });
    if (!this._templateDesignerConfig?.config) {
      this.dynamicHtmlTemplateBuilderService.setConfig(this.currentConfig);
      this.selectedRowIndex = 0;
    }
  }

  onClickItemDelete(event) {
    this.dynamicHtmlTemplateBuilderService.deleteItem(event);
  }

  onClickCellDelete(event) {
    this.currentConfig?.rows[event.rowIndex]?.cols.splice(event?.colIndex, 1);
    if (this.currentConfig?.rows[event.rowIndex]?.cols?.length === 0) {
      this.onClickRowDelete(event?.rowIndex);
    }
  }

  onClickRowDelete(rowIndex) {
    this.dynamicHtmlTemplateBuilderService.deleteRow(rowIndex);
  }

  onCellClick(event) {
    if (event && event.hasOwnProperty('rowIndex') && event.rowIndex > -1) {
      this.selectedRowIndex = event?.rowIndex;
    }
  }

  sidebarClose(){
    this.headerFooterEditor = 'hidden';
    this.desingerClosed.emit(null);
  }

  saveTemplate() {
    this.editorMode = 'preview';
    setTimeout(() => {
      const template = this.renderes;
      this.desingerClosed.emit({config: this.currentConfig, type : this.templateDesignerConfig?.type, template: template?.getInnerHtml() || ''});
      this.headerFooterEditor = 'hidden';
    });
  }

  switchMode(value) {
    this.editorMode = value;
  }
}
