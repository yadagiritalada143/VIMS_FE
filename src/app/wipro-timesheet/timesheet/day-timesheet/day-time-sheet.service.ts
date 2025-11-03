import { Injectable } from '@angular/core';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { TimesheetService } from '../../timesheet.service';
import { TimesheetWorkType, TimesheetWorkTypeAbbreviation, TimesheetWeeklyType, TimesheetConstants } from '../../timesheet.enums';
import { getFilteredObjectFromArray } from '../../timesheet.utils';
import { HourlyTimeSheetService } from '../hourly-timesheet/hourly-time-sheet.service';

@Injectable({
  providedIn: 'root'
})
export class DayTimeSheetService {
  private currentProgram: any = {};
  public weekDays = [];
  constructor(private htsService: HourlyTimeSheetService, private storageService: StorageService, private timesheetService: TimesheetService) {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
  }

  getDatesBetweenTwoDates(strDate, stpDate, weekEnds, work_week_start_day, config) {
    this.weekDays = new Array();
    let copiedStartDate = new Date(strDate);
    let copiedEndDate= new Date(stpDate);
    let cDate = strDate;

    if (this.htsService.getNoOfDaysBetweenTwoDates(strDate, stpDate) < 7) {
      const dayOfStartDate = this.htsService.getDayOfDate(cDate);
      const workWeekStartDay = work_week_start_day?.charAt(0).toUpperCase() + work_week_start_day?.substr(1, 2);
      const noOfDays = 7 - this.htsService.getNoOfDaysBetweenTwoDates(strDate, stpDate);
      if (dayOfStartDate !== workWeekStartDay) {
        cDate = this.htsService.addDays(cDate, -noOfDays);
      } else {
        stpDate = this.htsService.addDays(stpDate, (+noOfDays));
      }
    }

    while (cDate <= stpDate) {
      const date = new Date(cDate);
      const day = this.htsService.getDayOfDate(cDate);
      let active = true;
      let isWeekend= false;
      if (date < copiedStartDate || date > copiedEndDate || (!config?.weekend?.is_allow_entry && weekEnds.includes(day))) {
        active = false;
      }
      if(weekEnds.includes(day)){        
        isWeekend= true;
      }
      this.weekDays.push({ date: date, day: day, dayNumber: date.getDate(), active: active, isWeekend: isWeekend });
      cDate = this.htsService.addDays(cDate, 1);
    }

    return this.weekDays;
  }

