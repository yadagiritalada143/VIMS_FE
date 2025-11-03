import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { TITOTimesheetEntryNewComponent } from './tito-timesheet-entry-new.component';
import { TitoTimesheetEntryComponent } from '../TITO-timesheet-entry/tito-timesheet-entry.component';

describe('TITOTimesheetEntryNewComponent', () => {
  let component: TITOTimesheetEntryNewComponent;
  let fixture: ComponentFixture<TITOTimesheetEntryNewComponent>;
  CommonTestingModule.setUpTestBed(TitoTimesheetEntryComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TITOTimesheetEntryNewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TITOTimesheetEntryNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
