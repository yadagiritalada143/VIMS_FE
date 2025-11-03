import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { ExpenseConfigurationListComponent } from './expense-configuration-list.component';

describe('ExpenseConfigurationListComponent', () => {
  let component: ExpenseConfigurationListComponent;
  let fixture: ComponentFixture<ExpenseConfigurationListComponent>;
  CommonTestingModule.setUpTestBed(ExpenseConfigurationListComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ExpenseConfigurationListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpenseConfigurationListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
