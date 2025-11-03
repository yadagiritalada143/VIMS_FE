import { Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { IBaseProgramConfiguration } from '../program-config-model';
import { ProgramConfigService } from '../service/program-config.service';
import * as _ from 'lodash';

/**
 Base class for Program Configuration,
  Inherit this class to component which wants to be the part of Program Configuration Module
 **/

@Component({
  selector: 'app-base-program-config',
  templateUrl: './base-program-config.component.html',
  styleUrls: ['./base-program-config.component.scss'],
})
export class BaseProgramConfigComponent implements OnInit, IBaseProgramConfiguration, OnDestroy {
  
  #index: number = -1;
  public programConfigService: ProgramConfigService;

  private _data: any;
  private _formGroup: UntypedFormGroup;

  get formGroup(): UntypedFormGroup {
    return this._formGroup;
  }

  set formGroup(value: UntypedFormGroup) {
    let oldValue: any = _.cloneDeep(this.formGroup);
    this._formGroup = value;
    if (this._formGroup) {
      this._formGroup.valueChanges.subscribe(value => {
        this.setProgramConfig();
      });
      if(this.data && this.data.value){
        this.formGroup.patchValue(this.data.value);
      }

      let index: any = this.programConfigService.formGroup.push(this.formGroup);
      if(!oldValue) {
        this.#index = index - 1; 
      }
    }
  }

  get data(): any {
    return this._data;
  }

  set data(value: any) {
    this._data = value;
  }

  constructor(protected injector:Injector) {
    this.programConfigService =  injector.get(ProgramConfigService);
  }

  ngOnInit(): void { }

  // Override this method in Derived Class if want to use own logic to set the data value.
  setProgramConfig = () => {
    this.data.value = this.formGroup.value;
  }

  ngOnDestroy(): void {
    this.formGroup = new UntypedFormGroup({});
    this.programConfigService.formGroup[this.#index] = this.formGroup;
  }
}