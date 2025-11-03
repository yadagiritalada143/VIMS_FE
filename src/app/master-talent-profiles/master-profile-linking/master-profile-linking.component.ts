import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MasterTalentProfileService } from '../master-talent-profile.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { I18NextPipe } from 'angular-i18next';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { MasterProfilePermissions } from 'src/app/assignment/enums/master-profile-permissions';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MasterTalentProfileDetailsComponent } from '../master-talent-profile-details/master-talent-profile-details.component';
@Component({
  selector: 'app-master-profile-linking',
  templateUrl: './master-profile-linking.component.html',
  styleUrls: ['./master-profile-linking.component.scss'],
})
export class MasterProfileLinkingComponent implements OnInit {
  @Input() mtpMatches;
  @Input() candidateData;
  @Input() selectedMasterProfileID: string;
  profileId:string;
  public mtpDetails: any = null;
  @Output() onClose = new EventEmitter();
  @Output() setSelectedMtpID = new EventEmitter();
  currentProgramId: string;
  public scrollConfig: PerfectScrollbarConfigInterface = { suppressScrollX: false, suppressScrollY: true };
  constructor(
    private masterTalentProfileService: MasterTalentProfileService,
    public storageService: StorageService,
    private confirmService: ConfirmationDialogService,
    private i18NextPipe: I18NextPipe,
    private _loader: LoaderService,
    public alert: AlertService,
    private authorizationService: AuthorizationService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.currentProgramId = this.storageService.get(StorageKeys.PROGRAM_ID);
  }

  linkMasterProfile(isLinkedMTP) {
    const opt = {
      confirmationMsg: isLinkedMTP ? 'link_mtp_profile' : 'dont_see_match_success',
      successMsg: isLinkedMTP ? 'master_profile_link_success' : '',
      payload: isLinkedMTP
        ? { program_id: this.currentProgramId, mtp_id: this.selectedMasterProfileID }
        : { program_id: this.currentProgramId },
    };
    this.confirmService
      .confirm('', this.i18NextPipe.transform(opt.confirmationMsg), this.i18NextPipe.transform('yes'), this.i18NextPipe.transform('no'),'lg',null,true)
      .then(res => {
        if (res) {
          this._loader.show();
          this.masterTalentProfileService.updateLinkMasterProfile(this.candidateData.id, opt.payload).subscribe({
            next: () => {
              this.alert.success(this.i18NextPipe.transform(opt.successMsg));
              this._loader.hide();
              this.onClose.emit(true);
            },
            error: () => this._loader.hide(),
          });
        }
      });
  }
  arrowBack(){
    this.onClose.emit(false);
  }
  openLinkingModal(mtpId){
    if (this.authorizationService.authorize(MasterProfilePermissions.VIEW_MTP_SCREEN)) {
      this.mtpDetails = true;
      this.profileId = mtpId;
      const modalRef = this.modalService.open(MasterTalentProfileDetailsComponent);
      modalRef.componentInstance.profileId = mtpId;
    }
  }
}
