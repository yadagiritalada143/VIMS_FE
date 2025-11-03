import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { ExpenseConfigurationItemDetailsComponent } from './expense-configuration-item-details.component';

describe('ExpenseConfigurationItemDetailsComponent', () => {
  let component: ExpenseConfigurationItemDetailsComponent;
  let fixture: ComponentFixture<ExpenseConfigurationItemDetailsComponent>;
  CommonTestingModule.setUpTestBed(ExpenseConfigurationItemDetailsComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ExpenseConfigurationItemDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpenseConfigurationItemDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
