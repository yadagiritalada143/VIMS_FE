import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ReportsSavedComponent } from './reports-saved.component';

describe('ReportsSavedComponent', () => {
  let component: ReportsSavedComponent;
  let fixture: ComponentFixture<ReportsSavedComponent>;
  CommonTestingModule.setUpTestBed(ReportsSavedComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReportsSavedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportsSavedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
