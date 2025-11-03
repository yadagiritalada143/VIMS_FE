import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { AddAdditionalBudgetComponent } from './add-additional-budget.component';

describe('AddAdditionalBudgetComponent', () => {
  let component: AddAdditionalBudgetComponent;
  let fixture: ComponentFixture<AddAdditionalBudgetComponent>;
  CommonTestingModule.setUpTestBed(AddAdditionalBudgetComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AddAdditionalBudgetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddAdditionalBudgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
