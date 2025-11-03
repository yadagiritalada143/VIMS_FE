import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-template-render',
  templateUrl: './template-render.component.html',
  styleUrls: ['./template-render.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom
})
export class TemplateRenderComponent implements OnChanges {
  @Input() config: any;
  @ViewChild('rendererRoot') rendererRoot: ElementRef;
  @Input() id;

 @Output() headerData = new EventEmitter();
 @Output() footerData = new EventEmitter();

  ngOnChanges(changes: SimpleChanges) {
    if (changes.config) {
      this.render();
    }
  }

  ngAfterViewInit() {
    this.render();
  }
  render() {
    if (!this.rendererRoot?.nativeElement || !this.config?.rows?.length) {
      return;
    }
    if (this.id == "header") this.headerData.emit(this.config);
    if (this.id == "footer") this.footerData.emit(this.config);
    this.rendererRoot.nativeElement.innerHTML = '';
    const newTable = document.createElement('table');
    const tableBody = document.createElement('tbody');
    newTable.appendChild(tableBody);
    for (let rowIndex = 0; rowIndex < this.config?.rows?.length; rowIndex++) {
      const newTable = document.createElement('table');
      const tableBody = document.createElement('tbody');
      newTable.style['width'] = '100%';
      newTable.appendChild(tableBody);
      const row = this.config.rows[rowIndex];
      const tableRow = document.createElement('tr');
      row?.styles?.forEach(styleObj => {
        tableRow.style[styleObj.key] = styleObj.value;
      });

      row?.attributes?.forEach(obj => {
        if (!obj.key || !obj.value) {
          return;
        }
        tableRow.setAttribute(obj.key, obj.value);
      })
      for (let colIndex = 0; colIndex < this.config.rows[rowIndex].cols.length; colIndex++) {
        const tableCol = document.createElement('td');
        const col = row.cols[colIndex];
        col?.styles?.forEach(styleObj => {
          tableCol.style[styleObj.key] = styleObj.value;
        });

        col?.attributes?.forEach(obj => {
          if (!obj.key || !obj.value) {
            return;
          }
          tableCol.setAttribute(obj.key, obj.value);
        })
        for (let itemIndex = 0; itemIndex < row.cols[colIndex].items?.length; itemIndex++) {
          const item = row.cols[colIndex].items[itemIndex];
          let colItem: any;
          console.log(item);
          colItem = document.createElement(item.tagName)
          item.styles.forEach((obj) => {
            colItem.style[obj.key] = obj.value;
          })

          item.attributes.forEach((obj) => {
            if (!obj.key || !obj.value) {
              return;
            }
            colItem.setAttribute(obj.key, obj.value)
          })
          if (item.type === 'Header' || item.type === 'Sub Header') {
            colItem.innerHTML = item.customProperties.text;
          }
          if (item.type === 'Custom Html') {
            colItem.innerHTML = item.customProperties.innerHtml;
          }
          if (item.type === 'Button') {
            colItem.innerHTML = item.customProperties.label;
            colItem.style.color = item.customProperties.color;
            colItem.style.backgroundColor = item.customProperties.backgroundColor;
          }
          if (item.type === 'Link') {
            colItem.innerHTML = item.customProperties.label;
            colItem.href = item.customProperties.link;
          }
          if (item.type === 'Text') {
            colItem.innerHTML = item.text;
            colItem.style.fontFamily = item.customProperties.fontFamily;
            colItem.style.color = item.customProperties.color;
          }
          if (item.type === 'Image') {
            colItem.src = item.base64Data;
          }
          if (item.type)
            tableCol.append(colItem);
        }
        tableRow.append(tableCol);
      }

      tableBody.append(tableRow);
      this.rendererRoot.nativeElement.appendChild(newTable);
    }

  }

  getInnerHtml() {
    return this.rendererRoot.nativeElement.innerHTML;
  }

}
