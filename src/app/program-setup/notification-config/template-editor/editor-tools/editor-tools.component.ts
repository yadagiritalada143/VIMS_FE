import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-editor-tools-1',
  templateUrl: './editor-tools.component.html',
  styleUrls: ['./editor-tools.component.scss']
})
export class EditorToolsComponent {
  @Input() type :  'Header' | 'Footer';
  @Output() toolType :EventEmitter<string> = new EventEmitter<string>();

  tools = [
    { title: 'Header', iconName: 'h_mobiledata'},
    { title: 'Sub Header', iconName: 'text_fields'},
    { title: 'Text', iconName: 'text_format'},
    { title: 'Image', iconName: 'image'},
    { title: '2 column', iconName: 'chrome_reader_mode'},
    { title: '3 column', iconName: 'view_week'},
    { title: 'Button', iconName: 'smart_button'},
    { title: 'Link', iconName: 'link'},

  ];

  toolSelected(tool) {
    console.log(tool, this.type);
    this.toolType.emit(tool);
  }
}
