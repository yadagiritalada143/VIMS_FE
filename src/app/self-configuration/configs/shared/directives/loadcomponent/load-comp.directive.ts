import { Directive, Input, OnInit, ViewContainerRef } from '@angular/core';

/***
 * Directive to load the component dynamically on given placeholder
 * Please discuss once with Himanshu Kesarwani before changing any code
 */
@Directive({
  selector: '[loadComp]'
})
export class LoadCompDirective implements OnInit{

  // Can be used to pass data to any component which is getting loaded dynamically
  @Input() data:any;

  // Component which needs to be loaded dynamically
  @Input() loadComp:any;


  constructor(public viewContainerRef:ViewContainerRef) {
   }

  ngOnInit(): void {
      if(this.loadComp){
        let componentInstance:any = this.viewContainerRef.createComponent(this.loadComp);
        if(componentInstance && this.data){
          componentInstance.instance.data = this.data;
        }
      }
  }

}
