import { Component, OnInit, ViewChild, EventEmitter, Input, Output } from '@angular/core';
import { MasterTalentProfileService } from '../master-talent-profile.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { CandidateJobProfileComponent } from 'src/app/jobs/job-details/components/candidate-job-view/components/candidate-job-profile/candidate-job-profile.component';
import { MasterProfilePermissions } from 'src/app/assignment/enums/master-profile-permissions';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { MasterTalentProfileDetailsRequestParam } from '../model/mtp.model';
import { I18NextPipe } from 'angular-i18next';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
@Component({
  selector: 'app-master-talent-profile-details',
  templateUrl: './master-talent-profile-details.component.html',
  styleUrls: [
    '../../../assets/sass/self-config/config-main.scss',
    '../../../assets/sass/self-config/config-main-2.scss',
    './master-talent-profile-details.component.scss',
  ],
})
export class MasterTalentProfileDetailsComponent implements OnInit {
  @Output() modelclose: EventEmitter<any> = new EventEmitter<any>();
  @Input() profileId = '';
  currentTab: string = 'Linked Profiles';
  currentProgramId: string;
  profileDetails = null;
  selectedCandidate: any;
  mtpDetailsModal:boolean = false;
  masterProfilePermissions = MasterProfilePermissions;
  @ViewChild(CandidateJobProfileComponent) child:CandidateJobProfileComponent;
  showDetailSection: boolean = false;
  constructor(
    private masterTalentProfileService: MasterTalentProfileService,
    private storageService: StorageService,
    private loaderService: LoaderService,
    public alert: AlertService,
    private authorizationService: AuthorizationService,
    private confirmService: ConfirmationDialogService,
    private i18NextPipe: I18NextPipe,
    public activeModal: NgbActiveModal
  ) {}
  ngOnInit(): void {
    this.loaderService.show();
    if(this.profileId) {
      this.currentProgramId = this.storageService.get(StorageKeys.PROGRAM_ID);
      this.getMasterTalentProfileDetails({ programId: this.currentProgramId, mtpId: this.profileId });
    }
    this.mtpDetailsModal = true;
  }

    // Reassign Model close
    async mtpModalClose() {
      this.modelclose.emit(true)
      this.activeModal.close();
   }

  getMasterTalentProfileDetails = (masterTalentProfileListRequestParam: MasterTalentProfileDetailsRequestParam) => {
    this.masterTalentProfileService.getMasterTalentProfileDetails(masterTalentProfileListRequestParam).subscribe({
    next: (result: any) => {
      if (result) {
        this.profileDetails = {...result.master_talent_profiles};
        this.selectedCandidate = this.profileDetails.master_talent_profiles_mapped[0];
      } else {
        this.profileDetails = null;
      }
    },
      error: () => {},
      complete: () => {
        this.loaderService.hide();
      },
    });
  };

  updateMasterTalentProfile = () => {
    let payload = { talent_name: this.profileDetails.updated_talent_name };
    this.loaderService.show();
    this.masterTalentProfileService.updateMasterTalentProfile({ programId: this.currentProgramId, mtpId: this.profileId }, payload).subscribe({
      next: () => {
        this.profileDetails.talent_name = payload.talent_name;
        this.profileDetails.isEditName = false
        this.alert.success(this.i18NextPipe.transform('mtp_profile_name_updated'));
        this.loaderService.hide();
      },
      error: () => {
        this.alert.success(this.i18NextPipe.transform('issue_updating_mtp_profile'));
        this.loaderService.hide();
      },
    });
  };
  deleteMasterProfile = () => {
    this.confirmService.confirm('', this.i18NextPipe.transform('delete_mtp_profile'),
    'Yes', 'No').then((res)=>{
      if(res){
        this.loaderService.show();
        this.masterTalentProfileService.deleteMasterProfile({ programId: this.currentProgramId, mtpId: this.profileId }).subscribe({
        next: () => {
          this.alert.success(this.i18NextPipe.transform('mtp_profile_deleted_success'))
          this.loaderService.hide();
          this.modelclose.emit();
        },
        error: () => {
          this.alert.success(this.i18NextPipe.transform('issue_deleting_mtp'));
          this.loaderService.hide();
        },
      })
      }
    })
  }
  selectProfile(profile) {
    this.selectedCandidate = profile;
    this.child.resetEducationArr();
    this.child.getCandidateDetails(this.selectedCandidate.candidate?.id);
    this.child.getCandidateWorkerDetails(this.selectedCandidate.candidate?.id);
    this.showDetailSection = true;
  }

  checkAuthorization(permission) {
    return this.authorizationService.authorize(permission)
  }

  hideDetailbox() {
    this.showDetailSection = false;
  }
}
