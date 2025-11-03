import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ActiveContractsWidgetComponent } from './active-contracts-widget.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ActiveContractsWidgetComponent', () => {
  let component: ActiveContractsWidgetComponent;
  let fixture: ComponentFixture<ActiveContractsWidgetComponent>;
  CommonTestingModule.setUpTestBed(ActiveContractsWidgetComponent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ActiveContractsWidgetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActiveContractsWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
