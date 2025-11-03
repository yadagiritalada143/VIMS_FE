import { Injectable } from '@angular/core';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { TimesheetService } from '../../timesheet.service';
import { TimesheetStatus, TimesheetWorkType, TimesheetWorkTypeAbbreviation, TimesheetWeeklyType, AccountCodeStatus, TimesheetConstants, HoursInputType } from '../../timesheet.enums';
import { getDateFromString, getFilteredObjectFromArray,getStartDayOfCalendar } from '../../timesheet.utils';

@Injectable({
  providedIn: 'root'
})
export class HourlyTimeSheetService {

  private currentProgram: any = {};
  // Contains day, Date & dayNumber in it
  public weekDays = [];
  public custom = [];
  constructor(private storageService: StorageService, private timesheetService: TimesheetService) {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
  }


  getNoOfDaysBetweenTwoDates(date1, date2) {
    if (date1 && date2) {
      const diffDays = Math.ceil(Math.abs(date2 - date1) / (1000 * 60 * 60 * 24));
      return diffDays + 1;
    }
    return -1;
  }

  getDatesBetweenTwoDates(strDate, stpDate, weekEnds, work_week_start_day, config) {
    this.weekDays = new Array();
    let copiedStartDate = new Date(strDate);
    let copiedEndDate = new Date(stpDate);
    let cDate = strDate;
    if (this.getNoOfDaysBetweenTwoDates(strDate, stpDate) < 7) {
      const dayOfStartDate = this.getDayOfDate(cDate);
      const workWeekStartDay = work_week_start_day?.charAt(0).toUpperCase() + work_week_start_day?.substr(1, 2);
      const noOfDays = 7 - this.getNoOfDaysBetweenTwoDates(strDate, stpDate);
      const dayNumber = getStartDayOfCalendar(work_week_start_day)
      if (dayOfStartDate !== workWeekStartDay) {
        if (new Date(cDate).getDay() != dayNumber) {
          do {
            cDate = this.addDays(cDate, -1);
          } while (new Date(cDate).getDay() != dayNumber);
        }
        stpDate = this.addDays(cDate, 6);
      } else {
        stpDate = this.addDays(stpDate, (+noOfDays));
      }
    }
    while (cDate <= stpDate) {
      const date = new Date(cDate);
      const day = this.getDayOfDate(cDate);
      let active = true;
      let isWeekend = false;
      let isDayAvailable = true;
      if(date < copiedStartDate || date > copiedEndDate) {
        isDayAvailable = false;
      }
      if (date < copiedStartDate || date > copiedEndDate || (!config?.weekend?.is_allow_entry && weekEnds.includes(day))) {
        active = false;
      }
      if (weekEnds.includes(day)) {
        isWeekend = true;
      }
      this.weekDays.push({ date: date, day: day, dayNumber: date.getDate(), active: active, isWeekend: isWeekend, isDayAvailable: isDayAvailable });
      cDate = this.addDays(cDate, 1);
    }
    return this.weekDays;
  }

