import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, UntypedFormArray, Validators } from '@angular/forms';
import {
  EventStreamService,
  Events
} from 'src/app/core/services/event-stream.service';
import { Subscription } from 'rxjs';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
@Component({
  selector: 'app-edit-availability',
  templateUrl: './edit-availability.component.html',
  styleUrls: ['./edit-availability.component.scss']
})
export class EditAvailabilityComponent implements OnInit, OnDestroy {
  private subscrptions: Subscription[] = [];
  editAvailability = "hidden";
  preferredAvailability: UntypedFormGroup;
  @Output() availabiltiyData: EventEmitter<any> = new EventEmitter<any>();
  closePanel: EventEmitter<boolean> = new EventEmitter();
  sidebar_title="Set Candidate Availability";
  public toggle = {
    sun: {
      title: 'active',
      value: true
    },
    mon: {
      title: 'active',
      value: true
    },
    tue: {
      title: 'active',
      value: true
    },
    wed: {
      title: 'active',
      value: true
    },
    thu: {
      title: 'active',
      value: true
    },
    fri: {
      title: 'active',
      value: true
    },
    sat: {
      title: 'active',
      value: true
    }
  };
  sunTime = [1];
  monTime = [1];
  tueTime = [1];
  wedTime = [1];
  thuTime = [1];
  friTime = [1];
  satTime = [1];
  showTime: string = '';
  seachval: any;
  availability_slots = [];
  days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  short_days = { Sunday: 'sun', Monday: 'mon', Tuesday: 'tue', Wednesday: 'wed', Thursday: 'thu', Friday: 'fri', Saturday: 'sat' };
  timeDifference: any = undefined;
  logs:Log = undefined;
  constructor(
    private eventStream: EventStreamService,
    private fb: UntypedFormBuilder,
  ) { }

  ngOnInit(): void {
    this.subscrptions.push(this.eventStream.on(Events.EDIT_AVAILABILITY).subscribe((data) => {
      if (data) {
        this.editAvailability = "visible";

        if (data.obj != null && data.obj.length > 0) {
          this.updatePanel(data.obj);
        } else {
          this.toggle.sun.value = false;
          this.toggle.sat.value = false;
          this.preferredAvailability.controls['sun']['controls'][0].disable();
          this.preferredAvailability.controls['sat']['controls'][0].disable();
          this.preferredAvailability.controls['sun']['controls'][0].setValidators('');
          this.preferredAvailability.controls['sat']['controls'][0].setValidators('');

        }
      }
      else {
        this.editAvailability = "hidden"
      }
    }));
    this.preferredAvailability = this.fb.group({
      'sun': this.fb.array([]),
      'mon': this.fb.array([]),
      'tue': this.fb.array([]),
      'wed': this.fb.array([]),
      'thu': this.fb.array([]),
      'fri': this.fb.array([]),
      'sat': this.fb.array([]),
    })
    this.onAddTime('sun')
    this.onAddTime('mon')
    this.onAddTime('tue')
    this.onAddTime('wed')
    this.onAddTime('thu')
    this.onAddTime('fri')
    this.onAddTime('sat')
  }


