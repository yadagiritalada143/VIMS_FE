import {Injectable} from '@angular/core';

import { UntypedFormGroup} from '@angular/forms';
import {AttachmentExtension, ExpenseStatusMessage} from '../../enums/expense.enums';
import {AttachmentModel} from '../../models/attachment.model';

export interface AttachmentByExtension {
  previewPath: string;
  downloadPath: string;
  hasBigPreview: boolean;
}

@Injectable({
  providedIn: 'root'
})

export class FormHelperService {

  constructor() {
  }
  public showErrors(form: UntypedFormGroup) {
    Object
      .keys(form.controls)
      .forEach(field => {
        form
          .get(field)
          .markAsTouched({onlySelf: true});
      });
  }

  public getStatusText(status: string, isArchive: '0' | '1') {
    let text = '';
    switch (status.toLowerCase()) {
      case ExpenseStatusMessage.approved: text = 'Approved'; break;
      case ExpenseStatusMessage.rejected: text = 'Rejected'; break;
      case ExpenseStatusMessage.pending: text = 'Submitted'; break;
      case ExpenseStatusMessage.withdrawn: text = 'Withdrawn'; break;
      case ExpenseStatusMessage.modified: text = isArchive === '0' ? 'Approved' : 'Modified'; break;
      default: text = 'Last Updated';
    }
    return text;
  }

  public attachmentPathByExtension(attachment: AttachmentModel): AttachmentByExtension {
    attachment.attachment_extention = attachment?.attachment_extention?.toLocaleLowerCase();
    if (attachment.attachment_extention === AttachmentExtension.JPG ||
      attachment.attachment_extention === AttachmentExtension.PNG) {
      return { previewPath: attachment.path, downloadPath: attachment.path, hasBigPreview: true };
    }
    if (attachment.attachment_extention === AttachmentExtension.PDF) {
      return { previewPath: '/assets/images/pdf.svg', downloadPath: attachment.path, hasBigPreview: false };
    }
    if (attachment.attachment_extention === AttachmentExtension.DOCX ||
      attachment.attachment_extention === AttachmentExtension.DOC ||
      attachment.attachment_extention === AttachmentExtension.EXEL
    ) {
      return { previewPath: '/assets/images/word.svg', downloadPath: attachment.path, hasBigPreview: false };
    }
  }
}
