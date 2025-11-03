import { Component, Input, Output, OnInit, EventEmitter, Renderer2 } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { HttpService } from 'src/app/core/services/http.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';

enum Times {
  START_TIME = 'startTime',
  END_TIME = 'endTime',
}
@Component({
  selector: 'app-date-time-picker',
  templateUrl: './date-time-picker.component.html',
  styleUrls: ['./date-time-picker.component.scss'],
})
export class DateTimePickerComponent implements OnInit {
  today = new Date();
  form: UntypedFormGroup;
  options: any = {
    language: 'English',
    format12h: true,
    alwaysVisible: true,
    enabledDateRanges: [{ start: this.today.setDate(this.today.getDate() - 1) }],
  };

  @Input() modalShow: boolean = false;
  @Input() interviewerList: any;
  @Input() timezoneId: any;
  @Input() editDateTime: any;
  @Input() editSlotValue: any;
  @Input() editDuration: any;
  @Input() interviewerListDetails: any;

  @Output() onClose = new EventEmitter();
  @Output() onSave = new EventEmitter();

  submissionManager;
  jobId: any;
  programDetails: any;
  prefferedDateFormate: any;
  startTimeArray: any = [];
  endTimeArray: any = [];
  firstSelectTime: any;
  secondSelectTime: any;
  duration: any = 0;
  bookedMembersDetails: any;
  startTimePicker: boolean = false;
  endTimePicker: boolean = false;
  timeValidation = /^(1[0-2]|0?[1-9]):([0-5]?[0-9]) ?([AP]M)?$/;
  startTimeError: boolean;
  endTimeError: boolean;

  constructor(
    private _render: Renderer2,
    private fb: UntypedFormBuilder,
    private httpService: HttpService,
    private storageService: StorageService,
    private route: ActivatedRoute,
    private datePipe: LocalDateFormatPipe,
    private alert: AlertService,
  ) {}

  ngOnInit(): void {
    this.setInit();
  }

  ngOnChanges() {
    this.setInit();
    this.updateScrollBar();
    if (this.interviewerList?.length && typeof this.interviewerList[0] === 'string') {
      this.interviewerList = this.interviewerListDetails?.length
        ? this.interviewerListDetails?.filter(i => i?.member_type !== 'ADDITIONAL_ATTENDEES')
        : [];
    }
    this.editSlotValue ? this.createForm(this.editDateTime) : this.createForm();
  }

  setInit() {
    this.submissionManager = '/submission-manager';
    this.programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.prefferedDateFormate = this.programDetails?.defaultDateFormat ?? 'mm/dd/yyyy';
    this.route?.parent?.parent.params.subscribe(params => {
      this.jobId = params['id'];
    });
  }

  populate(timeValue, timeText?, isCurrentDate?, timeFromInput?) {
    let timeArray: any = [];
    let timezoneHours;
    let hours, minutes, ampm;
    let timezoneMinutes = timeValue % 60;
    if (!timeFromInput) {
      if (isCurrentDate) {
        timezoneHours = 0;
      } else {
        timezoneHours =
          timezoneMinutes >= 30 ? ((timeValue - timezoneMinutes) / 60 + 1) * 60 : ((timeValue - timezoneMinutes) / 60 + 0.5) * 60;
      }
    } else {
      timezoneHours = timeValue + 30;
    }

    const setLastTime = timeText === Times.START_TIME ? 1410 : 1440;
    for (let i = timezoneHours; i <= setLastTime; i += 30) {
      hours = Math.floor(i / 60);
      minutes = i % 60;
      if (minutes < 10) {
        minutes = '0' + minutes; // adding leading zero
      }
      ampm = hours % 24 < 12 ? 'AM' : 'PM';
      hours = hours % 12;
      if (hours === 0) {
        hours = 12;
      }
      timeArray.push({ value: i, label: hours + ':' + minutes + ' ' + ampm });
    }
    return timeArray;
  }

