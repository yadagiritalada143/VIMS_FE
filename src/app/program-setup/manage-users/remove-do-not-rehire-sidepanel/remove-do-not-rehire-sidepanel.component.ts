import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { UserService } from 'src/app/core/services/user.service';
import { ReasonCodesService } from 'src/app/shared/service/reson-codes.service';
import { errorHandler } from 'src/app/shared/util/error-handler';

@Component({
  selector: 'app-remove-do-not-rehire-sidepanel',
  templateUrl: './remove-do-not-rehire-sidepanel.component.html',
  styleUrls: ['./remove-do-not-rehire-sidepanel.component.scss']
})
export class RemoveDoNotRehireSidepanelComponent implements OnInit {
  @Input() showRehire = 'hidden';
  @Input() rehireData: any = null;
  assignmentDetails: any = [];
  program_id: any;
  isChecked: boolean = false;
  selectedReason: string = null;
  hireActionCode: string = null;
  hireReasons: string = null;
  @Output() rehireToggle = new EventEmitter();
  @Output() handleUpdate = new EventEmitter();
  constructor(private userService: UserService, private localStorage: StorageService, 
    private loader: LoaderService, private alert: AlertService,
    private reasonCodesService: ReasonCodesService) { }

  ngOnInit(): void {
    this.program_id = this.localStorage.get('PROGRAM_ID');
    if(this.rehireData){
      this.getAssignmentData();
      this.getReasonCode(this.program_id);
    }
  }

  getAssignmentData() {

    let id = this.rehireData?.id;
    this.loader.show();
    this.userService.get(`/assignment/programs/${this.program_id}/user/${id}`)
      .subscribe({
        next: (res: any) => {
          let data = res?.data;
          if (data) {
            this.userService.get(`/assignment/programs/${this.program_id}/worker/${data.worker.worker_id}/assignment`)
              .subscribe({
                next: (result: any) => {
                  this.loader.hide();
                  this.assignmentDetails = result?.data;
                }, error: (err: Error | any) => {
                  this.loader.hide();
                  this.alert.error(errorHandler(err));
                }
              });
          } else {
            this.loader.hide();
          }
        },
        error: (err: Error) => {
          console.error(err);
        }
      }
    );
  }

  ngOnChanges() {
    this.ngOnInit();
  }

  sidebarClose() {
    this.rehireToggle.emit('hidden');
    this.showRehire = 'hidden';
    this.selectedReason = null;
    this.isChecked = false;
    this.handleUpdate.emit();
  }

  getReasonCode(programID) {
    this.reasonCodesService.getResoncodesFor("REMOVE_DO_NOT_REHIRE")
      .subscribe((res: any) => {
        const { reason_codes, resonCodeID } = res;
        this.hireActionCode = resonCodeID;
        this.hireReasons = reason_codes;
      }
    );
  }

  onSave() {

    let id = this.rehireData?.id;
    let orgId = this.rehireData?.organization.id;
    this.loader.show();
    let payload: any = {
      is_do_not_rehire: false,
      do_not_re_hire_reason_code_action: this.hireActionCode,
      do_not_re_hire_reason: this.selectedReason,
      program_id: this.program_id
    };

    this.userService.put(`/configurator/organizations/${orgId}/members/${id}`, payload)
      .subscribe({
        next: (res: any) => {
          this.loader.hide();
          this.alert.success("Do Not Rehire Successfully Removed");
          this.sidebarClose();
        }, error: (err: Error | any) => {
          this.loader.hide();
          this.alert.error(errorHandler(err));
        }
      }
    );
  }

  changeChecked() {
    if(!this.isChecked){
      this.selectedReason = null;
    }
  }

}
