import { Component, ElementRef, Input, OnChanges, OnInit, Renderer2, ViewChild } from '@angular/core';
import { Observable, Subscription, forkJoin } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Candidate } from '../components/duplicate-candidates/duplicate-candidates.model';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { CredentialingService } from '../service/credentialing.service';
import { RoleEventType } from '../service/credentialing.model';
import { IRolePermissionResp, IRolePermissionWidget, Widget } from './credentialing-iframe.model';

declare const CredWidgetLibrary: any;

@Component({
  selector: 'app-credentialing-iframe',
  templateUrl: './credentialing-iframe.component.html',
  styleUrls: ['./credentialing-iframe.component.scss'],
})
export class CredentialingIframeComponent implements OnInit, OnChanges {
  @ViewChild('wrapper') div!: ElementRef;
  programId: string;
  @Input() widgetType: Widget;
  @Input() iframeStyle: any; // dynamically loaded iframe can only be changed with inline css

  // candidate credential
  @Input() candidate?: Candidate;

  // configure_role_permissions
  @Input() roleParam: {roleName: string}
  @Input() onRoleCreated?: (status: IRolePermissionResp, context: {}) => void;
  @Input() onRoleUpdated?: (status: IRolePermissionResp, context: {}) => void;

  tokenData: string;
  credProgramId: string;
  credWidget;

  subscriptions: Subscription[];

  constructor(
    private credentialingService: CredentialingService,
    private storageService: StorageService,
    private el: ElementRef,
    private renderer: Renderer2,
  ) {}

  ngOnInit() {
    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    forkJoin({ loadIframe: this.loadIframe(), tokenData: this.credentialingService.getClientToken({}) }).subscribe({
      next: data => {
        this.tokenData = data.tokenData.access_token;
        this.credProgramId = data.tokenData.cred_program_id;
        this.loadWidgetByType(this.widgetType);
      },
      error: error => {
        // TODO: error handling, show it in the UI
        console.error(error);
      },
    });
    this.subscriptions = [];
  }

  ngOnChanges(changes) {

    switch (this.widgetType) {
      case Widget.CONFIGURE_ROLE_PERMISSIONS:
      if (changes?.roleParam && !changes?.roleParam.firstChange)
        if (this.subscriptions.length > 0)
          this.subscriptions.forEach((sub: Subscription) => {
            sub?.unsubscribe();
          });
        this.subscriptions = [];
        this.div.nativeElement.replaceChildren();
        this.loadWidgetByType(this.widgetType);
      break;
    }
  }

  loadWidgetByType(widgetType: string) {
    // clean up all the events bind to the iframe
    switch (this.widgetType) {
      case Widget.CONFIGURE_CREDENTIALS:
        this.credWidget = this.initAddCredentialTypeFrame(this.tokenData, this.credProgramId);
        break;

      case Widget.ORG_CANDIDATE_CREDENTIAL:
        this.credWidget = this.initOrgCandidateCredentialFrame(this.tokenData, this.candidate);
        break;

      case Widget.CONFIGURE_ROLE_PERMISSIONS:
        window?.removeEventListener('message', CredWidgetLibrary.handleMessageFromFlutter);
        document?.removeEventListener("messageFromFlutter", CredWidgetLibrary.resolveMessageFromFlutter);
        this.credWidget = this.initRolePermissions(this.tokenData, this.credProgramId, this.roleParam.roleName);
        if (this.subscriptions.length == 0)
          this.subscriptions.push(
            this.credentialingService.rolePermissionEventObservable$.subscribe({
              next: roleEvent => {
                switch (roleEvent.type) {
                  case RoleEventType.CREATE_ROLE:
                    this.credWidget.createRole(roleEvent.name);
                    break;
                  case RoleEventType.UPDATE_ROLE:
                    this.credWidget.updateRole(roleEvent.name, roleEvent.newName);
                    break;
                  default:
                    break;
                }
              },
            }),
          );
        break;

      default:
        break;
    }
    const myElement = document.getElementById('cred-widgets-iframe');
    Object.entries(this.iframeStyle).forEach(([key, value]) => {
      this.renderer.setStyle(myElement, key, value);
    });
  }

  initOrgCandidateCredentialFrame(token: string, candidate: Candidate): any {
    const widgetData = this.credentialingService.createOrgCredentialDataFromCandidate(candidate, token);
    const credWidget = CredWidgetLibrary.createWidget(this.div.nativeElement, widgetData);
    return credWidget;
  }

  initAddCredentialTypeFrame(token: string, credProgramId: string): any {
    const widgetData = this.credentialingService.createAddCredentialType(token, credProgramId);
    const credWidget = CredWidgetLibrary.createWidget(this.div.nativeElement, widgetData);
    return credWidget;
  }

  initRolePermissions(token: string, credProgramId: string, roleName?: string): IRolePermissionWidget {
    const widgetData = this.credentialingService.createRolePermissions(token, credProgramId, roleName);
    const credWidget = CredWidgetLibrary.createWidget(this.div.nativeElement, widgetData);
    credWidget.onRoleCreate(status => this.onRoleCreated(status, { credProgramId }));
    credWidget.onRoleUpdate(status => this.onRoleUpdated(status, { credProgramId }));
    return credWidget;
  }

  loadIframe() {
    const scriptUrl: string = environment.CREDENTIALING_SCRIPT_URL;
    return new Observable(observer => {
      //load script
      let script = document.createElement('script');
      script.type = 'text/javascript';
      script.id = 'cred-widget-script';
      script.src = scriptUrl;
      script.onload = () => {
        observer.next({ loaded: true, status: 'Loaded' });
        observer.complete();
      };
      script.onerror = (error: any) => observer.error(error);
      document.getElementsByTagName('head')[0].appendChild(script);
    });
  }
}