  addDays(date, days) {
    let result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  getDayOfDate(dateInput) {
    let date:any= new Date(dateInput); //this can cause issue
    if(dateInput instanceof Date){
      date= dateInput;
    } else if (typeof (dateInput) === "string") {
       date = dateInput?.split("-");
      if (date?.length === 3) {
        date = new Date(parseInt(date[0]), parseInt(date[1]) - 1, parseInt(date[2]), 0, 0, 0, 0);// new Date( this.currentTimesheetData?.start_date); //fixed for safari
      }
    }
    let weekday = new Array(7);
    weekday[0] = "Sun";
    weekday[1] = "Mon";
    weekday[2] = "Tue";
    weekday[3] = "Wed";
    weekday[4] = "Thu";
    weekday[5] = "Fri";
    weekday[6] = "Sat";
    return weekday[date?.getDay()];
  }

  addZeroes(num, noOfDecimals, config) {

    let value = Number(num);
    let convertedValue = '';

    if (value || value === 0) {
      if (config && config.hours_input_type?.type === HoursInputType.DECIMAL) {
        return value.toFixed(noOfDecimals);
      }
      convertedValue = value.toFixed(noOfDecimals);
    } else {
      return num;
    }
    return convertedValue.replace('.', ':');
  }

  public populateTimes(formData, project, dateLevelTimes,config?:any) {
    const day = this.getDayOfDate(dateLevelTimes.date);
    for (let i = 0; i < dateLevelTimes.hours?.length; i++) {
      const hour = dateLevelTimes.hours[i];
      let key;
      if (hour.hours_type === TimesheetWorkType.REGULAR) {
        key = TimesheetConstants.PROJECT_APPENDER+TimesheetWorkTypeAbbreviation.REGULAR;
      } else if (hour.hours_type === TimesheetWorkType.OVERTIME) {
        key = TimesheetConstants.PROJECT_APPENDER+TimesheetWorkTypeAbbreviation.OVERTIME;
      } else if (hour.hours_type === TimesheetWorkType.DOUBLETIME) {
        key = TimesheetConstants.PROJECT_APPENDER+TimesheetWorkTypeAbbreviation.DOUBLETIME;
      } else if (hour?.hours_type) {
        key = '';
      }
      for (let j = 0; j < formData.rowData.length; j++) {
        let title;
        const show_account_code = this.timesheetService.showOnlyCodes();
        if (show_account_code) {
          title = project?.project_code || project?.project_title;
        } else {
          if (project?.project_code) {
            // title = project?.project_title + '(' + project?.project_code + ')';
              title = project?.project_type === 'project-x' ?  project?.project_title : project?.project_title + '(' + project?.project_code + ')'
          } else {
            title = project?.project_title;
          }
        }
        if (formData?.rowData[j]?.projectCode === title + key) {
          const row = formData?.rowData[j];
          row[day] = hour?.value;
        }
        //only for No Project base hourly manual timesheet
        if (formData?.rowData[i] && config?.project?.is_allow === false && config?.hour_type_calculation?.toLowerCase() == TimesheetWeeklyType.MANUAL) {
          const row = formData?.rowData[i];
          row[day] = hour?.value;
          if(project?.data[0]?.hours[i]?.hours_type){
            row.projectCode = this.getHoursType(project?.data[0]?.hours[i]?.hours_type);
            }
        }
      }
    }
  }

  public populateAutomaticTimes(formData, project, dateLevelTimes) {
    const day = this.getDayOfDate(dateLevelTimes.date);
      for (let j = 0; j < formData.rowData.length; j++) {
        if ((formData?.rowData[j]?.project_title === project?.project_title) || (formData?.rowData[j]?.projectCode === project?.project_title) ) {
          const row = formData.rowData[j];
          row[day] = dateLevelTimes.hours;
        }
      }
    
  }

  populateAutomaticHoursData(formData, dateLevelTimes) {
    const day = this.getDayOfDate(dateLevelTimes.date);
    for (let key in dateLevelTimes) {
      if(formData.automatic.total[key] == undefined){
        formData.automatic.total[key]= 0;
      }
      formData.automatic[key] = { ...formData.automatic[key], [day]: dateLevelTimes[key] };
      formData.automatic.total[key] += parseFloat(dateLevelTimes[key]);
    }
  }

  addProjectRows(projects, defaultValue, hourlyType, projectCodes): any {
    const formData = {
      totals: {},
      notes: {},
      rowData: []
    };
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      const filteredProjectCode= getFilteredObjectFromArray(projectCodes, 'title', project.project_title);
      const dayValues = project.data[0];
        let isStEnterd = false;
        let isOtEnterd = false;
        let isDtEnterd = false;
        let isNewValue = false;
        
      if(hourlyType?.toLowerCase() === TimesheetWeeklyType.MANUAL){
        dayValues.hours?.forEach(hour => {
          if (hour.hours_type === TimesheetWorkType.REGULAR) {
            isStEnterd = true;
          } else if (hour.hours_type === TimesheetWorkType.OVERTIME) {
            isOtEnterd = true;
          } else if (hour.hours_type === TimesheetWorkType.DOUBLETIME) {
            isDtEnterd = true;
          } else if (hour?.hours_type) {
            isNewValue = true;
          }
  
        });
      } else{
        isStEnterd= true;
      }
        
        if (isStEnterd) {
          let key= hourlyType?.toLowerCase() === TimesheetWeeklyType.MANUAL ? TimesheetConstants.PROJECT_APPENDER+TimesheetWorkTypeAbbreviation.REGULAR : '';
          const project_code = this.createProjectCode(project) ? (this.createProjectCode(project) + key) : this.createProjectCode(project);
          const projectInfo = {
            originalCode: project?.project_code,
            projectCode: project_code,
            title: project?.project_title,
            code: project_code,
            project_type: project?.project_type || project?.type
          }
          let row1:any = { projectCode:  project_code, total: defaultValue, project_title: project.project_title, project_id: project.project_id, projectInfo: (filteredProjectCode?.[0] || projectInfo) };
          if( filteredProjectCode?.length > 0){
            row1= {...row1, project_title: filteredProjectCode[0]?.title, project_id: filteredProjectCode[0]?.id, project_type: filteredProjectCode[0]?.type};
          }
        
          for (let j = 0; j < this.weekDays.length; j++) {
            row1[this.weekDays[j].day] = defaultValue;
            formData.totals[this.weekDays[j].day] = defaultValue;
            if (project?.data && project?.data[i] && typeof project?.data[i]?.hours == 'object') {
              project?.data.forEach(item => {
                if(item?.hours != undefined && item?.hours != null && typeof item?.hours == 'object'){
                  item?.hours?.forEach(hour => {
                    if (hour?.hours_type === TimesheetWorkType.REGULAR && this.weekDays[j]?.dayNumber == this.timesheetService?.getDayNumber(item)) {
                      row1[this.weekDays[j]?.dayNumber] = hour?.project_note
                    }
                  });
                }                
              });
          }
          // if (project.data && project?.data[j] && typeof project?.data[j]?.hours == 'string' && this.weekDays[j]?.dayNumber == new Date(project?.data[j]?.date).getDate()) {
          //   row1[this.weekDays[j]?.dayNumber] = project?.data[j]?.project_note
          // }

            // Only for Hybrid
            if (hourlyType?.toLowerCase() == TimesheetWeeklyType.HYBRID) {
              project?.data.forEach(item => {
                //  if (this.weekDays[j]?.dayNumber == new Date(item?.date).getDate()) {   \\ Old code
                if (this.weekDays[j]?.dayNumber == this.timesheetService?.getDayNumber(item)) {
                  row1[this.weekDays[j].day] = item?.hours
                }
              })
            }
            // end
          row1[new Date(project?.data[j]?.date).getDate()] = project?.data[j]?.project_note
        }
        formData.rowData.push(row1);
      }
        if (isOtEnterd) {
          const project_code = this.createProjectCode(project) ? (this.createProjectCode(project) + TimesheetConstants.PROJECT_APPENDER+TimesheetWorkTypeAbbreviation.OVERTIME) : this.createProjectCode(project);
          const projectInfo = {
            originalCode: project?.project_code,
            projectCode: project_code,
            title: project?.project_title,
            code: project_code,
            project_type: project?.project_type || project?.type
          }
          let row2:any = { projectCode: project_code, total: defaultValue, project_title: project.project_title, project_id: project.project_id, projectInfo: (filteredProjectCode?.[0] || projectInfo) };
          if( filteredProjectCode?.length > 0){
            row2= {...row2, project_title: filteredProjectCode[0]?.title, project_id: filteredProjectCode[0]?.id, project_type: filteredProjectCode[0]?.type};
          }
          for (let j = 0; j < this.weekDays.length; j++) {
            row2[this.weekDays[j].day] = defaultValue;
            formData.totals[this.weekDays[j].day] = defaultValue;
            if (project.data && project.data[i] && project.data[i].hours.length > 0) {
              project?.data.forEach(item => {
                item?.hours?.forEach(hour => {
                  if (hour?.hours_type === TimesheetWorkType.OVERTIME && this.weekDays[j]?.dayNumber == this.timesheetService?.getDayNumber(item)) {
                    row2[this.weekDays[j]?.dayNumber] = hour?.project_note
                  }
                });
              });
            }
        }
        formData.rowData.push(row2);
      }
        if (isDtEnterd) {
          const project_code = this.createProjectCode(project)? (this.createProjectCode(project) + TimesheetConstants.PROJECT_APPENDER+TimesheetWorkTypeAbbreviation.DOUBLETIME) :this.createProjectCode(project);
          const projectInfo = {
            originalCode: project?.project_code,
            projectCode: project_code,
            title: project?.project_title,
            code: project_code,
            project_type: project?.project_type || project?.type
          }
          let row3:any = { projectCode: project_code, total: defaultValue,project_title: project.project_title, project_id: project.project_id, projectInfo: (filteredProjectCode?.[0] || projectInfo) };
          if( filteredProjectCode?.length > 0){
            row3= {...row3,project_title: filteredProjectCode[0]?.title, project_id: filteredProjectCode[0]?.id, project_type: filteredProjectCode[0]?.type};
          }
          for (let j = 0; j < this.weekDays.length; j++) {
            row3[this.weekDays[j].day] = defaultValue;
            formData.totals[this.weekDays[j]?.day] = defaultValue;
            if (project?.data && project?.data[i] && project?.data[i].hours.length > 0) {
              project?.data?.forEach(item => {
                item?.hours?.forEach(hour => {
                  if (hour?.hours_type === TimesheetWorkType.DOUBLETIME && this.weekDays[j]?.dayNumber == this.timesheetService?.getDayNumber(item)) {
                    row3[this.weekDays[j]?.dayNumber] = hour?.project_note
                  }
                });
              });
            }
          }
          formData.rowData.push(row3);
        }


        // New Rate Type
        if (isNewValue) {
          let hour_type = this.getHoursType(project?.data[0]?.hours[0]?.hours_type);
          const project_code = this.createProjectCode(project) ? (this.createProjectCode(project)) : this.createProjectCode(project);
          const projectInfo = {
            originalCode: project?.project_code,
            projectCode: project_code,
            title: project?.project_title,
            code: project_code,
            project_type: project?.project_type || project?.type
          }
          let row1:any = { projectCode:  project_code, total: defaultValue, project_title: project.project_title, project_id: project.project_id, projectInfo: (filteredProjectCode?.[0] || projectInfo) };
          if( filteredProjectCode?.length > 0){
            row1= {...row1, project_title: filteredProjectCode[0]?.title, project_id: filteredProjectCode[0]?.id, project_type: filteredProjectCode[0]?.type};
          }
        
          for (let j = 0; j < this.weekDays.length; j++) {
            row1[this.weekDays[j].day] = defaultValue;
            formData.totals[this.weekDays[j].day] = defaultValue;
            if (project?.data && project?.data[i] && typeof project?.data[i]?.hours == 'object') {
              project?.data.forEach(item => {
                if(item?.hours != undefined && item?.hours != null && typeof item?.hours == 'object'){
                  item?.hours?.forEach(hour => {
                    // V2M-27158 - changed due to this ticket
                    if (hour?.hours_type === hour_type && this.weekDays[j]?.dayNumber == this.timesheetService?.getDayNumber(item)) {
                      row1[this.weekDays[j]?.dayNumber] = hour?.project_note
                    }
                  });
                }                
              });
          }
            // Only for Hybrid
            if (hourlyType?.toLowerCase() == TimesheetWeeklyType.HYBRID) {
              project?.data.forEach(item => {
                if (this.weekDays[j]?.dayNumber == this.timesheetService?.getDayNumber(item)) {
                  row1[this.weekDays[j].day] = item?.hours
                }
              })
            }
          row1[new Date(project?.data[j]?.date).getDate()] = project?.data[j]?.project_note
        }
        formData.rowData.push(row1);
      }
      // End
    }
    return formData;
  }

