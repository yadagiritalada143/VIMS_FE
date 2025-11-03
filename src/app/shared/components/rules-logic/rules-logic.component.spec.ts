import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { RulesLogicComponent } from './rules-logic.component';

describe('RulesLogicComponent', () => {
  let component: RulesLogicComponent;
  let fixture: ComponentFixture<RulesLogicComponent>;
  CommonTestingModule.setUpTestBed(RulesLogicComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RulesLogicComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RulesLogicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
