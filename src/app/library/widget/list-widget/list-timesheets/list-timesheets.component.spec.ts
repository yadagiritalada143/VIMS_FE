import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ListTimesheetsComponent } from './list-timesheets.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ListTimesheetsComponent', () => {
  let component: ListTimesheetsComponent;
  let fixture: ComponentFixture<ListTimesheetsComponent>;
  CommonTestingModule.setUpTestBed(ListTimesheetsComponent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ListTimesheetsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListTimesheetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
