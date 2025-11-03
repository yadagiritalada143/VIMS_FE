import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProgramService } from 'src/app/programs/program.service';
import { EmitEvent, EventStreamService, Events } from '../../core/services/event-stream.service';
import { StorageService } from '../../core/services/storage.service';
import { ProgramConfig } from '../../shared/enums';

@Component({
  selector: 'app-program-setup-home',
  templateUrl: './program-setup-home.component.html',
  styleUrls: ['./program-setup-home.component.scss']
})
export class ProgramSetupHomeComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  dataVisibility = true;
  isInsight = true;
  programObj;
  programData;
  constructor(private eventStream: EventStreamService,
    public storageService: StorageService,
    public router: Router,
    private changeDetectorRef: ChangeDetectorRef,
    private _storageService: StorageService,
    private programService: ProgramService) { }

  ngOnInit(): void {
    this.subscriptions.push(this.eventStream.on(Events.ON_SHOW_INSIGHT).subscribe((visibility) => {
      this.isInsight = visibility;
      this.changeDetectorRef.detectChanges();
    }));
    setTimeout(() => {
      this.eventStream.emit(new EmitEvent(Events.ON_SHOW_INSIGHT, true));
    }, 100);
    this.programData = JSON.parse(this._storageService.get(ProgramConfig[0]));
    this.fetchClientDetails();
  }

fetchClientDetails() {
  this.subscriptions.push(this.programService.get(`/configurator/programs/${this.programData?.program_req_id}`).subscribe((data:any) => {
      this.programObj = data.program;
    }, error => {
      if (error?.error?.message) {
        console.error(error);
      }
    }));
  }
  alertInfoClose() {
    this.dataVisibility = false;
  }


  exitProgramSetup() {
    //remove the current program configuration
    this.storageService.remove(ProgramConfig[0]);
    this.storageService.remove(ProgramConfig[1]);
    //redirect user to program listing page.
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
    this.eventStream.emit(new EmitEvent(Events.ON_SHOW_INSIGHT, false));
  }
}