  public populateAutomaticTimes(formData, project, dateLevelTimes) {
    const day = this.htsService.getDayOfDate(dateLevelTimes.date);
      for (let j = 0; j < formData.rowData.length; j++) {
        if ((formData?.rowData[j]?.project_title === project?.project_title) || (formData?.rowData[j]?.projectCode === project?.project_title) ) {
          const row = formData.rowData[j];
          row[day] = dateLevelTimes.value;
        }
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
        
      if(hourlyType?.toLowerCase() === TimesheetWeeklyType.MANUAL){
        dayValues.hours?.forEach(hour => {
          if (hour.hours_type === TimesheetWorkType.REGULAR) {
            isStEnterd = true;
          } else if (hour.hours_type === TimesheetWorkType.OVERTIME) {
            isOtEnterd = true;
          } else if (hour.hours_type === TimesheetWorkType.DOUBLETIME) {
            isDtEnterd = true;
          }
  
        });
      }else{
        isStEnterd= true;
      }
        
        if (isStEnterd) {
          let key= hourlyType?.toLowerCase() === TimesheetWeeklyType.MANUAL ? TimesheetConstants.PROJECT_APPENDER+TimesheetWorkTypeAbbreviation.REGULAR : '';
          const project_code = this.htsService.createProjectCode(project) ? (this.htsService.createProjectCode(project) + key) : this.htsService.createProjectCode(project);
          const projectInfo = {
            originalCode: project?.project_code,
            projectCode: project_code,
            title: project?.project_title,
            code: project_code
          }
          let row1:any = { projectCode:  project_code, total: defaultValue, project_title: project.project_title, project_id: project.project_id, projectInfo: (filteredProjectCode?.[0] || projectInfo) };
          if( filteredProjectCode?.length > 0){
            row1= {...row1, project_title: filteredProjectCode[0]?.title, project_id: filteredProjectCode[0]?.id, project_type: filteredProjectCode[0]?.type};
          }
          for (let i = 0; i < this.weekDays.length; i++) {
            row1[this.weekDays[i].day] = defaultValue;
            formData.totals[this.weekDays[i].day] = defaultValue;
          }
          formData.rowData.push(row1);
        }
        if (isOtEnterd) {
          const project_code = this.htsService.createProjectCode(project) ? (this.htsService.createProjectCode(project) + TimesheetConstants.PROJECT_APPENDER+TimesheetWorkTypeAbbreviation.OVERTIME) : this.htsService.createProjectCode(project);
          const projectInfo = {
            originalCode: project?.project_code,
            projectCode: project_code,
            title: project?.project_title,
            code: project_code
          }
          let row2:any = { projectCode: project_code, total: defaultValue, project_title: project.project_title, project_id: project.project_id, projectInfo: (filteredProjectCode?.[0] || projectInfo) };
          if( filteredProjectCode?.length > 0){
            row2= {...row2, project_title: filteredProjectCode[0]?.title, project_id: filteredProjectCode[0]?.id, project_type: filteredProjectCode[0]?.type};
          }
          for (let i = 0; i < this.weekDays.length; i++) {
            row2[this.weekDays[i].day] = defaultValue;
            formData.totals[this.weekDays[i].day] = defaultValue;
          }
          formData.rowData.push(row2);
        }
  
        if (isDtEnterd) {
          const project_code = this.htsService.createProjectCode(project)? (this.htsService.createProjectCode(project) + TimesheetConstants.PROJECT_APPENDER+TimesheetWorkTypeAbbreviation.DOUBLETIME) :this.htsService.createProjectCode(project);
          const projectInfo = {
            originalCode: project?.project_code,
            projectCode: project_code,
            title: project?.project_title,
            code: project_code
          }
          let row3:any = { projectCode: project_code, total: defaultValue,project_title: project.project_title, project_id: project.project_id, projectInfo: (filteredProjectCode?.[0] || projectInfo) };
          if( filteredProjectCode?.length > 0){
            row3= {...row3,project_title: filteredProjectCode[0]?.title, project_id: filteredProjectCode[0]?.id, project_type: filteredProjectCode[0]?.type};
          }
          for (let i = 0; i < this.weekDays.length; i++) {
            row3[this.weekDays[i].day] = defaultValue;
            formData.totals[this.weekDays[i].day] = defaultValue;
          }
          formData.rowData.push(row3);
        }
           
    }

    return formData;
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
        return row?.projectCode?.substr(0, row?.projectCode?.lastIndexOf(TimesheetConstants.PROJECT_APPENDER));
      }else{
        return row.projectCode;
      }
      
  }

  saveDayTimeSheet(formData: { rowData: any[]; totals: {}; notes: {}; grandTotal: string; custom: any[];}, submit, config) {
    const projects = [];
    const timesheetLogs = {
      data: [],
      notes: formData?.notes['timesheet_level'] || null
    };
    const weeksInfo = this.weekDays;//JSON.parse(JSON.stringify(this.weekDays));
    formData.rowData.forEach(row => {
      const projectCode= this.checkIfAppendarAdded(row, config);
      // const proCode = hour_type_calculation?.toLowerCase() == TimesheetWeeklyType.AUTOMATIC ? row?.projectCode :row.project_title;//row?.projectCode?.substr(0, row.projectCode.length - 3);
      const projectContent= (projectCode && row.project_title)? (projectCode + " "+row.project_title): (projectCode || row.project_title);
      if (projects.indexOf(projectContent) == -1) {
        projects.push(projectContent);
        const timeSheet = { project_title: row.project_title,project_code: row?.projectInfo?.originalCode || row?.projectInfo?.account_code || row?.account_code, project_id: row.project_id, project_type: row.project_type, data: [] };
        weeksInfo.forEach(day => {
          if (day?.active) {
            const date = this.timesheetService.formatDateInRequiredFormat(day?.date, "yyyy-MM-dd");//day.date?.substr(0, 10);
            day['dateString'] = date;
            const hours = row[day?.day]
            // const hours = hour_type_calculation?.toLowerCase() == TimesheetWeeklyType.AUTOMATIC ? row[day?.day] : [];
            // const startDate= this.timesheetService.formatDateInRequiredFormat(currentTimesheetData?.start_date, "yyyy-MM-dd");//day.date?.substr(0, 10);
            // const endDate= this.timesheetService.formatDateInRequiredFormat(currentTimesheetData?.end_date, "yyyy-MM-dd");//day.date?.substr(0, 10);
            // if(startDate <= date && date <= endDate ){
            timeSheet.data.push({
              "date": date,
              "value": hours,
              "notes": formData?.notes[day?.day] || null,
              "project_note": row[day?.dayNumber] || null,
              // "breaks": []
            });
          // }
          }
        });
        timesheetLogs.data.push(timeSheet);
      }
    });

    if(config?.hour_type_calculation?.toLowerCase() == TimesheetWeeklyType.MANUAL){
      formData.rowData.forEach(row => {
        const proTitle = row.project_title;//row.projectCode.substr(0, row.projectCode.length - 3);
        const projectCode = this.checkIfAppendarAdded(row, config);
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
              const day1 = this.htsService.getDayOfDate(sheet.date);
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
                sheet.hours.push({ "value": row[day1], "hours_type": hours_type });
              }
            });
          }
        });
      });

    }
    return this.htsService.saveHourlyTimesheetData(submit, timesheetLogs, formData?.custom);
  }
}
