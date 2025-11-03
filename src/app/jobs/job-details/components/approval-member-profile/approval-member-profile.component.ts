import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { UserPermissionService } from 'src/app/expense/services/user-permission.service';
import { ApprovalStatus } from 'src/app/shared/enums';

@Component({
  selector: 'app-approval-member-profile',
  templateUrl: './approval-member-profile.component.html',
  styleUrls: ['./approval-member-profile.component.scss'],
})
export class ApprovalMemberProfileComponent implements OnInit {
  @Input() profile: any;
  @Input() approval: any;
  @Input() jobStatus: any;
  @Input() approvalChainId: string;
  @Input() jobCurrentStatus: string;
  @Output() onReplaceApprover = new EventEmitter();
  @Output() onOpenApprovalPanel = new EventEmitter();
  readMore = false;
  approvalStatus = ApprovalStatus;

  constructor(private authorizationService:AuthorizationService,private userPermissionService: UserPermissionService) {}

  ngOnInit(): void {
    if (
      (this.jobCurrentStatus && (this.jobCurrentStatus.toLowerCase() === 'closed' || this.jobCurrentStatus.toLowerCase() === 'hold')) ||
      !this.profile?.is_active
    ) {
      this.profile.is_approval_allowed = false;
    }
  }

  getStatusStyleClass(status) {
    status = status?.toLowerCase();
    let className = '';
    switch (status) {
      case this.approvalStatus.pending:
        className = 'no-approved-panel';
        break;
      case this.approvalStatus.approved:
        className = 'approved-panel';
        break;
      case this.approvalStatus.rejected:
        className = 'rejected';
        break;
      case this.approvalStatus.not_needed:
        className = 'no-approved-panel';
        break;
      default:
        break;
    }
    return className;
  }

  replaceApprover(data: any) {
    this.onReplaceApprover.emit(data);
  }

  get hasReplaceApprovalPermission() {
    let canReplaceMember = false;
    if (this.userPermissionService.isUserSuperAdmin()) {
      canReplaceMember = true;
    } else {
      if (!this.profile?.is_delegated) {
        canReplaceMember = this.authorizationService.authorize('replace_approver');
      }
    }
    return canReplaceMember;
  }

  openApprovalPanel(status, approverId = '', is_program_admin = false, mode = '') {
    const data = {
      status: status,
      approverId: approverId,
      is_program_admin: is_program_admin,
      approval_chain_id: this.approvalChainId,
      mode: mode,
    };
    this.onOpenApprovalPanel.emit(data);
  }

  getNotActiveProfileMessage = (profile): string => {
    let message = 'Approval is deactivated';
    if (!profile?.is_active && profile.prgram_admin_fullname) {
      message = `Approval is replaced by ${profile.prgram_admin_fullname}`;
    }
    return message;
  };
}
