import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddRuleComponent } from './add-rule.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('AddRuleComponent', () => {
  let component: AddRuleComponent;
  let fixture: ComponentFixture<AddRuleComponent>;
  CommonTestingModule.setUpTestBed(AddRuleComponent);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddRuleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddRuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
