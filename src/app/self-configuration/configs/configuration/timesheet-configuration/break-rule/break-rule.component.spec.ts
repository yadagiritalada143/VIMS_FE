import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BreakRuleComponent } from './break-rule.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('BreakRuleComponent', () => {
  let component: BreakRuleComponent;
  let fixture: ComponentFixture<BreakRuleComponent>;
  CommonTestingModule.setUpTestBed(BreakRuleComponent);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BreakRuleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BreakRuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
