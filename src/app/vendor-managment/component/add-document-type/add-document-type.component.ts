import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';

@Component({
  selector: 'app-add-document-type',
  templateUrl: './add-document-type.component.html',
  styleUrls: ['./add-document-type.component.scss']
})
export class AddDocumentTypeComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  private _complianceGroupId: any;
  @Input() visiblity = 'hidden';
  @Input() programId;
  @Input() vendorId;
  @Input() set complianceGroupId(id) {
    if (id) {
      this._complianceGroupId = id;
      this.loadComplianceDocs();
    }
  };
  @Output() onClose = new EventEmitter();
  @Output() onSubmit = new EventEmitter<any>();
  contactForm = this.fb.group({});
  currentDoc: any;
  userType: any;
  update = false;
  docExpirationDate: any = '';
  notes: any = '';
  is_compliant = false;
  selectedDocument;
  pageNo = 1;
  complianceList: any[] = [];
  public input$ = new Subject<string>();
  constructor(private programService: ProgramService, private alertService: AlertService, private storageService: StorageService, private fb: UntypedFormBuilder, private eventStream: EventStreamService, private cd: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.userType = this.storageService.get('user_type');
    // this.loadComplianceDocs();

    this.subscriptions.push(
      this.eventStream.on(Events.UPLOAD_NEW_COMPLIANCE)
        .subscribe((data: any) => {
          this.visiblity = 'visible';
          this.cd.detectChanges()
        }
      )
    );

    this.subscriptions.push(
      this.input$.pipe(debounceTime(1000))
        .subscribe((newTerm: any) => {
          this.pageNo = 1;
          this.loadComplianceDocs(newTerm);
        }
      )
    );
  }

  loadComplianceDocs(term = null) {

    let url = `/configurator/programs/${this.programId}/vendor-compliance/required-documents?` +
      `&added_to_group=false&required_document_group_id=${this._complianceGroupId}`;
    if (term) {
      url += '&k=' + encodeURIComponent(term);
    }

    this.subscriptions.push(
      this.programService.get(url)
        .subscribe({
          next: (data: any) => {
            let { required_documents } = data;
            this.complianceList = required_documents;
          }, error: (err: Error) => console.error(err)
        }
      )
    );
  }

  docSelected(event) { }


  loadDoc() {
    const http = this.programService.get(`/configurator/programs/${this.programId}/vendor-compliance/required-documents/${this.currentDoc.id}`)
    this.subscriptions.push(http.subscribe((res: any) => {
      const { required_document } = res;
      this.currentDoc = required_document;
    }));
  }

  sideBaClose() {
    this.visiblity = 'hidden';
    this.selectedDocument = null;
    this.loadComplianceDocs();
    this.onClose.emit();
  }

  showLoader = false;

  save() {

    this.showLoader = true;
    const url = `/configurator/programs/${this.programId}/vendor-compliance/required-document-groups/${this._complianceGroupId}`;
    this.subscriptions.push(this.programService.put(url, {
      documents: [
        this.selectedDocument?.id
      ]
    }).subscribe({
      next: (res: any) => {
        this.complianceList = [];
        this.showLoader = false;
        this.sideBaClose();
      }, error: (err: Error | any) => {
        this.showLoader = false;
        this.alertService.error(errorHandler(err))
      }
    }));
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