  createProjectCode(data) {
    const show_account_code = this.timesheetService.showOnlyCodes();
    if(show_account_code){
      return data?.project_code || data?.code || data?.account_code || data?.project_title;
    } else {
    if (data?.project_code) {
      // return data?.project_title + '(' + data?.project_code + ')';
      return data?.project_type === 'project-x' ?  data?.project_title : data?.project_title + '(' + data?.project_code + ')';
    } else {
      return data?.project_title;
    }
  }
  }
  checkIfAppendarAdded(row, config){
    if(config?.hour_type_calculation?.toLowerCase() === TimesheetWeeklyType?.MANUAL?.toLowerCase() && !config?.project?.is_allow){
      return undefined;
    }
    const rateFactor= row?.projectCode?.substr(row?.projectCode?.lastIndexOf(TimesheetConstants.PROJECT_APPENDER),row?.projectCode?.length);
      if(row?.projectCode?.includes(TimesheetConstants.PROJECT_APPENDER) && (
      rateFactor == TimesheetConstants.PROJECT_APPENDER+TimesheetWorkTypeAbbreviation.REGULAR || 
      rateFactor == TimesheetConstants.PROJECT_APPENDER+TimesheetWorkTypeAbbreviation.OVERTIME || 
      rateFactor == TimesheetConstants.PROJECT_APPENDER+TimesheetWorkTypeAbbreviation.DOUBLETIME)
      //Add if any new Rate factors added
      ){
        const show_account_code = this.timesheetService?.showOnlyCodes();
        if (show_account_code) {
        // Changed due to V2M-27375
          return (row?.projectInfo?.type === 'project-x' ? (row?.projectInfo?.abbreviation || row?.projectInfo?.rate_factor) : row?.projectCode?.substr(0, row?.projectCode?.lastIndexOf(TimesheetConstants.PROJECT_APPENDER)));
        }
        // Changed only for Manual timesheet with project-x
        return row?.projectInfo?.originalCode || (row?.projectInfo?.type === 'project-x' ? row?.projectInfo?.abbreviation : row?.projectInfo?.rate_factor) || row?.projectCode?.substr(0, row?.projectCode?.lastIndexOf(TimesheetConstants.PROJECT_APPENDER));
      }else{
        if(config?.hour_type_calculation?.toLowerCase() === TimesheetWeeklyType?.MANUAL?.toLowerCase() && row?.project_type || row?.projectInfo?.type === 'project-x'){
          return row?.projectInfo?.abbreviation;
        }
        return row.projectCode;
      }
      
  }
  saveHourlyTimeSheet(formData: { rowData: any[]; totals: {}; notes: {}; grandTotal: string; custom: any[] }, submit, config) {
    const currentTimesheetData = this.storageService.get(TimesheetConstants.TIMESHEET);
    this.custom = formData.custom;
    const projects = [];
    const timesheetLogs = {
      data: [],
      notes: formData?.notes['timesheet_level'] || null
    };
    const weeksInfo = this.weekDays;//JSON.parse(JSON.stringify(this.weekDays));
    formData.rowData.forEach(row => {
      let projectCode= this.checkIfAppendarAdded(row, config);
      // const proCode = hour_type_calculation?.toLowerCase() == TimesheetWeeklyType.AUTOMATIC ? row?.projectCode :row.project_title;//row?.projectCode?.substr(0, row.projectCode.length - 3);
      const projectContent= (projectCode && row.project_title)? (projectCode + " "+row.project_title): (projectCode || row.project_title);
      if (projects.indexOf(projectContent) == -1) {
        projects.push(projectContent);
        const timeSheet = { project_title: row.project_title,project_code: row?.projectInfo?.originalCode || row?.projectInfo?.account_code || row?.account_code || (row?.projectInfo?.type === 'project-x' ? row?.projectInfo?.abbreviation : row?.projectInfo?.rate_factor), project_id: row.project_id, project_type: row.project_type || row?.projectInfo?.project_type, data: [] };
        weeksInfo.forEach(day => {
          // if (day?.active) {
            const date = this.timesheetService.formatDateInRequiredFormat(day?.date, "yyyy-MM-dd");//day.date?.substr(0, 10);
            day['dateString'] = date;
            const hours = (config?.hour_type_calculation?.toLowerCase() == TimesheetWeeklyType.AUTOMATIC || config?.hour_type_calculation?.toLowerCase() == TimesheetWeeklyType.HYBRID ) ? row[day?.day] : [];
            const startDate= this.timesheetService.formatDateInRequiredFormat(currentTimesheetData?.start_date, "yyyy-MM-dd");//day.date?.substr(0, 10);
            const endDate= this.timesheetService.formatDateInRequiredFormat(currentTimesheetData?.end_date, "yyyy-MM-dd");//day.date?.substr(0, 10);
            if(startDate <= date && date <= endDate ){
            timeSheet.data.push({
              "date": date,
              "hours": hours,
              "notes": formData?.notes[day?.day] || null,
              "project_note": row[day?.dayNumber] || null,
              "breaks": []
            });
          }
          // }
        });
        timesheetLogs.data.push(timeSheet);
      }
    });

    if(config?.hour_type_calculation?.toLowerCase() == TimesheetWeeklyType.MANUAL){
      formData.rowData.forEach(row => {
        const proTitle= row.project_title;
        const projectCode = this.checkIfAppendarAdded(row, config);//row.projectCode.substr(0, row?.projectCode?.lastIndexOf(row?.projectInfo?.projectAppender));
        
        const type = row.projectCode.substr(row.projectCode.length - 2, row.projectCode.length);
        let hours_type = '';
        switch (type) {
          case TimesheetWorkTypeAbbreviation.REGULAR:
            hours_type = TimesheetWorkType.REGULAR;
            break;
          case TimesheetWorkTypeAbbreviation.OVERTIME:
            hours_type = TimesheetWorkType.OVERTIME;
            break;
          case TimesheetWorkTypeAbbreviation.DOUBLETIME:
            hours_type = TimesheetWorkType.DOUBLETIME;
            break;
        }

        timesheetLogs.data.forEach(timesheet => {
           if (((timesheet?.project_code && timesheet?.project_title && timesheet?.project_code == projectCode && timesheet?.project_title == proTitle) &&
          (timesheet?.project_code  && timesheet?.project_code == projectCode) &&
          (timesheet?.project_title && timesheet?.project_title == proTitle)) || (!timesheet?.project_code && !timesheet?.project_title)) {
            timesheet.data.forEach(sheet => {
              const day1 = this.getDayOfDate(sheet.date);
              const dayNumber = new Date(sheet.date).getDate();
              let notPopulated = true;
              if (sheet.hours && sheet.hours.length > 0) {
                sheet.hours.forEach(hour => {
                  if (hour['hours_type'] === hours_type) {
                    hour.value = row[day1];
                    notPopulated = false;
                  }
                });
              }
              if (notPopulated) {
                // sheet.hours.push({ "value": row[day1], "hours_type": hours_type, "project_note": row[dayNumber] });
                sheet.hours.push({ "value": row[day1], "hours_type": row?.project_type === 'project-x' ? row?.projectInfo?.rate_type : hours_type, "project_note": row[dayNumber] });
              }
            });
          }
        });
      });

    }

    // Hybrid Only
    if(config?.hour_type_calculation?.toLowerCase() == TimesheetWeeklyType.HYBRID){
    timesheetLogs.data = this.removeEmptyProjects(timesheetLogs)
    }
    // End
    return this.saveHourlyTimesheetData(submit, timesheetLogs, formData?.custom);
  }