  updatePanel(data) {
    this.sidebar_title="Edit Candidate Availability";
    if (data.length > 0) {
      
      // this.toggle.sun.value = false;
      // this.toggle.sat.value = false;
      // this.preferredAvailability.controls['sun']['controls'][0].disable();
      // this.preferredAvailability.controls['sat']['controls'][0].disable();
      // this.preferredAvailability.controls['sun']['controls'][0].setValidators('');
      // this.preferredAvailability.controls['sat']['controls'][0].setValidators('');
     
      data.forEach((element, index) => {
        let preferredAvailability = this.preferredAvailability.controls[this.short_days[element.week_day]]['controls'];
        // if ((element.schedules && element.schedules.length > 0 && this.short_days[element.week_day] == 'sun') || (element.schedules && element.schedules.length > 0 && this.short_days[element.week_day] == 'sat')) {
        //   this.toggle.sun.value = true;
        //   this.toggle.sat.value = true;
        //   this.preferredAvailability.controls['sun']['controls'][0].enable();
        //   this.preferredAvailability.controls['sat']['controls'][0].enable();
        //   this.preferredAvailability.controls['sun']['controls'][0].setValidators(Validators.required);
        //   this.preferredAvailability.controls['sat']['controls'][0].setValidators(Validators.required);
        // }else 
        if(!element.schedules || element.schedules.length == 0){

          this.toggle[this.short_days[element.week_day]].value = false;
          this.preferredAvailability.controls[this.short_days[element.week_day]]['controls'][0].disable();
          this.preferredAvailability.controls[this.short_days[element.week_day]]['controls'][0].disable();
        }

        element.schedules.forEach((ele, inx) => {

          if (inx > 0) {
            this.onRemoveTime(this.short_days[element.week_day], inx)
            if (ele.start_time && ele.end_time) {
              this.onAddTime(this.short_days[element.week_day], false)
            }

          }
          preferredAvailability[inx].setValue({ time: { from: ele.start_time, to: ele.end_time } });
        });
      });
    }
  }

  sidebarClose() {
    this.logs=undefined;
    this.editAvailability = "hidden"
  }
  onAddTime(day: string, first = true, disabled = false) {
    if (disabled) {
      return;
    }
    if (!first) {
      switch (day) {
        case 'sun':
          this.sunTime.push(1)
          break;
        case 'mon':
          this.monTime.push(1);
          break;
        case 'tue':
          this.tueTime.push(1);
          break;
        case 'wed':
          this.wedTime.push(1);
          break;
        case 'thu':
          this.thuTime.push(1);
          break;
        case 'fri':
          this.friTime.push(1);
          break;
        case 'sat':
          this.satTime.push(1);
          break;
      }
    }

    (<UntypedFormArray>this.preferredAvailability.get(day)).push(
      this.fb.group({
        time: this.fb.group({
          from: [null, [Validators.required]],
          to: [null, [Validators.required]]
        })
      })
    )
  }

  onClickToggle(day: string) {
    let toggleValue = null
    switch (day) {
      case 'sun':
        this.toggle.sun.value = !this.toggle.sun.value
        toggleValue = this.toggle.sun.value
        break;
      case 'mon':
        this.toggle.mon.value = !this.toggle.mon.value
        toggleValue = this.toggle.mon.value
        break;
      case 'tue':
        this.toggle.tue.value = !this.toggle.tue.value
        toggleValue = this.toggle.tue.value
        break;
      case 'wed':
        this.toggle.wed.value = !this.toggle.wed.value
        toggleValue = this.toggle.wed.value
        break;
      case 'thu':
        this.toggle.thu.value = !this.toggle.thu.value
        toggleValue = this.toggle.thu.value
        break;
      case 'fri':
        this.toggle.fri.value = !this.toggle.fri.value
        toggleValue = this.toggle.fri.value
        break;
      case 'sat':
        this.toggle.sat.value = !this.toggle.sat.value
        toggleValue = this.toggle.sat.value
        break;
    }
    if (toggleValue) {
      let preferredAvailability = this.preferredAvailability.controls[day]['controls'];
      preferredAvailability[0].enable();
      preferredAvailability[0].setValidators(Validators.required)
      // this.preferredAvailability.get('preferred_availability').get(day).enable()
    } else {

      let preferredAvailability = this.preferredAvailability.controls[day]['controls'];


      preferredAvailability[0].setValue({ time: { from: '', to: '' } });
      preferredAvailability[0].disable();
      preferredAvailability[0].setValidators('')

      preferredAvailability.forEach((element, index) => {


        if (index > 0) {
          this.onRemoveTime(day, index)
        }
      });




      // this.preferredAvailability.get('preferred_availability').get(day).disable()
    }
  }

