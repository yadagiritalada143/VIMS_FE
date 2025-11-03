import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { PicklistFlyoutComponent } from './picklist-flyout.component';

describe('PicklistFlyoutComponent', () => {
  let component: PicklistFlyoutComponent;
  let fixture: ComponentFixture<PicklistFlyoutComponent>;
  CommonTestingModule.setUpTestBed(PicklistFlyoutComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PicklistFlyoutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PicklistFlyoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
