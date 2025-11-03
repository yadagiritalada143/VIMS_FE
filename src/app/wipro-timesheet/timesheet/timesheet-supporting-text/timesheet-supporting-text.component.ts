import { Component, Input, OnChanges } from '@angular/core';
import { TimesheetService } from '../../timesheet.service';
import { TimesheetStatus, TimesheetSupportingTextEvent } from '../../timesheet.enums';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';

@Component({
  selector: 'app-timesheet-supporting-text',
  templateUrl: './timesheet-supporting-text.component.html',
  styleUrls: ['./timesheet-supporting-text.component.scss']
})
export class TimesheetSupportingTextComponent implements OnChanges {
  @Input() timesheetStatus: string;
  public supportData:any;
  public readonly moduleLevel = 'module_level';

  constructor(private timesheetService: TimesheetService, private _storageService: StorageService) { }

  ngOnChanges(): void {
    // if (this.timesheetStatus) 
    this.getSupportingList();
  }

  getSupportingList() {
    let params = {};
    let showSupportingText = false;
    let userType = this._storageService.get(StorageKeys.USER_TYPE);
    params['performed_by'] = userType;
    if (this.timesheetStatus?.toLowerCase() === TimesheetStatus?.PENDING?.toLowerCase()) {
      params['event_slug'] = TimesheetSupportingTextEvent.APPROVE_EVENT;
      showSupportingText = true;
    }
    else if (!this.timesheetStatus || this.timesheetStatus?.toLowerCase() === TimesheetStatus?.DRAFT?.toLowerCase() || this.timesheetStatus?.toLowerCase() === TimesheetStatus?.MISSING?.toLowerCase()) {
      params['event_slug'] = TimesheetSupportingTextEvent.SUBMIT_EVENT;
      showSupportingText = true;
    }
    else if ((!!this.timesheetStatus && this.timesheetStatus?.toLowerCase() !== TimesheetStatus?.PENDING?.toLowerCase() && this.timesheetStatus?.toLowerCase() !== TimesheetStatus?.MISSING?.toLowerCase() && this.timesheetStatus?.toLowerCase() !== TimesheetStatus?.DRAFT?.toLowerCase())) {
      params['event_slug'] = TimesheetSupportingTextEvent.VIEW_EVENT;
      showSupportingText = true;
    }
    else if (!this.timesheetStatus) {
      params['event_slug'] = TimesheetSupportingTextEvent?.SUBMIT_EVENT;
      showSupportingText = true;
    }
    params['is_enabled'] = "true";

    if (showSupportingText) {
      this.timesheetService.getSupportingList(params).subscribe((res: any) => {
        let supportingTextData = res?.support_text_data[0]?.supp_text_actions?.find(supportingTextObj => supportingTextObj?.default_support_text?.default_actions.slug === this.moduleLevel);
        const slug = supportingTextData?.default_support_text?.default_actions.slug;
        this.supportData = {
          id: slug,
          support_text: supportingTextData?.description,
          link: supportingTextData?.url,
          button_text: supportingTextData?.label
        }
      })
    }
  }
}
