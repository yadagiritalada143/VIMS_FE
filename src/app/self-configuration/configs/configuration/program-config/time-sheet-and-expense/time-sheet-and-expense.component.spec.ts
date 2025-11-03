import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimeSheetAndExpenseComponent } from './time-sheet-and-expense.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ProgramConfigControlComponent } from '../program-config-control/program-config-control.component';

describe('TimeSheetAndExpenseComponent', () => {
  let component: TimeSheetAndExpenseComponent;
  let fixture: ComponentFixture<TimeSheetAndExpenseComponent>;
  CommonTestingModule.setUpTestBed(TimeSheetAndExpenseComponent);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TimeSheetAndExpenseComponent, ProgramConfigControlComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TimeSheetAndExpenseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
