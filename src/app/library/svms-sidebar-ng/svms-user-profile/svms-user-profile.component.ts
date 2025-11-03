import { Component, OnInit, Input,EventEmitter } from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { UserType } from 'src/app/expense/enums/expense.enums';
import { CryptoService } from 'src/app/core/services/crypto.service';

@Component({
  selector: 'app-svms-user-profile',
  templateUrl: './svms-user-profile.component.html',
  styleUrls: ['./svms-user-profile.component.scss']
})
export class SvmsUserProfileComponent implements OnInit {
  @Input() showProfile = false;
  @Input() avatar = '';
  @Input() userName = '';
  @Input() userPosition = ''
  @Input() socialProfiles:any;
  @Input() jobData:any;
  @Input() set candidateInfo (candidateData){
    this.candidateData = candidateData;
  }
  @Input() showSkelton: EventEmitter<boolean>;
  currentProgram:any;
  candidateData;
  accountDetails:any;
  loaded = false;
  resumeURL;
  isClient : boolean = false;
  socialprofile_icons={
    "facebook":'../../../../assets/images/facebook-white.svg',
    'linkedin':'../../../../assets/images/linkedin-white.svg',
    'skype':'../../../../assets/images/skype-white.svg',
    'git':'../../../../assets/images/github-white.svg',
    'instagram':'../../../../assets/images/instagram-white.svg'
  }
  constructor(
    private storageService: StorageService,
    private alert: AlertService,
    private cryptoService: CryptoService
  ) { }

  ngOnInit(): void {
    const programDetail = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const user_type = this.storageService.get('user_type')?.toLowerCase();
    if (user_type?.toUpperCase() === UserType.Client) {
      this.isClient = true;
    }
    this.accountDetails = this.storageService.get('account');
    if(programDetail){
      this.currentProgram=programDetail;
    }
  }

  downloadAttachment(data) {
    data = this.cryptoService?.decrypt(data);
    var link = document.createElement('a');
    if (data) {
      link.href = data;
    } else {
      this.alert.error('Resume Not Found.', {});
    }
    link.dispatchEvent(new MouseEvent('click'));
  }

  get profileImageHide() {
    return (this.isClient && this.currentProgram?.config?.is_candidate_image_hidden);
  }
}