  removeEmptyProjects(timesheetLogs) {
    return (timesheetLogs?.data || [])?.filter(project =>
      project?.project_type === 'default' || (project?.project_type && project?.project_title && project?.project_code)
    );
  }

  getHoursType(type){
    let hours_type = type;
    switch (type) {
      case TimesheetWorkType.REGULAR:
        hours_type = TimesheetWorkTypeAbbreviation.REGULAR;
        break;
      case TimesheetWorkType.OVERTIME:
        hours_type = TimesheetWorkTypeAbbreviation.OVERTIME;
        break;
      case TimesheetWorkType.DOUBLETIME:
        hours_type = TimesheetWorkTypeAbbreviation.DOUBLETIME;
        break;
    }
    return hours_type;
}
  saveHourlyTimesheetData(submit, timesheetLogs, customFieldsData?){
    const currentTimesheetData = this.storageService.get(TimesheetConstants.TIMESHEET);
    let timesheet_id = currentTimesheetData?.timesheet_uuid || currentTimesheetData?.timesheet_id;
    if (currentTimesheetData?.status?.toLowerCase() === TimesheetStatus.WITHDRAWN?.toLowerCase() || currentTimesheetData?.status?.toLowerCase() === TimesheetStatus.REJECTED?.toLowerCase()) {
      timesheet_id = undefined;
    }
    const payload: any = {
      assignment_uuid: currentTimesheetData?.assignment_id,
      user_uuid: currentTimesheetData?.user_id,
      parent_type: currentTimesheetData?.parent_type,
      child_type: currentTimesheetData?.child_type,
      worker_type: "worker",
      location_type: null,//this.assignmentDetails?.location_type,
      start_date: currentTimesheetData?.start_date,
      end_date: currentTimesheetData?.end_date,
      is_submit: submit,
      working_days: null,
      timesheet_uuid: timesheet_id,
      timesheet_logs: timesheetLogs,
      custom: customFieldsData
    }
    /* let treeSubj = new Subject<any>();
    let treeResult = treeSubj.asObservable();
    // a lot of code
    // need to tick a value in treeResult somewhere - can do this in several places
     treeSubj.next(1);
     return treeResult; */
    if (payload?.timesheet_uuid) {
      return this.timesheetService.updateDayTimesheet(payload);
    } else {
      return this.timesheetService.createDayTimesheet(payload);
    } 
  }

