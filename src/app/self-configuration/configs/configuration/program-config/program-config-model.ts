import { Type } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';

export interface IProgramConfiguration {
  tabName: string;
  tabIcon?: string;
  tabComponent: Type<any>;
  tabSelector?: string;
  tabOrder:number;
  tabActive?:boolean;
  config: {key:string,value:any };

}

export interface IBaseProgramConfiguration {
   setProgramConfig();
   data:any;
   formGroup:UntypedFormGroup;
}
