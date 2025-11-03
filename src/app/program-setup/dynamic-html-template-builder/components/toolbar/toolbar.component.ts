import { Component, OnInit, } from '@angular/core';
import { DynamicHtmlTemplateBuilderService } from '../../dynamic-html-template-builder.service';
import { ButtonProperties, CustomHtmlProperties, HeaderProperties, ImageProperties, LinkProperties, SubHeaderProperties, TextProperties } from './ItemProperties';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit {

  // @Input() type :  'Header' | 'Footer';
  // @Output() toolType :EventEmitter<string> = new EventEmitter<string>();

  tools = [
    { title: 'Header', iconName: 'h_mobiledata', tagName: 'h1'},
    { title: 'Sub Header', iconName: 'text_fields', tagName: 'h2'},
    { title: 'Text', iconName: 'text_format'},
    { title: 'Image', iconName: 'image', tagName: 'img'},
    { title: '2 column', iconName: 'chrome_reader_mode', isRow:true, noOfCols:2},
    { title: '3 column', iconName: 'view_week',  isRow:true, noOfCols:3},
    { title: 'New Row', iconName: 'menu',  isRow:true, noOfCols:1},
    { title: 'Button', iconName: 'smart_button', tagName: 'button'},
    { title: 'Link', iconName: 'link', tagName: 'a'},
    { title: 'Custom Html', iconName: 'code', tagName: 'div'},

  ];

  propertyMap =  {
    "Header" : HeaderProperties,
    "Sub Header" : SubHeaderProperties,
    "Image": ImageProperties,
    "Text": TextProperties,
    "Button": ButtonProperties,
    "Link": LinkProperties,
    "Custom Html": CustomHtmlProperties
  }

  constructor( private dynamicHtmlTemplateBuilderService:DynamicHtmlTemplateBuilderService) { }

  ngOnInit(): void {
  }

  toolSelected(tool:any) {

    if(tool?.isRow){
      this.dynamicHtmlTemplateBuilderService.addRow(tool);
    }
    else{
      this.dynamicHtmlTemplateBuilderService.addItem(new this.propertyMap[tool.title]());
    }

  }

}
