import { Component, Input, OnInit } from '@angular/core';
import { ProgramService } from 'src/app/programs/program.service';

@Component({
  selector: 'app-sso-setting-info',
  templateUrl: './sso-setting-info.component.html',
  styleUrls: ['./sso-setting-info.component.scss'],
})
export class SsoSettingInfoComponent implements OnInit {
  @Input() organisationId: string;
  ssoInfo:SSOInfo;
  constructor(private _programService: ProgramService) {}

  ngOnInit(): void {
    this.getSSOSetting();
  }

  getSSOSetting = () => {
    if (this.organisationId) {
      const url = `/global-tms/ssoproviders/all?org_id=${this.organisationId}`;
      this._programService.get(url).subscribe((result: any) => {
         if(result && result?.is_enabled){
            this.ssoInfo = result;
         }else{
          this.ssoInfo = {id:null,org_id:null,is_enabled:false};
         }
      });
    }
  };
}

export interface SSOInfo {
  id: string;
  org_id: string;
  provider_name?: string;
  user_type?: Array<string>;
  is_enabled:boolean;
  is_forced?:boolean;
  created_on?: number;
  modified_on?: number;
}
