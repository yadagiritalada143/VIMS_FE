import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { LoaderService } from 'src/app/core/components/loader/loader.service';

@Component({
  selector: 'app-push-notification-template',
  templateUrl: './push-notification-template.component.html',
  styleUrls: ['./push-notification-template.component.scss']
})
export class PushNotificationTemplateComponent implements OnInit {
  @Input() pushNotificationFields:any;
  @Output() templateSaveClicked = new EventEmitter();


  constructor(private loader: LoaderService) { }

  ngOnInit(): void {
  }
  savePushTemplate(){
    const data = {
      notifactionDetails: {
        title : this.pushNotificationFields.title,
        details : this.pushNotificationFields.details,
        body : this.pushNotificationFields.body,
        recipients: this.pushNotificationFields.recipients
      },
      check: true
    }
    this.templateSaveClicked.emit(data);
    this.loader.show();
  }
}
