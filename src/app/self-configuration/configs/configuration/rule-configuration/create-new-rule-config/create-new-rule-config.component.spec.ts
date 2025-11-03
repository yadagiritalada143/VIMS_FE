import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateNewRuleConfigComponent } from './create-new-rule-config.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('CreateNewRuleConfigComponent', () => {
  let component: CreateNewRuleConfigComponent;
  let fixture: ComponentFixture<CreateNewRuleConfigComponent>;
  CommonTestingModule.setUpTestBed(CreateNewRuleConfigComponent);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateNewRuleConfigComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateNewRuleConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
