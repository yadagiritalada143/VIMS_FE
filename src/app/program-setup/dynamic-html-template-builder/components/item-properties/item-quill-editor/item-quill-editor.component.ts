import { Component, forwardRef, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import Quill from 'quill'
var DirectionAttribute = Quill.import('attributors/attribute/direction');
Quill.register(DirectionAttribute, true);
var AlignClass = Quill.import('attributors/class/align');
Quill.register(AlignClass, true);
var BackgroundClass = Quill.import('attributors/class/background');
Quill.register(BackgroundClass, true);
var ColorClass = Quill.import('attributors/class/color');
Quill.register(ColorClass, true);
var DirectionClass = Quill.import('attributors/class/direction');
Quill.register(DirectionClass, true);
var FontClass = Quill.import('attributors/class/font');
Quill.register(FontClass, true);
var SizeClass = Quill.import('attributors/class/size');
Quill.register(SizeClass, true);
var AlignStyle = Quill.import('attributors/style/align');
Quill.register(AlignStyle, true);
var BackgroundStyle = Quill.import('attributors/style/background');
Quill.register(BackgroundStyle, true);
var ColorStyle = Quill.import('attributors/style/color');
Quill.register(ColorStyle, true);
var DirectionStyle = Quill.import('attributors/style/direction');
Quill.register(DirectionStyle, true);
var FontStyle = Quill.import('attributors/style/font');
Quill.register(FontStyle, true);
var SizeStyle = Quill.import('attributors/style/size');
Quill.register(SizeStyle, true);

@Component({
  selector: 'app-item-quill-editor',
  templateUrl: './item-quill-editor.component.html',
  styleUrls: ['./item-quill-editor.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ItemQuillEditorComponent),
      multi: true
    }
  ]
})
export class ItemQuillEditorComponent implements OnInit {

  constructor() { }


  ngOnInit(): void {
  }

  onChange: any = () => {};
  onTouch: any = () => {};
  val = '';

  set inputValue(val) {
    if (val !== undefined && this.val !== val) {
      this.val = val;
      this.onChange(val);
      this.onTouch(val);
    }
  }

  get inputValue() {
    return this.val;
  }

  writeValue(value: any) {
    this.inputValue = value;
  }

  registerOnChange(fn: any) {
    this.onChange = fn;
  }

  registerOnTouched(fn: any) {
    this.onTouch = fn;
  }

  savetext(){
    //console.log(this.control.value);
  }

}
