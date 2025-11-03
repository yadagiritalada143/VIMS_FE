import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import i18next from 'i18next';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { LOG_TYPE, Log } from 'src/app/library/logs/logs.model';
import { Widget } from 'src/app/shared/credentialing-iframe/credentialing-iframe.model';
import { CredentialingService } from 'src/app/shared/service/credentialing.service';

@Component({
  selector: 'app-credentialing',
  templateUrl: './credentialing.component.html',
  styleUrls: ['./credentialing.component.scss'],
})
export class CredentialingComponent implements OnInit {
  logs: Log = undefined;
  widgetType: string = Widget.CONFIGURE_CREDENTIALS;
  showWidget: boolean = false;
  programDetails: any;
  iframeStyle = {
      width: '100%',
      height: '100%',
      border: 'none',
      position: 'relative',
    }


  constructor(
    private _loader: LoaderService,
    private route: ActivatedRoute,
    private credentialingService: CredentialingService,
    private localStorage: StorageService,
  ) {}

  ngOnInit(): void {
    this.programDetails = this.localStorage.get(StorageKeys?.CURRENT_PROGRAM);
    if (this.credentialingService.canViewCredentialing()) this.showWidget = true;
    // Credentialing feature is not enabled
    else this.showError(i18next.t('credentialing_not_enabled'));
  }

  getCredProgramId() {
    return this.programDetails.credProgramId;
  }

  showError(err) {
    window.scrollTo(0, 0);
    this.logs = {
      type: LOG_TYPE.ERROR,
      heading: err?.error?.error?.message ? err?.error?.error?.message : typeof err == 'string' ? err : '',
      messages: [],
      autoClose: true,
      isShown: true,
      showReportButton: err?.status == 500 || err?.status == 400,
      additionalInfo: { trace_id: err?.error?.trace_id },
    };
  }
}
