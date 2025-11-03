import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { ProgramService } from 'src/app/programs/program.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { GlobalLaunchService } from './global-launch.service';

@Component({
  selector: 'app-global-launches',
  templateUrl: './global-launches.component.html',
  styleUrls: ['./global-launches.component.scss']
})
export class GlobalLaunchesComponent implements OnInit {

  readOnly: boolean = true;
  globalLaunchList: Array<any> = [];
  templaunches: Array<any> = [];
  emptyList: boolean = false;
  constructor(
    private programService: ProgramService,
    private alert: AlertService,
    private loader: LoaderService,
    private globalLaunchService:GlobalLaunchService
  ) { }

  ngOnInit(): void {
    this.getGlobalFlagsList();
  }

  getGlobalFlagsList() {
    this.loader.show();
    this.programService.get('/configurator/global-launch?limit=50')
    .subscribe({
      next: (data: any) => {
        this.loader.hide();
        if(data) {
          if(data?.global_launch_data?.length < 1) {
            this.emptyList = true;
          }
          this.globalLaunchList = data?.global_launch_data;
          this.templaunches = data?.global_launch_data;
        }
      },
      error: err => {
        this.loader.hide();
        this.emptyList = true;
        this.alert.error(errorHandler(err));
      }
    })
  }


  changed(toggleValue: any, ind: any){
    this.globalLaunchList[ind].is_enabled = !toggleValue;
  }

  toggle() {
    if(!this.readOnly) {
      this.onSave();
    }
    this.readOnly = !this.readOnly;
  }

  onSave() {
    let payload: any = {
      'golbal_launches': this.globalLaunchList.map((global: any) => {
        return {
          id: global?.id,
          is_enabled: global?.is_enabled
        }
      })
    }
    this.loader.show();
    this.programService.put('/configurator/global-launch',payload).subscribe({
      next: (data) => {
        this.globalLaunchService.updateGlobalLaunchConfiguration();
        this.loader.hide();
        this.alert.success("Global Launch Flags Updated Successfully");
      },
      error: err => {
        this.loader.hide();
        this.alert.error(errorHandler(err));
        this.globalLaunchList = this.templaunches;
      }
    })
  }


}