  onSelect(time: any, timeText, onEdit?): void {
    this.hideTimePicker();
    let timeFromInput = false;
    if (time === null || time === undefined) {
      if (timeText === Times.START_TIME) {
        this.form.controls['startTime'].setValue(null);
        this.form.controls['endTime'].setValue(null);
      } else if (timeText === Times.END_TIME) {
        this.form.controls['endTime'].setValue(null);
      }
      this.duration = 0;
      return;
    }
    if (time?.target?.value) {
      time = { label: time.target.value.toUpperCase().trim().replace('AM', ' AM').replace('PM', ' PM').replace('  ', ' ') };
    }
    if (!this.timeValidation.test(time?.label)) {
      this.startTimeError = this.startTimeError || timeText === Times.START_TIME;
      this.endTimeError = this.endTimeError || timeText === Times.END_TIME;
      return;
    } else {
      this.startTimeError = this.endTimeError = false;
    }
    if (time?.value === 0 || (time?.label && (time?.value === null || time?.value === undefined))) {
      time.value = this.parseFromAmPmToTwentyFour(time?.label);
      timeFromInput = true;
    }
    let timeValue = time.value;
    if (timeText === Times.START_TIME) {
      this.form.patchValue({ startTime: time.label });
      this.endTimeArray = this.populate(timeValue, Times.END_TIME, null, timeFromInput);
      this.firstSelectTime = this.secondSelectTime = timeValue;
      this.form.controls['endTime'].setValue(null);
    } else if (timeText === Times.END_TIME) {
      this.form.patchValue({ endTime: time.label });
      this.secondSelectTime = timeValue;
    }
    if (
      this.firstSelectTime !== undefined &&
      this.firstSelectTime !== null &&
      this.secondSelectTime !== undefined &&
      this.secondSelectTime !== null
    ) {
      this.checkBookedSlot(this.firstSelectTime, this.secondSelectTime);
    }
    if (onEdit) this.onSelect(onEdit.endTime, 'endTime');
  }

  calculateDuration(startTime: any, endTime: any) {
    if (endTime >= startTime) {
      this.duration = endTime - startTime;
      if (this.duration > 60) {
        let hours = Math.trunc(this.duration / 60);
        let minute = this.duration % 60;
        this.duration = `${hours} h ${minute}`;
      }
    } else {
      this.duration = 0;
      this.form.controls['endTime'].setValue(null);
    }
  }

  checkBookedSlot(startTime, endTime) {
    this.calculateDuration(startTime, endTime);
    let bookSlot: any = this.bookedMembersDetails?.booked_slots;
    this.interviewerList.forEach(member => {
      member.slotAvailability = false;
    });
    bookSlot?.forEach(slot => {
      let slotStartTime = this.parseFromAmPmToTwentyFour(slot.start_time);
      let slotEndTime = this.parseFromAmPmToTwentyFour(slot.end_time);
      if ((startTime >= slotStartTime && startTime < slotEndTime) || 
      (endTime > slotStartTime && endTime <= slotEndTime) ||
      (startTime <= slotStartTime && endTime >= slotEndTime)) {
        slot.members.forEach(member => {
          const isExist = this.interviewerList?.findIndex(entity => entity.id === member.id);
          if (isExist !== -1) {
            this.interviewerList[isExist].slotAvailability = true;
          }
        });
      } else {
      }
    });
  }

  calculateTimeValue(time: any) {
    let hours = Number(time.split(' ')[0].slice(0, 2));
    let minutes = Number(time.split(' ')[0].slice(3, 5));
    return hours * 60 + minutes;
  }

  parseFromAmPmToTwentyFour(time: string): any {
    let hours = Number(time.match(/^(\d+)/)?.[1]);
    let minutes = Number(time.match(/:(\d+)/)?.[1]);
    const AMPM = time.match(/\s(.*)$/)?.[1];
    if ((AMPM == 'PM' || AMPM == 'pm') && hours < 12) hours = hours + 12;
    if ((AMPM == 'AM' || AMPM == 'am') && hours == 12) hours = hours - 12;
    let sHours = hours.toString();
    let sMinutes = minutes.toString();
    if (hours < 10) sHours = '0' + sHours;
    if (minutes < 10) sMinutes = '0' + sMinutes;
    return this.calculateTimeValue(`${sHours}:${sMinutes}`);
  }

