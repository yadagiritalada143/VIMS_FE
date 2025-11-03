import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { ProgramService } from 'src/app/programs/program.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { cloneDeep } from 'lodash';

@Component({
  selector: 'app-edit-reason-code',
  templateUrl: './edit-reason-code.component.html',
  styleUrls: ['./edit-reason-code.component.scss'],
})
export class EditReasonCodeComponent implements OnInit {
  public name: string;
  public ReasonId: string;
  public module: string;
  public code: string;
  public currentReasons: any;
  public tempCurrentReasons: any;
  public initialReasonList: any;
  public review;
  showRemove = false;
  private reasonLength = 0;

  reasonCodeLimit: number = Infinity;

  constructor(
    private storageService: StorageService,
    public route: ActivatedRoute,
    private programService: ProgramService,
    private router: SvmsRouterService,
    private _alertService: AlertService,
    private confirmService: ConfirmationDialogService,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params: any) => {
      this.name = params?.['name'];
      this.ReasonId = params?.['id'];
      this.module = params?.['module'];
      this.code = params?.['code'];
      this.getReasonsList(this.storageService.get('PROGRAM_ID'), this.ReasonId);
    });
  }

  getReasonsList(programID, reasonID) {
    this.programService
      .get(`/configurator/programs/${programID}/pages/reason-code-actions/${reasonID}/reason-codes?status=all`)
      .subscribe((reasons: any) => {
        this.currentReasons = reasons.reason_codes;
        this.tempCurrentReasons = cloneDeep(reasons.reason_codes);
        this.initialReasonList = reasons.reason_codes;
        this.reasonLength = reasons.reason_codes.length;
        if (this.reasonLength > 0) {
          this.reasonCodeLimit = reasons.reason_codes[0].reason_code_limit
        }
        if (this.reasonLength == 0) {
          this.tempCurrentReasons.push({
            id: Math.random().toString(24).substr(2, 9),
            name: '',
            is_enabled: true,
            entity_ref: this.module,
            is_deleted: false,
            category: 'NEUTRAL',
            isNew: true,
          });
        }
      });
  }

  backClicked() {
    this.router.navigate(['data-management', 'reason-codes']);
  }

  reasonRatingChange(reasonData, event: any) {
    if (!event || !reasonData) {
      return;
    }

    this.tempCurrentReasons.forEach(item => {
      if (item.id == reasonData.id) {
        item.category = event;
      }
    });
  }

  addNewReason() {
    if (this.tempCurrentReasons.length >= this.reasonCodeLimit) return
    const lastReason = this.tempCurrentReasons[this.tempCurrentReasons.length - 1];
    if (lastReason?.name) {
      this.tempCurrentReasons.push({
        id: Math.random().toString(24).substr(2, 9),
        name: '',
        is_enabled: true,
        entity_ref: this.module,
        is_deleted: false,
        category: 'NEUTRAL',
        isNew: true,
      });
    } else if (this.tempCurrentReasons.length == 0) {
      this.tempCurrentReasons.push({
        id: Math.random().toString(24).substr(2, 9),
        name: '',
        is_enabled: true,
        entity_ref: this.module,
        is_deleted: false,
        category: 'NEUTRAL',
        isNew: true,
      });
    }

    this.initialReasonList.push(this.tempCurrentReasons[this.tempCurrentReasons.length - 1]);
  }

  deleteReason(reason) {
    this.confirmDelete(reason);
  }

  confirmDelete(reason) {
    this.confirmService.confirm('', 'Are you sure you want to remove this reason?', 'Yes', 'No').then(confirmed => {
      if (confirmed) {
        this.tempCurrentReasons.splice(this.tempCurrentReasons.indexOf(reason), 1);
        this.initialReasonList.forEach(item => {
          if (item.id == reason.id) {
            if (item.is_deleted == true) {
              item.is_deleted = false;
            } else {
              item.is_deleted = true;
            }
          }
        });
      }
    });
  }

  private updateDeletedReasonsFlag(tempCurrentReasons) {
    this.initialReasonList.forEach(initialReason => {
      const updatedReason = tempCurrentReasons.find(reason => reason.id === initialReason.id);

      if (updatedReason) {
        // Update initialReasonList with the updated changes from TempCurrentReason of that record
        Object.assign(initialReason, updatedReason);
      } else {
        // Set is_deleted = true for that record in initialReasonList if it's not present in tempCurrentReasons
        initialReason.is_deleted = true;
      }
    });
  }

  onSave() {
    let isSave = true;
    this.tempCurrentReasons.forEach(item => {
      if (item.name.trim() === '' || item.name === undefined || item.name === null) {
        item.nameError = true;
        isSave = false;
      }
    });

    if (isSave) {
      this.updateDeletedReasonsFlag(this.tempCurrentReasons);
      this.initialReasonList.forEach(item => {
        if (item.isNew) {
          delete item.isNew;
          delete item.id;
          if (item.is_deleted == true) {
            this.initialReasonList.splice(this.initialReasonList.indexOf(item), 1);
          }
        }
      });

      const payload = this.initialReasonList.map(item => {
        const { id, name, category, is_enabled, is_deleted } = item;
        return { id, name, category, is_enabled, is_deleted };
      });

      const putUrl = `/configurator/programs/${this.storageService.get(StorageKeys.PROGRAM_ID)}/pages/reason-code-actions-list/${
        this.ReasonId
      }`;
      this.programService.put(putUrl, { reason_codes: payload }).subscribe({
        next: (data: any) => {
          if (data) {
            this._alertService.success('Reasons updated successfully.');
            this.router.navigate(['data-management', 'reason-codes', 'reason-code-details'], {
              queryParams: {
                name: this.name,
                id: this.ReasonId,
                module: this.module,
                code: this.code
              },
            });
          }
        },
        error: err => {
          this._alertService.error(errorHandler(err));
        },
      });
    }
  }

  onClickToggle(reason) {
    if (!reason.is_editable) return
    this.tempCurrentReasons.forEach(item => {
      if (item.id == reason.id) {
        item.is_enabled = !item.is_enabled;
      }
    });
  }

  updateName(reason: any, newName: string) {
    if (newName.trim() === '') {
      reason.nameError = true;
      reason.name = newName.trim();
    } else {
      reason.nameError = false;
      reason.name = newName.trim();
    }
  }

  get isAutoClosedAssignment() {
    return this.code === 'AUTO_CLOSED_ASSIGNMENT';
  }
}
