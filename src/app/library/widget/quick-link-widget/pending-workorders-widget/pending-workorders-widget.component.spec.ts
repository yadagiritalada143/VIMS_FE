import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PendingWorkordersWidgetComponent } from './pending-workorders-widget.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('PendingWorkordersWidgetComponent', () => {
  let component: PendingWorkordersWidgetComponent;
  let fixture: ComponentFixture<PendingWorkordersWidgetComponent>;
  CommonTestingModule.setUpTestBed(PendingWorkordersWidgetComponent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PendingWorkordersWidgetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PendingWorkordersWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
