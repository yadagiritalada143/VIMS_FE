import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { DashboardWidgetSettingsComponent } from './dashboard-widget-settings.component';

describe('DashboardWidgetSettingsComponent', () => {
  let component: DashboardWidgetSettingsComponent;
  let fixture: ComponentFixture<DashboardWidgetSettingsComponent>;
  CommonTestingModule.setUpTestBed(DashboardWidgetSettingsComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DashboardWidgetSettingsComponent],
      imports:[NgbModule],
      providers:[NgbActiveModal]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardWidgetSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
