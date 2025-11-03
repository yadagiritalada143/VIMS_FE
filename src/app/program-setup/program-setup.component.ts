import { Component, OnInit, OnDestroy } from '@angular/core';
import { EventStreamService, Events, EmitEvent } from '../core/services/event-stream.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ProgramConfig } from '../shared/enums';
import { StorageService } from '../core/services/storage.service';
import {AlertService} from '../core/components/alert/alert.service';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-program-setup',
  templateUrl: './program-setup.component.html',
  styleUrls: ['./program-setup.component.scss']
})
export class ProgramSetupComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  isInsightVisible = true;
  public clientId: string;
  public programId: string;
  valueEmittedFromChildComponent = '';
  valueEmittedFromHeaderComponent: '';

  constructor(private eventStream: EventStreamService,
    private route: ActivatedRoute,
    private router: Router,
    private _alert: AlertService,
    private localStorage: StorageService) {
      this.subscriptions.push(this.router.events.subscribe((event) => {
      this.eventStream.emit(new EmitEvent(Events.ON_SHOW_INSIGHT, false));
    }));
  }

  ngOnInit(): void {
    if (this.router.url === '/program-setup') {
      this.eventStream.emit(new EmitEvent(Events.ON_SHOW_INSIGHT, true));
      this.isInsightVisible = true;
    } else {
      this.eventStream.emit(new EmitEvent(Events.ON_SHOW_INSIGHT, false));
      this.isInsightVisible = false;
    }
    this.subscriptions.push(this.eventStream.on(Events.ON_SHOW_INSIGHT).subscribe((visibility) => {
      this.isInsightVisible = visibility;
    }));
    // //Subscribing Route params from URL  -- ticket no. 561 --
    this.subscriptions.push(this.route.queryParams
      .subscribe(params => {

        if(params?.program_req_id){
          let newProgramJson = {
            program_uniqId: params?.programId,
            clientId: params?.clientId,
            program_req_id: params?.program_req_id,
            clientName : params?.clientName
          }
          this.localStorage.set(ProgramConfig[0], JSON.stringify(newProgramJson), true);
        }
       
      }));
      let programData = this.localStorage.get(ProgramConfig[0]);
      if(!programData || programData == undefined){
        this._alert.error("You have not configured the Program",{});
          this.router.navigate(['/dashboard']);
      }else{
        if(this.route.snapshot.queryParams['redirectTo']){
          this.router.navigateByUrl(this.route.snapshot.queryParams['redirectTo']);
        }
      }
  }
  

  parentEventHandlerFunction(valueEmitted) {
    this.valueEmittedFromChildComponent = valueEmitted;
  }
 
  notificationEventHandlerFunction(valueEmitted) {
    this.valueEmittedFromHeaderComponent = valueEmitted;

  }
  ngOnDestroy(): void {
    this.eventStream.emit(new EmitEvent(Events.ON_SHOW_INSIGHT, false));
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