  onRemoveTime(day: string, index: number, disabled = false) {
    if (disabled) {
      return;
    }
    (<UntypedFormArray>this.preferredAvailability.get(day)).removeAt(index);
    switch (day) {
      case 'sun':
        this.sunTime.splice(index, 1);
        break;
      case 'mon':
        this.monTime.splice(index, 1);
        break;
      case 'tue':
        this.tueTime.splice(index, 1);
        break;
      case 'wed':
        this.wedTime.splice(index, 1);
        break;
      case 'thu':
        this.thuTime.splice(index, 1);
        break;
      case 'fri':
        this.friTime.splice(index, 1);
        break;
      case 'sat':
        this.satTime.splice(index, 1);
        break;
    }
  }
  saveAvailability() {
    this.logs=undefined;
    let data = this.preferredAvailability.value;
    this.availability_slots = [];
    if (this.preferredAvailability.valid || this.preferredAvailability.disabled) {

      for (const [key, value] of Object.entries(this.short_days)) {
        let schedules = [];
        if (data[value] && data[value] != '') {
          data[value].forEach((val) => {
            if (val['time'].from && val['time'].from != '' && val['time'].to && val['time'].to != '') {
              schedules.push({
                "start_time": val['time'].from,
                "end_time": val['time'].to
              });
            }
          });
        }
        //if(schedules.length){
        this.availability_slots.push({ 'week_day': key, 'schedules': schedules });

        //}
      }
      this.sidebarClose();
      this.availabiltiyData.emit(this.availability_slots);
    } else {
      // this.alert.error('Please fill the enable week(s) day value.');
      this.showError('Please fill the enable week(s) day value.');

    }
  }

