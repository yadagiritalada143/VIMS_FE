import { Component, ElementRef, HostListener, Input, OnInit, ViewChild } from '@angular/core';
import { IActionLinks } from '../svms-table/svms-table.model';

@Component({
  selector: 'app-svms-dropdown',
  templateUrl: './svms-dropdown.component.html',
  styleUrls: ['./svms-dropdown.component.scss']
})
export class SvmsDropdownComponent implements OnInit {

  private _actionLinks:Array<IActionLinks>;
  rowDropdownTrigger:boolean;
  @Input() data:any;
  @Input() validatorFn:Function;
  @Input() position:string;
  @Input() parentTemplate: any;
  @ViewChild('optionButton', { read: ElementRef, static: false }) optionButton: ElementRef;
  @Input() set actionLinks(value :Array<IActionLinks>){
       this._actionLinks = value ?? [];
  }
  @ViewChild('optionDropdownMenu', { read: ElementRef, static: false }) optionDropdownMenu: ElementRef;
  get actionLinks(){
    return this._actionLinks;

  }
  constructor() { }

  ngOnInit(): void {
  }

  toogleDropDown = () => {
    this.optionDropdownMenu.nativeElement.style.left = `${this.parentTemplate.clientWidth - 50}px`;
    this.rowDropdownTrigger = !this.rowDropdownTrigger;
    if(this.parentTemplate){
      if(this.rowDropdownTrigger){
        this.parentTemplate.style['z-index']= 5;
      }else {
        this.parentTemplate.style['z-index']  =  4;
      }
    }
    if (this.rowDropdownTrigger) {
      this.validateLinks();
    }
  };

  @HostListener('window:scroll') onScroll(e: Event): void {
    this.hideDropdownBox(e);
  }

  hideDropdownBox(e: Event) {
    this.rowDropdownTrigger = false;
    if(this.parentTemplate){
     this.parentTemplate.style['z-index']  =  4;
    }
 }

  validateLinks = () => {
    if (this.actionLinks?.length > 0) {
      if (this.validatorFn) {
        this.validatorFn(this.actionLinks,this.data);
      }
    }
  }

  onActionClick = (actionLink:IActionLinks) => {
      this.rowDropdownTrigger = false;
      if(actionLink && actionLink.method && !actionLink.disable){
         actionLink.method(this.data);
      }
  }

  get showActionLinks(){
    return this.actionLinks && this.actionLinks.length > 0 && this.actionLinks.some(link => !link.hide);
  }

}