 formatMinutes(minutes) {
    if (minutes.length == 1) {
      return minutes + "0";
    } else if (minutes.length == 0) {
      return "00";
    }
    return minutes;
  }

  /* getFilteredObjectFromArray(array, key, value){
    var result = array?.filter(obj => {
      return obj[key] === value;
    });
    return result;    
  } */

  removeInactiveProjectCodes(dropDownItems, formData){
    const currentTimesheetData = this.storageService.get(TimesheetConstants.TIMESHEET);
    const start_date= getDateFromString(currentTimesheetData?.start_date);
    // const indexes=[];
    const dropdownList=[];
    dropDownItems.forEach((item)=>{
      if(item.status?.toLowerCase() === AccountCodeStatus.INACTIVE?.toLowerCase()){
        const projectCodes= getFilteredObjectFromArray(formData?.rowData, 'projectCode', item?.projectCode);      
        const inactivated_at= getDateFromString(item?.inactivated_at) || null;
        /* if(!projectCodes || projectCodes?.length <=0  && inactivated_at < start_date){ indexes.push(index); } else{dropdownList.push(item);} */
        if(projectCodes?.length > 0 || inactivated_at > start_date){
          dropdownList.push(item);
        }
      }else{
        dropdownList.push(item);
      }      
    });
    return dropdownList;    
  }
}