  createForm(formDetails?) {
    if (formDetails) {
      let formateForm: any = {
        startTime: {},
        endTime: {},
      };
      formateForm['startTime'].label = formDetails.startTime;
      formateForm['endTime'].label = formDetails.endTime;
      this.duration = formDetails.duration;
      this.form = this.fb.group({
        // date: [formDetails.date, Validators.required],
        date: [this.datePipe.transform(formDetails.date, DATE_FORMAT.FORMATMDY, '', '', true), Validators.required],
        startTime: [formateForm.startTime.label, [Validators.required, Validators.pattern(this.timeValidation)]],
        endTime: [formateForm.endTime.label, [Validators.required, Validators.pattern(this.timeValidation)]],
        i: [formDetails.i],
        j: [formDetails.j],
      });
      this.onDateChange(new Date(this.datePipe.transform(formDetails.date,  DATE_FORMAT.FORMATMDY, '', '', true)), formateForm);
    } else {
      this.form = this.fb.group({
        date: [null, Validators.required],
        startTime: [null, [Validators.required, Validators.pattern(this.timeValidation)]],
        endTime: [null, [Validators.required, Validators.pattern(this.timeValidation)]],
      });
    }
  }

  save() {
    this.form.value.duration = this.duration;
    this.onSave.emit(this.form.value);
    this.duration = 0;
    this.hideDateTimeModal();
  }

  getMembersDetails(date) {
    date = this.datePipe.transform(date, DATE_FORMAT.FORMATMDY, null, null, true);
    let memberIds = [];
    let memberIdsString;
    this.interviewerList.forEach(interviewer => {
      memberIds.push(interviewer.id);
    });
    memberIdsString = memberIds.toString();
    return this.httpService.get(
      `${this.submissionManager}/programs/${this.programDetails.id}/jobs/${this.jobId}/interviews/booked-schedules?member_ids=${memberIdsString}&scheduled_on=${date}&timezone_id=${this.timezoneId}`,
    );
  }

  onDateChange(date, onEdit?) {
    const dateFormatted = this.datePipe.transform(date, DATE_FORMAT.FORMATMDY, null, null, true);
    this.getMembersDetails(dateFormatted).subscribe({
      next: (res: any) => {
        this.bookedMembersDetails = res;
        this.form.controls['startTime'].setValue(null);
        this.form.controls['endTime'].setValue(null);
        this.duration = 0;
        this.startTimeArray = this.endTimeArray = [];
        const hours = Number(this.bookedMembersDetails?.current_time?.split('T')[1].slice(0, 2));
        const minutes = Number(this.bookedMembersDetails?.current_time?.split('T')[1].slice(3, 5));
        const timeZoneDate = this.datePipe.transform(
          this.bookedMembersDetails?.current_time?.split('T')[0],
          'MM/dd/yyyy',
          null,
          null,
          true,
        );
        let isCurrentDate = new Date(this.datePipe.transform(date, 'MM/dd/yyyy', null, null, true)) > new Date(timeZoneDate);
        this.startTimeArray = this.populate(hours * 60 + minutes, Times.START_TIME, isCurrentDate);
        if (onEdit) {
          this.onSelect(onEdit.startTime, 'startTime', onEdit);
        }
      },
      error: err => {
        this.alert.error('Failed to load the time for the selected date.\nPlease try selecting again.');
      },
    });
  }

  hideDateTimeModal() {
    this.form.controls['date'].setValue(null);
    this.form.controls['startTime'].setValue(null);
    this.form.controls['endTime'].setValue(null);
    this.modalShow = false;
    this.onClose.emit(false);
  }

  updateScrollBar() {
    if (this.modalShow == true) {
      this._render.addClass(document.body, 'date-time-overflow');
    } else if (this.modalShow == false) {
      this._render.removeClass(document.body, 'date-time-overflow');
    }
  }

  showTimePicker(value) {
    if (value == 'start') {
      this.startTimePicker = true;
    } else if (value == 'end') {
      this.endTimePicker = true;
    }
  }

  hideTimePicker() {
    this.startTimePicker = false;
    this.endTimePicker = false;
  }

  ngOnDestroy() {
    this._render.removeClass(document.body, 'date-time-overflow');
  }
}
