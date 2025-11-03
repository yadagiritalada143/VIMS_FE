import { Component, Input, OnInit } from '@angular/core';
import attributes from 'src/assets/json/attributes.json';
import css_keys_properties from 'src/assets/json/css_properties.json';

@Component({
  selector: 'app-key-value-pair-generator',
  templateUrl: './key-value-pair-generator.component.html',
  styleUrls: ['./key-value-pair-generator.component.scss']
})
export class KeyValuePairGeneratorComponent implements OnInit {
  attributes = attributes;
  css_keys_properties = css_keys_properties;
  @Input() items:any;
  @Input() title:any;
  constructor() { }

  ngOnInit(): void {
  }

  addStyle(){
    this.items.push({key:'',value:''});
  }

  deleteStyle(index:any){
    this.items.splice(index,1);
  }


}
