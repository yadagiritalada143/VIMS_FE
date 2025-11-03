import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { CopyMonthlyTimesheetComponent } from './copy-timesheet.component';
import { ChunkPipe } from 'src/app/shared/pipe/chunk.pipe';
describe('CopyMonthlyTimesheetComponent', () => {
  let component: CopyMonthlyTimesheetComponent;
  let fixture: ComponentFixture<CopyMonthlyTimesheetComponent>;
  CommonTestingModule.setUpTestBed(CopyMonthlyTimesheetComponent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CopyMonthlyTimesheetComponent , ChunkPipe]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CopyMonthlyTimesheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
