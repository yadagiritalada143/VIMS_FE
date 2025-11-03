import { Component, EventEmitter, Output, Input } from '@angular/core';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { AttachmentModel } from '../../models/attachment.model';
import {AttachmentByExtension, FormHelperService} from '../../services/form-helper/form-helper.service';

@Component({
  selector: 'app-attachment-item',
  templateUrl: './attachment-item.component.html',
  styleUrls: ['./attachment-item.component.scss']
})
export class AttachmentItemComponent {
  @Input() public attachment: AttachmentModel;
  @Output() removeEvent = new EventEmitter();

  constructor( private confirmationService: ConfirmationDialogService,
               private formHelperService: FormHelperService) {}

 public deleteItem(): void {
    this.confirmationService.confirm('', 'Are you sure you want to delete the attachment?', 'Delete', 'Cancel').then(confirmed => {
      if (confirmed) {
        this.removeEvent.emit(this.attachment);
      }
    });
  }
  public attachmentPathByExtension(): AttachmentByExtension {
    return this.formHelperService.attachmentPathByExtension(this.attachment);
  }


}