  checkTimePattern(event) {
    if (event) {
      let allowedkeys = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 32, 65, 77, 80, 97, 109, 112];
      if (allowedkeys.includes(event.charCode)) {

      } else {
        event.preventDefault();
        return false;
      }
    }

  }
  formatTime(str) {
    let numberArray = str?.split(":");
    if (numberArray?.length > 1) {
      const hours = parseInt(numberArray[0]);
      const value = hours < 10 ? "0" + hours + ":" + numberArray[1] : str;
      return (!value?.includes("undefined")) ? value : str;
    } else {
      return str;
    }
  }

  setShowTimeValue(value) {
    this.showTime = value;
  }
  checkTimeFormat(day, element, index) {
    if (element == 'to') {
      let to = this.preferredAvailability.controls[day]['controls'][index]['controls']['time']['controls']['to'];

      to.setValue(to?.value?.toUpperCase());
      if (to?.value?.slice(to?.value?.length - 3) !== ' AM' && to?.value.slice(to?.value?.length - 3) !== ' PM') {
        to.setValue(to?.value?.trim().replace(/.{2}$/, ' $&'));
      }
      if (to?.value) {
        to.setValue(this.formatTime(to.value));
      }
      this.validationChecks(day, element, index);
    } else if (element == 'from') {

      let from = this.preferredAvailability.controls[day]['controls'][index]['controls']['time']['controls']['from'];


      from.setValue(from?.value?.toUpperCase());
      if (from?.value?.slice(from?.value?.length - 3) !== ' AM' && from?.value.slice(from?.value?.length - 3) !== ' PM') {
        from.setValue(from?.value?.trim().replace(/.{2}$/, ' $&'));
      }
      if (from?.value) {
        from.setValue(this.formatTime(from.value));
      }

      this.validationChecks(day, element, index);
    }

  }

  validationChecks(day, element, index) {
      this.logs=undefined;
    let from = this.preferredAvailability.controls[day]['controls'][index]['controls']['time']['controls']['from'];
    let to = this.preferredAvailability.controls[day]['controls'][index]['controls']['time']['controls']['to'];


    if (from?.value && !from?.errors?.pattern &&
      to?.value && !to?.errors?.pattern) {
      this.timeDifference = this.calculateTimeDifference(from?.value, to?.value);
      if (from.value == to.value) {
        // this.alert.error("Time In cannot be same as Time Out");
        this.showError("Time In cannot be same as Time Out");
        this.preferredAvailability.controls[day]['controls'][index]['controls']['time']['controls']['from'].patchValue('')
        this.preferredAvailability.controls[day]['controls'][index]['controls']['time']['controls']['to'].patchValue('')
      } else if (this.timeDifference.hours < 0 || this.timeDifference.minutes < 0) {
        // this.alert.error("Time In cannot be greater than Time Out");
        this.showError("Time In cannot be greater than Time Out");
        this.preferredAvailability.controls[day]['controls'][index]['controls']['time']['controls']['from'].patchValue('')
        this.preferredAvailability.controls[day]['controls'][index]['controls']['time']['controls']['to'].patchValue('')
      }
    }

    if (index > 0) {
      let selectedTime: any;

      if (element == 'to') {
        selectedTime = to.value;
      } else {
        selectedTime = from.value;
      }



      for (let i = 0; i < this.preferredAvailability.controls[day]['controls'].length - 1; i++) {
        let startTime = this.preferredAvailability.controls[day]['controls'][i]['controls']['time']['controls']['from'].value;
        let endTime = this.preferredAvailability.controls[day]['controls'][i]['controls']['time']['controls']['to'].value;
        let selectedTimeSeconds = new Date("2017-01-26 " + selectedTime).getTime();
        let startTimeSeconds = new Date("2017-01-26 " + startTime).getTime();
        let endTimeSeconds = new Date("2017-01-26 " + endTime).getTime();

        if (selectedTimeSeconds >= startTimeSeconds && selectedTimeSeconds <= endTimeSeconds) {
          // this.alert.error("Selected time already  assigned previous slot(s)");
          this.showError("Selected time already  assigned previous slot(s)");
          this.preferredAvailability.controls[day]['controls'][index]['controls']['time']['controls']['from'].patchValue('')
          this.preferredAvailability.controls[day]['controls'][index]['controls']['time']['controls']['to'].patchValue('')

        }
      }
    }
  }
  isEmptyObject(value) {
    return Object.keys(value).length === 0 && value.constructor === Object;
  }
  calculateTimeDifference(f, s) {
    const currentDate = new Date();
    const date = (currentDate.getMonth() + 1) + "/" + currentDate.getDate() + "/" + currentDate.getFullYear() + " ";
    let _first = this.hasWhiteSpace(f) ? f : f.replace(/am/ig, ' am').replace(/pm/ig, ' pm');
    let _second = this.hasWhiteSpace(s) ? s : s.replace(/am/ig, ' am').replace(/pm/ig, ' pm');
    let timeStart: any = new Date(date + _first);
    let timeEnd: any = new Date(date + _second);
    let diff = (timeEnd - timeStart) / 60000;
    let minutes = diff % 60;
    let hours = (diff - minutes) / 60;
    return { hours, minutes };
    /* let fs;
    let ss;
    if (minutes < 10) { ss = '0'.concat(JSON.stringify(minutes)) } else { ss = minutes }
    if (hours < 10) { fs = '0'.concat(JSON.stringify(hours)) } else { fs = hours }
    return fs + ':' + ss + ' H'; */
  }

  hasWhiteSpace(s) {
    return s.indexOf(' ') >= 0;
  }


  setSelectedTime(data, day, i, fromOrTo) {

    // this.preferredAvailability.controls[day].value[i]
    const actualValue = this.preferredAvailability.controls[day].value;
    const value = this.preferredAvailability.controls[day].value[i];
    value.time[fromOrTo] = data;
    actualValue[i] = value;
    this.preferredAvailability.controls[day].setValue(actualValue);
    let formControlName = this.preferredAvailability.controls[day]['controls'][i]['controls']['time']['controls'][fromOrTo];

    if (data && formControlName) {
      formControlName.setValue(data);
    }

    if (fromOrTo == 'to' || fromOrTo == 'from') {
      this.validationChecks(day, fromOrTo, i);
    }
    this.showTime = '';


  }
  ngOnDestroy(): void {
    this.subscrptions?.forEach(sub => sub.unsubscribe());
  }

  showError(err){
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : (typeof err == 'string' ? err : ''), messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo:{trace_id: err?.error?.trace_id } 
    };
      err?.error?.error?.errors?.forEach(msg => {      
        if (msg?.message) {      
          this.logs.messages.push(msg?.message);
        }
      });
  }

}
