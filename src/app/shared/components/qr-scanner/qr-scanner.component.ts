import { Component, OnInit } from '@angular/core';
import { NgxQrcodeElementTypes, NgxQrcodeErrorCorrectionLevels } from '@techiediaries/ngx-qrcode';
import { AuthLoginService } from 'src/app/auth/auth-login.service';
import { StorageService,StorageKeys  } from 'src/app/core/services/storage.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'qr-scanner',
  templateUrl: './qr-scanner.component.html',
  styleUrls: ['./qr-scanner.component.scss']
})
export class QrScannerComponent implements OnInit {
  qrScannerModal:boolean = false; 
  // name = 'Angular ' + VERSION.major;
  elementType = NgxQrcodeElementTypes.CANVAS;
  correctionLevel = NgxQrcodeErrorCorrectionLevels.HIGH;
  // value   = 'https://www.techiediaries.com/';
  requiredData: any = {};
  userData: any = {};
  newData: string ;

  constructor(public storageService: StorageService,    private _http: AuthLoginService,
    ) { }

    ngOnInit(): void { 
      this.getUserData();
      this.preLogin();
    }
  openQRScaner() {
    this.qrScannerModal = true;
    this.getUserData();
    this.preLogin();
  };

  closeQRScanner () {
    this.qrScannerModal = false;
  };
  preLogin() {
      this._http.get('/configurator/resources/sso-configurations?domain='+ window.location.hostname).subscribe((data: any) => {
        if (data) {
          this.requiredData = {...data, ...this.userData}
          if (this.userData && data) {
            this.newData = JSON.stringify({
              // client_id:data?.client_id,
              // domain:data?.domain,
              // secret_key:data?.secret_key,
              // validator_endpoint:data?.validator_endpoint,
              // trace_id:data?.trace_id,
              // _id:this.userData?._id,
              // avatar:this.userData?.avatar,
              sso_url: data?.sso_url,
              backend_url: environment?.API_ENDPOINT,
              email: this.userData?.email,
              full_name: this.userData?.full_name,
              reports_backend_url: environment.REPORT_API_ENDPOINT
            })
          }
      }
      });
    }
    getUserData(){
      let user = this.storageService.get(StorageKeys?.CURRENT_USER);
      this.userData.avatar = user?.avatar;
      this.userData.email = user?.email;
      this.userData._id = user?._id;
      this.userData.full_name = user?.full_name ? user?.full_name : user?.first_name;
    }
}
