import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ExpressionBuilderConditionComponent } from './expression-builder-condition.component';
describe('ExpressionBuilderConditionComponent', () => {
  let component: ExpressionBuilderConditionComponent;
  let fixture: ComponentFixture<ExpressionBuilderConditionComponent>;
  CommonTestingModule.setUpTestBed(ExpressionBuilderConditionComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ExpressionBuilderConditionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpressionBuilderConditionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
