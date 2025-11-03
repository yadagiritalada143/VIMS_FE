import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { RuleBuilderConditionComponent } from './rule-builder-condition.component';

describe('RuleBuilderConditionComponent', () => {
  let component: RuleBuilderConditionComponent;
  let fixture: ComponentFixture<RuleBuilderConditionComponent>;
  CommonTestingModule.setUpTestBed(RuleBuilderConditionComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RuleBuilderConditionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RuleBuilderConditionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
