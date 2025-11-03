import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { DynamicHtmlTemplateBuilderService } from '../../dynamic-html-template-builder.service';

@Component({
  selector: 'app-item-renderer',
  templateUrl: './item-renderer.component.html',
  styleUrls: ['./item-renderer.component.scss']
})
export class ItemRendererComponent implements OnInit, AfterViewInit {

  @Input() item:any
  @Input() itemIndex:any

  @ViewChild('Text') Text;
  @ViewChild('Image') Image;
  @ViewChild('Button') Button;
  @ViewChild('Link') Link;
  @ViewChild('Header') Header;
  @ViewChild('SubHeader') SubHeader;
  @ViewChild('customHtml') customHtml;
  target = '_self';
  @Output() clickDeleteCell: EventEmitter<{}> = new EventEmitter<{}>();

  keyMap;


  //itemSelected;
  constructor(private dynamicHtmlTemplateBuilderService:DynamicHtmlTemplateBuilderService ) { }
  ngOnInit(): void {}

  ngAfterViewInit(){
    this.keyMap = {
      'Text' : this.Text,
      'Image' : this.Image,
      'Link' : this.Link,
      'Button' : this.Button,
      'Header' : this.Header,
      'Sub Header' : this.SubHeader,
      'Custom Html' : this.customHtml,
    }
    this.applyStyles(this.item);
  }

  ngOnChanges() {
    this.item.componentRef = this;
  }

  itemClicked(item:any){
    this.dynamicHtmlTemplateBuilderService.setSelectedItemValue(this.item);
    console.log(item);
  }

 applyStyles(item:any) {
  this.target = item?.customProperties?.target || '_self';
  const element = this.keyMap[this.item.type].nativeElement;

  this.item.styles?.forEach((obj)=>{
    element.style[obj.key] = obj.value;
  })

  this.item.attributes?.forEach((obj)=>{
    if(!obj.key || !obj.value) {
      return;
    }
    element.setAttribute(obj.key, obj.value)
  })

  if(this.item.base64Data) {
    element.setAttribute('src', this.item.base64Data);
  }
 }

 onDeleteItem(itemIndex: number) {
  this.clickDeleteCell.emit(itemIndex);
}

}
