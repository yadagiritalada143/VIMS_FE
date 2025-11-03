import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NewRuleComponent } from './new-rule.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('NewRuleComponent', () => {
  let component: NewRuleComponent;
  let fixture: ComponentFixture<NewRuleComponent>;
  CommonTestingModule.setUpTestBed(NewRuleComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(NewRuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
