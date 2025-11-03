import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss']
})
export class PreviewComponent implements OnInit {
  @Input() previewMode = "email";
  @Input() previewContent:string;
  @Output() previewClicked= new EventEmitter();

  htmlemail = '<!doctype html><html> <head></head> <body style="padding-left: 0; padding-right: 0; padding-bottom: 0; padding-top: 0; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; background-color: #ffffff;"> <table width="100%" cellpadding="0" cellspacing="0" style="width:100%;"> <tr> <td align="center"> <table width="719" style="width:719px;" cellpadding="0" cellspacing="0"> <tr> <td align="center"> <table width="651" style="width: 651px;" cellpadding="0" cellspacing="0"> <tr> <td height="117" style="height: 117px;"> <img src="./assets/images/treva.png" alt="" width="118" height="33"> </td></tr><tr> <td height="21" style="height: 21px;"></td></tr><tr> <td style="font-size: 19px; color: #3A4550; font-weight: bold; font-family: Arial, Helvetica, sans-serif; height: auto;"> Hello{{Recipient_Display_Name}}</td></tr><tr> <td height="24" style="height: 24px;"></td></tr><tr> <td style="font-size: 13px; line-height: 24px; color: #3A4550; font-weight: normal; font-family: Arial, Helvetica, sans-serif; height: auto;"> A Job has been created by{{First_Name}}{{Last_Name}}with job_id -{{Job_Id}}. Sincerely, American Family Insurance </td></tr><tr> <td height="24" style="height: 24px;"></td></tr><tr> <td style="font-size: 13px; line-height: 24px; color: #3A4550; font-weight: normal; font-family: Arial, Helvetica, sans-serif; height: auto;"> Sincerely, <br>American Family Insurance </td></tr><tr> <td height="90" style="height: 90px;"></td></tr></table> </td></tr><tr> <td align="center" style="background-color: #484A69;"> <table width="651" style="width: 651px;" cellpadding="0" cellspacing="0"> <tr> <td height="34" style="height: 34px;"></td></tr><tr> <td style="color: #B8BED6; font-size: 12px; line-height: 21px; font-family: Arial, Helvetica, sans-serif; height: auto;"> American Family Mutual Insurance Company, S.I. | American Family Insurance Company | American Family Life Insurance Company | American Standard Insurance Company of Ohio | American Standard Insurance Company of Wisconsin | Midvale Indemnity Company | Home Office - 6000 American Parkway Madison, WI 53783 </td></tr><tr> <td height="34" style="height: 34px;"></td></tr><tr> <td style="color: #B8BED6; font-size: 12px; line-height: 21px; font-family: Arial, Helvetica, sans-serif; height: auto;"> Permanent General Assurance Corporation of Ohio | The General Automobile Insurance Company, Inc. DBA The General® Home Office - 2636 Elm Hill Pike Nashville, TN 37214 wholly owned subsidiaries of American Family Mutual Insurance Company, S.I. </td></tr><tr> <td height="34" style="height: 34px;"></td></tr><tr> <td style="color: #B8BED6; font-size: 12px; line-height: 21px; font-family: Arial, Helvetica, sans-serif; height: auto;"> *If you are not the intended recipient, please contact the sender and delete this e-mail, any attachments and all copies.. </td></tr><tr> <td height="34" style="height: 34px;"></td></tr></table> </td></tr></table> </td></tr></table> </body></html>';

  htmlsms = '<p style="line-height: 32px; font-size: 19px; color: #0F2E4E;">A Job has been created by<br> {{First_Name}} {{Last_Name}} <br>with job_id - {{Job_Id}}.</p>';

  htmlnotification = '<table width="100%" cellpadding="0" cellspacing="0" style="width:100%;"><tr><td style="padding: 0; height: auto;"><table width="100%" cellpadding="0" cellspacing="0" style="width:100%;"><tr><td style="padding: 0; height: auto;"><img src="./assets/images/treva.png" alt="" width="118" height="33"></td><td style="padding: 0; height: auto; text-align: right; color: #A1A1C4; font-size: 12px; font-family:Arial, Helvetica, sans-serif; ">Now</td></tr></table></td></tr><tr><td style="height: 10px; padding: 0;"></td></tr><tr><td style="height: auto; padding: 0; color: #0F2E4E; font-size: 19px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">New job posting</td></tr><tr><td style="height: 10px; padding: 0;"></td></tr><tr><td style="height: auto; padding: 0; color: #0F2E4E; font-size: 19px; font-weight: normal; font-family: Arial, Helvetica, sans-serif; line-height: 32px;">A new job has been create by Muhammad Shanu with the job id 123</td></tr></table>';
  constructor() { }

  ngOnInit(): void {
  }

  openEditor(type: string) {
  //  this.router.navigate([], { queryParams: { ...(this.activatedRoute?.snapshot?.queryParams || {}), editorType: type } });
  }

  contentClicked(){
    this.previewClicked.emit({type: ''})
  }
}
