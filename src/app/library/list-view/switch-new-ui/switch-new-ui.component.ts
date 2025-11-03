import { Component, OnInit } from '@angular/core';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { Router } from '@angular/router';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';

@Component({
  selector: 'app-switch-new-ui',
  templateUrl: './switch-new-ui.component.html',
  styleUrls: ['./switch-new-ui.component.scss'],
})
export class SwitchNewUiComponent implements OnInit {
  showHideSwitchUi: boolean = false;
  urlToNavigate: string;
  oldURL:string;
  defaultView:boolean = false
  glv : any;
    constructor(private eventStream: EventStreamService, private router: Router,private _storageService: StorageService,private _http: ProgramService, 
    public alertService: AlertService
    ) {}

  ngOnInit(): void {
     this.glv = this._storageService.get(StorageKeys.GLV_PREFERENCE);
    this.eventStream.on(Events.TRY_NEW_TABLE_UI).subscribe(data => {
      if (data) {
        this.urlToNavigate = data.URL;
        this.oldURL = data.oldURL;
        this.showHideSwitchUi = true;
        Object?.keys(this.glv)?.forEach(ele => {
          if(this.glv[ele]['newUrl']?.includes(this.urlToNavigate)){
            this.defaultView =  this.glv[ele].newView ? true : false
          }
        })
         this.setData(this.glv)
      } else {
        this.showHideSwitchUi = false;
      }

    });
  }
  hideNewUiModal() {
    this.showHideSwitchUi = false;
  }

  showNewUI() {
    Object.keys(this.glv).forEach(ele => {
      if(this.glv[ele]['newUrl']?.includes(this.urlToNavigate)){
        this.glv[ele].glv = true
        this.glv[ele].newView = this.defaultView
      }
    })
    this.setData(this.glv)
    this.saveGlvConfiguration(this.glv)
    this.router.navigate([this.urlToNavigate], { state: { prevURL: this.oldURL } });
  }
  changed = (evt) => {   
    this.defaultView = evt.target.checked;
    // Object?.keys(this.glv)?.forEach(ele => {
    //   if(this.glv[ele]['newUrl']?.includes(this.urlToNavigate)){
    //     this.glv[ele].newView = this.glv[ele].glv = this.defaultView
    //   }
    // })
    // this.setData(this.glv)
    }
    
    setData(glv){
    this._storageService.set(StorageKeys.GLV_PREFERENCE,glv,true);
    }
    saveGlvConfiguration(glv){
      const programId = this._storageService.get(StorageKeys.PROGRAM_ID);
      const memberId = JSON.parse(localStorage.getItem(StorageKeys.ACCOUNT))?.['id']
      if(!glv)
      return
    
    Object.keys(glv).forEach(ele => {
      if(!glv[ele]['newView']){
        glv[ele]['glv'] = false
      }
    })
    const payload = {
      glv_preferences: glv
    }
         this._http.put(`/configurator/programs/${programId}/members/${memberId}/glv_preferences`,payload).subscribe({
           next: (data: any) => {
           },
           error: err => {
             this.alertService.error(errorHandler(err));
           },
         });
    }
}
