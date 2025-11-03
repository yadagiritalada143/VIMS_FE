import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { HybridTimesheetComponent } from './hybrid-timesheet.component';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { DecimalPipe } from '@angular/common';

describe('HybridTimesheetComponent', () => {
  let component: HybridTimesheetComponent;
  let fixture: ComponentFixture<HybridTimesheetComponent>;
  CommonTestingModule.setUpTestBed(HybridTimesheetComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HybridTimesheetComponent , AccuracyPipe],
      providers: [DecimalPipe]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HybridTimesheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
